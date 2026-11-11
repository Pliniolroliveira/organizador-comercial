import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../../lib/supabase'
import { withAuth } from '../../lib/handler'
import { encrypt, decrypt } from '../../lib/crypto'

export default withAuth(async (req, res, userId) => {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('clientes').select('*').eq('user_id', userId).order('criado_em', { ascending: false })
    if (error) { res.status(500).json({ error: error.message }); return }
    const result = (data ?? []).map(c => ({
      ...c,
      cpf_cnpj: c.cpf_cnpj ? decrypt(c.cpf_cnpj) : null,
    }))
    res.status(200).json({ data: result }); return
  }

  if (req.method === 'POST') {
    const { nome, empresa, cpf_cnpj, telefone, email, produto_contratado, valor_contrato, data_inicio, data_renovacao, status, notas, lead_id } = req.body ?? {}
    if (!nome) { res.status(400).json({ error: 'nome é obrigatório' }); return }
    const { data, error } = await supabase.from('clientes').insert({
      user_id: userId, lead_id, nome, empresa,
      cpf_cnpj: cpf_cnpj ? encrypt(cpf_cnpj) : null,
      telefone, email, produto_contratado, valor_contrato,
      data_inicio, data_renovacao, status: status ?? 'ativo', notas,
    }).select().single()
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(201).json({ data: { ...data, cpf_cnpj: cpf_cnpj ?? null } }); return
  }

  res.status(405).end()
})
