const SESSION_KEY = 'cc_session'

export const auth = {
  getSession: () => JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null'),
  signIn: (email) => {
    const session = { user: { email }, loggedAt: Date.now() }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  },
  signOut: () => localStorage.removeItem(SESSION_KEY),
}
