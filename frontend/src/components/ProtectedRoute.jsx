import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate, useLocation } from '../context/RouterContext'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-brand-violet/30 border-t-brand-violet animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-brand-cyan">
            P
          </div>
        </div>
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">
          Verifying PrepVerse Session...
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login preserving the target route
    const redirectUrl = location.pathname ? `/login?from=${encodeURIComponent(location.pathname)}` : '/login'
    return <Navigate to={redirectUrl} replace />
  }

  return children
}

