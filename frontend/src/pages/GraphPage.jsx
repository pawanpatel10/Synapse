import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReactFlow, Background, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import SiteHeader from '../components/SiteHeader.jsx'
import api from '../services/api.js'

export default function GraphPage() {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const { data } = await api.get('/api/graph')
        const { notes, links } = data

        if (!notes || notes.length === 0) {
          setLoading(false)
          return
        }

        // Arrange nodes in a beautiful circular layout
        const radius = 250
        const centerX = 400
        const centerY = 300

        const formattedNodes = notes.map((note, index) => {
          const angle = (index / notes.length) * 2 * Math.PI
          return {
            id: note._id,
            data: { label: note.title },
            position: {
              x: notes.length > 1 ? centerX + radius * Math.cos(angle) : centerX,
              y: notes.length > 1 ? centerY + radius * Math.sin(angle) : centerY,
            },
            style: {
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#1e3a8a',
              border: '2px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '16px',
              padding: '12px 16px',
              fontWeight: '600',
              boxShadow: '0 10px 25px rgba(59, 130, 246, 0.08)',
              backdropFilter: 'blur(10px)',
              minWidth: '150px',
              textAlign: 'center',
            },
          }
        })

        const formattedEdges = links.map((link) => ({
          id: link._id || `${link.sourceNote}-${link.targetNote}`,
          source: link.sourceNote,
          target: link.targetNote,
          label: link.sharedTags?.join(', ') || '',
          animated: true,
          style: {
            stroke: '#10b981',
            strokeWidth: 2,
          },
          labelStyle: {
            fill: '#047857',
            fontWeight: '600',
            fontSize: '11px',
          },
        }))

        setNodes(formattedNodes)
        setEdges(formattedEdges)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch knowledge graph')
      } finally {
        setLoading(false)
      }
    }

    fetchGraphData()
  }, [])

  const onNodeClick = (event, node) => {
    navigate(`/notes/${node.id}/edit`)
  }

  return (
    <main className="app-shell site-page">
      <SiteHeader />

      <section className="hero-banner compact-hero">
        <div>
          <span className="eyebrow">Visualizer</span>
          <h1>Knowledge Graph</h1>
          <p>
            Explore how your notes connect automatically based on shared tags. Click a node to view or edit details.
          </p>
        </div>
      </section>

      <section className="workspace-layout">
        <div className="main-panel surface-panel" style={{ height: '600px', position: 'relative' }}>
          {loading ? (
            <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
              <p>Generating knowledge connections...</p>
            </div>
          ) : error ? (
            <div className="error-banner">{error}</div>
          ) : nodes.length === 0 ? (
            <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#64748b' }}>
              <p>No connections yet. Add shared tags to your notes to link them together!</p>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodeClick={onNodeClick}
                fitView
              >
                <Background color="#cbd5e1" gap={16} />
                <Controls />
              </ReactFlow>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
