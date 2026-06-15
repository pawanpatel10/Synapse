import { Router } from 'express'
import protect from '../middleware/authMiddleware.js'
import Note from '../models/Note.js'
import NoteAnalytics from '../models/NoteAnalytics.js'

const router = Router()

// ─── Helpers ───────────────────────────────────────────────────────────

const getAccessibleNote = async (noteId, userId) => {
	const note = await Note.findById(noteId)
	if (!note) return null
	const uid = userId.toString()
	const ownerId = note.owner.toString()
	const isCollaborator = note.collaborators.some(c => c.toString() === uid)
	if (ownerId !== uid && !isCollaborator) return null
	return note
}

const stripHtml = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

// ─── AI Provider: Groq (Free, fast, worldwide) ────────────────────────

const callGroq = async (prompt, options = {}) => {
	const apiKey = process.env.GROQ_API_KEY
	if (!apiKey) return null

	const url = 'https://api.groq.com/openai/v1/chat/completions'

	const messages = []
	if (options.systemInstruction) {
		messages.push({ role: 'system', content: options.systemInstruction })
	}
	messages.push({ role: 'user', content: prompt })

	const body = {
		model: 'llama-3.3-70b-versatile',
		messages,
		temperature: 0.7,
		max_tokens: 2048,
	}

	if (options.json) {
		body.response_format = { type: 'json_object' }
	}

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		})

		if (!response.ok) {
			const errorBody = await response.text()
			console.error('Groq API error:', response.status, errorBody)
			return null
		}

		const data = await response.json()
		return data?.choices?.[0]?.message?.content || null
	} catch (err) {
		console.error('Groq fetch error:', err.message)
		return null
	}
}

// ─── AI Provider: Gemini (Google) ──────────────────────────────────────

const callGemini = async (prompt, options = {}) => {
	const apiKey = process.env.GEMINI_API_KEY
	if (!apiKey) return null

	const model = 'gemini-2.0-flash'
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

	const body = {
		contents: [{ parts: [{ text: prompt }] }],
		generationConfig: {
			temperature: 0.7,
			maxOutputTokens: 2048,
		},
	}

	if (options.systemInstruction) {
		body.systemInstruction = { parts: [{ text: options.systemInstruction }] }
	}

	if (options.json) {
		body.generationConfig.responseMimeType = 'application/json'
	}

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})

		if (!response.ok) {
			const errorBody = await response.text()
			console.error('Gemini API error:', response.status, errorBody)
			return null
		}

		const data = await response.json()
		return data?.candidates?.[0]?.content?.parts?.[0]?.text || null
	} catch (err) {
		console.error('Gemini fetch error:', err.message)
		return null
	}
}

/**
 * Try available AI providers in order: Groq → Gemini → null
 */
const callAI = async (prompt, options = {}) => {
	// Try Groq first (free, reliable, worldwide)
	const groqResult = await callGroq(prompt, options)
	if (groqResult) return groqResult

	// Try Gemini as fallback
	const geminiResult = await callGemini(prompt, options)
	if (geminiResult) return geminiResult

	return null
}

// ─── Improved local fallbacks (no API key) ─────────────────────────────

const localSummarize = (title, plainText) => {
	const sentences = plainText
		.split(/[.!?]+/)
		.map(s => s.trim())
		.filter(s => s.length > 15)

	if (sentences.length === 0) {
		return `### Summary of "${title}"\n\n- This note does not have enough content to generate a summary.\n\n*(Add a GROQ_API_KEY in .env for AI-powered summaries — it's free!)*`
	}

	const picks = [sentences[0]]
	const step = Math.max(1, Math.floor(sentences.length / 4))
	for (let i = step; i < sentences.length && picks.length < 5; i += step) {
		picks.push(sentences[i])
	}

	return (
		`### Summary of "${title}"\n\n` +
		picks.map(p => `- ${p}.`).join('\n') +
		`\n\n*(Local summary — add GROQ_API_KEY in .env for AI-powered results)*`
	)
}

const localFlashcards = (title, plainText) => {
	const sentences = plainText
		.split(/[.!?]+/)
		.map(s => s.trim())
		.filter(s => s.length > 20)

	if (sentences.length === 0) {
		return [{ question: `What is "${title}" about?`, answer: 'Not enough content to generate flashcards. Add more text to your note.' }]
	}

	const cards = []
	const used = new Set()

	for (const sentence of sentences) {
		if (cards.length >= 5) break
		if (used.has(sentence)) continue
		used.add(sentence)

		const words = sentence.split(/\s+/)
		const keyPhrase = words.slice(0, Math.min(4, words.length)).join(' ')

		cards.push({
			question: `Regarding "${title}": What can you say about "${keyPhrase}..."?`,
			answer: sentence + '.',
		})
	}

	return cards
}

const localQuiz = (title, plainText) => {
	const sentences = plainText
		.split(/[.!?]+/)
		.map(s => s.trim())
		.filter(s => s.length > 20)

	if (sentences.length < 2) {
		return [
			{
				question: `What is the main topic of "${title}"?`,
				options: [
					plainText.slice(0, 60) || title,
					'An unrelated subject',
					'A random concept',
					'None of these',
				],
				correctAnswer: 0,
			},
		]
	}

	const quiz = []
	const step = Math.max(1, Math.floor(sentences.length / 3))

	for (let i = 0; i < sentences.length && quiz.length < 3; i += step) {
		const correct = sentences[i] + '.'
		const distractors = []
		for (let j = 0; j < sentences.length && distractors.length < 3; j++) {
			if (j !== i) {
				distractors.push(sentences[j].slice(0, 50) + '...')
			}
		}
		while (distractors.length < 3) {
			distractors.push(`An unrelated concept (${distractors.length + 1})`)
		}

		const correctIndex = Math.floor(Math.random() * 4)
		const options = [...distractors.slice(0, 3)]
		options.splice(correctIndex, 0, correct.slice(0, 80))

		quiz.push({
			question: `Which of the following is stated in the note "${title}"?`,
			options,
			correctAnswer: correctIndex,
		})
	}

	return quiz
}

// ─── Routes ────────────────────────────────────────────────────────────

// POST /api/ai/summarize/:noteId
router.post('/summarize/:noteId', protect, async (req, res) => {
	try {
		const note = await getAccessibleNote(req.params.noteId, req.user._id)
		if (!note) return res.status(403).json({ message: 'Note not found or unauthorized' })

		const plainText = stripHtml(note.content)

		const aiResult = await callAI(
			`Title: ${note.title}\nTags: ${note.tags?.join(', ') || 'none'}\n\nFull Content:\n${plainText}`,
			{
				systemInstruction:
					'You are an expert study assistant. Summarize the following note into a clear, concise summary with bullet points. ' +
					'Cover ALL key concepts, definitions, and important details from the FULL content. ' +
					'Use markdown formatting. Start with a brief overview sentence, then list the key points.',
			}
		)

		if (aiResult) {
			return res.json({ summary: aiResult })
		}

		res.json({ summary: localSummarize(note.title, plainText) })
	} catch (error) {
		console.error('Summarize error:', error)
		res.status(500).json({ message: error.message })
	}
})

// POST /api/ai/flashcards/:noteId
router.post('/flashcards/:noteId', protect, async (req, res) => {
	try {
		const note = await getAccessibleNote(req.params.noteId, req.user._id)
		if (!note) return res.status(403).json({ message: 'Note not found or unauthorized' })

		const plainText = stripHtml(note.content)

		const aiResult = await callAI(
			`Title: ${note.title}\nTags: ${note.tags?.join(', ') || 'none'}\n\nFull Content:\n${plainText}`,
			{
				systemInstruction:
					'You are an expert study assistant. Generate 5 high-quality flashcards based on the FULL content of this note. ' +
					'Each flashcard should test a specific concept, definition, or fact from the content. ' +
					'Return a JSON object with a "flashcards" key containing an array of objects, each with "question" and "answer" properties. ' +
					'Make questions specific and answers detailed.',
				json: true,
			}
		)

		if (aiResult) {
			try {
				const parsed = JSON.parse(aiResult)
				const cards = parsed.flashcards || parsed.cards || parsed
				if (Array.isArray(cards) && cards.length > 0) {
					return res.json(cards)
				}
			} catch (parseErr) {
				console.error('AI flashcard parse error:', parseErr)
			}
		}

		res.json(localFlashcards(note.title, plainText))
	} catch (error) {
		console.error('Flashcards error:', error)
		res.status(500).json({ message: error.message })
	}
})

// POST /api/ai/quiz/:noteId
router.post('/quiz/:noteId', protect, async (req, res) => {
	try {
		const note = await getAccessibleNote(req.params.noteId, req.user._id)
		if (!note) return res.status(403).json({ message: 'Note not found or unauthorized' })

		const plainText = stripHtml(note.content)

		const aiResult = await callAI(
			`Title: ${note.title}\nTags: ${note.tags?.join(', ') || 'none'}\n\nFull Content:\n${plainText}`,
			{
				systemInstruction:
					'You are an expert study assistant. Generate a 5-question multiple choice quiz based ENTIRELY on the FULL content of this note. ' +
					'Each question must be answerable from the note content only. Do NOT use the title or tags to create questions — use the actual content. ' +
					'Return a JSON object with a "questions" key containing an array of objects. ' +
					'Each object must have: "question" (string), "options" (array of exactly 4 strings), and "correctAnswer" (integer index 0-3). ' +
					'Make the distractors plausible but clearly wrong based on the content.',
				json: true,
			}
		)

		if (aiResult) {
			try {
				const parsed = JSON.parse(aiResult)
				const questions = parsed.questions || parsed.quiz || parsed
				if (Array.isArray(questions) && questions.length > 0) {
					return res.json(questions)
				}
			} catch (parseErr) {
				console.error('AI quiz parse error:', parseErr)
			}
		}

		res.json(localQuiz(note.title, plainText))
	} catch (error) {
		console.error('Quiz error:', error)
		res.status(500).json({ message: error.message })
	}
})

// POST /api/ai/quiz/:noteId/submit
router.post('/quiz/:noteId/submit', protect, async (req, res) => {
	try {
		const note = await getAccessibleNote(req.params.noteId, req.user._id)
		if (!note) return res.status(403).json({ message: 'Note not found or unauthorized' })

		const { score } = req.body
		if (score === undefined || typeof score !== 'number') {
			return res.status(400).json({ message: 'Score is required and must be a number' })
		}

		const statusStr = score >= 80 ? 'completed' : 'reviewing'

		const analytics = await NoteAnalytics.findOneAndUpdate(
			{ user: req.user._id, note: note._id },
			{
				$push: { quizScores: score },
				$set: { status: statusStr, lastVisited: new Date() },
			},
			{ upsert: true, returnDocument: 'after' }
		)

		res.json({ message: 'Quiz score submitted successfully', analytics })
	} catch (error) {
		console.error('Quiz submit error:', error)
		res.status(500).json({ message: error.message })
	}
})

export default router
