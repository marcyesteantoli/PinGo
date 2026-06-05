// ─── MODO DEMO ──────────────────────────────────────────────────────────────
// Cambia a false para volver al modo real con Supabase
export const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE !== 'false'
// ────────────────────────────────────────────────────────────────────────────

import type { Trip, Experience, Collaborator, Memory, Settlement, TripDestination } from '@types/index'
import type { ExpenseWithSplits } from '@types/index'

// IDs fijos para el usuario y los viajes de demo
export const DEMO_USER_ID    = '11111111-1111-1111-1111-111111111111'
export const COLLAB_002_ID   = '22222222-2222-2222-2222-222222222222'
export const COLLAB_003_ID   = '33333333-3333-3333-3333-333333333333'
export const DEMO_TRIP_ID    = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
export const DEMO_TRIP_ID_2  = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

// IDs de experiencias
const EXP_001 = 'e1111111-1111-1111-1111-111111111111'
const EXP_002 = 'e2222222-2222-2222-2222-222222222222'
const EXP_003 = 'e3333333-3333-3333-3333-333333333333'
const EXP_004 = 'e4444444-4444-4444-4444-444444444444'
const EXP_005 = 'e5555555-5555-5555-5555-555555555555'
const EXP_101 = 'f1111111-1111-1111-1111-111111111111'
const EXP_102 = 'f2222222-2222-2222-2222-222222222222'
const EXP_103 = 'f3333333-3333-3333-3333-333333333333'
const EXP_104 = 'f4444444-4444-4444-4444-444444444444'

// IDs de gastos
const GASTO_001 = 'c1111111-1111-1111-1111-111111111111'
const GASTO_002 = 'c2222222-2222-2222-2222-222222222222'
const GASTO_003 = 'c3333333-3333-3333-3333-333333333333'
const GASTO_004 = 'c4444444-4444-4444-4444-444444444444'
const GASTO_101 = 'd1111111-1111-1111-1111-111111111111'
const GASTO_102 = 'd2222222-2222-2222-2222-222222222222'

// Usuario simulado (compatible con el tipo User de Supabase Auth)
export const DEMO_USER = {
  id: DEMO_USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@pingo.app',
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
    start_date: '2026-05-06',
    end_date: '2026-05-24',
    currency: 'JPY',
    created_by: DEMO_USER_ID,
    join_code: 'JP2026',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: DEMO_TRIP_ID_2,
    title: 'Escapada a Lisboa',
    start_date: '2026-03-15',
    end_date: '2026-03-20',
    currency: 'EUR',
    created_by: DEMO_USER_ID,
    join_code: 'LIS01',
    created_at: '2026-01-10T10:00:00Z',
  },
]

// ─── COLABORADORES ──────────────────────────────────────────────────────────

export const mockCollaborators: Record<string, Collaborator[]> = {
  [DEMO_TRIP_ID]: [
    { user_id: DEMO_USER_ID,  name: 'Marc Yeste',    avatar_url: null, role: 'owner' },
    { user_id: COLLAB_002_ID, name: 'Nuria Fabregat', avatar_url: null, role: 'member' },
    { user_id: COLLAB_003_ID, name: 'Paula Tena',     avatar_url: null, role: 'member' },
  ],
  [DEMO_TRIP_ID_2]: [
    { user_id: DEMO_USER_ID,  name: 'Usuario Demo', avatar_url: null, role: 'owner' },
    { user_id: COLLAB_002_ID, name: 'Ana García',    avatar_url: null, role: 'member' },
  ],
}

// ─── EXPERIENCIAS ────────────────────────────────────────────────────────────

export const mockExperiences: Record<string, Experience[]> = {
  [DEMO_TRIP_ID]: [
    {
      id: EXP_001,
      trip_id: DEMO_TRIP_ID,
      type: 'transport',
      title: 'Vuelo BCN → NRT',
      location: null,
      confirmation_code: 'IB7841',
      start_time: '07:30',
      end_time: '09:45',
      date: '2026-05-06',
      destination_id: 'dest-001',
      created_by: DEMO_USER_ID,
      updated_at: '2026-01-15T10:00:00Z',
    },
    {
      id: EXP_002,
      trip_id: DEMO_TRIP_ID,
      type: 'accommodation',
      title: 'Hotel Shinjuku Granbell',
      location: null,
      confirmation_code: 'HT882XJ',
      start_time: '15:00',
      end_time: null,
      date: '2026-05-08',
      destination_id: 'dest-001',
      created_by: DEMO_USER_ID,
      updated_at: '2026-01-15T10:00:00Z',
    },
    {
      id: EXP_003,
      trip_id: DEMO_TRIP_ID,
      type: 'activity',
      title: 'Templo Senso-ji',
      location: null,
      confirmation_code: null,
      start_time: '09:00',
      end_time: '11:30',
      date: '2026-05-08',
      destination_id: 'dest-001',
      created_by: DEMO_USER_ID,
      updated_at: '2026-01-15T10:00:00Z',
    },
    {
      id: EXP_004,
      trip_id: DEMO_TRIP_ID,
      type: 'restaurant',
      title: 'Sushi Saito · Roppongi',
      location: null,
      confirmation_code: null,
      start_time: '20:00',
      end_time: '22:00',
      date: '2026-05-12',
      destination_id: 'dest-002',
      created_by: COLLAB_002_ID,
      updated_at: '2026-01-15T10:00:00Z',
    },
    {
      id: EXP_005,
      trip_id: DEMO_TRIP_ID,
      type: 'activity',
      title: 'Excursión Monte Fuji',
      location: null,
      confirmation_code: null,
      start_time: '06:00',
      end_time: '18:00',
      date: '2026-06-14',
      destination_id: null,
      created_by: COLLAB_003_ID,
      updated_at: '2026-01-15T10:00:00Z',
    },
  ],
  [DEMO_TRIP_ID_2]: [
    {
      id: EXP_101,
      trip_id: DEMO_TRIP_ID_2,
      type: 'transport',
      title: 'Vuelo BCN → LIS',
      location: null,
      confirmation_code: 'VY1234',
      start_time: '08:15',
      end_time: '10:30',
      date: '2026-03-15',
      destination_id: null,
      created_by: DEMO_USER_ID,
      updated_at: '2026-01-10T10:00:00Z',
    },
    {
      id: EXP_102,
      trip_id: DEMO_TRIP_ID_2,
      type: 'accommodation',
      title: 'Bairro Alto Hotel',
      location: null,
      confirmation_code: 'BH991',
      start_time: '14:00',
      end_time: null,
      date: '2026-03-15',
      destination_id: null,
      created_by: DEMO_USER_ID,
      updated_at: '2026-01-10T10:00:00Z',
    },
    {
      id: EXP_103,
      trip_id: DEMO_TRIP_ID_2,
      type: 'restaurant',
      title: 'Restaurante Belcanto',
      location: null,
      confirmation_code: null,
      start_time: '20:30',
      end_time: '22:30',
      date: '2026-03-16',
      destination_id: null,
      created_by: COLLAB_002_ID,
      updated_at: '2026-01-10T10:00:00Z',
    },
    {
      id: EXP_104,
      trip_id: DEMO_TRIP_ID_2,
      type: 'activity',
      title: 'Torre de Belém',
      location: null,
      confirmation_code: null,
      start_time: '10:00',
      end_time: '12:00',
      date: '2026-03-17',
      destination_id: null,
      created_by: DEMO_USER_ID,
      updated_at: '2026-01-10T10:00:00Z',
    },
  ],
}

// ─── GASTOS ──────────────────────────────────────────────────────────────────
// Balances Japón (zero-sum):
//   Marc Yeste      → +€771.67
//   Nuria Fabregat  → -€48.33
//   Paula Tena      → -€723.34
//
// Ajustes recomendados:
//   Paula  → Marc:  €723.34
//   Nuria  → Marc:   €48.33

export const mockExpenses: Record<string, ExpenseWithSplits[]> = {
  [DEMO_TRIP_ID]: [
    {
      id: GASTO_001,
      trip_id: DEMO_TRIP_ID,
      experience_id: EXP_001,
      description: 'Vuelos grupo BCN → NRT',
      amount: 1450,
      currency: 'EUR',
      payer_id: DEMO_USER_ID,
      created_at: '2026-01-20T10:00:00Z',
      payer: { id: DEMO_USER_ID, name: 'Marc Yeste', avatar_url: null, updated_at: '' } as any,
      splits: [
        { expense_id: GASTO_001, user_id: DEMO_USER_ID,  amount: 483.33 },
        { expense_id: GASTO_001, user_id: COLLAB_002_ID, amount: 483.33 },
        { expense_id: GASTO_001, user_id: COLLAB_003_ID, amount: 483.34 },
      ],
    },
    {
      id: GASTO_002,
      trip_id: DEMO_TRIP_ID,
      experience_id: EXP_002,
      description: 'Hotel Shinjuku (3 noches)',
      amount: 840,
      currency: 'EUR',
      payer_id: COLLAB_002_ID,
      created_at: '2026-01-20T10:05:00Z',
      payer: { id: COLLAB_002_ID, name: 'Nuria Fabregat', avatar_url: null, updated_at: '' } as any,
      splits: [
        { expense_id: GASTO_002, user_id: DEMO_USER_ID,  amount: 280 },
        { expense_id: GASTO_002, user_id: COLLAB_002_ID, amount: 280 },
        { expense_id: GASTO_002, user_id: COLLAB_003_ID, amount: 280 },
      ],
    },
    {
      id: GASTO_003,
      trip_id: DEMO_TRIP_ID,
      experience_id: EXP_004,
      description: 'Cena en Sushi Saito',
      amount: 210,
      currency: 'EUR',
      payer_id: DEMO_USER_ID,
      created_at: '2026-01-20T10:10:00Z',
      payer: { id: DEMO_USER_ID, name: 'Marc Yeste', avatar_url: null, updated_at: '' } as any,
      splits: [
        { expense_id: GASTO_003, user_id: DEMO_USER_ID,  amount: 70 },
        { expense_id: GASTO_003, user_id: COLLAB_002_ID, amount: 70 },
        { expense_id: GASTO_003, user_id: COLLAB_003_ID, amount: 70 },
      ],
    },
    {
      id: GASTO_004,
      trip_id: DEMO_TRIP_ID,
      experience_id: EXP_005,
      description: 'Tour Monte Fuji',
      amount: 165,
      currency: 'EUR',
      payer_id: COLLAB_003_ID,
      created_at: '2026-01-20T10:15:00Z',
      payer: { id: COLLAB_003_ID, name: 'Paula Tena', avatar_url: null, updated_at: '' } as any,
      splits: [
        { expense_id: GASTO_004, user_id: DEMO_USER_ID,  amount: 55 },
        { expense_id: GASTO_004, user_id: COLLAB_002_ID, amount: 55 },
        { expense_id: GASTO_004, user_id: COLLAB_003_ID, amount: 55 },
      ],
    },
  ],
  [DEMO_TRIP_ID_2]: [
    {
      id: GASTO_101,
      trip_id: DEMO_TRIP_ID_2,
      experience_id: EXP_101,
      description: 'Vuelos BCN → LIS',
      amount: 380,
      currency: 'EUR',
      payer_id: DEMO_USER_ID,
      created_at: '2026-01-12T10:00:00Z',
      payer: { id: DEMO_USER_ID, name: 'Usuario Demo', avatar_url: null, updated_at: '' } as any,
      splits: [
        { expense_id: GASTO_101, user_id: DEMO_USER_ID,  amount: 190 },
        { expense_id: GASTO_101, user_id: COLLAB_002_ID, amount: 190 },
      ],
    },
    {
      id: GASTO_102,
      trip_id: DEMO_TRIP_ID_2,
      experience_id: EXP_102,
      description: 'Bairro Alto Hotel (2 noches)',
      amount: 560,
      currency: 'EUR',
      payer_id: COLLAB_002_ID,
      created_at: '2026-01-12T10:05:00Z',
      payer: { id: COLLAB_002_ID, name: 'Ana García', avatar_url: null, updated_at: '' } as any,
      splits: [
        { expense_id: GASTO_102, user_id: DEMO_USER_ID,  amount: 280 },
        { expense_id: GASTO_102, user_id: COLLAB_002_ID, amount: 280 },
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
  file_path: string | null
  file_url: string | null
  file_type: string | null
  document_type: 'file' | 'link' | 'pass'
  url: string | null
  uploaded_by: string
  created_at: string
  experience_title: string | null
}>> = {
  [DEMO_TRIP_ID]: [
    {
      id: 'doc-001',
      experience_id: EXP_001,
      trip_id: DEMO_TRIP_ID,
      name: 'Reserva vuelo IB7841',
      file_path: 'mock/doc-001.pdf',
      file_url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf',
      file_type: 'application/pdf',
      document_type: 'file',
      url: null,
      uploaded_by: DEMO_USER_ID,
      created_at: '2026-01-20T11:00:00Z',
      experience_title: 'Vuelo BCN → NRT',
    },
    {
      id: 'doc-002',
      experience_id: EXP_002,
      trip_id: DEMO_TRIP_ID,
      name: 'Confirmación hotel Shinjuku',
      file_path: 'mock/doc-002.pdf',
      file_url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf',
      file_type: 'application/pdf',
      document_type: 'file',
      url: null,
      uploaded_by: DEMO_USER_ID,
      created_at: '2026-01-20T11:05:00Z',
      experience_title: 'Hotel Shinjuku Granbell',
    },
    {
      id: 'doc-003',
      experience_id: EXP_001,
      trip_id: DEMO_TRIP_ID,
      name: 'Seguro de viaje 2026',
      file_path: 'mock/doc-003.pdf',
      file_url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf',
      file_type: 'application/pdf',
      document_type: 'file',
      url: null,
      uploaded_by: COLLAB_002_ID,
      created_at: '2026-01-21T09:00:00Z',
      experience_title: 'Vuelo BCN → NRT',
    },
    {
      id: 'doc-004',
      experience_id: EXP_002,
      trip_id: DEMO_TRIP_ID,
      name: 'Hotel Shinjuku Granbell',
      file_path: null,
      file_url: null,
      file_type: null,
      document_type: 'link',
      url: 'https://www.granbell.jp/en/shinjuku',
      uploaded_by: DEMO_USER_ID,
      created_at: '2026-01-20T12:00:00Z',
      experience_title: 'Hotel Shinjuku Granbell',
    },
  ],
  [DEMO_TRIP_ID_2]: [
    {
      id: 'doc-101',
      experience_id: EXP_101,
      trip_id: DEMO_TRIP_ID_2,
      name: 'Billetes VY1234',
      file_path: 'mock/doc-101.pdf',
      file_url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf',
      file_type: 'application/pdf',
      document_type: 'file',
      url: null,
      uploaded_by: DEMO_USER_ID,
      created_at: '2026-01-12T11:00:00Z',
      experience_title: 'Vuelo BCN → LIS',
    },
  ],
}

// ─── DESTINOS ────────────────────────────────────────────────────────────────

export const mockDestinations: Record<string, TripDestination[]> = {
  [DEMO_TRIP_ID]: [
    {
      id: 'dest-001',
      trip_id: DEMO_TRIP_ID,
      name: 'Tokyo',
      country: 'Japón',
      lat: 35.6762,
      lng: 139.6503,
      start_date: '2026-05-06',
      end_date: '2026-05-09',
      sort_order: 0,
      created_at: '2026-01-15T10:00:00Z',
    },
    {
      id: 'dest-002',
      trip_id: DEMO_TRIP_ID,
      name: 'Hakone',
      country: 'Japón',
      lat: 35.2323,
      lng: 139.1069,
      start_date: '2026-05-10',
      end_date: '2026-05-13',
      sort_order: 1,
      created_at: '2026-01-15T10:00:00Z',
    },
    {
      id: 'dest-003',
      trip_id: DEMO_TRIP_ID,
      name: 'Kyoto',
      country: 'Japón',
      lat: 35.0116,
      lng: 135.7681,
      start_date: '2026-05-14',
      end_date: '2026-05-20',
      sort_order: 2,
      created_at: '2026-01-15T10:00:00Z',
    },
    {
      id: 'dest-004',
      trip_id: DEMO_TRIP_ID,
      name: 'Osaka',
      country: 'Japón',
      lat: 34.6937,
      lng: 135.5023,
      start_date: '2026-05-21',
      end_date: '2026-05-24',
      sort_order: 3,
      created_at: '2026-01-15T10:00:00Z',
    },
  ],
  [DEMO_TRIP_ID_2]: [],
}

// ─── LIQUIDACIONES ──────────────────────────────────────────────────────────

export const mockSettlements: Record<string, Settlement[]> = {
  [DEMO_TRIP_ID]: [],
  [DEMO_TRIP_ID_2]: [],
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
      user_id: COLLAB_002_ID,
      image_url: 'https://picsum.photos/seed/fuji/800/600',
      caption: 'Vistas desde el Monte Fuji',
      created_at: '2026-06-14T10:00:00Z',
    },
    {
      id: 'mem-003',
      trip_id: DEMO_TRIP_ID,
      user_id: COLLAB_003_ID,
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
      user_id: COLLAB_002_ID,
      image_url: 'https://picsum.photos/seed/lisboa/800/600',
      caption: 'Vistas desde el Mirador da Graça',
      created_at: '2026-03-16T16:00:00Z',
    },
  ],
}
