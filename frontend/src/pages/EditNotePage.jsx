import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader.jsx'
import api from '../services/api.js'

const EditNotePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ title: '', content: '', tags: '' })
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '' })

  useEffect(() => {
    const loadNote = async () => {
      try {
        const { data } = await api.get(`/api/notes/${id}`)
        setFormData({
          title: data.title || '',
          content: data.content || '',
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        })
      } catch (error) {
        setStatus((current) => ({
          ...current,
          error: error.response?.data?.message || 'Failed to load note',
        }))
      } finally {
        setStatus((current) => ({ ...current, loading: false }))
      }
    }

    loadNote()
  }, [id])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus((current) => ({ ...current, saving: true, error: '', success: '' }))

    try {
      await api.put(`/api/notes/${id}`, formData)
      setStatus((current) => ({ ...current, saving: false, success: 'Note updated successfully' }))
      navigate('/notes')
    } catch (error) {
      setStatus((current) => ({
        ...current,
        saving: false,
        error: error.response?.data?.message || 'Failed to update note',
      }))
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
      <section className="workspace-layout">
        <div className="main-panel surface-panel edit-panel">
          <div className="edit-header">
            <div>
              <span className="eyebrow">Notes</span>
              <h1>Edit note</h1>
              <p>Update the content and save your changes.</p>
            </div>
            <Link className="secondary-button button-link" to="/notes">
              Back to notes
            </Link>
          </div>

          <form className="field-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Title</span>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required />
            </label>

            <label className="field">
              <span>Content</span>
              <textarea name="content" value={formData.content} onChange={handleChange} required />
            </label>

            <label className="field">
              <span>Tags</span>
              <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="react, backend" />
            </label>

            <button className="primary-button" type="submit" disabled={status.saving}>
              {status.saving ? 'Saving changes...' : 'Save changes'}
            </button>
          </form>

          {status.error ? <div className="error-banner">{status.error}</div> : null}
          {status.success ? <div className="success-banner">{status.success}</div> : null}
        </div>
      </section>
    </main>
  )
}

export default EditNotePage