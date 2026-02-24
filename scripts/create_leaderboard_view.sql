-- View for fast leaderboard loading

DROP VIEW IF EXISTS leaderboard_stats;

CREATE VIEW leaderboard_stats AS
WITH player_counts AS (
  SELECT player_id, COUNT(*) as games_played
  FROM game_results
  GROUP BY player_id
),
latest_results AS (
  SELECT 
    player_id, 
    elo_change as recent_elo_change,
    cf_change as recent_cf_change,
    os_change as recent_os_change,
    whr_change as recent_whr_change
  FROM (
    SELECT *, ROW_NUMBER() OVER(PARTITION BY player_id ORDER BY created_at DESC) as rn
    FROM game_results
  ) sub
  WHERE rn = 1
)
SELECT 
  p.id,
  p.name,
  p.initial_elo,
  p.cf_rating,
  p.os_ordinal,
  p.whr_rating,
  COALESCE(pc.games_played, 0) as games_played,
  COALESCE(lr.recent_elo_change, 0) as recent_elo_change,
  COALESCE(lr.recent_cf_change, 0) as recent_cf_change,
  COALESCE(lr.recent_os_change, 0) as recent_os_change,
  COALESCE(lr.recent_whr_change, 0) as recent_whr_change
FROM players p
LEFT JOIN player_counts pc ON p.id = pc.player_id
LEFT JOIN latest_results lr ON p.id = lr.player_id;
