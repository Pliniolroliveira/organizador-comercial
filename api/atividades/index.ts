import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../../lib/supabase'
import { withAuth } from '../../lib/handler'

export default withAuth(async (req, res, userId) => {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('atividades').select('*').eq('user_id', userId).order('data', { ascending: false })
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(200).json({ data }); return
  }
  if (req.method === 'POST') {
    const { data: date, tipo, lead_id, resultado, nota } = req.body ?? {}
    if (!date || !tipo) { res.status(400).json({ error: 'data e tipo são obrigatórios' }); return }
    const { data, error } = await supabase.from('atividades').insert({ user_id: userId, data: date, tipo, lead_id, resultado, nota }).select().single()
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(201).json({ data }); return
  }
  res.status(405).end()
})
