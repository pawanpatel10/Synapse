import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader.jsx'
import api from '../services/api.js'

const initialFormState = {
  title: '',
  content: '',
  tags: '',
}

const NotesPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [notes, setNotes] = useState([])
  const [formData, setFormData] = useState(initialFormState)
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('')
  const [status, setStatus] = useState({ loading: false, error: '', success: '' })
  const [loadingNotes, setLoadingNotes] = useState(true)
  const activeMode = searchParams.get('mode') || 'notes'

  const sortedNotes = useMemo(() => {
    const term = appliedSearchTerm.trim().toLowerCase()

    if (!term) {
      return notes
    }

    return notes.filter((note) => {
      const text = [note.title, note.content, ...(note.tags || [])].join(' ').toLowerCase()
      const collaboratorText = (note.collaborators || [])
        .map((collaborator) => `${collaborator.name || ''} ${collaborator.email || ''}`.trim())
        .join(' ')
        .toLowerCase()

      return text.includes(term) || collaboratorText.includes(term)
    })
  }, [notes, appliedSearchTerm])

  const collaboratorSummary = useMemo(() => {
    const collaborators = new Map()

    notes.forEach((note) => {
      note.collaborators?.forEach((collaborator) => {
        const collaboratorId = collaborator._id || collaborator
        if (!collaborators.has(collaboratorId)) {
          collaborators.set(collaboratorId, collaborator)
        }
      })
    })

    return Array.from(collaborators.values())
  }, [notes])

  const loadNotes = async () => {
    setLoadingNotes(true)

    try {
      const { data } = await api.get('/api/notes')
      setNotes(data)
    } catch (error) {
      setStatus({ loading: false, error: error.response?.data?.message || 'Failed to load notes', success: '' })
    } finally {
      setLoadingNotes(false)
    }
  }

  useEffect(() => {
    loadNotes()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ loading: true, error: '', success: '' })

    try {
      await api.post('/api/notes', formData)
      setFormData(initialFormState)
      setStatus({ loading: false, error: '', success: 'Note created successfully' })
      await loadNotes()
    } catch (error) {
      setStatus({
        loading: false,
        error: error.response?.data?.message || 'Failed to create note',
        success: '',
      })
    }
  }

  const handleDelete = async (noteId) => {
    try {
      await api.delete(`/api/notes/${noteId}`)
      await loadNotes()
    } catch (error) {
      setStatus({ loading: false, error: error.response?.data?.message || 'Failed to delete note', success: '' })
    }
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
  }

  const handleSearchSubmit = () => {
    setAppliedSearchTerm(searchTerm)
  }

  return (
    <main className="app-shell site-page">
      <SiteHeader />

      <section className="hero-banner compact-hero">
        <div>
          <span className="eyebrow">Notes workspace</span>
          <h1>Manage notes in one place.</h1>
          <p>Search, create, and review notes without clutter.</p>
        </div>
      </section>

      <section className="workspace-layout">
        <div className="main-panel surface-panel">
          <div className="mode-tabs">
            <Link className={`mode-tab${activeMode === 'notes' ? ' active' : ''}`} to="/notes">
              Notes
            </Link>
            <Link className={`mode-tab${activeMode === 'search' ? ' active' : ''}`} to="/notes?mode=search">
              Search
            </Link>
            <Link className={`mode-tab${activeMode === 'collaborators' ? ' active' : ''}`} to="/notes?mode=collaborators">
              Collaborators
            </Link>
          </div>

          {activeMode === 'search' ? (
            <section className="section-card">
              <h2>Search notes</h2>
              <div className="search-panel">
                <label className="field">
                  <span>Search by title, content, tag, or collaborator</span>
                  <input type="text" value={searchTerm} onChange={handleSearchChange} placeholder="Type a name or keyword" />
                </label>
                <button className="primary-button search-button" type="button" onClick={handleSearchSubmit}>
                  Search
                </button>
              </div>
            </section>
          ) : null}

          {activeMode === 'notes' ? (
            <section className="section-card create-note-card">
              <h2>Create note</h2>
              <form className="field-grid" onSubmit={handleSubmit}>
                <label className="field">
                  <span>Title</span>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Note title" required />
                </label>

                <label className="field">
                  <span>Content</span>
                  <textarea name="content" value={formData.content} onChange={handleChange} placeholder="Write your note here" required />
                </label>

                <label className="field">
                  <span>Tags</span>
                  <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="react, auth, backend" />
                </label>

                <label className="field">
                  <span>Collaborators</span>
                  <input
                    type="text"
                    name="collaborators"
                    value={formData.collaborators || ''}
                    onChange={handleChange}
                    placeholder="collaborator@example.com or userId, separated by commas"
                  />
                </label>

                <button className="primary-button" type="submit" disabled={status.loading}>
                  {status.loading ? 'Saving...' : 'Create note'}
                </button>
              </form>

              {status.error ? <div className="error-banner">{status.error}</div> : null}
              {status.success ? <div className="success-banner">{status.success}</div> : null}
            </section>
          ) : null}

          <section className="section-card">
            <h2>Note list</h2>
            {loadingNotes ? (
              <p>Loading notes...</p>
            ) : sortedNotes.length > 0 ? (
              <div className="note-list">
                {sortedNotes.map((note) => (
                  <div className="note-item" key={note._id}>
                    <div className="note-header">
                      <strong>{note.title}</strong>
                      <div className="button-row">
                        <Link className="secondary-button button-link" to={`/notes/${note._id}/edit`}>
                          Edit
                        </Link>
                        <button className="secondary-button" type="button" onClick={() => handleDelete(note._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <p>{note.content}</p>
                    <p className="note-meta">
                      {note.tags?.length ? note.tags.map((tag) => `#${tag}`).join(' ') : 'No tags yet'}
                    </p>
                    {note.collaborators?.length ? (
                      <p className="note-meta">
                        Collaborators: {note.collaborators.map((collaborator) => collaborator.name || collaborator.email || 'User').join(', ')}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p>No notes created yet.</p>
            )}
          </section>

          {activeMode === 'collaborators' ? (
            <section className="section-card">
              <h2>Collaborators</h2>
              {collaboratorSummary.length > 0 ? (
                <div className="note-list">
                  {collaboratorSummary.map((collaborator) => (
                    <div className="note-item" key={collaborator._id || collaborator.email}>
                      <strong>{collaborator.name || 'Unnamed collaborator'}</strong>
                      <p>{collaborator.email || 'No email available'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No collaborators added yet.</p>
              )}
            </section>
          ) : null}
        </div>
      </section>
    </main>
  )
}

export default NotesPage