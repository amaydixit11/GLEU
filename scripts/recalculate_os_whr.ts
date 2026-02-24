/**
 * Recalculate OpenSkill + WHR ratings from scratch.
 * 
 * Usage: npx tsx scripts/recalculate_os_whr.ts
 * 
 * Requires: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { rating, rate, ordinal } from 'openskill'
import { computeWHR, WHRGame } from '../lib/whr'

// Load env from .env.local manually (no dotenv dependency)
import { readFileSync } from 'fs'
import { join } from 'path'
try {
  const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8')
  for (const line of envFile.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim()
  }
} catch {}


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const SCALE = 40
const OFFSET = 1000
function osOrd(r: { mu: number; sigma: number }): number {
  return Math.round(ordinal(r) * SCALE + OFFSET)
}

async function main() {
  console.log('🔄 Fetching all games and results...')

  // Fetch all games chronologically
  const { data: games } = await supabase
    .from('games')
    .select('id, played_at')
    .order('played_at', { ascending: true })

  if (!games || games.length === 0) {
    console.log('No games found.')
    return
  }

  // Fetch all results
  const { data: allResults } = await supabase
    .from('game_results')
    .select('id, game_id, player_id, normalized_position')

  if (!allResults) { console.log('No results found.'); return }

  // Fetch all players
  const { data: players } = await supabase.from('players').select('id, name')
  if (!players) { console.log('No players found.'); return }

  const nameMap: Record<string, string> = {}
  for (const p of players) nameMap[p.id] = p.name

  // ============================================================
  // PART 1: OpenSkill Recalculation (online, game by game)
  // ============================================================
  console.log('')
  console.log('📊 OPENSKILL RECALCULATION')
  console.log('═'.repeat(50))

  // Track mu/sigma per player
  const osRatings: Record<string, { mu: number; sigma: number }> = {}
  for (const p of players) {
    osRatings[p.id] = rating() // { mu: 25, sigma: 8.333 }
  }

  for (const game of games) {
    const gameResults = allResults
      .filter(r => r.game_id === game.id)
      .sort((a, b) => parseFloat(a.normalized_position) - parseFloat(b.normalized_position))

    if (gameResults.length < 2) continue

    // Build teams (each player = 1-person team)
    const teams = gameResults.map(r => {
      const pr = osRatings[r.player_id] || rating()
      return [rating({ mu: pr.mu, sigma: pr.sigma })]
    })

    // Handle ties via rank array
    const ranks = gameResults.map(r => {
      const pos = parseFloat(r.normalized_position)
      const firstIdx = gameResults.findIndex(gr => parseFloat(gr.normalized_position) === pos)
      return firstIdx + 1
    })

    // Rate
    const updated = rate(teams, { rank: ranks })

    // Update DB and in-memory state
    for (let i = 0; i < gameResults.length; i++) {
      const r = gameResults[i]
      const oldOrd = osOrd(osRatings[r.player_id])
      const newRating = updated[i][0]
      const newOrd = osOrd(newRating)

      await supabase
        .from('game_results')
        .update({
          os_before: oldOrd,
          os_after: newOrd,
          os_change: newOrd - oldOrd,
        })
        .eq('id', r.id)

      osRatings[r.player_id] = { mu: newRating.mu, sigma: newRating.sigma }
    }

    console.log(`  Game ${game.played_at}: ${gameResults.map(r => 
      `${nameMap[r.player_id]} → ${osOrd(osRatings[r.player_id])}`
    ).join(', ')}`)
  }

  // Update final OS ratings on players
  console.log('')
  console.log('Final OpenSkill ratings:')
  for (const p of players) {
    const r = osRatings[p.id]
    const ord = osOrd(r)
    await supabase
      .from('players')
      .update({ os_mu: r.mu, os_sigma: r.sigma, os_ordinal: ord })
      .eq('id', p.id)
    console.log(`  ${p.name.padEnd(15)} μ=${r.mu.toFixed(2)} σ=${r.sigma.toFixed(2)} → ${ord}`)
  }

  // ============================================================
  // PART 2: WHR Recalculation (batch, all games at once)
  // ============================================================
  console.log('')
  console.log('📊 WHR RECALCULATION')
  console.log('═'.repeat(50))

  const whrGames: WHRGame[] = games.map(g => ({
    gameId: g.id,
    playedAt: new Date(g.played_at),
    players: allResults
      .filter(r => r.game_id === g.id)
      .map(r => ({ playerId: r.player_id, position: parseFloat(r.normalized_position) }))
  }))

  const whrResult = computeWHR(whrGames)

  // Update game_results
  for (const game of games) {
    const snapshot = whrResult.gameSnapshots[game.id]
    const changes = whrResult.gameChanges[game.id]
    if (!snapshot) continue

    for (const r of allResults.filter(r => r.game_id === game.id)) {
      const whrAfter = snapshot[r.player_id] ?? 1000
      const whrChange = changes[r.player_id] ?? 0
      const whrBefore = whrAfter - whrChange

      await supabase
        .from('game_results')
        .update({ whr_before: whrBefore, whr_after: whrAfter, whr_change: whrChange })
        .eq('id', r.id)
    }
  }

  // Update final WHR ratings on players
  console.log('Final WHR ratings:')
  const sortedByWhr = Object.entries(whrResult.playerRatings)
    .sort((a, b) => b[1] - a[1])
  for (const [pid, whrRating] of sortedByWhr) {
    await supabase
      .from('players')
      .update({ whr_rating: whrRating })
      .eq('id', pid)
    console.log(`  ${(nameMap[pid] || pid).padEnd(15)} → ${whrRating}`)
  }

  console.log('')
  console.log('✅ Recalculation complete!')
  console.log(`   ${games.length} games processed`)
  console.log(`   ${players.length} players updated`)
}

main().catch(console.error)
