import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type NotificationEvent =
  | 'expense_added'
  | 'debt_settled'
  | 'member_joined'
  | 'member_left'
  | 'experience_added'
  | 'memory_added'

interface Payload {
  event: NotificationEvent
  trip_id: string
  source_id: string | null
  context: {
    description?: string
    amount?: number
    title?: string
    to_user_id?: string
  }
}

// Notification copy per event per locale. Falls back to 'en'.
const COPY: Record<string, Record<string, { title: string; body: string }>> = {
  debt_settled: {
    es: { title: '{{actor}} te pagó', body: '{{amount}} {{currency}} en {{trip}}' },
    en: { title: '{{actor}} paid you back', body: '{{amount}} {{currency}} in {{trip}}' },
    de: { title: '{{actor}} hat dich zurückbezahlt', body: '{{amount}} {{currency}} in {{trip}}' },
    fr: { title: '{{actor}} t\'a remboursé', body: '{{amount}} {{currency}} dans {{trip}}' },
    it: { title: '{{actor}} ti ha rimborsato', body: '{{amount}} {{currency}} in {{trip}}' },
    pt: { title: '{{actor}} pagou você', body: '{{amount}} {{currency}} em {{trip}}' },
  },
  member_joined: {
    es: { title: '{{actor}} se unió a {{trip}}', body: '¡Tu grupo de viaje ha crecido!' },
    en: { title: '{{actor}} joined {{trip}}', body: 'Your travel crew just got bigger!' },
    de: { title: '{{actor}} ist {{trip}} beigetreten', body: 'Eure Reisegruppe ist größer geworden!' },
    fr: { title: '{{actor}} a rejoint {{trip}}', body: 'Votre groupe de voyage s\'est agrandi!' },
    it: { title: '{{actor}} si è unito a {{trip}}', body: 'Il tuo gruppo di viaggio è cresciuto!' },
    pt: { title: '{{actor}} entrou em {{trip}}', body: 'Seu grupo de viagem cresceu!' },
  },
  member_left: {
    es: { title: '{{actor}} abandonó {{trip}}', body: 'El grupo ha cambiado.' },
    en: { title: '{{actor}} left {{trip}}', body: 'The group has changed.' },
    de: { title: '{{actor}} hat {{trip}} verlassen', body: 'Die Gruppe hat sich geändert.' },
    fr: { title: '{{actor}} a quitté {{trip}}', body: 'Le groupe a changé.' },
    it: { title: '{{actor}} ha lasciato {{trip}}', body: 'Il gruppo è cambiato.' },
    pt: { title: '{{actor}} saiu de {{trip}}', body: 'O grupo mudou.' },
  },
  experience_added: {
    es: { title: '{{actor}} añadió una actividad', body: '{{title}} en {{trip}}' },
    en: { title: '{{actor}} added to the plan', body: '{{title}} in {{trip}}' },
    de: { title: '{{actor}} hat eine Aktivität hinzugefügt', body: '{{title}} in {{trip}}' },
    fr: { title: '{{actor}} a ajouté une activité', body: '{{title}} dans {{trip}}' },
    it: { title: '{{actor}} ha aggiunto un\'attività', body: '{{title}} in {{trip}}' },
    pt: { title: '{{actor}} adicionou uma atividade', body: '{{title}} em {{trip}}' },
  },
  memory_added: {
    es: { title: '{{actor}} compartió una foto', body: 'Nueva foto en {{trip}}' },
    en: { title: '{{actor}} shared a photo', body: 'New photo in {{trip}}' },
    de: { title: '{{actor}} hat ein Foto geteilt', body: 'Neues Foto in {{trip}}' },
    fr: { title: '{{actor}} a partagé une photo', body: 'Nouvelle photo dans {{trip}}' },
    it: { title: '{{actor}} ha condiviso una foto', body: 'Nuova foto in {{trip}}' },
    pt: { title: '{{actor}} compartilhou uma foto', body: 'Nova foto em {{trip}}' },
  },
}

// Maps event → notification_preferences column
const PREF_COLUMN: Record<NotificationEvent, string> = {
  expense_added: 'expense_added',
  debt_settled: 'debt_settled',
  member_joined: 'member_events',
  member_left: 'member_events',
  experience_added: 'experience_added',
  memory_added: 'memory_added',
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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return new Response('Unauthorized', { status: 401 })

  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
  if (authError || !user) return new Response('Unauthorized', { status: 401 })

  const body: Payload = await req.json()
  const { event, trip_id, source_id, context } = body

  // Actor profile (name + locale)
  const { data: actor } = await supabase
    .from('profiles')
    .select('name, locale')
    .eq('id', user.id)
    .single()

  const actorName = actor?.name ?? 'Alguien'

  // Trip info (used by real-time events; expense_added uses this too for title)
  const { data: trip } = await supabase
    .from('trips')
    .select('title, currency')
    .eq('id', trip_id)
    .single()

  // ── expense_added → batch queue ──────────────────────────────────────────
  if (event === 'expense_added') {
    const tripRow = trip

    const { data: splits } = await supabase
      .from('expense_splits')
      .select('user_id')
      .eq('expense_id', source_id)
      .neq('user_id', user.id)

    if (!splits?.length) {
      return new Response(JSON.stringify({ queued: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const recipientIds = splits.map((s) => s.user_id)
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('user_id, expense_added')
      .in('user_id', recipientIds)

    const prefMap = new Map(prefs?.map((p) => [p.user_id, p.expense_added]) ?? [])
    const sendAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    let queued = 0

    for (const split of splits) {
      // Default ON when no preference row exists
      if (prefMap.has(split.user_id) && !prefMap.get(split.user_id)) continue

      await supabase.rpc('enqueue_expense_notification', {
        p_trip_id: trip_id,
        p_actor_id: user.id,
        p_recipient_id: split.user_id,
        p_description: context.description ?? '',
        p_trip_title: tripRow?.title ?? '',
        p_send_at: sendAt,
      })
      queued++
    }

    return new Response(JSON.stringify({ queued }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ── Real-time events ─────────────────────────────────────────────────────

  // Determine recipients
  let recipientIds: string[] = []

  if (event === 'debt_settled') {
    if (context.to_user_id) recipientIds = [context.to_user_id]
  } else {
    // member_joined, member_left, experience_added, memory_added → all active members except actor
    const { data: collabs } = await supabase
      .from('trip_collaborators')
      .select('user_id')
      .eq('trip_id', trip_id)
      .eq('status', 'active')
      .neq('user_id', user.id)

    recipientIds = collabs?.map((c) => c.user_id) ?? []
  }

  if (!recipientIds.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Check preferences
  const prefColumn = PREF_COLUMN[event]
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select(`user_id, ${prefColumn}`)
    .in('user_id', recipientIds)

  const prefMap = new Map(
    prefs?.map((p) => [p.user_id, (p as any)[prefColumn] as boolean]) ?? []
  )

  // Dedup check (skip for null source_id)
  const alreadySentSet = new Set<string>()
  if (source_id) {
    const { data: logged } = await supabase
      .from('notification_log')
      .select('recipient_id')
      .eq('event_type', event)
      .eq('source_id', source_id)
      .in('recipient_id', recipientIds)

    logged?.forEach((l) => alreadySentSet.add(l.recipient_id))
  }

  // Fetch push tokens
  const eligibleIds = recipientIds.filter(
    (id) => !alreadySentSet.has(id) && (!prefMap.has(id) || prefMap.get(id) !== false)
  )

  if (!eligibleIds.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: tokenRows } = await supabase
    .from('push_tokens')
    .select('user_id, token')
    .in('user_id', eligibleIds)

  // Fetch recipient locales for per-user message copy
  const { data: recipientProfiles } = await supabase
    .from('profiles')
    .select('id, locale')
    .in('id', eligibleIds)

  const localeMap = new Map<string, string>(
    recipientProfiles?.map((p: { id: string; locale: string | null }) => [p.id, p.locale ?? 'es']) ?? []
  )

  const tripTitle = trip?.title ?? ''
  const currency = trip?.currency ?? ''

  // Build messages
  const messages = (tokenRows ?? []).map((row) => {
    const locale = localeMap.get(row.user_id) ?? 'es'
    const copy = COPY[event]?.[locale] ?? COPY[event]?.['en'] ?? { title: '', body: '' }

    const vars: Record<string, string> = {
      actor: actorName,
      trip: tripTitle,
      amount: String(context.amount ?? ''),
      currency,
      title: context.title ?? '',
      description: context.description ?? '',
    }

    return {
      to: row.token,
      title: interpolate(copy.title, vars),
      body: interpolate(copy.body, vars),
      data: { event, trip_id },
      sound: 'default',
      badge: 1,
    }
  })

  await sendToExpoPush(messages)

  // Log sent notifications
  if (tokenRows?.length) {
    const logRows = eligibleIds
      .filter((id) => tokenRows.some((t) => t.user_id === id))
      .map((id) => ({
        event_type: event,
        source_id: source_id ?? undefined,
        recipient_id: id,
        trip_id,
        status: 'sent',
      }))

    await supabase.from('notification_log').upsert(logRows, {
      onConflict: 'event_type,source_id,recipient_id',
      ignoreDuplicates: true,
    })
  }

  return new Response(JSON.stringify({ sent: messages.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
