import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Grid } from 'lucide-react'
import GlobalMatrixViewer from '@/components/GlobalMatrixViewer'

export const dynamic = 'force-dynamic'

type Player = { id: string; name: string; os_ordinal: number }

export default async function GlobalRivalryPage() {
  const { data: players } = await supabase
    .from('players')
    .select('id, name, os_ordinal')

  if (!players) return <div className="p-8">No players found</div>

  const { data: results } = await supabase
    .from('game_results')
    .select('player_id, game_id, normalized_position')

  // Matrix: matrix[playerA][playerB] = { wins, losses, ties } (from A's perspective against B)
  const matrix: Record<string, Record<string, { wins: number; losses: number; ties: number }>> = {}
  const summary: Record<string, { wins: number; losses: number; ties: number }> = {}

  // Initialize data structures
  players.forEach(p1 => {
    matrix[p1.id] = {}
    summary[p1.id] = { wins: 0, losses: 0, ties: 0 }
    players.forEach(p2 => {
      if (p1.id !== p2.id) {
        matrix[p1.id][p2.id] = { wins: 0, losses: 0, ties: 0 }
      }
    })
  })

  if (results) {
    // Group results by game
    const games: Record<string, { player_id: string; pos: number }[]> = {}
    results.forEach(r => {
      if (!games[r.game_id]) games[r.game_id] = []
      games[r.game_id].push({ player_id: r.player_id, pos: r.normalized_position })
    })

    // Compute pairwise results for each game
    Object.values(games).forEach(gamePlayers => {
      for (let i = 0; i < gamePlayers.length; i++) {
        for (let j = 0; j < gamePlayers.length; j++) {
          if (i === j) continue
          const p1 = gamePlayers[i]
          const p2 = gamePlayers[j]
          
          if (matrix[p1.player_id] && matrix[p1.player_id][p2.player_id]) {
            if (p1.pos < p2.pos) {
              matrix[p1.player_id][p2.player_id].wins++
              summary[p1.player_id].wins++
            } else if (p1.pos > p2.pos) {
              matrix[p1.player_id][p2.player_id].losses++
              summary[p1.player_id].losses++
            } else {
              matrix[p1.player_id][p2.player_id].ties++
              summary[p1.player_id].ties++
            }
          }
        }
      }
    })
  }

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-[95vw] mx-auto space-y-8">
      <header className="flex items-center gap-4 flex-wrap">
        <Link href="/" className="p-2 border border-foreground hover:bg-uno-yellow hover:text-black transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl md:text-4xl font-black font-mono uppercase tracking-tighter text-uno-yellow flex items-center gap-3">
          <Grid size={32} /> Global Rivalry Matrix
        </h1>
      </header>

      <GlobalMatrixViewer 
        initialPlayers={players} 
        matrix={matrix} 
        summary={summary} 
      />
    </main>
  )
}
