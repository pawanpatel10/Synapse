import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const SiteHeader = () => {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    const isDark = localStorage.getItem('synapse_dark') === 'true'
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) {
      document.body.classList.remove('menu-open')
      return undefined
    }

    document.body.classList.add('menu-open')

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.classList.remove('menu-open')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  return (
    <header className="site-header">
      <div className="site-header-left">
        <button className={`menu-button${menuOpen ? ' open' : ''}`} type="button" onClick={() => setMenuOpen((current) => !current)} aria-expanded={menuOpen} aria-label="Toggle navigation menu">
          <span />
          <span />
          <span />
        </button>

        <Link className="brand brand-link" to="/dashboard">
          <span className="brand-mark" />
          <span>Synapse</span>
        </Link>
      </div>

      <div className="site-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          className="icon-button"
          type="button"
          onClick={() => {
            const isDark = document.documentElement.classList.toggle('dark')
            localStorage.setItem('synapse_dark', isDark ? 'true' : 'false')
          }}
          title="Toggle Dark/Light Mode"
          style={{ cursor: 'pointer', display: 'grid', placeItems: 'center' }}
        >
          🌓
        </button>
      </div>

      <div className={`menu-backdrop${menuOpen ? ' open' : ''}`} onClick={closeMenu} />

      <aside className={`left-popover${menuOpen ? ' open' : ''}`}>
        <div className="left-popover-header">
          <div>
            <span className="eyebrow">Menu</span>
            <strong>{user?.name || user?.email || 'User'}</strong>
          </div>
          <button className="icon-button" type="button" onClick={closeMenu} aria-label="Close navigation menu">
            ×
          </button>
        </div>

        <nav className="left-popover-nav">
          <NavLink className={({ isActive }) => `left-popover-link${isActive ? ' active' : ''}`} to="/profile" onClick={closeMenu}>
            Profile
          </NavLink>
          <NavLink className={({ isActive }) => `left-popover-link${isActive ? ' active' : ''}`} to="/notes" onClick={closeMenu}>
            Notes
          </NavLink>
          <NavLink className={({ isActive }) => `left-popover-link${isActive ? ' active' : ''}`} to="/graph" onClick={closeMenu}>
            Knowledge Graph
          </NavLink>
          <NavLink className={({ isActive }) => `left-popover-link${isActive ? ' active' : ''}`} to="/analytics" onClick={closeMenu}>
            Analytics
          </NavLink>
        </nav>

        <button
          className="menu-logout"
          type="button"
          onClick={() => {
            closeMenu()
            signOut()
          }}
        >
          Log out
        </button>
      </aside>
    </header>
  )
}

export default SiteHeader