import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ENDPOINTS } from '../config/api'

/**
 * AUTHENTICATION CONTEXT & TOKEN STORAGE DECISION:
 * ------------------------------------------------
 * In Phase 1, access tokens are passed via standard HTTP Authorization Bearer headers.
 * Tokens are held in React state and mirrored in `sessionStorage` (scoped strictly to the active
 * browser tab session to avoid indefinite disk persistence of localStorage).
 * 
 * SECURITY TRADE-OFF NOTICE:
 * Client-accessible storage (sessionStorage/localStorage) is susceptible to XSS if an attacker
 * manages to execute arbitrary scripts in the application's origin.
 * 
 * PRODUCTION HARDENING ROADMAP (Phase 6):
 * For public production deployment, migrate token delivery to HttpOnly, SameSite=Strict cookies
 * with anti-CSRF token verification and short token lifetimes with refresh token rotation.
 */

const TOKEN_STORAGE_KEY = 'prepverse_access_token'
const LEGACY_TOKEN_STORAGE_KEY = 'interviewai_access_token'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(LEGACY_TOKEN_STORAGE_KEY))
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  // Safe initial verification: query backend /me to confirm token validity
  const verifyCurrentToken = useCallback(async (tokenToVerify) => {
    if (!tokenToVerify) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const response = await fetch(ENDPOINTS.AUTH_ME, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setToken(tokenToVerify)
        sessionStorage.setItem(TOKEN_STORAGE_KEY, tokenToVerify)
      } else {
        // Token invalid, expired, or rejected by server -> clean up
        sessionStorage.removeItem(TOKEN_STORAGE_KEY)
        sessionStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)
        setToken(null)
        setUser(null)
      }
    } catch (err) {
      // Backend unreachable or network failure -> do not assume logged in
      console.warn('Unable to verify auth session with backend:', err.message)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const existingToken = sessionStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(LEGACY_TOKEN_STORAGE_KEY)
    verifyCurrentToken(existingToken)
  }, [verifyCurrentToken])

  const register = async (name, email, password) => {
    setAuthError(null)
    try {
      const response = await fetch(ENDPOINTS.AUTH_REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.detail || 'Registration failed. Please check your details.'
        setAuthError(errorMessage)
        return { success: false, error: errorMessage }
      }

      sessionStorage.setItem(TOKEN_STORAGE_KEY, data.access_token)
      setToken(data.access_token)
      setUser(data.user)
      return { success: true }
    } catch (err) {
      const msg = 'Network error connecting to authentication service. Please verify backend is running.'
      setAuthError(msg)
      return { success: false, error: msg }
    }
  }

  const login = async (email, password) => {
    setAuthError(null)
    try {
      const response = await fetch(ENDPOINTS.AUTH_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.detail || 'Invalid email or password.'
        setAuthError(errorMessage)
        return { success: false, error: errorMessage }
      }

      sessionStorage.setItem(TOKEN_STORAGE_KEY, data.access_token)
      setToken(data.access_token)
      setUser(data.user)
      return { success: true }
    } catch (err) {
      const msg = 'Network error connecting to authentication service. Please verify backend is running.'
      setAuthError(msg)
      return { success: false, error: msg }
    }
  }

  const logout = () => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY)
    sessionStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
    setAuthError(null)
  }

  const authFetch = useCallback(async (url, options = {}) => {
    const activeToken = token || sessionStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(LEGACY_TOKEN_STORAGE_KEY)
    const headers = {
      ...(options.headers || {}),
    }
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`
    }
    return fetch(url, {
      ...options,
      headers,
    })
  }, [token])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authError,
        setAuthError,
        register,
        login,
        logout,
        authFetch,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

