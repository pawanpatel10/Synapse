import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Name is required'],
			trim: true,
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: [true, 'Password is required'],
			minLength: [6, 'Password must be at least 6 characters long'],
		},
	},
	{
		timestamps: true,
	}
)

const User = mongoose.model('User', userSchema)

export default User