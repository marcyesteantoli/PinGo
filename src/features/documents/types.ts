import { z } from 'zod'
import { i18n } from '@/i18n'

export function buildUploadDocumentSchema() {
  return z.object({
    name: z.string().min(1, i18n.t('validation_required_docName')),
    experience_id: z.string().uuid(i18n.t('validation_required_experience')),
  })
}

export type UploadDocumentFormData = z.infer<ReturnType<typeof buildUploadDocumentSchema>>
