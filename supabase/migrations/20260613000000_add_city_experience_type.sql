-- Add 'city' as valid type for experiences

ALTER TABLE experiences
  DROP CONSTRAINT IF EXISTS experiences_type_check,
  ADD CONSTRAINT experiences_type_check
    CHECK (type IN ('transport', 'accommodation', 'activity', 'restaurant', 'entertainment', 'city', 'other'));
