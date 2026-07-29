-- App default language changed from 'es' to 'en'; new profiles should follow suit.
ALTER TABLE profiles ALTER COLUMN locale SET DEFAULT 'en';
