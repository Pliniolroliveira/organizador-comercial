export async function checkSession(): Promise<boolean> {
  const res = await fetch('/api/auth/session')
  return res.ok
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login.html'
}
