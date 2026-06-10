import { z } from 'zod'
import { i18n } from '@/i18n'

export function buildLoginSchema() {
  return z.object({
    email: z.string().email(i18n.t('auth_validation_password')),
    password: z.string().min(6, i18n.t('auth_validation_password')),
  })
}

export function buildRegisterSchema() {
  return z.object({
    name: z.string().min(1, i18n.t('auth_validation_name')),
    email: z.string().email(i18n.t('auth_validation_password')),
    password: z
      .string()
      .min(8, i18n.t('auth_validation_password_strong'))
      .regex(/[a-z]/, i18n.t('auth_validation_password_strong'))
      .regex(/[A-Z]/, i18n.t('auth_validation_password_strong'))
      .regex(/[0-9]/, i18n.t('auth_validation_password_strong')),
  })
}

export type LoginFormData = z.infer<ReturnType<typeof buildLoginSchema>>
export type RegisterFormData = z.infer<ReturnType<typeof buildRegisterSchema>>
