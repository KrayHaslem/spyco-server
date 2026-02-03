import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from './AuthContext'
import { api } from '../utils/api'
import type { User } from '../types'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.checkLogin()
      if (response.data !== null && typeof response.data === 'object' && 'user' in response.data) {
        setUser((response.data as { user: User }).user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password)
    if (response.error) {
      return { success: false, error: response.error }
    }
    if (response.data !== null && typeof response.data === 'object' && 'user' in response.data) {
      setUser((response.data as { user: User }).user)
    }
    return { success: true }
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setUser(null)
  }, [])

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
