import Note from '../models/Note.js'
import User from '../models/User.js'
import NoteLink from '../models/NoteLink.js'
import NoteAnalytics from '../models/NoteAnalytics.js'

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
	if (!collaborators) return []
	
	let rawValues = []
	if (Array.isArray(collaborators)) {
		rawValues = collaborators
	} else if (typeof collaborators === 'string') {
		rawValues = collaborators.split(',')
	} else {
		rawValues = [collaborators]
	}

	const cleanedValues = rawValues
		.map((val) => {
			if (!val) return null
			if (typeof val === 'string') return val.trim()
			if (typeof val === 'object' && val !== null) return (val.email || val._id || val.id || '').toString().trim()
			return val.toString().trim()
		})
		.filter(Boolean)

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
  const uid = userId.toString();

  const ownerId = note.owner?._id
    ? note.owner._id.toString()
    : note.owner.toString();

  const isCollaborator = note.collaborators.some(
    (collaborator) => {
      const collaboratorId = collaborator?._id
        ? collaborator._id.toString()
        : collaborator.toString();

      return collaboratorId === uid;
    }
  );

  return ownerId === uid || isCollaborator;
};

const updateNoteLinks = async (note) => {
	try {
		const noteId = note._id
		const tags = note.tags || []

		// First, delete any existing links involving this note
		await NoteLink.deleteMany({
			$or: [{ sourceNote: noteId }, { targetNote: noteId }]
		})

		if (tags.length === 0) return

		// Find other notes that share at least one tag
		const matchingNotes = await Note.find({
			_id: { $ne: noteId },
			tags: { $in: tags }
		})

		const linksToCreate = []
		for (const match of matchingNotes) {
			const matchTags = match.tags || []
			const shared = tags.filter(t => matchTags.includes(t))
			
			if (shared.length > 0) {
				const [source, target] = noteId.toString() < match._id.toString() 
					? [noteId, match._id] 
					: [match._id, noteId]

				linksToCreate.push({
					sourceNote: source,
					targetNote: target,
					sharedTags: shared,
					similarityScore: shared.length
				})
			}
		}

		if (linksToCreate.length > 0) {
			try {
				await NoteLink.insertMany(linksToCreate, { ordered: false })
			} catch (err) {
				// Ignore duplicate keys
			}
		}
	} catch (error) {
		console.error('Failed to update note links:', error)
	}
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

		// Track analytics for new note
		await NoteAnalytics.findOneAndUpdate(
			{ user: req.user._id, note: note._id },
			{ $inc: { visits: 1 }, lastVisited: new Date() },
			{ upsert: true, new: true }
		)

		// Populate links
		await updateNoteLinks(note)

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

		// Log visits
		await NoteAnalytics.findOneAndUpdate(
			{ user: req.user._id, note: note._id },
			{ $inc: { visits: 1 }, lastVisited: new Date() },
			{ upsert: true, new: true }
		)

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

		if (!canAccessNote(note, req.user._id)) {
			return res.status(403).json({ message: 'Not authorized to update this note' })
		}

		note.title = req.body.title ?? note.title
		note.content = req.body.content ?? note.content
		note.tags = req.body.tags !== undefined ? normalizeTags(req.body.tags) : note.tags
		
		// Only owner can edit collaborators
		if (note.owner.toString() === req.user._id.toString() && req.body.collaborators !== undefined) {
			note.collaborators = await normalizeCollaboratorIds(req.body.collaborators)
		}

		const updatedNote = await note.save()

		// Log visit on update
		await NoteAnalytics.findOneAndUpdate(
			{ user: req.user._id, note: note._id },
			{ $inc: { visits: 1 }, lastVisited: new Date() },
			{ upsert: true, new: true }
		)

		// Update links
		await updateNoteLinks(updatedNote)

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

		// Remove links and analytics
		await NoteLink.deleteMany({
			$or: [{ sourceNote: note._id }, { targetNote: note._id }]
		})
		await NoteAnalytics.deleteMany({ note: note._id })

		await note.deleteOne()
		res.json({ message: 'Note deleted successfully' })
	} catch (error) {
		res.status(500).json({ message: error.message })
	}
}