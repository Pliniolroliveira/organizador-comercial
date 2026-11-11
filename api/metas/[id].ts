import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../../lib/supabase'
import { withAuth } from '../../lib/handler'

export default withAuth(async (req, res, userId) => {
  const { id } = req.query as { id: string }
  if (req.method === 'PUT') {
    const { titulo, objetivo_id, alvo, atual, unidade, prazo } = req.body ?? {}
    const { data, error } = await supabase.from('metas').update({ titulo, objetivo_id, alvo, atual, unidade, prazo }).eq('id', id).eq('user_id', userId).select().single()
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(200).json({ data }); return
  }
  if (req.method === 'DELETE') {
    const { error } = await supabase.from('metas').delete().eq('id', id).eq('user_id', userId)
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(204).end(); return
  }
  res.status(405).end()
})
