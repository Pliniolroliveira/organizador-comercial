import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSession } from '../../lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const session = await getSession(req)
  if (!session) { res.status(401).json({ authenticated: false }); return }
  res.status(200).json({ authenticated: true })
}
