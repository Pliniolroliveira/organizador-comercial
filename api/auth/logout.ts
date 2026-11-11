import type { VercelRequest, VercelResponse } from '@vercel/node'
import { serialize } from 'cookie'

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  const cookie = serialize('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  res.setHeader('Set-Cookie', cookie)
  res.status(200).json({ ok: true })
}
