begin;

-- Apply before deploying PIN-code shipping charges. Existing orders stay unchanged.
create table if not exists public.shipping_settings (
  id boolean primary key default true check (id = true),
  default_amount numeric(10,2) not null default 0 check (default_amount between 0 and 100000)
);
insert into public.shipping_settings (id, default_amount) values (true, 0) on conflict (id) do nothing;

create table if not exists public.shipping_pin_rates (
  id uuid primary key default gen_random_uuid(),
  region text not null check (length(trim(region)) between 1 and 100),
  pin_from integer not null check (pin_from between 100000 and 999999),
  pin_to integer not null check (pin_to between 100000 and 999999 and pin_to >= pin_from),
  amount numeric(10,2) not null default 0 check (amount between 0 and 100000),
  active boolean not null default true,
  exclude using gist (int4range(pin_from, pin_to, '[]') with &&) where (active)
);
alter table public.shipping_settings enable row level security;
alter table public.shipping_pin_rates enable row level security;
-- Server actions use service_role after explicit authorization. No browser writes.
revoke all on public.shipping_settings, public.shipping_pin_rates from anon, authenticated;
grant all on public.shipping_settings, public.shipping_pin_rates to service_role;

insert into public.shipping_pin_rates (region, pin_from, pin_to, amount) values
('Bengaluru',560001,560110,0), ('Mysuru',570001,570026,0),
('Mangaluru',575001,575030,0), ('Hubballi-Dharwad',580001,580032,0),
('Belagavi',590001,590020,0), ('Shivamogga',577201,577227,0),
('Tumakuru',572101,572140,0), ('Davanagere',577001,577006,0),
('Ballari',583101,583104,0), ('Vijayapura',586101,586213,0)
on conflict do nothing;

alter table public.orders add column if not exists shipping_amount numeric(10,2) not null default 0 check (shipping_amount >= 0);

commit;
