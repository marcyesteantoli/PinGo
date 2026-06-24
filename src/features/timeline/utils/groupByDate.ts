import type { Experience } from '@app-types/index'

export const UNDATED_SENTINEL = '__undated__'

export type Section = { title: string; data: Experience[] }

export function groupByDate(experiences: Experience[]): Section[] {
  const groups: Record<string, Experience[]> = {}
  for (const exp of experiences) {
    const key = exp.date ?? UNDATED_SENTINEL
    if (!groups[key]) groups[key] = []
    groups[key].push(exp)
  }
  const sortByTime = (exps: Experience[]) =>
    exps.sort((a, b) => {
      if (!a.start_time && !b.start_time) return 0
      if (!a.start_time) return 1
      if (!b.start_time) return -1
      return a.start_time.localeCompare(b.start_time)
    })

  const dated = Object.entries(groups)
    .filter(([k]) => k !== UNDATED_SENTINEL)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, data]) => ({ title, data: sortByTime(data) }))
  const undated = groups[UNDATED_SENTINEL] ?? []
  return undated.length > 0 ? [...dated, { title: UNDATED_SENTINEL, data: undated }] : dated
}
