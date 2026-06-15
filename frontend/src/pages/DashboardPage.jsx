import { useEffect, useMemo, useState } from 'react';
import NoteList from "../components/notes/NoteList.jsx";
import SiteHeader from '../components/SiteHeader.jsx'
import api from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const DashboardPage = () => {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const { data } = await api.get('/api/notes')
        setNotes(data)
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadNotes()
  }, [])

  const dashboardStats = useMemo(() => {
    const uniqueTags = new Set()
    const uniqueCollaborators = new Set()

    notes.forEach((note) => {
      note.tags?.forEach((tag) => uniqueTags.add(tag))
      note.collaborators?.forEach((collaborator) => {
        uniqueCollaborators.add(collaborator._id || collaborator)
      })
    })

    return [
      { value: notes.length, label: 'Notes created' },
      { value: uniqueTags.size, label: 'Active tags' },
      { value: uniqueCollaborators.size, label: 'Collaborators' },
    ]
  }, [notes])

  const recentNotes = useMemo(() => notes.slice(0, 10), [notes])

  return (
    <main className="app-shell site-page">
      <SiteHeader />

      <section className="hero-banner compact-hero">
        <div>
          <span className="eyebrow">Workspace overview</span>
          <h1>Welcome back{user?.name ? `, ${user.name}` : ''}.</h1>
          <p>Track notes, collaborators, and recent work from one clean overview.</p>
        </div>
      </section>

      <section className="workspace-layout dashboard-compact">
        <div className="main-panel surface-panel">
          <h2>Overview</h2>
          <p>Your current workspace data is shown below.</p>

          {error ? <div className="error-banner">{error}</div> : null}

          <div className="stats-grid">
            {dashboardStats.map((stat) => (
              <div className="stat-card" key={stat.label}>
                <strong>{loading ? '...' : stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          <section className="section-card">
            <h2>Recent notes</h2>
            {loading ? (
              <p>Loading dashboard data...</p>
            ) : recentNotes.length > 0 ? (
              <NoteList notes={recentNotes} loadingNotes={loading} compact={true} />
            ) : (
              <p>No notes created yet.</p>
            )}
          </section>
        </div>
      </section>

    </main>
  )
}

export default DashboardPage