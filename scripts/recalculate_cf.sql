-- ============================================================
-- CF Rating Recalculation Script
-- Replays all games with CF-style expected rank algorithm
-- K(n) = 16 + 16*e^(-n/20), same as Elo
-- 
-- Run this AFTER migrate_cf.sql
-- ============================================================

DO $$
DECLARE
  game_rec RECORD;
  result_rec RECORD;
  other_rec RECORD;
  
  -- Player state tracking
  player_ratings JSONB := '{}'::JSONB;   -- { player_id: current_cf_rating }
  player_games JSONB := '{}'::JSONB;     -- { player_id: games_played_count }
  
  -- Per-game calculation
  cf_changes JSONB;
  player_rating NUMERIC;
  other_rating NUMERIC;
  player_k NUMERIC;
  expected_rank NUMERIC;
  p_beat NUMERIC;
  player_games_count INTEGER;
  change_val NUMERIC;
  new_rating INTEGER;
  actual_pos NUMERIC;
  
  p_record RECORD;
BEGIN
  RAISE NOTICE '🔄 Starting CF rating recalculation...';
  RAISE NOTICE '';

  -- ============================================================
  -- STEP 1: Reset all CF ratings to 1000
  -- ============================================================
  FOR p_record IN SELECT id, name FROM players LOOP
    player_ratings := player_ratings || jsonb_build_object(p_record.id::TEXT, 1000);
    player_games := player_games || jsonb_build_object(p_record.id::TEXT, 0);
  END LOOP;

  RAISE NOTICE 'Initialized % players to CF rating 1000', (SELECT COUNT(*) FROM players);

  -- ============================================================
  -- STEP 2: Process each game chronologically
  -- ============================================================
  FOR game_rec IN 
    SELECT id, played_at, total_players 
    FROM games 
    ORDER BY played_at ASC
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE '📅 Processing game % (played: %)', game_rec.id, game_rec.played_at;

    -- Reset cf_changes for this game
    cf_changes := '{}'::JSONB;

    -- ============================================================
    -- CF ALGORITHM: Expected Rank for each player
    -- expectedRank[i] = 1 + Σ(j≠i) P(j beats i)
    -- delta[i] = K * (expectedRank[i] - actualRank[i])
    -- ============================================================
    FOR result_rec IN 
      SELECT player_id, normalized_position 
      FROM game_results 
      WHERE game_id = game_rec.id
    LOOP
      player_rating := (player_ratings ->> result_rec.player_id::TEXT)::NUMERIC;
      player_games_count := (player_games ->> result_rec.player_id::TEXT)::INTEGER;
      actual_pos := result_rec.normalized_position::NUMERIC;

      -- Calculate expected rank
      expected_rank := 1;

      FOR other_rec IN 
        SELECT player_id, normalized_position 
        FROM game_results 
        WHERE game_id = game_rec.id AND player_id != result_rec.player_id
      LOOP
        other_rating := (player_ratings ->> other_rec.player_id::TEXT)::NUMERIC;
        -- P(other beats me) = 1 / (1 + 10^((my_rating - their_rating) / 400))
        p_beat := 1.0 / (1.0 + POWER(10.0, (player_rating - other_rating) / 400.0));
        expected_rank := expected_rank + p_beat;
      END LOOP;

      -- K-factor: K(n) = 16 + 16 * e^(-n/20)
      player_k := 16.0 + 16.0 * EXP(-player_games_count::NUMERIC / 20.0);

      -- Delta = K * (expectedRank - actualRank)
      change_val := ROUND(player_k * (expected_rank - actual_pos));

      cf_changes := cf_changes || jsonb_build_object(result_rec.player_id::TEXT, change_val);
    END LOOP;

    -- ============================================================
    -- UPDATE game_results and player CF ratings for this game
    -- ============================================================
    FOR result_rec IN 
      SELECT gr.id, gr.player_id, gr.normalized_position, p.name
      FROM game_results gr
      JOIN players p ON p.id = gr.player_id
      WHERE gr.game_id = game_rec.id
      ORDER BY gr.normalized_position ASC
    LOOP
      player_rating := (player_ratings ->> result_rec.player_id::TEXT)::NUMERIC;
      change_val := (cf_changes ->> result_rec.player_id::TEXT)::NUMERIC;
      new_rating := (player_rating + change_val)::INTEGER;

      -- Update game_results CF columns
      UPDATE game_results 
      SET cf_before = player_rating::INTEGER,
          cf_after = new_rating,
          cf_change = change_val::INTEGER
      WHERE id = result_rec.id;

      player_games_count := (player_games ->> result_rec.player_id::TEXT)::INTEGER;
      
      RAISE NOTICE '   % K=% CF: % → % (%)',
        RPAD(result_rec.name, 12),
        LPAD(ROUND(16.0 + 16.0 * EXP(-player_games_count::NUMERIC / 20.0), 1)::TEXT, 5),
        player_rating::INTEGER,
        new_rating,
        change_val::INTEGER;

      -- Update in-memory rating
      player_ratings := jsonb_set(player_ratings, ARRAY[result_rec.player_id::TEXT], to_jsonb(new_rating));
    END LOOP;

    -- Increment games played
    FOR result_rec IN 
      SELECT DISTINCT player_id FROM game_results WHERE game_id = game_rec.id
    LOOP
      player_games_count := (player_games ->> result_rec.player_id::TEXT)::INTEGER;
      player_games := jsonb_set(
        player_games, 
        ARRAY[result_rec.player_id::TEXT], 
        to_jsonb(player_games_count + 1)
      );
    END LOOP;

  END LOOP;

  -- ============================================================
  -- STEP 3: Update all player final CF ratings
  -- ============================================================
  RAISE NOTICE '';
  RAISE NOTICE '📊 Final CF ratings:';
  RAISE NOTICE '────────────────────────────────────────';
  
  FOR p_record IN 
    SELECT p.id, p.name, p.cf_rating AS old_cf,
           (player_ratings ->> p.id::TEXT)::INTEGER AS new_cf,
           (player_games ->> p.id::TEXT)::INTEGER AS games_count
    FROM players p
    ORDER BY (player_ratings ->> p.id::TEXT)::INTEGER DESC
  LOOP
    RAISE NOTICE '  % % → % (%) [% games]',
      RPAD(p_record.name, 12),
      COALESCE(p_record.old_cf, 1000),
      p_record.new_cf,
      CASE WHEN p_record.new_cf - COALESCE(p_record.old_cf, 1000) >= 0 
        THEN '+' || (p_record.new_cf - COALESCE(p_record.old_cf, 1000))
        ELSE (p_record.new_cf - COALESCE(p_record.old_cf, 1000))::TEXT
      END,
      p_record.games_count;

    UPDATE players SET cf_rating = p_record.new_cf WHERE id = p_record.id;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✅ CF Recalculation complete!';
END $$;
