import { z } from 'zod'
import { i18n } from '@/i18n'

export type DocumentType = 'file' | 'link' | 'pass'

export function buildUploadDocumentSchema() {
  return z.object({
    name: z.string().min(1, i18n.t('validation_required_docName')),
    experience_id: z.string().uuid(i18n.t('validation_required_experience')),
  })
}

export type UploadDocumentFormData = z.infer<ReturnType<typeof buildUploadDocumentSchema>>

export function buildAddLinkSchema() {
  return z.object({
    name: z.string().min(1, i18n.t('validation_required_docName')),
    url: z.string().url(i18n.t('docs_link_url_invalid')),
    experience_id: z.string().uuid(i18n.t('validation_required_experience')),
  })
}

export type AddLinkFormData = z.infer<ReturnType<typeof buildAddLinkSchema>>
