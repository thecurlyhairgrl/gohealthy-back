// Import of the environment variables
export const env = {
  port: Number(process.env.PORT) || 3000,
  mongodbUri: process.env.MONGODB_URI,
  clientUrl: process.env.CLIENT_URL,
  emailUser: process.env.EMAIL_USER,
  emailAppPassword: process.env.EMAIL_APP_PASSWORD,
}
if (!env.mongodbUri) {
  throw new Error('Falta la variable MONGODB_URI en el archivo .env')
}

if (!env.emailUser || !env.emailAppPassword) {
  console.warn('Faltan EMAIL_USER o EMAIL_APP_PASSWORD en el archivo .env: no se podrán enviar correos')
}
