import { fastify } from 'fastify'
import { 
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider
 } from 'fastify-type-provider-zod'
import { fastifyCors } from '@fastify/cors'
import { env } from './env.ts'
import { getUsersRoute } from './http/routes/users/get-users.ts'
import { postUsersRoute } from './http/routes/users/post-users.ts'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors, {
  origin: 'localhost:5173',
})

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.get('/health', () => {
  return 'OK'
})

app.register(getUsersRoute)
app.register(postUsersRoute)

app.listen({ port: env.PORT })