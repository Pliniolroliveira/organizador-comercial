import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../../lib/supabase'
import { withAuth } from '../../lib/handler'

export default withAuth(async (req, res, userId) => {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('objetivos')
      .select('*')
      .eq('user_id', userId)
      .order('criado_em', { ascending: false })
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(200).json({ data })
    return
  }

  if (req.method === 'POST') {
    const { titulo, descricao, prazo } = req.body ?? {}
    if (!titulo) { res.status(400).json({ error: 'titulo é obrigatório' }); return }
    const { data, error } = await supabase
      .from('objetivos')
      .insert({ user_id: userId, titulo, descricao, prazo })
      .select()
      .single()
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(201).json({ data })
    return
  }

  res.status(405).end()
})
