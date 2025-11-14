import type { FastifyInstance } from 'fastify';
import { Login } from './login';
import { Logout } from './logout';
import { Me } from './me';
import { Register } from './register';

export async function authRoutes(app: FastifyInstance) {
	app.register(Register);
	app.register(Login);
	app.register(Logout);
	app.register(Me);
}
