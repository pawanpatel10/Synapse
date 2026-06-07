import Note from '../models/Note.js'
import User from '../models/User.js'

const isObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(value)

const normalizeTags = (tags) => {
	if (Array.isArray(tags)) {
		return tags.map((tag) => tag.trim()).filter(Boolean)
	}

	if (typeof tags === 'string') {
		return tags
			.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean)
	}

	return []
}

const normalizeCollaboratorIds = async (collaborators) => {
	const values = Array.isArray(collaborators)
		? collaborators
		: typeof collaborators === 'string'
			? collaborators.split(',')
			: []

	const cleanedValues = values.map((value) => value.trim()).filter(Boolean)
	if (cleanedValues.length === 0) {
		return []
	}

	const objectIdValues = cleanedValues.filter(isObjectId)
	const emailValues = cleanedValues.filter((value) => !isObjectId(value)).map((value) => value.toLowerCase())

	const queryParts = []

	if (objectIdValues.length > 0) {
		queryParts.push({ _id: { $in: objectIdValues } })
	}

	if (emailValues.length > 0) {
		queryParts.push({ email: { $in: emailValues } })
	}

	if (queryParts.length === 0) {
		return []
	}

	const resolvedUsers = await User.find({ $or: queryParts }).select('_id')

	return resolvedUsers.map((user) => user._id)
}

const canAccessNote = (note, userId) => {
	return note.owner.toString() === userId.toString() || note.collaborators.some((collaborator) => collaborator.toString() === userId.toString())
}

export const createNote = async (req, res) => {
	try {
		const { title, content, tags, collaborators } = req.body

		if (!title || !content) {
			return res.status(400).json({ message: 'Title and content are required' })
		}

		const note = await Note.create({
			title,
			content,
			tags: normalizeTags(tags),
			owner: req.user._id,
			collaborators: await normalizeCollaboratorIds(collaborators),
		})

		res.status(201).json(note)
	} catch (error) {
		res.status(500).json({ message: error.message })
	}
}

export const getNotes = async (req, res) => {
	try {
		const notes = await Note.find({
			$or: [{ owner: req.user._id }, { collaborators: req.user._id }],
		})
			.populate('owner', 'name email')
			.populate('collaborators', 'name email')
			.sort({ updatedAt: -1 })

		res.json(notes)
	} catch (error) {
		res.status(500).json({ message: error.message })
	}
}

export const getNoteById = async (req, res) => {
	try {
		const note = await Note.findById(req.params.id).populate('owner', 'name email').populate('collaborators', 'name email')

		if (!note) {
			return res.status(404).json({ message: 'Note not found' })
		}

		if (!canAccessNote(note, req.user._id)) {
			return res.status(403).json({ message: 'Not authorized to view this note' })
		}

		res.json(note)
	} catch (error) {
		res.status(500).json({ message: error.message })
	}
}

export const updateNote = async (req, res) => {
	try {
		const note = await Note.findById(req.params.id)

		if (!note) {
			return res.status(404).json({ message: 'Note not found' })
		}

		if (note.owner.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: 'Only the owner can update this note' })
		}

		note.title = req.body.title ?? note.title
		note.content = req.body.content ?? note.content
		note.tags = req.body.tags !== undefined ? normalizeTags(req.body.tags) : note.tags
		note.collaborators = req.body.collaborators !== undefined ? await normalizeCollaboratorIds(req.body.collaborators) : note.collaborators

		const updatedNote = await note.save()
		res.json(updatedNote)
	} catch (error) {
		res.status(500).json({ message: error.message })
	}
}

export const deleteNote = async (req, res) => {
	try {
		const note = await Note.findById(req.params.id)

		if (!note) {
			return res.status(404).json({ message: 'Note not found' })
		}

		if (note.owner.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: 'Only the owner can delete this note' })
		}

		await note.deleteOne()
		res.json({ message: 'Note deleted successfully' })
	} catch (error) {
		res.status(500).json({ message: error.message })
	}
}