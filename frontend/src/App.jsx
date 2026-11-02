import React from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { RouterProvider, Routes, Route, Navigate } from './context/RouterContext'
import ProtectedRoute from './components/ProtectedRoute'

// Public Multi-Page Experience
import Home from './pages/public/Home'
import Features from './pages/public/Features'
import HowItWorks from './pages/public/HowItWorks'
import About from './pages/public/About'
import Contact from './pages/public/Contact'

// Dedicated Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Onboarding from './pages/auth/Onboarding'

// Authenticated Application Workspace Shell
import AppShell from './pages/app/AppShell'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider>
          <Routes>
            {/* Public Multi-Page Marketing & Discovery Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* Dedicated Authentication & Onboarding Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <AppShell view="profile" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppShell view="profile" />
                </ProtectedRoute>
              }
            />

            {/* Authenticated Workspace App Routes (/app/*) */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Navigate to="/app/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell view="overview" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/interviews"
              element={
                <ProtectedRoute>
                  <AppShell view="interviews" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/interviews/:sessionId"
              element={
                <ProtectedRoute>
                  <AppShell view="interviews" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/interviews/:sessionId/report"
              element={
                <ProtectedRoute>
                  <AppShell view="interviews" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/coach"
              element={
                <ProtectedRoute>
                  <AppShell view="coach" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/roadmap"
              element={
                <ProtectedRoute>
                  <AppShell view="roadmap" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/analytics"
              element={
                <ProtectedRoute>
                  <AppShell view="analytics" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/resume"
              element={
                <ProtectedRoute>
                  <AppShell view="resumes" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/job-analysis"
              element={
                <ProtectedRoute>
                  <AppShell view="job_analysis" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/settings"
              element={
                <ProtectedRoute>
                  <AppShell view="settings" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/profile"
              element={
                <ProtectedRoute>
                  <AppShell view="profile" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/admin"
              element={<AppShell view="admin" />}
            />

            {/* Convenient Aliases & Redirects */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Navigate to="/app/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interviews"
              element={
                <ProtectedRoute>
                  <Navigate to="/app/interviews" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coach"
              element={
                <ProtectedRoute>
                  <Navigate to="/app/coach" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roadmap"
              element={
                <ProtectedRoute>
                  <Navigate to="/app/roadmap" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Navigate to="/app/analytics" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume"
              element={
                <ProtectedRoute>
                  <Navigate to="/app/resume" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resumes"
              element={
                <ProtectedRoute>
                  <Navigate to="/app/resume" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/job-analysis"
              element={
                <ProtectedRoute>
                  <Navigate to="/app/job-analysis" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Navigate to="/app/settings" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={<Navigate to="/app/admin" replace />}
            />

            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
