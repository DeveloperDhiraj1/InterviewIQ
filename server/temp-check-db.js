import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const uri = process.env.MONGODB_URI
const dbName = process.env.DB_NAME || 'InterviewIQ'

console.log('MONGODB_URI=', uri)
console.log('DB_NAME=', dbName)

try {
  const conn = await mongoose.connect(uri, {
    dbName,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
  console.log('Connected to', conn.connection.host, 'db:', conn.connection.name)
  await conn.disconnect()
} catch (error) {
  console.error('Connection failed:', error.message)
  process.exit(1)
}
