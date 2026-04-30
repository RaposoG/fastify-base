import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { UserEntity } from './user.entity';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userParamsSchema,
  userPublicSchema,
} from './user.schema';
import { UserService } from './user.service';

const toPublic = (u: UserEntity) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

export async function userRoutes(app: FastifyInstance): Promise<void> {
  const service = new UserService(app.db.getRepository(UserEntity));
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    '/users',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['users'],
        summary: 'List users',
        security: [{ cookieAuth: [] }],
        querystring: listUsersQuerySchema,
        response: {
          200: z.object({
            data: z.array(userPublicSchema),
            total: z.number(),
            page: z.number(),
            limit: z.number(),
          }),
        },
      },
    },
    async (req) => {
      const { page, limit } = req.query;
      const { data, total } = await service.list(page, limit);
      return { data: data.map(toPublic), total, page, limit };
    },
  );

  r.get(
    '/users/:id',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['users'],
        summary: 'Get user by id',
        security: [{ cookieAuth: [] }],
        params: userParamsSchema,
        response: { 200: userPublicSchema },
      },
    },
    async (req) => toPublic(await service.findById(req.params.id)),
  );

  r.post(
    '/users',
    {
      onRequest: [app.authenticate, app.csrfGuard],
      schema: {
        tags: ['users'],
        summary: 'Create user (admin)',
        security: [{ cookieAuth: [] }],
        body: createUserSchema,
        response: { 201: userPublicSchema },
      },
    },
    async (req, reply) => {
      const user = await service.create(req.body);
      return reply.status(201).send(toPublic(user));
    },
  );

  r.patch(
    '/users/:id',
    {
      onRequest: [app.authenticate, app.csrfGuard],
      schema: {
        tags: ['users'],
        summary: 'Update user',
        security: [{ cookieAuth: [] }],
        params: userParamsSchema,
        body: updateUserSchema,
        response: { 200: userPublicSchema },
      },
    },
    async (req) => toPublic(await service.update(req.params.id, req.body)),
  );

  r.delete(
    '/users/:id',
    {
      onRequest: [app.authenticate, app.csrfGuard],
      schema: {
        tags: ['users'],
        summary: 'Delete user',
        security: [{ cookieAuth: [] }],
        params: userParamsSchema,
        response: { 204: z.null() },
      },
    },
    async (req, reply) => {
      await service.remove(req.params.id);
      return reply.status(204).send(null);
    },
  );
}
