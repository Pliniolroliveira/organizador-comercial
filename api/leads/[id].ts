import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../../lib/supabase'
import { withAuth } from '../../lib/handler'

export default withAuth(async (req, res, userId) => {
  const { id } = req.query as { id: string }

  if (req.method === 'PUT') {
    const body = req.body ?? {}
    const fechado = body.etapa === 'ganho' || body.etapa === 'perdido'
    const update = {
      nome: body.nome, empresa: body.empresa, telefone: body.telefone,
      email: body.email, origem: body.origem, etapa: body.etapa,
      interesse: body.interesse, valor: body.valor,
      proximo_contato: body.proximo_contato, notas: body.notas,
      fechado_em: fechado ? (body.fechado_em ?? new Date().toISOString().slice(0, 10)) : null,
    }
    const { data, error } = await supabase.from('leads').update(update).eq('id', id).eq('user_id', userId).select().single()
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(200).json({ data }); return
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('leads').delete().eq('id', id).eq('user_id', userId)
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(204).end(); return
  }

  res.status(405).end()
})
