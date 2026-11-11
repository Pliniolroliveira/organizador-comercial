import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { serialize } from 'cookie'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return }

  const { email, password } = req.body ?? {}
  if (!email || !password) { res.status(400).json({ error: 'Email e senha são obrigatórios' }); return }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) { res.status(401).json({ error: 'Credenciais inválidas' }); return }

  const cookie = serialize('session', data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  res.setHeader('Set-Cookie', cookie)
  res.status(200).json({ ok: true })
}
