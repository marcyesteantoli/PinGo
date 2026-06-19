import { renderHook } from '@testing-library/react-native'
import type { Region } from 'react-native-maps'

// Mock supercluster before importing the hook
const mockLoad = jest.fn()
const mockGetClusters = jest.fn().mockReturnValue([])
const mockGetLeaves = jest.fn().mockReturnValue([])
const mockGetClusterExpansionZoom = jest.fn().mockReturnValue(10)

jest.mock('supercluster', () => {
  return jest.fn().mockImplementation(() => ({
    load: mockLoad,
    getClusters: mockGetClusters,
    getLeaves: mockGetLeaves,
    getClusterExpansionZoom: mockGetClusterExpansionZoom,
  }))
})

// Import after mocking
import { useMapClusters } from '../useMapClusters'

beforeEach(() => {
  jest.clearAllMocks()
  mockGetClusters.mockReturnValue([])
  mockGetLeaves.mockReturnValue([])
  mockGetClusterExpansionZoom.mockReturnValue(10)
})

// ─── Pure function implementations (mirrored from source) ──────────────────
// These are private in the source — we replicate the math here so we can test
// the logic in isolation, and verify it matches the hook output via getClusters.

function regionToZoom(region: Region): number {
  return Math.max(0, Math.min(20, Math.round(Math.log2(360 / region.latitudeDelta))))
}

function regionToBbox(region: Region): [number, number, number, number] {
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region
  return [
    Math.max(-180, longitude - longitudeDelta / 2),
    Math.max(-90, latitude - latitudeDelta / 2),
    Math.min(180, longitude + longitudeDelta / 2),
    Math.min(90, latitude + latitudeDelta / 2),
  ]
}

// ─── Fixtures ──────────────────────────────────────────────────────────────

function makeRegion(overrides: Partial<Region> = {}): Region {
  return {
    latitude: 40.416775,
    longitude: -3.703790,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
    ...overrides,
  }
}

const SAMPLE_ITEMS = [
  { id: 'item-a', lat: 40.4, lng: -3.7, data: { name: 'Place A' } },
  { id: 'item-b', lat: 41.0, lng: -3.5, data: { name: 'Place B' } },
]

// ─── regionToZoom (pure function mirror) ───────────────────────────────────

describe('regionToZoom (pure math)', () => {
  it('returns a low zoom for a large region (latDelta=1)', () => {
    const region = makeRegion({ latitudeDelta: 1 })
    const zoom = regionToZoom(region)
    // log2(360/1) ≈ 8.49 → rounded to 8
    expect(zoom).toBe(8)
    expect(zoom).toBeGreaterThanOrEqual(0)
    expect(zoom).toBeLessThanOrEqual(20)
  })

  it('returns a high zoom for a small region (latDelta=0.001)', () => {
    const region = makeRegion({ latitudeDelta: 0.001 })
    const zoom = regionToZoom(region)
    // log2(360/0.001) = log2(360000) ≈ 18.45 → rounded to 18
    expect(zoom).toBe(18)
    expect(zoom).toBeGreaterThanOrEqual(0)
    expect(zoom).toBeLessThanOrEqual(20)
  })

  it('large region zoom is less than small region zoom', () => {
    const large = makeRegion({ latitudeDelta: 1 })
    const small = makeRegion({ latitudeDelta: 0.001 })
    expect(regionToZoom(large)).toBeLessThan(regionToZoom(small))
  })

  it('clamps zoom to minimum 0 for extremely large regions', () => {
    const region = makeRegion({ latitudeDelta: 360 })
    // log2(360/360) = 0 → no clamping needed, boundary check
    const zoom = regionToZoom(region)
    expect(zoom).toBeGreaterThanOrEqual(0)
  })

  it('clamps zoom to maximum 20 for extremely small regions', () => {
    const region = makeRegion({ latitudeDelta: 0.00001 })
    const zoom = regionToZoom(region)
    expect(zoom).toBeLessThanOrEqual(20)
  })
})

// ─── regionToBbox (pure function mirror) ───────────────────────────────────

describe('regionToBbox (pure math)', () => {
  it('returns [west, south, east, north] in correct order', () => {
    const region = makeRegion({
      latitude: 40.0,
      longitude: -3.0,
      latitudeDelta: 2.0,
      longitudeDelta: 4.0,
    })
    const [west, south, east, north] = regionToBbox(region)
    // west = -3 - 4/2 = -5, south = 40 - 2/2 = 39, east = -3 + 4/2 = -1, north = 40 + 2/2 = 41
    expect(west).toBeCloseTo(-5, 5)
    expect(south).toBeCloseTo(39, 5)
    expect(east).toBeCloseTo(-1, 5)
    expect(north).toBeCloseTo(41, 5)
  })

  it('west is always less than east', () => {
    const region = makeRegion()
    const [west, , east] = regionToBbox(region)
    expect(west).toBeLessThan(east)
  })

  it('south is always less than north', () => {
    const region = makeRegion()
    const [, south, , north] = regionToBbox(region)
    expect(south).toBeLessThan(north)
  })

  it('clamps longitude bounds to [-180, 180]', () => {
    // Near the antimeridian — large longitudeDelta would push past ±180
    const region = makeRegion({
      longitude: 179.5,
      longitudeDelta: 2.0,
    })
    const [west, , east] = regionToBbox(region)
    expect(west).toBeGreaterThanOrEqual(-180)
    expect(east).toBeLessThanOrEqual(180)
  })

  it('clamps latitude bounds to [-90, 90]', () => {
    // Near the pole — large latitudeDelta would push past ±90
    const region = makeRegion({
      latitude: 89.0,
      latitudeDelta: 4.0,
    })
    const [, south, , north] = regionToBbox(region)
    expect(south).toBeGreaterThanOrEqual(-90)
    expect(north).toBeLessThanOrEqual(90)
  })

  it('symmetric region around (0, 0) produces symmetric bbox', () => {
    const region = makeRegion({
      latitude: 0,
      longitude: 0,
      latitudeDelta: 2,
      longitudeDelta: 2,
    })
    const [west, south, east, north] = regionToBbox(region)
    expect(west).toBeCloseTo(-1, 5)
    expect(south).toBeCloseTo(-1, 5)
    expect(east).toBeCloseTo(1, 5)
    expect(north).toBeCloseTo(1, 5)
  })
})

// ─── Hook behaviour ────────────────────────────────────────────────────────

describe('useMapClusters hook', () => {
  it('returns empty array when region is null', async () => {
    const { result } = await renderHook(() => useMapClusters(SAMPLE_ITEMS, null))
    expect(result.current.clusters).toEqual([])
  })

  it('returns empty array when there are no items', async () => {
    const region = makeRegion()
    const { result } = await renderHook(() => useMapClusters([], region))
    expect(result.current.clusters).toEqual([])
  })

  it('calls sc.load with the GeoJSON features derived from items', async () => {
    const region = makeRegion()
    await renderHook(() => useMapClusters(SAMPLE_ITEMS, region))

    expect(mockLoad).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'Feature',
          properties: expect.objectContaining({ id: 'item-a' }),
          geometry: expect.objectContaining({
            type: 'Point',
            coordinates: [-3.7, 40.4],
          }),
        }),
        expect.objectContaining({
          type: 'Feature',
          properties: expect.objectContaining({ id: 'item-b' }),
          geometry: expect.objectContaining({
            type: 'Point',
            coordinates: [-3.5, 41.0],
          }),
        }),
      ])
    )
  })

  it('calls getClusters with bbox and zoom derived from region', async () => {
    const region = makeRegion({
      latitude: 40.0,
      longitude: -3.0,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    })
    await renderHook(() => useMapClusters(SAMPLE_ITEMS, region))

    const expectedBbox = regionToBbox(region)
    const expectedZoom = regionToZoom(region)

    expect(mockGetClusters).toHaveBeenCalledWith(expectedBbox, expectedZoom)
  })

  it('maps cluster features to ClusterGroup items', async () => {
    const region = makeRegion()
    mockGetClusters.mockReturnValue([
      {
        type: 'Feature',
        properties: {
          cluster: true,
          cluster_id: 42,
          point_count: 5,
        },
        geometry: { type: 'Point', coordinates: [-3.7, 40.4] },
      },
    ])

    const { result } = await renderHook(() => useMapClusters(SAMPLE_ITEMS, region))

    expect(result.current.clusters).toHaveLength(1)
    const cluster = result.current.clusters[0]
    expect(cluster.type).toBe('cluster')
    if (cluster.type === 'cluster') {
      expect(cluster.clusterId).toBe(42)
      expect(cluster.count).toBe(5)
      expect(cluster.latitude).toBe(40.4)
      expect(cluster.longitude).toBe(-3.7)
    }
  })

  it('maps point features to ClusterPoint items', async () => {
    const region = makeRegion()
    mockGetClusters.mockReturnValue([
      {
        type: 'Feature',
        properties: {
          cluster: false,
          id: 'item-a',
          data: { name: 'Place A' },
        },
        geometry: { type: 'Point', coordinates: [-3.7, 40.4] },
      },
    ])

    const { result } = await renderHook(() => useMapClusters(SAMPLE_ITEMS, region))

    expect(result.current.clusters).toHaveLength(1)
    const point = result.current.clusters[0]
    expect(point.type).toBe('point')
    if (point.type === 'point') {
      expect(point.id).toBe('item-a')
      expect(point.latitude).toBe(40.4)
      expect(point.longitude).toBe(-3.7)
    }
  })

  it('returns null from getExpansionRegion when getLeaves returns empty array', async () => {
    mockGetLeaves.mockReturnValue([])
    const region = makeRegion()

    const { result } = await renderHook(() => useMapClusters(SAMPLE_ITEMS, region))
    const expansionRegion = result.current.getExpansionRegion(99)

    expect(expansionRegion).toBeNull()
  })

  it('returns a valid Region from getExpansionRegion when leaves exist', async () => {
    mockGetClusterExpansionZoom.mockReturnValue(12)
    mockGetLeaves.mockReturnValue([
      { geometry: { coordinates: [-3.7, 40.4] } },
      { geometry: { coordinates: [-3.5, 41.0] } },
    ])
    const region = makeRegion()

    const { result } = await renderHook(() => useMapClusters(SAMPLE_ITEMS, region))
    const expansionRegion = result.current.getExpansionRegion(42)

    expect(expansionRegion).not.toBeNull()
    expect(expansionRegion).toEqual(
      expect.objectContaining({
        latitude: expect.any(Number),
        longitude: expect.any(Number),
        latitudeDelta: expect.any(Number),
        longitudeDelta: expect.any(Number),
      })
    )
  })

  it('returns null from getExpansionRegion when supercluster throws', async () => {
    mockGetClusterExpansionZoom.mockImplementation(() => {
      throw new Error('Cluster not found')
    })
    const region = makeRegion()

    const { result } = await renderHook(() => useMapClusters(SAMPLE_ITEMS, region))
    const expansionRegion = result.current.getExpansionRegion(999)

    expect(expansionRegion).toBeNull()
  })
})
