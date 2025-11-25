import jwt from '@fastify/jwt';
import { env } from '../../env.js';
export const jwtPlugin = async (app) => {
    app.register(jwt, {
        secret: env.JWT_SECRET,
    });
};
