import SiteHeader from '../components/SiteHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const ProfilePage = () => {
  const { user } = useAuth()

  return (
    <main className="app-shell site-page">
      <SiteHeader />

      <section className="hero-banner compact-hero">
        <div>
          <span className="eyebrow">Profile</span>
          <h1>Your account details.</h1>
          <p>Basic profile information is shown here so the left menu has a proper destination.</p>
        </div>
      </section>

      <section className="workspace-layout">
        <div className="main-panel surface-panel profile-panel">
          <div className="profile-card">
            <span className="profile-label">Name</span>
            <strong>{user?.name || 'User'}</strong>
          </div>
          <div className="profile-card">
            <span className="profile-label">Email</span>
            <strong>{user?.email || 'unknown'}</strong>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ProfilePage