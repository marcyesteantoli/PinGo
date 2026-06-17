type NotificationData = {
  event?: string
  trip_id?: string
}

export function resolveDeeplink(data: NotificationData): string {
  if (!data.trip_id) return '/(app)/(tabs)/trips'

  switch (data.event) {
    case 'expense_added':
    case 'debt_settled':
    case 'unsettled_debts':
      return `/trips/${data.trip_id}/expenses`
    case 'memory_added':
    case 'trip_ended_1day':
      return `/trips/${data.trip_id}/memories`
    case 'experience_added':
    case 'member_joined':
    case 'member_left':
    case 'trip_starts_tomorrow':
    case 'trip_starts_today':
    case 'trip_ends_tomorrow':
      return `/trips/${data.trip_id}/timeline`
    default:
      return '/(app)/(tabs)/trips'
  }
}
