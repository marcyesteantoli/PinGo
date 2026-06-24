import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const COPY_EXPENSE: Record<string, { title: string; body_single: string; body_multi: string }> = {
  es: {
    title: '{{actor}} añadió {{count}} gasto(s)',
    body_single: '{{description}} en {{trip}}',
    body_multi: 'en {{trip}}',
  },
  en: {
    title: '{{actor}} added {{count}} expense(s)',
    body_single: '{{description}} in {{trip}}',
    body_multi: 'in {{trip}}',
  },
  de: {
    title: '{{actor}} hat {{count}} Ausgabe(n) hinzugefügt',
    body_single: '{{description}} in {{trip}}',
    body_multi: 'in {{trip}}',
  },
  fr: {
    title: '{{actor}} a ajouté {{count}} dépense(s)',
    body_single: '{{description}} dans {{trip}}',
    body_multi: 'dans {{trip}}',
  },
  it: {
    title: '{{actor}} ha aggiunto {{count}} spesa/e',
    body_single: '{{description}} in {{trip}}',
    body_multi: 'in {{trip}}',
  },
  pt: {
    title: '{{actor}} adicionou {{count}} despesa(s)',
    body_single: '{{description}} em {{trip}}',
    body_multi: 'em {{trip}}',
  },
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

async function sendToExpoPush(messages: object[]): Promise<void> {
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100)
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(chunk),
    })
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret || req.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const now = new Date().toISOString()

  // Fetch pending batches ready to send
  const { data: batches, error } = await supabase
    .from('notification_batch_queue')
    .select('id, trip_id, actor_id, recipient_id, count, last_description, trip_title')
    .eq('status', 'pending')
    .lte('send_at', now)

  if (error || !batches?.length) {
    return new Response(JSON.stringify({ flushed: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const recipientIds = [...new Set(batches.map((b) => b.recipient_id))]
  const actorIds = [...new Set(batches.map((b) => b.actor_id))]

  // Fetch push tokens
  const { data: tokenRows } = await supabase
    .from('push_tokens')
    .select('user_id, token')
    .in('user_id', recipientIds)

  const tokenMap = new Map<string, string[]>()
  tokenRows?.forEach((row) => {
    const existing = tokenMap.get(row.user_id) ?? []
    tokenMap.set(row.user_id, [...existing, row.token])
  })

  // Fetch locales for recipients
  const { data: recipientProfiles } = await supabase
    .from('profiles')
    .select('id, locale')
    .in('id', recipientIds)

  const localeMap = new Map(recipientProfiles?.map((p) => [p.id, p.locale]) ?? [])

  // Fetch actor names
  const { data: actorProfiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', actorIds)

  const actorNameMap = new Map(actorProfiles?.map((p) => [p.id, p.name]) ?? [])

  const messages: object[] = []

  for (const batch of batches) {
    const tokens = tokenMap.get(batch.recipient_id) ?? []
    if (!tokens.length) continue

    const locale = localeMap.get(batch.recipient_id) ?? 'es'
    const copy = COPY_EXPENSE[locale] ?? COPY_EXPENSE['en']
    const actorName = actorNameMap.get(batch.actor_id) ?? 'Alguien'

    const vars: Record<string, string> = {
      actor: actorName,
      count: String(batch.count),
      description: batch.last_description ?? '',
      trip: batch.trip_title ?? '',
    }

    const body =
      batch.count === 1
        ? interpolate(copy.body_single, vars)
        : interpolate(copy.body_multi, vars)

    for (const token of tokens) {
      messages.push({
        to: token,
        title: interpolate(copy.title, vars),
        body,
        data: { event: 'expense_added', trip_id: batch.trip_id },
        sound: 'default',
        badge: 1,
      })
    }
  }

  if (messages.length) await sendToExpoPush(messages)

  // Mark batches as sent
  const batchIds = batches.map((b) => b.id)
  await supabase
    .from('notification_batch_queue')
    .update({ status: 'sent' })
    .in('id', batchIds)

  return new Response(JSON.stringify({ flushed: batches.length, messages: messages.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
