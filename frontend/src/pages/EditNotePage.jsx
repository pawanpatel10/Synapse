import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader.jsx'
import NoteEditor from '../components/notes/NoteEditor.jsx'
import api from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const EditNotePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    collaborators: '',
  })

  const [status, setStatus] = useState({
    loading: true,
    saving: false,
    error: '',
    success: '',
  })

  // AI Study Companion states
  const [activeHubTab, setActiveHubTab] = useState('summary') // summary, flashcards, quiz
  const [summary, setSummary] = useState('')
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [aiError, setAiError] = useState('')

  const [flashcards, setFlashcards] = useState([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const [quizQuestions, setQuizQuestions] = useState([])
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [submittedQuizScore, setSubmittedQuizScore] = useState(null)

  useEffect(() => {
    const loadNote = async () => {
      try {
        const { data } = await api.get(`/api/notes/${id}`)

        setFormData({
          title: data.title || '',
          content: data.content || '',
          tags: Array.isArray(data.tags)
            ? data.tags.join(', ')
            : '',
          collaborators: Array.isArray(data.collaborators)
            ? data.collaborators
                .map((c) => c.email || c._id || '')
                .join(', ')
            : '',
        })
      } catch (error) {
        setStatus((current) => ({
          ...current,
          error: error.response?.data?.message || 'Failed to load note',
        }))
      } finally {
        setStatus((current) => ({
          ...current,
          loading: false,
        }))
      }
    }

    loadNote()
  }, [id])

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setStatus((current) => ({
      ...current,
      saving: true,
      error: '',
      success: '',
    }))

    try {
      await api.put(`/api/notes/${id}`, formData)

      setStatus((current) => ({
        ...current,
        saving: false,
        success: 'Note updated successfully',
      }))

      navigate('/notes')
    } catch (error) {
      setStatus((current) => ({
        ...current,
        saving: false,
        error: error.response?.data?.message || 'Failed to update note',
      }))
    }
  }

  // AI Actions
  const handleGenerateSummary = async () => {
    setLoadingSummary(true)
    setAiError('')
    try {
      const { data } = await api.post(`/api/ai/summarize/${id}`)
      setSummary(data.summary)
    } catch (error) {
      console.error(error)
      setAiError('Failed to generate summary. Please try again.')
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleGenerateFlashcards = async () => {
    setLoadingCards(true)
    setAiError('')
    try {
      const { data } = await api.post(`/api/ai/flashcards/${id}`)
      setFlashcards(data)
      setCurrentCardIndex(0)
      setIsFlipped(false)
    } catch (error) {
      console.error(error)
      setAiError('Failed to generate flashcards. Please try again.')
    } finally {
      setLoadingCards(false)
    }
  }

  const handleGenerateQuiz = async () => {
    setLoadingQuiz(true)
    setQuizCompleted(false)
    setCurrentQuestionIndex(0)
    setCorrectAnswersCount(0)
    setSelectedAnswer(null)
    setSubmittedQuizScore(null)
    try {
      const { data } = await api.post(`/api/ai/quiz/${id}`)
      setQuizQuestions(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingQuiz(false)
    }
  }

  const handleAnswerSelection = (index) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(index)
    if (index === quizQuestions[currentQuestionIndex].correctAnswer) {
      setCorrectAnswersCount((prev) => prev + 1)
    }
  }

  const handleNextQuestion = () => {
    setSelectedAnswer(null)
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      setQuizCompleted(true)
      submitQuizScore()
    }
  }

  const submitQuizScore = async () => {
    const finalScore = Math.round((correctAnswersCount / quizQuestions.length) * 100)
    setSubmittedQuizScore(finalScore)
    try {
      await api.post(`/api/ai/quiz/${id}/submit`, { score: finalScore })
    } catch (error) {
      console.error('Failed to submit quiz score:', error)
    }
  }

  if (status.loading) {
    return (
      <main className="app-shell site-page">
        <SiteHeader />
        <section className="workspace-layout">
          <div className="main-panel surface-panel">
            <p>Loading note...</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell site-page">
      <SiteHeader />

      <div className="edit-page-container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Left Panel: Rich Editor */}
        <section className="main-panel surface-panel edit-panel">
          <div className="edit-header">
            <div>
              <span className="eyebrow">Notes Workspace</span>
              <h1>Edit Note</h1>
              <p>Collaborate in real-time, format text, and save changes.</p>
            </div>
            <Link className="secondary-button button-link" to="/notes">
              Back to notes
            </Link>
          </div>

          <form className="field-grid" onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <label className="field">
              <span>Title</span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </label>

            <label className="field">
              <span>Content</span>
              <NoteEditor
                noteId={id}
                userName={user?.name || user?.email || 'Guest'}
                value={formData.content}
                onChange={(content) =>
                  setFormData((prev) => ({
                    ...prev,
                    content,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>Tags (comma separated)</span>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="react, logic, dynamic-programming"
              />
            </label>

            <label className="field">
              <span>Collaborators (emails, comma separated)</span>
              <input
                type="text"
                name="collaborators"
                value={formData.collaborators}
                onChange={handleChange}
                placeholder="user@example.com, another@example.com"
              />
            </label>

            <button className="primary-button" type="submit" disabled={status.saving} style={{ width: '100%' }}>
              {status.saving ? 'Saving changes...' : 'Save Note Details'}
            </button>
          </form>

          {status.error ? <div className="error-banner">{status.error}</div> : null}
          {status.success ? <div className="success-banner">{status.success}</div> : null}
        </section>

        {/* Right Panel: AI Study Companion */}
        <section className="main-panel surface-panel edit-panel" style={{ background: 'linear-gradient(180deg, #faf5ff 0%, #ffffff 100%)', border: '1px solid rgba(139, 92, 246, 0.12)' }}>
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e9d5ff', paddingBottom: '12px' }}>
            <button
              onClick={() => setActiveHubTab('summary')}
              className={`mode-tab ${activeHubTab === 'summary' ? 'active' : ''}`}
              style={{ cursor: 'pointer', padding: '8px 12px', fontSize: '0.9rem', border: '0', background: 'transparent' }}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveHubTab('flashcards')}
              className={`mode-tab ${activeHubTab === 'flashcards' ? 'active' : ''}`}
              style={{ cursor: 'pointer', padding: '8px 12px', fontSize: '0.9rem', border: '0', background: 'transparent' }}
            >
              Flashcards
            </button>
            <button
              onClick={() => setActiveHubTab('quiz')}
              className={`mode-tab ${activeHubTab === 'quiz' ? 'active' : ''}`}
              style={{ cursor: 'pointer', padding: '8px 12px', fontSize: '0.9rem', border: '0', background: 'transparent' }}
            >
              Quiz Game
            </button>
          </div>

          <div className="study-hub-content" style={{ marginTop: '20px', minHeight: '380px' }}>
            {/* AI Summary Tab */}
            {activeHubTab === 'summary' && (
              <div>
                <h2>✨ AI Topic Summary</h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>Generate a quick outline of key points from this note.</p>
                {aiError && activeHubTab === 'summary' ? <div className="error-banner" style={{ marginBottom: '12px' }}>{aiError}</div> : null}
                {summary ? (
                  <div>
                    <div style={{ background: '#fcfaff', padding: '16px', borderRadius: '12px', border: '1px solid #e9d5ff', whiteSpace: 'pre-line', fontSize: '0.92rem' }}>
                      {summary}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                      <button className="secondary-button" type="button" onClick={() => { setSummary(''); handleGenerateSummary(); }} disabled={loadingSummary}>
                        {loadingSummary ? 'Regenerating...' : '🔄 Regenerate Summary'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', marginTop: '60px' }}>
                    <button className="primary-button" type="button" onClick={handleGenerateSummary} disabled={loadingSummary}>
                      {loadingSummary ? 'Summarizing...' : 'Generate Summary'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Flashcards Tab */}
            {activeHubTab === 'flashcards' && (
              <div>
                <h2>💡 Smart Flashcards</h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>Interactive study cards generated from your content.</p>
                
                {flashcards.length > 0 ? (
                  <div>
                    <div
                      onClick={() => setIsFlipped(!isFlipped)}
                      style={{
                        background: isFlipped ? '#f0fdf4' : '#eff6ff',
                        border: isFlipped ? '2px solid #86efac' : '2px solid #bfdbfe',
                        minHeight: '180px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.02)',
                        transition: 'transform 0.3s ease, background 0.3s ease',
                      }}
                    >
                      <h3 style={{ color: isFlipped ? '#065f46' : '#1e3a8a', margin: '0' }}>
                        {isFlipped ? flashcards[currentCardIndex].answer : flashcards[currentCardIndex].question}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                      <button
                        className="secondary-button"
                        type="button"
                        disabled={currentCardIndex === 0}
                        onClick={() => {
                          setCurrentCardIndex((c) => c - 1)
                          setIsFlipped(false)
                        }}
                      >
                        Prev
                      </button>
                      <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        {currentCardIndex + 1} / {flashcards.length}
                      </span>
                      <button
                        className="secondary-button"
                        type="button"
                        disabled={currentCardIndex === flashcards.length - 1}
                        onClick={() => {
                          setCurrentCardIndex((c) => c + 1)
                          setIsFlipped(false)
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', marginTop: '60px' }}>
                    <button className="primary-button" type="button" onClick={handleGenerateFlashcards} disabled={loadingCards}>
                      {loadingCards ? 'Generating cards...' : 'Build Flashcards'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quiz Tab */}
            {activeHubTab === 'quiz' && (
              <div>
                <h2>🎮 Practice Quiz</h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>Test your retention. Quiz performance is logged to your study dashboard.</p>

                {loadingQuiz ? (
                  <p style={{ textAlign: 'center', marginTop: '40px' }}>Creating customized quiz...</p>
                ) : quizQuestions.length > 0 ? (
                  !quizCompleted ? (
                    <div>
                      <div style={{ marginBottom: '16px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#8b5cf6', fontWeight: 'bold' }}>QUESTION {currentQuestionIndex + 1} OF {quizQuestions.length}</span>
                        <h3 style={{ margin: '8px 0 0' }}>{quizQuestions[currentQuestionIndex].question}</h3>
                      </div>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
                          const isCorrect = idx === quizQuestions[currentQuestionIndex].correctAnswer
                          const isSelected = idx === selectedAnswer
                          let bg = '#ffffff'
                          let border = '1px solid rgba(15, 23, 42, 0.08)'
                          if (selectedAnswer !== null) {
                            if (isCorrect) {
                              bg = '#d1fae5'
                              border = '1px solid #10b981'
                            } else if (isSelected) {
                              bg = '#fee2e2'
                              border = '1px solid #ef4444'
                            }
                          }
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => handleAnswerSelection(idx)}
                              style={{
                                background: bg,
                                border: border,
                                padding: '12px 16px',
                                borderRadius: '10px',
                                textAlign: 'left',
                                cursor: selectedAnswer !== null ? 'default' : 'pointer',
                                fontWeight: '500',
                                fontSize: '0.9rem',
                                color: '#1e293b'
                              }}
                            >
                              {option}
                            </button>
                          )
                        })}
                      </div>
                      {selectedAnswer !== null && (
                        <div style={{ textAlign: 'right', marginTop: '16px' }}>
                          <button className="primary-button" type="button" onClick={handleNextQuestion}>
                            {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <h1 style={{ fontSize: '3rem', margin: '0', color: submittedQuizScore >= 80 ? '#10b981' : '#f59e0b' }}>
                        {submittedQuizScore}%
                      </h1>
                      <h3>Quiz Completed!</h3>
                      <p style={{ color: '#64748b' }}>
                        You got {correctAnswersCount} out of {quizQuestions.length} questions correct. Score uploaded to dashboard.
                      </p>
                      <button className="primary-button" type="button" onClick={handleGenerateQuiz} style={{ marginTop: '12px' }}>
                        Retake Quiz
                      </button>
                    </div>
                  )
                ) : (
                  <div style={{ textAlign: 'center', marginTop: '60px' }}>
                    <button className="primary-button" type="button" onClick={handleGenerateQuiz}>
                      Start Practice Quiz
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

      </div>
    </main>
  )
}

export default EditNotePage