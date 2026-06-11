import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home          from './pages/Home/index.jsx'
import Login         from './pages/Login/index.jsx'
import Dashboard     from './pages/Dashboard/index.jsx'
import LoadingScreen from './components/LoadingScreen/index.jsx'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'

function PrivateRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return null
  return session ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return null
  return session ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  const [loaded, setLoaded] = useState(false)

  return (
    <AuthProvider>
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/login"     element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}