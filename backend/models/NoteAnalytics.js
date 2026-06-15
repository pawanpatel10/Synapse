import mongoose from 'mongoose'

const noteAnalyticsSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		note: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Note',
			required: true,
		},
		visits: {
			type: Number,
			default: 0,
		},
		quizScores: {
			type: [Number],
			default: [],
		},
		status: {
			type: String,
			enum: ['incomplete', 'reviewing', 'completed'],
			default: 'incomplete',
		},
		lastVisited: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
)

// Ensure unique entry per user per note
noteAnalyticsSchema.index({ user: 1, note: 1 }, { unique: true })

const NoteAnalytics = mongoose.model('NoteAnalytics', noteAnalyticsSchema)

export default NoteAnalytics
