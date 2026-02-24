-- ============================================================
-- MIGRATION: Add CF (Codeforces-style) rating columns
-- Run this FIRST in Supabase SQL Editor before using the new feature
-- ============================================================

-- Add CF rating to players (default 1000, same as Elo start)
ALTER TABLE players ADD COLUMN IF NOT EXISTS cf_rating INTEGER DEFAULT 1000;
UPDATE players SET cf_rating = 1000 WHERE cf_rating IS NULL;

-- Add CF tracking columns to game_results
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS cf_before INTEGER;
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS cf_after INTEGER;
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS cf_change INTEGER;

-- Enable update policy on game_results (needed for recalculation)
-- Drop first in case it already exists (idempotent)
DROP POLICY IF EXISTS "Enable update for all users" ON public.game_results;
CREATE POLICY "Enable update for all users" ON public.game_results 
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Verify
SELECT 'players' AS tbl, COUNT(*) AS rows, 
  COUNT(cf_rating) AS has_cf 
FROM players
UNION ALL
SELECT 'game_results', COUNT(*), COUNT(cf_before) 
FROM game_results;
