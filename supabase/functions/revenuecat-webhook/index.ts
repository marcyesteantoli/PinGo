import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GRANT_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'TRANSFER',
  'NON_RENEWING_PURCHASE',
  'TRIAL_STARTED',
  'PRODUCT_CHANGED',
])

const REVOKE_EVENTS = new Set([
  'CANCELLATION',
  'EXPIRATION',
  'BILLING_ISSUE',
  'REFUND',
])

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const expectedAuth = Deno.env.get('REVENUECAT_WEBHOOK_AUTH_HEADER')
  const receivedAuth = req.headers.get('Authorization')
  if (!expectedAuth || receivedAuth !== expectedAuth) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()
  const event = body.event as {
    type: string
    app_user_id: string
    expiration_at_ms: number | null
  }

  if (!event?.type || !event?.app_user_id) {
    return new Response('Bad request', { status: 400 })
  }

  const { type, app_user_id, expiration_at_ms } = event

  if (!GRANT_EVENTS.has(type) && !REVOKE_EVENTS.has(type)) {
    return new Response(JSON.stringify({ skipped: true, type }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  if (GRANT_EVENTS.has(type)) {
    const expiresAt = expiration_at_ms
      ? new Date(expiration_at_ms).toISOString()
      : null

    const { error } = await supabase
      .from('profiles')
      .update({ is_pro: true, pro_expires_at: expiresAt })
      .eq('id', app_user_id)

    if (error) {
      console.error('Error granting pro:', error)
      return new Response('Internal error', { status: 500 })
    }
  } else {
    const { error } = await supabase
      .from('profiles')
      .update({ is_pro: false, pro_expires_at: null })
      .eq('id', app_user_id)

    if (error) {
      console.error('Error revoking pro:', error)
      return new Response('Internal error', { status: 500 })
    }
  }

  return new Response(JSON.stringify({ ok: true, type }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
