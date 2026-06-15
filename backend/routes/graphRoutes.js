import { Router } from 'express'
import protect from '../middleware/authMiddleware.js'
import Note from '../models/Note.js'
import NoteLink from '../models/NoteLink.js'

const router = Router()

router.get('/', protect, async (req, res) => {
	try {
		const notes = await Note.find({
			$or: [{ owner: req.user._id }, { collaborators: req.user._id }],
		}).select('title tags')

		const noteIds = notes.map((n) => n._id)

		const links = await NoteLink.find({
			sourceNote: { $in: noteIds },
			targetNote: { $in: noteIds },
		})

		res.json({ notes, links })
	} catch (error) {
		res.status(500).json({ message: error.message })
	}
})

export default router
