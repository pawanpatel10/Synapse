import mongoose from 'mongoose'

const noteSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, 'Title is required'],
			trim: true,
		},
		content: {
			type: String,
			required: [true, 'Content is required'],
			trim: true,
		},
		tags: {
			type: [String],
			default: [],
		},
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		collaborators: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
	},
	{
		timestamps: true,
	}
)

const Note = mongoose.model('Note', noteSchema)

export default Note