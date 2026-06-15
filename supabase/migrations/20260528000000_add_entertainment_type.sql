-- Add 'entertainment' as valid type for experiences and wishlist_items

ALTER TABLE experiences
  DROP CONSTRAINT IF EXISTS experiences_type_check,
  ADD CONSTRAINT experiences_type_check
    CHECK (type IN ('transport', 'accommodation', 'activity', 'restaurant', 'entertainment', 'other'));

ALTER TABLE wishlist_items
  DROP CONSTRAINT IF EXISTS wishlist_items_type_check,
  ADD CONSTRAINT wishlist_items_type_check
    CHECK (type IN ('city', 'restaurant', 'activity', 'accommodation', 'entertainment', 'other'));
