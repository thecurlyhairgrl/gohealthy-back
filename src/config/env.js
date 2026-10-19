// Import of the environment variables
export const env = {
  port: Number(process.env.PORT) || 3000,
  mongodbUri: process.env.MONGODB_URI,
  clientUrl: process.env.CLIENT_URL,
  emailUser: process.env.EMAIL_USER,
  emailAppPassword: process.env.EMAIL_APP_PASSWORD,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
}
if (!env.mongodbUri) {
  throw new Error('Falta la variable MONGODB_URI en el archivo .env')
}
if (!env.jwtSecret) {
  throw new Error('Falta la variable JWT_SECRET en el archivo .env')
}
if (!env.emailUser || !env.emailAppPassword) {
  console.warn('Faltan EMAIL_USER o EMAIL_APP_PASSWORD en el archivo .env: no se podrán enviar correos')
}