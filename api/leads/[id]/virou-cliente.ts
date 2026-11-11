import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../../../lib/supabase'
import { withAuth } from '../../../lib/handler'

export default withAuth(async (req, res, userId) => {
  if (req.method !== 'POST') { res.status(405).end(); return }

  const { id } = req.query as { id: string }

  const { data: lead, error: leadErr } = await supabase
    .from('leads').select('*').eq('id', id).eq('user_id', userId).single()
  if (leadErr || !lead) { res.status(404).json({ error: 'Lead não encontrado' }); return }
  if (lead.virou_cliente) { res.status(409).json({ error: 'Lead já foi convertido em cliente' }); return }

  const { data: cliente, error: clienteErr } = await supabase.from('clientes').insert({
    user_id: userId,
    lead_id: id,
    nome: lead.nome,
    empresa: lead.empresa ?? null,
    telefone: lead.telefone ?? null,
    email: lead.email ?? null,
    notas: lead.notas ?? null,
    status: 'ativo',
  }).select().single()
  if (clienteErr) { res.status(500).json({ error: clienteErr.message }); return }

  await supabase.from('leads').update({ virou_cliente: true }).eq('id', id).eq('user_id', userId)

  res.status(201).json({ data: cliente })
})
