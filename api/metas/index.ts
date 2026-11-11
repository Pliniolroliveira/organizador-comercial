import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../../lib/supabase'
import { withAuth } from '../../lib/handler'

export default withAuth(async (req, res, userId) => {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('metas').select('*').eq('user_id', userId).order('criado_em', { ascending: false })
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(200).json({ data }); return
  }
  if (req.method === 'POST') {
    const { titulo, objetivo_id, alvo, atual, unidade, prazo } = req.body ?? {}
    if (!titulo || alvo == null) { res.status(400).json({ error: 'titulo e alvo são obrigatórios' }); return }
    const { data, error } = await supabase.from('metas').insert({ user_id: userId, titulo, objetivo_id, alvo, atual: atual ?? 0, unidade, prazo }).select().single()
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(201).json({ data }); return
  }
  res.status(405).end()
})
