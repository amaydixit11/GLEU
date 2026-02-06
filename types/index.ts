export type Player = {
  id: string
  name: string
  initial_elo: number
  created_at: string
}

export type Game = {
  id: string
  played_at: string
  total_players: number
  created_at: string
}

export type GameResult = {
  id: string
  game_id: string
  player_id: string
  raw_positions: number[]
  normalized_position: number
  elo_before: number
  elo_after: number
  elo_change: number
  created_at: string
  player?: Player // Joined
}

export type EloChange = {
  playerId: string
  eloBefore: number
  eloAfter: number
  change: number
}
