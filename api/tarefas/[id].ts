import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../../lib/supabase'
import { withAuth } from '../../lib/handler'

export default withAuth(async (req, res, userId) => {
  const { id } = req.query as { id: string }
  if (req.method === 'PUT') {
    const body = req.body ?? {}
    const update: Record<string, unknown> = {
      titulo: body.titulo, meta_id: body.meta_id, prioridade: body.prioridade,
      status: body.status, prazo: body.prazo, notas: body.notas,
      concluida_em: body.status === 'concluida' ? (body.concluida_em ?? new Date().toISOString().slice(0, 10)) : null,
    }
    const { data, error } = await supabase.from('tarefas').update(update).eq('id', id).eq('user_id', userId).select().single()
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(200).json({ data }); return
  }
  if (req.method === 'DELETE') {
    const { error } = await supabase.from('tarefas').delete().eq('id', id).eq('user_id', userId)
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(204).end(); return
  }
  res.status(405).end()
})
