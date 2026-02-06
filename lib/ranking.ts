/**
 * Calculates normalized positions from raw rankings.
 * Handles cases where a player appears multiple times (rejoins).
 */
export function normalizeRankings(
  rawRankings: { playerId: string; position: number }[]
): { playerId: string; normalizedPosition: number; rawPositions: number[] }[] {
  const playerPositions: Record<string, number[]> = {}

  // Group positions by player
  rawRankings.forEach((r) => {
    if (!playerPositions[r.playerId]) {
      playerPositions[r.playerId] = []
    }
    playerPositions[r.playerId].push(r.position)
  })

  // Calculate average position
  const normalized = Object.keys(playerPositions).map((playerId) => {
    const positions = playerPositions[playerId]
    const sum = positions.reduce((a, b) => a + b, 0)
    const avg = sum / positions.length
    return {
      playerId,
      normalizedPosition: avg,
      rawPositions: positions.sort((a, b) => a - b),
    }
  })

  // Sort by normalized position (ascending)
  return normalized.sort((a, b) => a.normalizedPosition - b.normalizedPosition)
}
