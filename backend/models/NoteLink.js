import mongoose from 'mongoose'

const noteLinkSchema = new mongoose.Schema(
	{
		sourceNote: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Note',
			required: true,
		},
		targetNote: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Note',
			required: true,
		},
		sharedTags: {
			type: [String],
			default: [],
		},
		similarityScore: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
)

// Ensure unique pairs of note links
noteLinkSchema.index({ sourceNote: 1, targetNote: 1 }, { unique: true })

const NoteLink = mongoose.model('NoteLink', noteLinkSchema)

export default NoteLink
