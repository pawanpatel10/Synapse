import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { useAuth } from './context/AuthContext.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import EditNotePage from './pages/EditNotePage.jsx'
import NotesPage from './pages/NotesPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes"
        element={
          <ProtectedRoute>
            <NotesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes/:id/edit"
        element={
          <ProtectedRoute>
            <EditNotePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default App
