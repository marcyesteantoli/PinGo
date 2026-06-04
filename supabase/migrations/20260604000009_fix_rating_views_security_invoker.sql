-- Fix: experience_ratings_avg and experience_attribute_ratings_avg used default
-- security definer semantics, bypassing RLS on the underlying tables.
-- Any authenticated user could query rating data for experiences they don't own.
-- security_invoker = true makes views execute as the calling user, enforcing RLS.

DROP VIEW IF EXISTS experience_ratings_avg;

CREATE VIEW experience_ratings_avg
WITH (security_invoker = true) AS
SELECT
  experience_id,
  ROUND(AVG(rating)::NUMERIC, 2) AS rating_avg,
  COUNT(*) AS rating_count
FROM experience_ratings
GROUP BY experience_id;

DROP VIEW IF EXISTS experience_attribute_ratings_avg;

CREATE VIEW experience_attribute_ratings_avg
WITH (security_invoker = true) AS
SELECT
  experience_id,
  attribute,
  ROUND(AVG(value)::NUMERIC, 1) AS avg,
  COUNT(*) AS rating_count
FROM experience_attribute_ratings
GROUP BY experience_id, attribute;
