import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import noteRoutes from './routes/noteRoutes.js'
import graphRoutes from './routes/graphRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import aiRoutes from './routes/aiRoutes.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/graph', graphRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/ai', aiRoutes)

app.get('/api/test', (req, res) => {
	res.json({ message: 'Server working' })
})

app.get('/', (req, res) => {
	res.json({ message: 'Synapse backend is running' })
})

const httpServer = createServer(app)
const io = new Server(httpServer, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST']
	}
})

io.on('connection', (socket) => {
	socket.on('join-note', ({ noteId, userName }) => {
		socket.join(noteId)
		socket.to(noteId).emit('user-joined', { socketId: socket.id, userName })
	})

	socket.on('edit-note', ({ noteId, content }) => {
		socket.to(noteId).emit('note-updated', { content })
	})

	socket.on('typing', ({ noteId, userName, isTyping }) => {
		socket.to(noteId).emit('user-typing', { userName, isTyping })
	})

	socket.on('cursor-position', ({ noteId, userName, position }) => {
		socket.to(noteId).emit('cursor-moved', { socketId: socket.id, userName, position })
	})

	socket.on('disconnecting', () => {
		for (const room of socket.rooms) {
			if (room !== socket.id) {
				socket.to(room).emit('user-left', { socketId: socket.id })
			}
		}
	})
})

const startServer = async () => {
	try {
		await connectDB()
		httpServer.listen(port, () => {
			console.log(`Server running on port ${port}`)
		})
	} catch (error) {
		console.error('Failed to start server:', error.message)
		process.exit(1)
	}
}

startServer()

