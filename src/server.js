// Punto de entrada: conecta la base de datos y levanta el servidor HTTP.
import app from './app.js'
import { env } from './config/env.js'
import { connectDatabase } from './database/connection.js'

await connectDatabase()

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}/api`)
})
