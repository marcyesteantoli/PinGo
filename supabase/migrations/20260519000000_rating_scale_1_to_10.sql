-- Scale experience ratings from 1-5 to 1-10
ALTER TABLE experience_ratings DROP CONSTRAINT IF EXISTS experience_ratings_rating_check;

UPDATE experience_ratings SET rating = rating * 2;

ALTER TABLE experience_ratings
  ADD CONSTRAINT experience_ratings_rating_check CHECK (rating BETWEEN 1 AND 10);
