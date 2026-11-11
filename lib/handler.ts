import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSession } from './auth'

type AuthedHandler = (req: VercelRequest, res: VercelResponse, userId: string) => Promise<void>

export function withAuth(handler: AuthedHandler) {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    try {
      const session = await getSession(req)
      if (!session) {
        res.status(401).json({ error: 'Não autorizado' })
        return
      }
      await handler(req, res, session.userId)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }
}
