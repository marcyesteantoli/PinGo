export type ErrorKey =
  | 'unexpected'
  | 'network'
  | 'duplicate'
  | 'validation'
  | 'overlap_error'
  | 'not_authorized'
  | 'delete_error'
  | 'invalid_join_code'
  | 'already_member'
  | 'active_trip_limit_reached'
  | 'debt_already_settled'
  | 'debt_not_involved'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_already_exists'
  | 'weak_password'
  | 'rate_limited'
  | 'purchase_failed'
  | 'no_session'
  | 'document_limit_reached'
  | 'photo_limit_reached'

interface RawError {
  code?: string
  message: string
}

export class AppError extends Error {
  readonly key: ErrorKey
  readonly cause?: unknown

  constructor(key: ErrorKey, rawError?: unknown) {
    super(key)
    this.name = 'AppError'
    this.key = key
    this.cause = rawError
  }
}

function isNetworkError(error: RawError): boolean {
  return !error.code && /network|fetch/i.test(error.message)
}

export function mapSupabaseError(error: RawError): AppError {
  if (isNetworkError(error)) return new AppError('network', error)

  switch (error.code) {
    case '23505':
      return new AppError('duplicate', error)
    case '23514':
    case '23503':
      return new AppError('validation', error)
    case '23P01':
      return new AppError('overlap_error', error)
  }

  const msg = error.message
  if (msg.includes('Invalid join code')) return new AppError('invalid_join_code', error)
  if (msg.includes('Already a member')) return new AppError('already_member', error)
  if (msg.includes('active_trip_limit_reached')) return new AppError('active_trip_limit_reached', error)
  if (msg.includes('already_settled')) return new AppError('debt_already_settled', error)
  if (msg.includes('not_involved')) return new AppError('debt_not_involved', error)
  if (msg.includes('not_authorized')) return new AppError('not_authorized', error)

  return new AppError('unexpected', error)
}

export function mapAuthError(error: RawError): AppError {
  if (isNetworkError(error)) return new AppError('network', error)

  switch (error.code) {
    case 'invalid_credentials':
      return new AppError('invalid_credentials', error)
    case 'email_not_confirmed':
      return new AppError('email_not_confirmed', error)
    case 'user_already_exists':
      return new AppError('user_already_exists', error)
    case 'weak_password':
      return new AppError('weak_password', error)
    case 'over_email_send_rate_limit':
      return new AppError('rate_limited', error)
  }

  const msg = error.message
  if (msg.includes('Invalid login credentials')) return new AppError('invalid_credentials', error)
  if (msg.includes('Email not confirmed')) return new AppError('email_not_confirmed', error)
  if (msg.includes('User already registered')) return new AppError('user_already_exists', error)
  if (msg.includes('Password should be at least')) return new AppError('weak_password', error)
  if (msg.toLowerCase().includes('rate limit')) return new AppError('rate_limited', error)

  return new AppError('unexpected', error)
}

export function toAppError(error: unknown, fallback: ErrorKey = 'unexpected'): AppError {
  if (error instanceof AppError) return error
  return new AppError(fallback, error)
}

export function getErrorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof AppError) return t(`error_${error.key}`)
  return t('error_unexpected')
}
