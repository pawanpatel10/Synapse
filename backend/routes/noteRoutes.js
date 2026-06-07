import { Router } from 'express'
import protect from '../middleware/authMiddleware.js'
import {
	createNote,
	deleteNote,
	getNoteById,
	getNotes,
	updateNote,
} from '../controllers/noteController.js'

const router = Router()

router.use(protect)

router.route('/').post(createNote).get(getNotes)
router.route('/:id').get(getNoteById).put(updateNote).delete(deleteNote)

export default router