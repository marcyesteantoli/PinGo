-- Soft-delete support: a collaborator who leaves a trip keeps their row (status='left')
-- so their historical expenses/splits remain attributable, instead of vanishing from
-- balance calculations. joined_at lets leave_trip() pick the next owner deterministically.

ALTER TABLE public.trip_collaborators
  ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'left')),
  ADD COLUMN joined_at timestamptz NOT NULL DEFAULT now();
