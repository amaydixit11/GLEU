-- ============================================================
-- MIGRATION: Add OpenSkill + WHR rating columns
-- Run this in Supabase SQL Editor
-- ============================================================

-- OpenSkill columns on players (mu/sigma Bayesian model)
ALTER TABLE players ADD COLUMN IF NOT EXISTS os_mu REAL DEFAULT 25;
ALTER TABLE players ADD COLUMN IF NOT EXISTS os_sigma REAL DEFAULT 8.333;
ALTER TABLE players ADD COLUMN IF NOT EXISTS os_ordinal INTEGER DEFAULT 0;

-- WHR column on players
ALTER TABLE players ADD COLUMN IF NOT EXISTS whr_rating INTEGER DEFAULT 1000;

-- OpenSkill columns on game_results
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS os_before INTEGER;
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS os_after INTEGER;
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS os_change INTEGER;

-- WHR columns on game_results
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS whr_before INTEGER;
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS whr_after INTEGER;
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS whr_change INTEGER;

-- Set defaults for existing players
UPDATE players SET os_mu = 25, os_sigma = 8.333, os_ordinal = 0 WHERE os_mu IS NULL;
UPDATE players SET whr_rating = 1000 WHERE whr_rating IS NULL;

-- Verify
SELECT name, initial_elo, cf_rating, os_ordinal, whr_rating FROM players ORDER BY initial_elo DESC;
