import Link from 'next/link'
import Leaderboard from '@/components/Leaderboard'
import { Plus, History } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 space-y-8">
      <header className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase glitch-text">
            Desperate <br></br>for UNO 
          </h1>
          <p className="font-mono text-accent uppercase tracking-widest mt-2">
            Official Ranking System
          </p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <Link 
            href="/add-game" 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-foreground text-background font-bold py-3 px-6 hover:bg-accent hover:text-white transition-colors uppercase font-mono border-2 border-foreground"
          >
            <Plus size={20} />
            Log Game
          </Link>
          <Link 
            href="/history" 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 border-2 border-foreground font-bold py-3 px-6 hover:bg-white/10 transition-colors uppercase font-mono"
          >
            <History size={20} />
            History
          </Link>
        </div>
      </header>

      <Leaderboard />

      <footer className="max-w-4xl mx-auto pt-12 text-center font-mono text-xs opacity-30 uppercase">
        System Operational • v1.0.0
      </footer>
    </main>
  )
}
