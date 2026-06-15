import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import SiteHeader from '../components/SiteHeader.jsx'
import api from '../services/api.js'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/api/analytics')
        setStats(data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <main className="app-shell site-page">
        <SiteHeader />
        <section className="workspace-layout">
          <div className="main-panel surface-panel">
            <p>Loading analytics data...</p>
          </div>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="app-shell site-page">
        <SiteHeader />
        <section className="workspace-layout">
          <div className="main-panel surface-panel">
            <div className="error-banner">{error}</div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell site-page">
      <SiteHeader />

      <section className="hero-banner compact-hero">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>Study Analytics.</h1>
          <p>Track your revision habits, topic coverage, streaks, and focus areas.</p>
        </div>
      </section>

      <section className="workspace-layout">
        <div className="stats-grid">
          <div className="stat-card">
            <strong>🔥 {stats?.studyStreak || 0} Days</strong>
            <span>Current Study Streak</span>
          </div>
          <div className="stat-card">
            <strong>📝 {stats?.totalNotes || 0}</strong>
            <span>Notes Analyzed</span>
          </div>
          <div className="stat-card">
            <strong>🎯 {stats?.weakTopics?.length || 0}</strong>
            <span>Topics Requiring Review</span>
          </div>
        </div>

        <div className="analytics-visual-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginTop: '24px' }}>
          <div className="main-panel surface-panel" style={{ padding: '24px' }}>
            <h2>Activity History</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Visits and edits over the last 7 days.</p>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.activityChart || []}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="main-panel surface-panel" style={{ padding: '24px' }}>
            <h2>Topic Coverage</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Distribution of notes by tags.</p>
            {stats?.topicCoverage?.length > 0 ? (
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.topicCoverage}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="tag"
                    >
                      {stats?.topicCoverage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{ color: '#64748b', textAlign: 'center', marginTop: '80px' }}>No tag distribution data available. Assign tags to notes to populate topic coverage.</p>
            )}
          </div>
        </div>

        <section className="section-card" style={{ marginTop: '24px' }}>
          <h2>⚠️ Focus Areas / Weak Topics</h2>
          <p style={{ color: '#475569', fontSize: '0.92rem', marginBottom: '16px' }}>
            These topics have high revisit counts but low quiz scores or are still marked as incomplete. Focus on revising these notes.
          </p>

          {stats?.weakTopics?.length > 0 ? (
            <div className="note-list">
              {stats.weakTopics.map((topic) => (
                <div className="note-item" key={topic._id} style={{ borderLeft: '4px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{topic.title}</strong>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                      <span>Visits: {topic.visits}</span>
                      <span>Avg Score: {topic.avgQuizScore !== null ? `${Math.round(topic.avgQuizScore)}%` : 'No score'}</span>
                      <span>Status: <strong style={{ color: '#ef4444' }}>{topic.status}</strong></span>
                    </div>
                  </div>
                  <Link className="secondary-button button-link" to={`/notes/${topic._id}/edit`}>
                    Revise
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#10b981', fontWeight: '500', marginTop: '12px' }}>🎉 Great job! No weak topics detected. Keep maintaining your quiz scores!</p>
          )}
        </section>
      </section>
    </main>
  )
}
