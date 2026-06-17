import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Invoked once daily at 06:00 UTC via Supabase Dashboard Cron Job.
// Checks trip dates and fans out reminder notifications to all active members.

type ReminderEvent =
  | 'trip_starts_tomorrow'
  | 'trip_starts_today'
  | 'trip_ends_tomorrow'
  | 'trip_ended_1day'
  | 'unsettled_debts'

const COPY: Record<ReminderEvent, Record<string, { title: string; body: string }>> = {
  trip_starts_tomorrow: {
    es: { title: '¡{{trip}} empieza mañana!', body: 'Tu aventura comienza en menos de 24h.' },
    en: { title: '{{trip}} starts tomorrow!', body: 'Your adventure begins in less than 24h.' },
    de: { title: '{{trip}} beginnt morgen!', body: 'Dein Abenteuer beginnt in weniger als 24h.' },
    fr: { title: '{{trip}} commence demain!', body: 'Ton aventure commence dans moins de 24h.' },
    it: { title: '{{trip}} inizia domani!', body: 'La tua avventura inizia in meno di 24h.' },
    pt: { title: '{{trip}} começa amanhã!', body: 'Sua aventura começa em menos de 24h.' },
  },
  trip_starts_today: {
    es: { title: '¡Hoy empieza {{trip}}! ✈️', body: '¡Que tengas un viaje increíble!' },
    en: { title: '{{trip}} starts today! ✈️', body: 'Have an amazing trip!' },
    de: { title: '{{trip}} beginnt heute! ✈️', body: 'Hab eine tolle Reise!' },
    fr: { title: '{{trip}} commence aujourd\'hui! ✈️', body: 'Bon voyage!' },
    it: { title: '{{trip}} inizia oggi! ✈️', body: 'Buon viaggio!' },
    pt: { title: '{{trip}} começa hoje! ✈️', body: 'Boa viagem!' },
  },
  trip_ends_tomorrow: {
    es: { title: 'Último día completo en {{trip}}', body: '¡Aprovéchalo! No olvides saldar los gastos.' },
    en: { title: 'Last full day in {{trip}}', body: 'Make it count! Don\'t forget to settle expenses.' },
    de: { title: 'Letzter voller Tag in {{trip}}', body: 'Nutze ihn! Vergiss nicht, die Ausgaben zu begleichen.' },
    fr: { title: 'Dernier jour complet à {{trip}}', body: 'Profites-en! N\'oublie pas de régler les dépenses.' },
    it: { title: 'Ultimo giorno completo a {{trip}}', body: 'Sfruttalo! Non dimenticare di saldare le spese.' },
    pt: { title: 'Último dia completo em {{trip}}', body: 'Aproveite! Não se esqueça de acertar as despesas.' },
  },
  trip_ended_1day: {
    es: { title: '¿Cómo fue {{trip}}?', body: 'Añade tus últimos recuerdos antes de que se desvanezcan.' },
    en: { title: 'How was {{trip}}?', body: 'Add your memories before they fade.' },
    de: { title: 'Wie war {{trip}}?', body: 'Füge deine Erinnerungen hinzu, bevor sie verblassen.' },
    fr: { title: 'Comment était {{trip}}?', body: 'Ajoutez vos souvenirs avant qu\'ils ne s\'effacent.' },
    it: { title: 'Com\'era {{trip}}?', body: 'Aggiungi i tuoi ricordi prima che svaniscano.' },
    pt: { title: 'Como foi {{trip}}?', body: 'Adicione suas memórias antes que elas desapareçam.' },
  },
  unsettled_debts: {
    es: { title: 'Gastos pendientes en {{trip}}', body: 'Aún tienes saldos por liquidar.' },
    en: { title: 'Unsettled expenses in {{trip}}', body: 'You still have pending balances to settle.' },
    de: { title: 'Offene Ausgaben in {{trip}}', body: 'Du hast noch ausstehende Salden zu begleichen.' },
    fr: { title: 'Dépenses en attente dans {{trip}}', body: 'Tu as encore des soldes à régler.' },
    it: { title: 'Spese in sospeso in {{trip}}', body: 'Hai ancora saldi da saldare.' },
    pt: { title: 'Despesas pendentes em {{trip}}', body: 'Você ainda tem saldos pendentes para liquidar.' },
  },
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0]
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

async function fanOut(
  supabase: ReturnType<typeof createClient>,
  trips: { id: string; title: string }[],
  event: ReminderEvent,
): Promise<object[]> {
  if (!trips.length) return []

  const messages: object[] = []

  for (const trip of trips) {
    // Check if already sent today (dedup)
    const today = toDateString(new Date())
    const { data: logged } = await supabase
      .from('notification_log')
      .select('id')
      .eq('event_type', event)
      .eq('trip_id', trip.id)
      .gte('sent_at', `${today}T00:00:00Z`)
      .limit(1)

    if (logged?.length) continue

    // Active members
    const { data: collabs } = await supabase
      .from('trip_collaborators')
      .select('user_id')
      .eq('trip_id', trip.id)
      .eq('status', 'active')

    if (!collabs?.length) continue

    const memberIds = collabs.map((c) => c.user_id)

    // Check trip_reminders preference
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('user_id, trip_reminders')
      .in('user_id', memberIds)

    const prefMap = new Map(prefs?.map((p) => [p.user_id, p.trip_reminders]) ?? [])

    const eligibleIds = memberIds.filter(
      (id) => !prefMap.has(id) || prefMap.get(id) !== false
    )
    if (!eligibleIds.length) continue

    // Tokens + locales
    const { data: tokenRows } = await supabase
      .from('push_tokens')
      .select('user_id, token')
      .in('user_id', eligibleIds)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, locale')
      .in('id', eligibleIds)

    const localeMap = new Map(profiles?.map((p) => [p.id, p.locale]) ?? [])

    for (const row of tokenRows ?? []) {
      const locale = localeMap.get(row.user_id) ?? 'es'
      const copy = COPY[event]?.[locale] ?? COPY[event]?.['en']
      const vars = { trip: trip.title }

      messages.push({
        to: row.token,
        title: interpolate(copy.title, vars),
        body: interpolate(copy.body, vars),
        data: { event, trip_id: trip.id },
        sound: 'default',
        badge: 1,
      })
    }

    // Log one entry per trip (recipient = first member, trip_id = dedup key)
    await supabase.from('notification_log').insert({
      event_type: event,
      source_id: null,
      recipient_id: memberIds[0],
      trip_id: trip.id,
      status: 'sent',
    })
  }

  return messages
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const today = toDateString(new Date())
  const tomorrow = toDateString(new Date(Date.now() + 86_400_000))
  const yesterday = toDateString(new Date(Date.now() - 86_400_000))
  const threeDaysAgo = toDateString(new Date(Date.now() - 3 * 86_400_000))

  const [
    { data: startsTomorrow },
    { data: startsToday },
    { data: endsTomorrow },
    { data: ended1Day },
    { data: unsettledTrips },
  ] = await Promise.all([
    supabase.from('trips').select('id, title').eq('start_date', tomorrow),
    supabase.from('trips').select('id, title').eq('start_date', today),
    supabase.from('trips').select('id, title').eq('end_date', tomorrow),
    supabase.from('trips').select('id, title').eq('end_date', yesterday),
    supabase.from('trips').select('id, title').eq('end_date', threeDaysAgo),
  ])

  const allMessages: object[] = []

  const results = await Promise.all([
    fanOut(supabase, startsTomorrow ?? [], 'trip_starts_tomorrow'),
    fanOut(supabase, startsToday ?? [], 'trip_starts_today'),
    fanOut(supabase, endsTomorrow ?? [], 'trip_ends_tomorrow'),
    fanOut(supabase, ended1Day ?? [], 'trip_ended_1day'),
    fanOut(supabase, unsettledTrips ?? [], 'unsettled_debts'),
  ])

  results.forEach((msgs) => allMessages.push(...msgs))

  if (allMessages.length) await sendToExpoPush(allMessages)

  return new Response(JSON.stringify({ sent: allMessages.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
