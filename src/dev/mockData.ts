// ─── MODO DEMO ──────────────────────────────────────────────────────────────
// Cambia a false para volver al modo real con Supabase
export const DEV_MODE = true
// ────────────────────────────────────────────────────────────────────────────

import type { Trip, Experience, Collaborator, Memory } from '@types/index'
import type { ExpenseWithSplits } from '@types/index'

// IDs fijos para el usuario y los viajes de demo
export const DEMO_USER_ID = 'demo-user-001'
export const DEMO_TRIP_ID = 'demo-trip-japon'
export const DEMO_TRIP_ID_2 = 'demo-trip-lisboa'

// Usuario simulado (compatible con el tipo User de Supabase Auth)
export const DEMO_USER = {
  id: DEMO_USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@tripsync.app',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  app_metadata: { provider: 'email' },
  user_metadata: { name: 'Usuario Demo' },
  identities: [],
} as any

// ─── VIAJES ─────────────────────────────────────────────────────────────────

export const mockTrips: Trip[] = [
  {
    id: DEMO_TRIP_ID,
    title: 'Ruta por Japón',
    start_date: '2026-06-10',
    end_date: '2026-06-24',
    created_by: DEMO_USER_ID,
    join_code: 'JP2026',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: DEMO_TRIP_ID_2,
    title: 'Escapada a Lisboa',
    start_date: '2026-03-15',
    end_date: '2026-03-20',
    created_by: DEMO_USER_ID,
    join_code: 'LIS01',
    created_at: '2026-01-10T10:00:00Z',
  },
]

// ─── COLABORADORES ──────────────────────────────────────────────────────────

export const mockCollaborators: Record<string, Collaborator[]> = {
  [DEMO_TRIP_ID]: [
    { user_id: DEMO_USER_ID, name: 'Usuario Demo', avatar_url: null, role: 'owner' },
    { user_id: 'collab-002', name: 'Ana García', avatar_url: null, role: 'member' },
    { user_id: 'collab-003', name: 'Carlos López', avatar_url: null, role: 'member' },
  ],
  [DEMO_TRIP_ID_2]: [
    { user_id: DEMO_USER_ID, name: 'Usuario Demo', avatar_url: null, role: 'owner' },
    { user_id: 'collab-002', name: 'Ana García', avatar_url: null, role: 'member' },
  ],
}

// ─── EXPERIENCIAS ────────────────────────────────────────────────────────────

export const mockExperiences: Record<string, Experience[]> = {
  [DEMO_TRIP_ID]: [
    {
      id: 'exp-001',
      trip_id: DEMO_TRIP_ID,
      type: 'transport',
      title: 'Vuelo BCN → NRT',
      location: null,
      confirmation_code: 'IB7841',
      start_time: '07:30',
      end_time: '09:45',
      date: '2026-06-10',
      created_by: DEMO_USER_ID,
      updated_at: '2026-01-15T10:00:00Z',
    },
    {
      id: 'exp-002',
      trip_id: DEMO_TRIP_ID,
      type: 'accommodation',
      title: 'Hotel Shinjuku Granbell',
      location: null,
      confirmation_code: 'HT882XJ',
      start_time: '15:00',
      end_time: null,
      date: '2026-06-10',
      created_by: DEMO_USER_ID,
      updated_at: '2026-01-15T10:00:00Z',
    },
    {
      id: 'exp-003',
      trip_id: DEMO_TRIP_ID,
      type: 'activity',
      title: 'Templo Senso-ji',
      location: null,
      confirmation_code: null,
      start_time: '09:00',
      end_time: '11:30',
      date: '2026-06-12',
      created_by: DEMO_USER_ID,
      updated_at: '2026-01-15T10:00:00Z',
    },
    {
      id: 'exp-004',
      trip_id: DEMO_TRIP_ID,
      type: 'restaurant',
      title: 'Sushi Saito · Roppongi',
      location: null,
      confirmation_code: null,
      start_time: '20:00',
      end_time: '22:00',
      date: '2026-06-12',
      created_by: 'collab-002',
      updated_at: '2026-01-15T10:00:00Z',
    },
    {
      id: 'exp-005',
      trip_id: DEMO_TRIP_ID,
      type: 'activity',
      title: 'Excursión Monte Fuji',
      location: null,
      confirmation_code: null,
      start_time: '06:00',
      end_time: '18:00',
      date: '2026-06-14',
      created_by: 'collab-003',
      updated_at: '2026-01-15T10:00:00Z',
    },
  ],
  [DEMO_TRIP_ID_2]: [
    {
      id: 'exp-101',
      trip_id: DEMO_TRIP_ID_2,
      type: 'transport',
      title: 'Vuelo BCN → LIS',
      location: null,
      confirmation_code: 'VY1234',
      start_time: '08:15',
      end_time: '10:30',
      date: '2026-03-15',
      created_by: DEMO_USER_ID,
      updated_at: '2026-01-10T10:00:00Z',
    },
    {
      id: 'exp-102',
      trip_id: DEMO_TRIP_ID_2,
      type: 'accommodation',
      title: 'Bairro Alto Hotel',
      location: null,
      confirmation_code: 'BH991',
      start_time: '14:00',
      end_time: null,
      date: '2026-03-15',
      created_by: DEMO_USER_ID,
      updated_at: '2026-01-10T10:00:00Z',
    },
    {
      id: 'exp-103',
      trip_id: DEMO_TRIP_ID_2,
      type: 'restaurant',
      title: 'Restaurante Belcanto',
      location: null,
      confirmation_code: null,
      start_time: '20:30',
      end_time: '22:30',
      date: '2026-03-16',
      created_by: 'collab-002',
      updated_at: '2026-01-10T10:00:00Z',
    },
    {
      id: 'exp-104',
      trip_id: DEMO_TRIP_ID_2,
      type: 'activity',
      title: 'Torre de Belém',
      location: null,
      confirmation_code: null,
      start_time: '10:00',
      end_time: '12:00',
      date: '2026-03-17',
      created_by: DEMO_USER_ID,
      updated_at: '2026-01-10T10:00:00Z',
    },
  ],
}

// ─── GASTOS ──────────────────────────────────────────────────────────────────

export const mockExpenses: Record<string, ExpenseWithSplits[]> = {
  [DEMO_TRIP_ID]: [
    {
      id: 'gasto-001',
      trip_id: DEMO_TRIP_ID,
      experience_id: 'exp-001',
      description: 'Vuelos grupo BCN → NRT',
      amount: 1450,
      currency: 'EUR',
      payer_id: DEMO_USER_ID,
      created_at: '2026-01-20T10:00:00Z',
      payer: { id: DEMO_USER_ID, name: 'Usuario Demo', avatar_url: null, updated_at: '' } as any,
      splits: [
        { expense_id: 'gasto-001', user_id: DEMO_USER_ID, amount: 483.33, is_settled: false },
        { expense_id: 'gasto-001', user_id: 'collab-002', amount: 483.33, is_settled: false },
        { expense_id: 'gasto-001', user_id: 'collab-003', amount: 483.34, is_settled: false },
      ],
    },
    {
      id: 'gasto-002',
      trip_id: DEMO_TRIP_ID,
      experience_id: 'exp-002',
      description: 'Hotel Shinjuku (3 noches)',
      amount: 840,
      currency: 'EUR',
      payer_id: 'collab-002',
      created_at: '2026-01-20T10:05:00Z',
      payer: { id: 'collab-002', name: 'Ana García', avatar_url: null, updated_at: '' } as any,
      splits: [
        { expense_id: 'gasto-002', user_id: DEMO_USER_ID, amount: 280, is_settled: false },
        { expense_id: 'gasto-002', user_id: 'collab-002', amount: 280, is_settled: false },
        { expense_id: 'gasto-002', user_id: 'collab-003', amount: 280, is_settled: false },
      ],
    },
    {
      id: 'gasto-003',
      trip_id: DEMO_TRIP_ID,
      experience_id: 'exp-004',
      description: 'Cena en Sushi Saito',
      amount: 210,
      currency: 'EUR',
      payer_id: DEMO_USER_ID,
      created_at: '2026-01-20T10:10:00Z',
      payer: { id: DEMO_USER_ID, name: 'Usuario Demo', avatar_url: null, updated_at: '' } as any,
      splits: [
        { expense_id: 'gasto-003', user_id: DEMO_USER_ID, amount: 70, is_settled: false },
        { expense_id: 'gasto-003', user_id: 'collab-002', amount: 70, is_settled: true },
        { expense_id: 'gasto-003', user_id: 'collab-003', amount: 70, is_settled: false },
      ],
    },
    {
      id: 'gasto-004',
      trip_id: DEMO_TRIP_ID,
      experience_id: 'exp-005',
      description: 'Tour Monte Fuji',
      amount: 165,
      currency: 'EUR',
      payer_id: 'collab-003',
      created_at: '2026-01-20T10:15:00Z',
      payer: { id: 'collab-003', name: 'Carlos López', avatar_url: null, updated_at: '' } as any,
      splits: [
        { expense_id: 'gasto-004', user_id: DEMO_USER_ID, amount: 55, is_settled: false },
        { expense_id: 'gasto-004', user_id: 'collab-002', amount: 55, is_settled: false },
        { expense_id: 'gasto-004', user_id: 'collab-003', amount: 55, is_settled: false },
      ],
    },
  ],
  [DEMO_TRIP_ID_2]: [
    {
      id: 'gasto-101',
      trip_id: DEMO_TRIP_ID_2,
      experience_id: 'exp-101',
      description: 'Vuelos BCN → LIS',
      amount: 380,
      currency: 'EUR',
      payer_id: DEMO_USER_ID,
      created_at: '2026-01-12T10:00:00Z',
      payer: { id: DEMO_USER_ID, name: 'Usuario Demo', avatar_url: null, updated_at: '' } as any,
      splits: [
        { expense_id: 'gasto-101', user_id: DEMO_USER_ID, amount: 190, is_settled: false },
        { expense_id: 'gasto-101', user_id: 'collab-002', amount: 190, is_settled: true },
      ],
    },
    {
      id: 'gasto-102',
      trip_id: DEMO_TRIP_ID_2,
      experience_id: 'exp-102',
      description: 'Bairro Alto Hotel (2 noches)',
      amount: 560,
      currency: 'EUR',
      payer_id: 'collab-002',
      created_at: '2026-01-12T10:05:00Z',
      payer: { id: 'collab-002', name: 'Ana García', avatar_url: null, updated_at: '' } as any,
      splits: [
        { expense_id: 'gasto-102', user_id: DEMO_USER_ID, amount: 280, is_settled: true },
        { expense_id: 'gasto-102', user_id: 'collab-002', amount: 280, is_settled: false },
      ],
    },
  ],
}

// ─── DOCUMENTOS ──────────────────────────────────────────────────────────────

export const mockDocuments: Record<string, Array<{
  id: string
  experience_id: string
  trip_id: string
  name: string
  file_url: string
  file_type: string | null
  uploaded_by: string
  created_at: string
  experience_title: string | null
}>> = {
  [DEMO_TRIP_ID]: [
    {
      id: 'doc-001',
      experience_id: 'exp-001',
      trip_id: DEMO_TRIP_ID,
      name: 'Reserva vuelo IB7841',
      file_url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf',
      file_type: 'application/pdf',
      uploaded_by: DEMO_USER_ID,
      created_at: '2026-01-20T11:00:00Z',
      experience_title: 'Vuelo BCN → NRT',
    },
    {
      id: 'doc-002',
      experience_id: 'exp-002',
      trip_id: DEMO_TRIP_ID,
      name: 'Confirmación hotel Shinjuku',
      file_url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf',
      file_type: 'application/pdf',
      uploaded_by: DEMO_USER_ID,
      created_at: '2026-01-20T11:05:00Z',
      experience_title: 'Hotel Shinjuku Granbell',
    },
    {
      id: 'doc-003',
      experience_id: 'exp-001',
      trip_id: DEMO_TRIP_ID,
      name: 'Seguro de viaje 2026',
      file_url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf',
      file_type: 'application/pdf',
      uploaded_by: 'collab-002',
      created_at: '2026-01-21T09:00:00Z',
      experience_title: 'Vuelo BCN → NRT',
    },
  ],
  [DEMO_TRIP_ID_2]: [
    {
      id: 'doc-101',
      experience_id: 'exp-101',
      trip_id: DEMO_TRIP_ID_2,
      name: 'Billetes VY1234',
      file_url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf',
      file_type: 'application/pdf',
      uploaded_by: DEMO_USER_ID,
      created_at: '2026-01-12T11:00:00Z',
      experience_title: 'Vuelo BCN → LIS',
    },
  ],
}

// ─── RECUERDOS ───────────────────────────────────────────────────────────────

export const mockMemories: Record<string, Memory[]> = {
  [DEMO_TRIP_ID]: [
    {
      id: 'mem-001',
      trip_id: DEMO_TRIP_ID,
      user_id: DEMO_USER_ID,
      image_url: 'https://picsum.photos/seed/senso/800/600',
      caption: 'Amanecer en el Templo Senso-ji',
      created_at: '2026-06-12T07:30:00Z',
    },
    {
      id: 'mem-002',
      trip_id: DEMO_TRIP_ID,
      user_id: 'collab-002',
      image_url: 'https://picsum.photos/seed/fuji/800/600',
      caption: 'Vistas desde el Monte Fuji',
      created_at: '2026-06-14T10:00:00Z',
    },
    {
      id: 'mem-003',
      trip_id: DEMO_TRIP_ID,
      user_id: 'collab-003',
      image_url: 'https://picsum.photos/seed/shinjuku/800/600',
      caption: null,
      created_at: '2026-06-11T20:00:00Z',
    },
  ],
  [DEMO_TRIP_ID_2]: [
    {
      id: 'mem-101',
      trip_id: DEMO_TRIP_ID_2,
      user_id: DEMO_USER_ID,
      image_url: 'https://picsum.photos/seed/belem/800/600',
      caption: 'Torre de Belém al atardecer',
      created_at: '2026-03-17T18:30:00Z',
    },
    {
      id: 'mem-102',
      trip_id: DEMO_TRIP_ID_2,
      user_id: 'collab-002',
      image_url: 'https://picsum.photos/seed/lisboa/800/600',
      caption: 'Vistas desde el Mirador da Graça',
      created_at: '2026-03-16T16:00:00Z',
    },
  ],
}
