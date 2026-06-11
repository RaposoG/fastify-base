import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/shared/errors/app-error';
import { describe, expect, it } from 'vitest';

describe('AppError hierarchy', () => {
  it('carries statusCode, code and details', () => {
    const err = new AppError('boom', 418, 'TEAPOT', { hint: 'tea' });
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(418);
    expect(err.code).toBe('TEAPOT');
    expect(err.details).toEqual({ hint: 'tea' });
    expect(err.message).toBe('boom');
  });

  it('maps each subclass to the right status/code', () => {
    expect(new BadRequestError()).toMatchObject({ statusCode: 400, code: 'BAD_REQUEST' });
    expect(new UnauthorizedError()).toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });
    expect(new ForbiddenError()).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(new NotFoundError()).toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
    expect(new ConflictError()).toMatchObject({ statusCode: 409, code: 'CONFLICT' });
  });

  it('uses the subclass name as error name', () => {
    expect(new NotFoundError().name).toBe('NotFoundError');
  });
});
