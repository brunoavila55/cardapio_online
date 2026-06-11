import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Validate session
      apiFetch('/auth/me')
        .then(data => {
          setUser(data.user)
          setLoading(false)
        })
        .catch(() => {
          localStorage.removeItem('token')
          setUser(null)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      localStorage.setItem('token', data.token)
      setUser(data.user)
      return data
    } catch (err) {
      setLoading(false)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (restaurantName, slug, email, password) => {
    setLoading(true)
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ restaurantName, slug, email, password })
      })
      localStorage.setItem('token', data.token)
      setUser(data.user)
      return data
    } catch (err) {
      setLoading(false)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    localStorage.removeItem('token')
    setUser(null)
    setLoading(false)
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { user, loading, signIn, register, signOut } },
    children
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
