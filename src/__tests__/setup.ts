import '@testing-library/jest-native/extend-expect'

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
)

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'es' } }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn(),
    storage: {
      from: jest.fn().mockReturnThis(),
      createSignedUrls: jest.fn(),
    },
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    rpc: jest.fn(),
  },
}))
