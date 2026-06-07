import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import noteRoutes from './routes/noteRoutes.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/notes', noteRoutes)

app.get('/api/test', (req, res) => {
	res.json({ message: 'Server working' })
})

app.get('/', (req, res) => {
	res.json({ message: 'Synapse backend is running' })
})

const startServer = async () => {
	try {
		await connectDB()
		app.listen(port, () => {
			console.log(`Server running on port ${port}`)
		})
	} catch (error) {
		console.error('Failed to start server:', error.message)
		process.exit(1)
	}
}

startServer()
