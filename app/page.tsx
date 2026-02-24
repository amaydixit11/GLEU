import Link from 'next/link'
import Leaderboard from '@/components/Leaderboard'
import { Plus, History, Swords, Grid } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 space-y-8">
      <header className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 mb-8 md:mb-12 text-center md:text-left">
        <div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase glitch-text text-uno-red drop-shadow-[4px_4px_0px_rgba(255,255,255,0.2)]">
            UNO No Mercy
          </h1>
          <p className="font-mono text-uno-yellow uppercase tracking-widest mt-2 font-bold text-sm md:text-base">
            The Desperate Ranking System
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 w-full md:flex md:flex-row md:w-auto">
          <Link 
            href="/add-game" 
            className="flex flex-col md:flex-row items-center justify-center gap-2 bg-uno-blue text-white font-bold p-3 md:py-4 md:px-6 hover:bg-uno-blue/80 transition-all transform hover:scale-105 uppercase font-mono shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] text-xs md:text-base text-center"
          >
            <Plus size={20} className="md:w-6 md:h-6" />
            Log Game
          </Link>
          <Link 
            href="/history" 
            className="flex flex-col md:flex-row items-center justify-center gap-2 border-2 border-uno-yellow text-uno-yellow font-bold p-3 md:py-4 md:px-6 hover:bg-uno-yellow hover:text-black transition-all transform hover:scale-105 uppercase font-mono text-xs md:text-base text-center"
          >
            <History size={20} className="md:w-6 md:h-6" />
            History
          </Link>
          <div className="col-span-2 grid grid-cols-2 gap-3 md:flex md:flex-row md:gap-4 md:col-span-1">
            <Link 
              href="/rivalry" 
              className="flex flex-col md:flex-row items-center justify-center gap-2 border-2 border-uno-red text-uno-red font-bold p-3 md:py-4 md:px-6 hover:bg-uno-red hover:text-white transition-all transform hover:scale-105 uppercase font-mono text-xs md:text-base text-center"
            >
              <Swords size={20} className="md:w-6 md:h-6" />
              1v1 Stats
            </Link>
            <Link 
              href="/global-rivalry" 
              className="flex flex-col md:flex-row items-center justify-center gap-2 border-2 border-uno-green text-uno-green font-bold p-3 md:py-4 md:px-6 hover:bg-uno-green hover:text-black transition-all transform hover:scale-105 uppercase font-mono text-xs md:text-base text-center"
            >
              <Grid size={20} className="md:w-6 md:h-6" />
              Matrix
            </Link>
          </div>
        </div>
      </header>

      <Leaderboard />

      <footer className="max-w-4xl mx-auto pt-12 text-center font-mono text-xs opacity-30 uppercase">
        System Operational • v1.0.0
      </footer>
    </main>
  )
}
