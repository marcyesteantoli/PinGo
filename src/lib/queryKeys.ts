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
  settlements: {
    all: (tripId: string) => ['settlements', tripId] as const,
  },
  memories: {
    all: (tripId: string) => ['memories', tripId] as const,
  },
  ratings: {
    byExperience: (experienceId: string) => ['ratings', experienceId] as const,
    byTrip: (tripId: string) => ['ratings', 'trip', tripId] as const,
  },
  attributeRatings: {
    byExperience: (experienceId: string) => ['attributeRatings', experienceId] as const,
  },
  savedExperiences: {
    byUser: () => ['savedExperiences'] as const,
    isSaved: (experienceId: string) => ['savedExperiences', 'isSaved', experienceId] as const,
    savedCopyForSource: (sourceExperienceId: string) => ['savedExperiences', 'sourceLookup', sourceExperienceId] as const,
    note: (experienceId: string) => ['savedExperiences', 'note', experienceId] as const,
    detail: (experienceId: string) => ['savedExperiences', 'detail', experienceId] as const,
  },
  collaborators: {
    byTrip: (tripId: string) => ['collaborators', tripId] as const,
  },
  auth: {
    currentUser: () => ['currentUser'] as const,
    profile: (userId?: string) => ['profile', userId] as const,
  },
  wishlist: {
    byUser: () => ['wishlist'] as const,
  },
  destinations: {
    byTrip: (tripId: string) => ['destinations', tripId] as const,
  },
  premium: {
    tripStatus: (tripId: string) => ['premium', 'tripStatus', tripId] as const,
  },
}
