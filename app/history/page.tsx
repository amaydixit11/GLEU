import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Calendar } from 'lucide-react'

// Force dynamic rendering to fetch latest history
export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const { data: games } = await supabase
    .from('games')
    .select(`
      *,
      game_results (
        player_id,
        elo_change,
        normalized_position,
        players (name)
      )
    `)
    .order('played_at', { ascending: false })

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <Link href="/" className="p-2 border border-foreground hover:bg-foreground hover:text-background transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold font-mono uppercase">Game History</h1>
      </header>

      <div className="space-y-6">
        {games?.map((game: any) => (
          <div key={game.id} className="border border-foreground/20 p-6 hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-start mb-6 border-b border-foreground/10 pb-4">
              <div className="flex items-center gap-2 opacity-50 font-mono text-sm">
                <Calendar size={14} />
                {new Date(game.played_at).toLocaleDateString()} • {new Date(game.played_at).toLocaleTimeString()}
              </div>
              <div className="font-mono text-xs uppercase bg-foreground/10 px-2 py-1">
                {game.total_players} Players
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {game.game_results
                .sort((a: any, b: any) => a.normalized_position - b.normalized_position)
                .map((result: any) => (
                <div key={result.player_id} className="flex justify-between items-center bg-black/20 p-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-accent font-bold">
                      {result.normalized_position % 1 === 0 ? `#${result.normalized_position}` : `#${result.normalized_position.toFixed(1)}`}
                    </span>
                    <span className="font-bold">{result.players?.name}</span>
                  </div>
                  <span className={`font-mono font-bold ${result.elo_change >= 0 ? 'text-success' : 'text-danger'}`}>
                    {result.elo_change > 0 ? '+' : ''}{result.elo_change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {(!games || games.length === 0) && (
          <div className="text-center opacity-50 font-mono py-12">No games recorded yet.</div>
        )}
      </div>
    </main>
  )
}
