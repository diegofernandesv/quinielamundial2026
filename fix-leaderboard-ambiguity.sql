-- Fix 1: Ambiguous column 'id' in recalculate_leaderboard CTE
-- The join between leaderboard_snapshots and pool_members both have 'id',
-- causing "column reference 'id' is ambiguous" error.

CREATE OR REPLACE FUNCTION recalculate_leaderboard(p_pool_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_member record;
  v_total_points numeric;
  v_exact int;
  v_correct int;
  v_made int;
  v_bonus numeric;
BEGIN
  FOR v_member IN SELECT user_id FROM pool_members WHERE pool_id = p_pool_id AND is_active = true LOOP
    SELECT
      COALESCE(SUM(p.points_earned), 0),
      COUNT(*) FILTER (WHERE p.predicted_home_goals = m.home_goals AND p.predicted_away_goals = m.away_goals AND m.status = 'finished'),
      COUNT(*) FILTER (WHERE p.predicted_result = CASE WHEN m.home_goals > m.away_goals THEN 'home' WHEN m.away_goals > m.home_goals THEN 'away' ELSE 'draw' END AND m.status = 'finished'),
      COUNT(*) FILTER (WHERE p.is_locked)
    INTO v_total_points, v_exact, v_correct, v_made
    FROM predictions p
    JOIN matches m ON m.id = p.match_id
    WHERE p.pool_id = p_pool_id AND p.user_id = v_member.user_id;

    SELECT COALESCE(total_bonus_points, 0) INTO v_bonus
    FROM bonus_predictions
    WHERE pool_id = p_pool_id AND user_id = v_member.user_id;

    INSERT INTO leaderboard_snapshots(pool_id, user_id, total_points, exact_scores, correct_results, predictions_made, bonus_points, last_calculated_at)
    VALUES (p_pool_id, v_member.user_id, COALESCE(v_total_points, 0) + COALESCE(v_bonus, 0), COALESCE(v_exact, 0), COALESCE(v_correct, 0), COALESCE(v_made, 0), COALESCE(v_bonus, 0), now())
    ON CONFLICT (pool_id, user_id) DO UPDATE SET
      previous_position = leaderboard_snapshots.position,
      total_points = excluded.total_points,
      exact_scores = excluded.exact_scores,
      correct_results = excluded.correct_results,
      predictions_made = excluded.predictions_made,
      bonus_points = excluded.bonus_points,
      last_calculated_at = excluded.last_calculated_at;
  END LOOP;

  -- Fix: use ls.id to avoid ambiguity with pool_members.id
  WITH ranked AS (
    SELECT ls.id, ROW_NUMBER() OVER (ORDER BY ls.total_points DESC, ls.exact_scores DESC, ls.correct_results DESC, pm.joined_at ASC) AS rn
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

-- Fix 2: After applying the function fix, re-run scoring and leaderboard for existing data
-- Score predictions for Mexico vs South Africa match (which has goals saved but was stuck as 'scheduled')
UPDATE matches SET status = 'finished' WHERE id = '140ea898-4d7b-41bb-abc4-bbf600cde287';

-- The trigger handle_match_finished will auto-run score_match_predictions and recalculate_leaderboard
-- If the trigger already ran above, you're done. Otherwise run manually:
-- SELECT score_match_predictions('140ea898-4d7b-41bb-abc4-bbf600cde287');
-- SELECT recalculate_leaderboard('cb0a955e-a110-49fc-bf1d-b08db91325be');
