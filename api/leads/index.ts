import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../../lib/supabase'
import { withAuth } from '../../lib/handler'

export default withAuth(async (req, res, userId) => {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('leads').select('*').eq('user_id', userId).order('criado_em', { ascending: false })
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(200).json({ data }); return
  }
  if (req.method === 'POST') {
    const { nome, empresa, telefone, email, origem, etapa, interesse, valor, proximo_contato, notas } = req.body ?? {}
    if (!nome) { res.status(400).json({ error: 'nome é obrigatório' }); return }
    const { data, error } = await supabase.from('leads').insert({
      user_id: userId, nome, empresa, telefone, email, origem,
      etapa: etapa ?? 'novo', interesse, valor, proximo_contato, notas,
      virou_cliente: false,
    }).select().single()
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(201).json({ data }); return
  }
  res.status(405).end()
})
