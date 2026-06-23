import { useCallback, useMemo, useRef } from 'react'
import Supercluster from 'supercluster'
import type { Region } from 'react-native-maps'

export type ClusterPoint<T> = {
  type: 'point'
  id: string
  latitude: number
  longitude: number
  data: T
}

export type ClusterGroup = {
  type: 'cluster'
  clusterId: number
  latitude: number
  longitude: number
  count: number
}

export type ClusterItem<T> = ClusterPoint<T> | ClusterGroup

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

export function useMapClusters<T>(
  items: Array<{ id: string; lat: number; lng: number; data: T }>,
  region: Region | null,
): {
  clusters: ClusterItem<T>[]
  getExpansionRegion: (clusterId: number) => Region | null
} {
  const scRef = useRef(
    new Supercluster<{ id: string; data: T }>({ radius: 30, maxZoom: 14 })
  )

  const features = useMemo(
    () =>
      items.map((item) => ({
        type: 'Feature' as const,
        properties: { id: item.id, data: item.data },
        geometry: { type: 'Point' as const, coordinates: [item.lng, item.lat] },
      })),
    [items]
  )

  useMemo(() => { scRef.current.load(features) }, [features])

  const clusters = useMemo<ClusterItem<T>[]>(() => {
    if (!region) return []
    const bbox = regionToBbox(region)
    const zoom = regionToZoom(region)
    return scRef.current.getClusters(bbox, zoom).map((f) => {
      if (f.properties.cluster) {
        return {
          type: 'cluster' as const,
          clusterId: f.properties.cluster_id as number,
          latitude: f.geometry.coordinates[1],
          longitude: f.geometry.coordinates[0],
          count: f.properties.point_count as number,
        }
      }
      return {
        type: 'point' as const,
        id: (f.properties as { id: string }).id,
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
        data: (f.properties as { data: T }).data,
      }
    })
  }, [features, region])

  const getExpansionRegion = useCallback((clusterId: number): Region | null => {
    try {
      const zoom = scRef.current.getClusterExpansionZoom(clusterId)
      const leaves = scRef.current.getLeaves(clusterId, Infinity)
      if (leaves.length === 0) return null
      const lats = leaves.map((l) => l.geometry.coordinates[1])
      const lngs = leaves.map((l) => l.geometry.coordinates[0])
      const latC = (Math.min(...lats) + Math.max(...lats)) / 2
      const lngC = (Math.min(...lngs) + Math.max(...lngs)) / 2
      const delta = (360 / Math.pow(2, zoom)) * 1.4
      return { latitude: latC, longitude: lngC, latitudeDelta: delta, longitudeDelta: delta }
    } catch {
      return null
    }
  }, [])

  return { clusters, getExpansionRegion }
}
