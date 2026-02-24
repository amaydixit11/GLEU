'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Player = { id: string; name: string; os_ordinal: number }
type MatrixData = Record<string, Record<string, { wins: number; losses: number; ties: number }>>
type SummaryData = Record<string, { wins: number; losses: number; ties: number }>

export default function GlobalMatrixViewer({
  initialPlayers,
  matrix,
  summary
}: {
  initialPlayers: Player[]
  matrix: MatrixData
  summary: SummaryData
}) {
  const [sortBy, setSortBy] = useState<'rating' | 'games' | 'winrate'>('rating')

  const players = [...initialPlayers].sort((a, b) => {
    if (sortBy === 'rating') return (b.os_ordinal || 0) - (a.os_ordinal || 0)

    const sumA = summary[a.id]
    const sumB = summary[b.id]
    const gA = sumA.wins + sumA.losses + sumA.ties
    const gB = sumB.wins + sumB.losses + sumB.ties

    if (sortBy === 'games') {
      return gB - gA
    }
    
    if (sortBy === 'winrate') {
      const wrA = gA > 0 ? sumA.wins / gA : 0
      const wrB = gB > 0 ? sumB.wins / gB : 0
      if (Math.abs(wrB - wrA) < 0.001) return gB - gA
      return wrB - wrA
    }
    
    return 0
  })

  const getCellStyles = (wins: number, losses: number) => {
    if (wins === 0 && losses === 0) return { backgroundColor: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.2)' }
    const total = wins + losses
    const winRate = wins / total
    
    if (winRate === 0.5) return { backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }

    // Heatmap intensity: distance from 50%
    // At 51%, opacity is ~0.15. At 100%, opacity is ~0.8
    const intensity = 0.15 + (Math.abs(winRate - 0.5) / 0.5) * 0.65

    if (winRate > 0.5) {
      return { backgroundColor: `rgba(34, 197, 94, ${intensity})`, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }
    } else {
      return { backgroundColor: `rgba(239, 68, 68, ${intensity})`, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-end border-b border-foreground/20 pb-4 flex-wrap gap-4">
        <div className="text-sm font-mono opacity-80">
          Row player's stats against Column player.<br/>
          <span className="text-uno-green font-bold">Green: Winning Head-to-Head</span> | <span className="text-uno-red font-bold">Red: Losing</span>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-2 border border-foreground/10 text-xs font-mono uppercase">
          <span className="opacity-50">Sort By:</span>
          {['rating', 'winrate', 'games'].map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s as any)}
              className={cn(
                "px-2 py-1 font-bold transition-colors",
                sortBy === s ? "bg-uno-yellow text-black" : "hover:bg-white/10"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto shadow-[4px_4px_0px_0px_var(--uno-yellow)] border border-foreground/20 bg-background">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr>
              <th className="p-3 border-b-2 border-r-2 border-foreground/20 bg-background sticky left-0 z-20 w-40 drop-shadow-md">
                <div className="text-[10px] uppercase font-mono opacity-50 tracking-wider">Player</div>
              </th>
              {players.map(p => (
                <th key={p.id} className="p-2 border-b-2 border-foreground/20 text-center w-20 bg-white/5">
                  <div className="flex flex-col items-center justify-end h-full">
                    <span className="text-[10px] opacity-50 font-mono mb-1">{p.os_ordinal}</span>
                    <Link href={`/player/${p.id}`} className="hover:text-uno-yellow transition-colors font-mono text-xs font-bold truncate block w-full">
                      {p.name}
                    </Link>
                  </div>
                </th>
              ))}
              <th className="p-3 border-b-2 border-l-2 border-foreground/20 text-center w-24 bg-white/5">
                <div className="text-[10px] uppercase font-mono opacity-80 tracking-wider">Overall Rate</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map(p1 => {
              const sum = summary[p1.id]
              const totalGames = sum.wins + sum.losses + sum.ties
              const overallWr = totalGames > 0 ? sum.wins / totalGames : 0

              return (
                <tr key={p1.id} className="hover:bg-white/5 transition-colors group/row">
                  <th className="p-3 border-r-2 border-b border-foreground/20 bg-background sticky left-0 z-10 w-40 drop-shadow-md flex items-center justify-between">
                    <Link href={`/player/${p1.id}`} className="hover:text-uno-yellow transition-colors font-mono text-sm font-bold truncate">
                      {p1.name}
                    </Link>
                  </th>
                  
                  {players.map(p2 => {
                    if (p1.id === p2.id) {
                      return <td key={p2.id} className="p-0 border-b border-foreground/20 bg-[url('/diagonal-stripes.png')] bg-white/5" />
                    }

                    const stats = matrix[p1.id][p2.id]
                    const total = stats.wins + stats.losses
                    const hasPlayed = total > 0

                    return (
                      <td 
                        key={p2.id} 
                        className="p-0 border-b border-foreground/20 relative group/cell"
                      >
                        <Link 
                          href={`/rivalry?p1=${p1.id}&p2=${p2.id}`}
                          className="flex flex-col items-center justify-center p-2 h-14 w-full transition-all hover:scale-110 hover:z-30 hover:shadow-xl relative"
                          style={getCellStyles(stats.wins, stats.losses)}
                        >
                          {hasPlayed ? (
                            <>
                              <div className="text-sm font-mono font-black">{Math.round((stats.wins / total) * 100)}%</div>
                              <div className="text-[9px] font-mono opacity-80 font-bold tracking-wider">{stats.wins}W - {stats.losses}L</div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-white/20" /></div>
                          )}
                        </Link>
                      </td>
                    )
                  })}

                  {/* Summary Column */}
                  <td className="p-3 border-l-2 border-b border-foreground/20 bg-background text-center">
                    <div className="flex flex-col items-center">
                      <span className={cn("text-sm font-mono font-bold", overallWr > 0.5 ? "text-uno-green" : overallWr < 0.5 ? "text-uno-red" : "text-white")}>
                        {totalGames > 0 ? Math.round(overallWr * 100) + '%' : '-'}
                      </span>
                      <span className="text-[9px] font-mono opacity-50 uppercase mt-0.5">{totalGames} Games</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
