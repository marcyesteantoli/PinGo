-- Store user's preferred locale for server-side notification copy.
-- Set by the client on sign-in and whenever the language changes.
ALTER TABLE profiles ADD COLUMN locale TEXT NOT NULL DEFAULT 'es';
