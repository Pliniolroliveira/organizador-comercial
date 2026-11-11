import { createClient } from '@supabase/supabase-js'
import { parse } from 'cookie'
import type { VercelRequest } from '@vercel/node'

export async function getSession(req: VercelRequest): Promise<{ userId: string } | null> {
  const cookies = parse(req.headers.cookie || '')
  const token = cookies.session
  if (!token) return null

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  return { userId: user.id }
}
