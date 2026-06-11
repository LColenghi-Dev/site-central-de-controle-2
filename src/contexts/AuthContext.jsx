import { createContext, useContext, useState } from 'react'
import { auth } from '../lib/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => auth.getSession())

  function signIn(email) {
    const s = auth.signIn(email)
    setSession(s)
    return s
  }

  function signOut() {
    auth.signOut()
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, loading: false, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
