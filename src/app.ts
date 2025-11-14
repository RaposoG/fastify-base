import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifyScalar from '@scalar/fastify-api-reference';
import { fastify, type FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from '@/env';
import { errorHandler } from './error-handler';
import { authRoutes } from './routes/auth';

export function createApp(): FastifyInstance {
	const app = fastify({
		logger: env.NODE_ENV === 'development',
	}).withTypeProvider<ZodTypeProvider>();

	app.setErrorHandler(errorHandler);

	app.register(fastifyRateLimit, {
		max: 100,
		timeWindow: '1 minute',
		keyGenerator: (req) => req.ip,
		skipOnError: true,
	});

	if (env.NODE_ENV === 'development') {
		app.register(fastifySwagger, {
			openapi: {
				info: {
					title: 'Api Exemple',
					description: 'Api Exemple',
					version: '0.0.1',
				},
				components: {
					securitySchemes: {
						cookieAuth: {
							type: 'apiKey',
							in: 'cookie',
							name: 'token',
						},
					},
				},
			},
		});

		app.register(fastifyScalar, {
			routePrefix: '/docs',
		});
	}

	app.register(fastifyCookie);
	app.register(fastifyJwt, {
		secret: env.SECRET_JWT,
		cookie: {
			cookieName: 'token',
			signed: false,
		},
	});

	app.register(fastifyCors, {
		origin: ['http://localhost:3000'],
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
		credentials: true,
	});

	app.register(authRoutes);

	return app;
}
