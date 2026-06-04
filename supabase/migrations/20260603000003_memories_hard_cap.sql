-- Hard cap: max 150 memories per trip regardless of premium status.
-- App-level soft cap (50 for free users) is enforced in the application layer.
create or replace function check_memories_per_trip()
returns trigger as $$
begin
  if (select count(*) from memories where trip_id = NEW.trip_id) >= 150 then
    raise exception 'trip_memories_limit_reached' using errcode = 'P0001';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger memories_per_trip_limit
  before insert on memories
  for each row
  execute function check_memories_per_trip();
