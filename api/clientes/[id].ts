import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../../lib/supabase'
import { withAuth } from '../../lib/handler'
import { encrypt, decrypt } from '../../lib/crypto'

export default withAuth(async (req, res, userId) => {
  const { id } = req.query as { id: string }

  if (req.method === 'PUT') {
    const { nome, empresa, cpf_cnpj, telefone, email, produto_contratado, valor_contrato, data_inicio, data_renovacao, status, notas } = req.body ?? {}
    const { data, error } = await supabase.from('clientes').update({
      nome, empresa,
      cpf_cnpj: cpf_cnpj ? encrypt(cpf_cnpj) : null,
      telefone, email, produto_contratado, valor_contrato, data_inicio, data_renovacao, status, notas,
    }).eq('id', id).eq('user_id', userId).select().single()
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(200).json({ data: { ...data, cpf_cnpj: data.cpf_cnpj ? decrypt(data.cpf_cnpj) : null } }); return
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('clientes').delete().eq('id', id).eq('user_id', userId)
    if (error) { res.status(500).json({ error: error.message }); return }
    res.status(204).end(); return
  }

  res.status(405).end()
})
