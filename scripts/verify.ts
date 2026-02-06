import { calculateEloChanges } from '@/lib/elo'
import { normalizeRankings } from '@/lib/ranking'

// Test Case 1: Simple 4 player game
console.log('--- TEST 1: Simple Game ---')
const players = [
  { id: 'p1', elo: 1200, gamesPlayed: 10, position: 1 },
  { id: 'p2', elo: 1100, gamesPlayed: 10, position: 2 },
  { id: 'p3', elo: 1000, gamesPlayed: 10, position: 3 },
  { id: 'p4', elo: 900, gamesPlayed: 10, position: 4 },
]

const changes = calculateEloChanges(players)
console.log('Result:', changes)
// Expected: p1 gains big, p4 loses big

// Test Case 2: Rejoined player
console.log('\n--- TEST 2: Rejoined Player ---')
const rawRankings = [
  { playerId: 'p1', position: 1 }, // p1 won
  { playerId: 'p2', position: 2 }, // p2 second
  { playerId: 'p3', position: 3 }, // p3 died
  { playerId: 'p3', position: 4 }, // p3 rejoined position 4
]

const normalized = normalizeRankings(rawRankings)
console.log('Normalized:', normalized)
// Expected: p3 position = 3.5

const eloInputs = normalized.map(p => ({
  id: p.playerId,
  elo: 1000,
  gamesPlayed: 10,
  position: p.normalizedPosition
}))

const changes2 = calculateEloChanges(eloInputs)
console.log('Elo Changes with Rejoin:', changes2)
