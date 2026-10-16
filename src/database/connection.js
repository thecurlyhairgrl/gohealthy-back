import mongoose from 'mongoose'
import { env } from '../config/env.js'

export async function connectDatabase() {
  await mongoose.connect(env.mongodbUri)
  console.log('Database connected')
}
