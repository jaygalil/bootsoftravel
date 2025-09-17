export interface Location {
  latitude: number
  longitude: number
}

export interface Checkpoint {
  id: string
  name: string
  latitude: number
  longitude: number
  radius: number // in meters
  isActive: boolean
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c
  return distance
}

/**
 * Check if a location is within a checkpoint's radius
 */
export function isWithinCheckpointRadius(userLocation: Location, checkpoint: Checkpoint): boolean {
  if (!checkpoint.isActive) {
    return false
  }

  const distance = calculateDistance(userLocation, {
    latitude: checkpoint.latitude,
    longitude: checkpoint.longitude
  })

  return distance <= checkpoint.radius
}

/**
 * Find the nearest active checkpoint to a given location
 */
export function findNearestCheckpoint(userLocation: Location, checkpoints: Checkpoint[]): Checkpoint | null {
  const activeCheckpoints = checkpoints.filter(cp => cp.isActive)
  
  if (activeCheckpoints.length === 0) {
    return null
  }

  let nearestCheckpoint: Checkpoint | null = null
  let minDistance = Infinity

  for (const checkpoint of activeCheckpoints) {
    const distance = calculateDistance(userLocation, {
      latitude: checkpoint.latitude,
      longitude: checkpoint.longitude
    })

    if (distance < minDistance) {
      minDistance = distance
      nearestCheckpoint = checkpoint
    }
  }

  return nearestCheckpoint
}

/**
 * Get all checkpoints that are within range of a location
 */
export function getCheckpointsInRange(userLocation: Location, checkpoints: Checkpoint[]): Checkpoint[] {
  return checkpoints.filter(checkpoint => 
    checkpoint.isActive && isWithinCheckpointRadius(userLocation, checkpoint)
  )
}