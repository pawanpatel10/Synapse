import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const SiteHeader = () => {
  const { user, signOut } = useAuth()

  return (
    <header className="site-header">
      <Link className="brand brand-link" to="/dashboard">
        <span className="brand-mark" />
        <span>Synapse</span>
      </Link>

      <nav className="site-nav">
        <NavLink className={({ isActive }) => `site-nav-link${isActive ? ' active' : ''}`} to="/dashboard">
          Dashboard
        </NavLink>
        <NavLink className={({ isActive }) => `site-nav-link${isActive ? ' active' : ''}`} to="/notes">
          Notes
        </NavLink>
      </nav>

      <div className="site-userbar">
        <span className="site-user">{user?.name || user?.email || 'User'}</span>
        <button className="secondary-button" type="button" onClick={signOut}>
          Sign out
        </button>
      </div>
    </header>
  )
}

export default SiteHeader