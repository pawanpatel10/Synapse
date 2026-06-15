import { Router } from 'express'
import protect from '../middleware/authMiddleware.js'
import Note from '../models/Note.js'
import NoteAnalytics from '../models/NoteAnalytics.js'

const router = Router()

router.get('/', protect, async (req, res) => {
	try {
		const analytics = await NoteAnalytics.find({ user: req.user._id }).populate('note', 'title tags')

		const tagCounts = {}
		let totalNotes = 0
		const visitedNotes = []

		analytics.forEach((item) => {
			if (!item.note) return
			totalNotes++
			visitedNotes.push({
				id: item.note._id,
				title: item.note.title,
				visits: item.visits,
				status: item.status,
				avgQuizScore: item.quizScores.length > 0 
					? item.quizScores.reduce((a, b) => a + b, 0) / item.quizScores.length 
					: null
			})

			item.note.tags?.forEach((tag) => {
				tagCounts[tag] = (tagCounts[tag] || 0) + 1
			})
		})

		const topicCoverage = Object.keys(tagCounts).map((tag) => ({
			tag,
			count: tagCounts[tag]
		}))

		const visitedDates = analytics
			.map(item => item.lastVisited.toDateString())
			.filter((value, index, self) => self.indexOf(value) === index)
		
		let streak = 0
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		
		let checkDate = new Date(today)
		
		if (!visitedDates.includes(checkDate.toDateString())) {
			checkDate.setDate(checkDate.getDate() - 1)
		}

		while (visitedDates.includes(checkDate.toDateString())) {
			streak++
			checkDate.setDate(checkDate.getDate() - 1)
		}

		const weakTopics = visitedNotes
			.filter(note => {
				const hasLowScore = note.avgQuizScore !== null && note.avgQuizScore < 70
				const isRevisitedButIncomplete = note.visits >= 2 && note.status === 'incomplete'
				return hasLowScore || isRevisitedButIncomplete
			})
			.map(note => ({
				_id: note.id,
				title: note.title,
				visits: note.visits,
				avgQuizScore: note.avgQuizScore,
				status: note.status
			}))

		const activityChart = []
		for (let i = 6; i >= 0; i--) {
			const d = new Date()
			d.setDate(d.getDate() - i)
			const dateStr = d.toDateString()
			const formattedLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })
			
			const dayVisits = analytics
				.filter(item => item.lastVisited.toDateString() === dateStr)
				.reduce((acc, item) => acc + 1, 0)

			activityChart.push({
				name: formattedLabel,
				visits: dayVisits
			})
		}

		res.json({
			totalNotes,
			studyStreak: streak,
			topicCoverage,
			weakTopics,
			activityChart,
			visitedNotes
		})
	} catch (error) {
		res.status(500).json({ message: error.message })
	}
})

export default router
