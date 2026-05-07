export const queryKeys = {
  trips: {
    all: () => ['trips'] as const,
    list: () => ['trips', 'list'] as const,
    detail: (id: string) => ['trips', id] as const,
  },
  experiences: {
    all: (tripId: string) => ['experiences', tripId] as const,
    detail: (tripId: string, id: string) => ['experiences', tripId, id] as const,
  },
  documents: {
    all: (tripId: string) => ['documents', tripId] as const,
    byExperience: (experienceId: string) => ['documents', 'experience', experienceId] as const,
  },
  expenses: {
    all: (tripId: string) => ['expenses', tripId] as const,
    balances: (tripId: string) => ['expenses', tripId, 'balances'] as const,
  },
  memories: {
    all: (tripId: string) => ['memories', tripId] as const,
  },
  ratings: {
    byExperience: (experienceId: string) => ['ratings', experienceId] as const,
  },
  collaborators: {
    byTrip: (tripId: string) => ['collaborators', tripId] as const,
  },
}
