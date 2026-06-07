import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('synapse_user')
    return storedUser ? JSON.parse(storedUser) : null
  })

  const [token, setToken] = useState(() => localStorage.getItem('synapse_token') || '')

  useEffect(() => {
    if (token) {
      localStorage.setItem('synapse_token', token)
      api.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
      localStorage.removeItem('synapse_token')
      delete api.defaults.headers.common.Authorization
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('synapse_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('synapse_user')
    }
  }, [user])

  const value = useMemo(() => {
    const signIn = ({ nextUser, nextToken }) => {
      localStorage.setItem('synapse_user', JSON.stringify(nextUser))
      localStorage.setItem('synapse_token', nextToken)
      api.defaults.headers.common.Authorization = `Bearer ${nextToken}`
      setUser(nextUser)
      setToken(nextToken)
    }

    const signOut = () => {
      localStorage.removeItem('synapse_user')
      localStorage.removeItem('synapse_token')
      delete api.defaults.headers.common.Authorization
      setUser(null)
      setToken('')
    }

    return {
      user,
      token,
      signIn,
      signOut,
      isAuthenticated: Boolean(user && token),
    }
  }, [token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}