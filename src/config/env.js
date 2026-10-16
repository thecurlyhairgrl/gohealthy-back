// Import of the environment variables
export const env = {
  port: Number(process.env.PORT) || 3000,
  mongodbUri: process.env.MONGODB_URI,
  clientUrl: process.env.CLIENT_URL,
}

if (!env.mongodbUri) {
  throw new Error('Falta la variable MONGODB_URI en el archivo .env')
}
