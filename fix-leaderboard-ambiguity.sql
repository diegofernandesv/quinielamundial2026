-- ============================================================
-- FIX 1: recalculate_leaderboard — ambiguous column 'id'
-- Both leaderboard_snapshots and pool_members have 'id'.
-- Use ls.id explicitly in the CTE.
-- ============================================================

CREATE OR REPLACE FUNCTION recalculate_leaderboard(p_pool_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_member record;
  v_total_points numeric;
  v_exact int;
  v_correct int;
  v_made int;
  v_bonus numeric;
BEGIN
  FOR v_member IN
    SELECT user_id FROM pool_members WHERE pool_id = p_pool_id AND is_active = true
  LOOP
    SELECT
      COALESCE(SUM(p.points_earned), 0),
      COUNT(*) FILTER (
        WHERE m.status = 'finished'
          AND p.predicted_home_goals = m.home_goals
          AND p.predicted_away_goals = m.away_goals
      ),
      COUNT(*) FILTER (
        WHERE m.status = 'finished'
          AND p.predicted_result = CASE
            WHEN m.home_goals > m.away_goals THEN 'home'
            WHEN m.away_goals > m.home_goals THEN 'away'
            ELSE 'draw'
          END
      ),
      COUNT(*) FILTER (WHERE p.is_locked)
    INTO v_total_points, v_exact, v_correct, v_made
    FROM predictions p
    JOIN matches m ON m.id = p.match_id
    WHERE p.pool_id = p_pool_id AND p.user_id = v_member.user_id;

    SELECT COALESCE(total_bonus_points, 0) INTO v_bonus
    FROM bonus_predictions
    WHERE pool_id = p_pool_id AND user_id = v_member.user_id;

    INSERT INTO leaderboard_snapshots (
      pool_id, user_id, total_points, exact_scores, correct_results,
      predictions_made, bonus_points, last_calculated_at
    )
    VALUES (
      p_pool_id, v_member.user_id,
      COALESCE(v_total_points, 0) + COALESCE(v_bonus, 0),
      COALESCE(v_exact, 0), COALESCE(v_correct, 0),
      COALESCE(v_made, 0), COALESCE(v_bonus, 0), now()
    )
    ON CONFLICT (pool_id, user_id) DO UPDATE SET
      previous_position    = leaderboard_snapshots.position,
      total_points         = excluded.total_points,
      exact_scores         = excluded.exact_scores,
      correct_results      = excluded.correct_results,
      predictions_made     = excluded.predictions_made,
      bonus_points         = excluded.bonus_points,
      last_calculated_at   = excluded.last_calculated_at;
  END LOOP;

  -- FIX: ls.id avoids ambiguity with pool_members.id
  WITH ranked AS (
    SELECT
      ls.id,
      ROW_NUMBER() OVER (
        ORDER BY ls.total_points DESC, ls.exact_scores DESC,
                 ls.correct_results DESC, pm.joined_at ASC
      ) AS rn
    FROM leaderboard_snapshots ls
    JOIN pool_members pm ON pm.pool_id = ls.pool_id AND pm.user_id = ls.user_id
    WHERE ls.pool_id = p_pool_id
  )
  UPDATE leaderboard_snapshots ls
  SET position = ranked.rn
  FROM ranked
  WHERE ls.id = ranked.id;
END;
$$;


-- ============================================================
-- FIX 2: handle_match_finished trigger — wrap in EXCEPTION block
-- so a bug in recalculate_leaderboard doesn't roll back the UPDATE.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_match_finished()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_distinct_pools uuid[];
  v_pool_id uuid;
BEGIN
  IF new.status = 'finished' AND (
    old.status != 'finished'
    OR old.home_goals IS DISTINCT FROM new.home_goals
    OR old.away_goals IS DISTINCT FROM new.away_goals
  ) THEN
    BEGIN
      PERFORM score_match_predictions(new.id);

      SELECT array_agg(DISTINCT pool_id)
        INTO v_distinct_pools
        FROM predictions
       WHERE match_id = new.id;

      IF v_distinct_pools IS NOT NULL THEN
        FOREACH v_pool_id IN ARRAY v_distinct_pools LOOP
          PERFORM recalculate_leaderboard(v_pool_id);
        END LOOP;
      END IF;

      INSERT INTO audit_logs(action, entity_type, entity_id, old_data, new_data)
      VALUES (
        'match_finished', 'match', new.id,
        jsonb_build_object('status', old.status, 'home_goals', old.home_goals, 'away_goals', old.away_goals),
        jsonb_build_object('status', new.status, 'home_goals', new.home_goals, 'away_goals', new.away_goals)
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't roll back the match update
      INSERT INTO audit_logs(action, entity_type, entity_id, old_data, new_data)
      VALUES (
        'match_finished_error', 'match', new.id,
        jsonb_build_object('status', old.status),
        jsonb_build_object('error', SQLERRM, 'status', new.status)
      );
    END;
  END IF;
  RETURN new;
END;
$$;


-- ============================================================
-- FIX 3: admin_update_match_result — atomic function for
-- setting OR reverting a match result. Called from the server
-- action with service_role, bypasses RLS via SECURITY DEFINER.
-- ============================================================

CREATE OR REPLACE FUNCTION admin_update_match_result(
  p_match_id   uuid,
  p_status     text,          -- 'scheduled' | 'live' | 'finished'
  p_home_goals int DEFAULT NULL,
  p_away_goals int DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_old_status  text;
  v_pools       uuid[];
  v_pool_id     uuid;
  v_scored      int;
BEGIN
  -- Get current status
  SELECT status INTO v_old_status FROM matches WHERE id = p_match_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Partido no encontrado');
  END IF;

  -- ── Case 1: Reverting (finished → scheduled / live) ──────────────
  IF v_old_status = 'finished' AND p_status != 'finished' THEN

    -- 1a. Get affected pools BEFORE wiping points
    SELECT array_agg(DISTINCT pool_id) INTO v_pools
    FROM predictions WHERE match_id = p_match_id;

    -- 1b. Reset predictions for this match
    UPDATE predictions
       SET points_earned = NULL,
           scored_at     = NULL,
           is_locked     = FALSE
     WHERE match_id = p_match_id;

    -- 1c. Update match (clear goals, set new status)
    UPDATE matches
       SET status      = p_status,
           home_goals  = NULL,
           away_goals  = NULL,
           updated_at  = now()
     WHERE id = p_match_id;

    -- 1d. Recalculate leaderboard for each affected pool
    IF v_pools IS NOT NULL THEN
      FOREACH v_pool_id IN ARRAY v_pools LOOP
        PERFORM recalculate_leaderboard(v_pool_id);
      END LOOP;
    END IF;

    RETURN jsonb_build_object('ok', true, 'action', 'reverted');

  -- ── Case 2: Setting / updating a finished result ──────────────────
  ELSIF p_status = 'finished' THEN

    IF p_home_goals IS NULL OR p_away_goals IS NULL THEN
      RETURN jsonb_build_object('error', 'Se requieren los goles para finalizar un partido');
    END IF;

    -- 2a. Update match
    UPDATE matches
       SET status      = 'finished',
           home_goals  = p_home_goals,
           away_goals  = p_away_goals,
           updated_at  = now()
     WHERE id = p_match_id;

    -- 2b. Score all predictions (trigger may do this too, but we do it
    --     explicitly so it always runs even if the trigger had an error)
    SELECT score_match_predictions(p_match_id) INTO v_scored;

    -- 2c. Recalculate leaderboard for all affected pools
    SELECT array_agg(DISTINCT pool_id) INTO v_pools
    FROM predictions WHERE match_id = p_match_id;

    IF v_pools IS NOT NULL THEN
      FOREACH v_pool_id IN ARRAY v_pools LOOP
        PERFORM recalculate_leaderboard(v_pool_id);
      END LOOP;
    END IF;

    RETURN jsonb_build_object('ok', true, 'action', 'scored', 'predictions_scored', v_scored);

  -- ── Case 3: scheduled / live (no scoring needed) ─────────────────
  ELSE
    UPDATE matches
       SET status     = p_status,
           updated_at = now()
     WHERE id = p_match_id;

    RETURN jsonb_build_object('ok', true, 'action', 'status_updated');
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;


-- ============================================================
-- DATA FIX (only if Mexico vs SA match is stuck in bad state)
-- Uncomment and run manually if needed:
-- ============================================================
-- SELECT admin_update_match_result(
--   '140ea898-4d7b-41bb-abc4-bbf600cde287',
--   'finished', 0, 1
-- );
