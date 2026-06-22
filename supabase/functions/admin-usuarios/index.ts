// @ts-nocheck — Deno globals no existen en el tsconfig local; el código corre en el runtime de Supabase Edge
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'No autorizado' }, 401)

    // Verificar que el solicitante esté autenticado
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await anonClient.auth.getUser()
    if (authError || !user) return json({ error: 'No autorizado' }, 401)

    // Cliente admin con service role key (solo disponible server-side)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    if (req.method === 'GET') {
      const { data, error } = await adminClient.auth.admin.listUsers()
      if (error) return json({ error: error.message }, 400)
      return json({ users: data.users })
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const { email, password } = body ?? {}

      if (!email || !password) return json({ error: 'Email y contraseña son requeridos' }, 400)

      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (error) return json({ error: error.message }, 400)
      return json({ user: data.user })
    }

    if (req.method === 'PUT') {
      const body = await req.json()
      const { id, email, password } = body ?? {}

      if (!id) return json({ error: 'ID es requerido' }, 400)

      const updates: Record<string, string> = {}
      if (email) updates.email = email
      if (password) updates.password = password

      if (Object.keys(updates).length === 0) return json({ error: 'No hay cambios' }, 400)

      const { data, error } = await adminClient.auth.admin.updateUserById(id, updates)
      if (error) return json({ error: error.message }, 400)
      return json({ user: data.user })
    }

    if (req.method === 'DELETE') {
      const body = await req.json()
      const { id } = body ?? {}

      if (!id) return json({ error: 'ID es requerido' }, 400)

      const { error } = await adminClient.auth.admin.deleteUser(id)
      if (error) return json({ error: error.message }, 400)
      return json({ success: true })
    }

    return json({ error: 'Método no permitido' }, 405)

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno del servidor'
    return json({ error: msg }, 500)
  }
})
