-- Hotel site backend. Run this ONCE in Supabase: SQL Editor > New query > paste > Run.

create table if not exists public.site_config (
  id int primary key check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.site_config enable row level security;
alter table public.admins enable row level security;   -- no policies: only the SQL editor / service role can touch it

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create policy "site_config is public to read" on public.site_config for select using (true);
create policy "site_config is public to update" on public.site_config for update using (true) with check (true);
create policy "site_config is public to insert" on public.site_config for insert with check (true);

-- Starting content (taken from your current site). Edit it later in the Admin panel.
insert into public.site_config (id, data) values (1, $json${
  "hotel": {
    "name": "Hotel Shyadri",
    "tagline": "Stay · Dine · Relax",
    "phone": ""
  },
  "wifi": {
    "name": "Shyadri_Guest",
    "pass": "welcome123"
  },
  "review": "https://www.google.com/search?q=Hotel+Shyadri+reviews",
  "rules": [
    "Check-out time is 11:00 AM.",
    "Quiet hours after 10:00 PM.",
    "No smoking inside rooms.",
    "A valid photo ID is required for every guest.",
    "Please keep your room key safe."
  ],
  "menu": [
    {
      "cat": "Snacks",
      "items": [
        {
          "id": "a1",
          "n": "Kothimbir Vadi",
          "p": "100",
          "d": "Crispy coriander fritters",
          "v": true,
          "a": true
        },
        {
          "id": "a2",
          "n": "Misal Pav",
          "p": "90",
          "d": "Spicy sprout curry with pav",
          "v": true,
          "a": true
        },
        {
          "id": "a3",
          "n": "Chicken Sukka",
          "p": "240",
          "d": "Dry masala chicken",
          "v": false,
          "a": true
        }
      ]
    },
    {
      "cat": "Meals",
      "items": [
        {
          "id": "b1",
          "n": "Veg Thali",
          "p": "180",
          "d": "Roti, rice, dal, 2 sabzi, sweet",
          "v": true,
          "a": true
        },
        {
          "id": "b2",
          "n": "Fish Thali",
          "p": "320",
          "d": "Fish curry, fry, rice, solkadhi",
          "v": false,
          "a": true
        },
        {
          "id": "b3",
          "n": "Paneer Butter Masala",
          "p": "240",
          "d": "Creamy tomato gravy",
          "v": true,
          "a": true
        }
      ]
    },
    {
      "cat": "Drinks",
      "items": [
        {
          "id": "c1",
          "n": "Masala Chai",
          "p": "20",
          "d": "",
          "v": true,
          "a": true
        },
        {
          "id": "c2",
          "n": "Solkadhi",
          "p": "50",
          "d": "Kokum and coconut milk cooler",
          "v": true,
          "a": true
        },
        {
          "id": "c3",
          "n": "Kokum Sarbat",
          "p": "60",
          "d": "Cool and tangy",
          "v": true,
          "a": false
        }
      ]
    }
  ],
  "notices": [
    {
      "id": "n1",
      "t": "स्वागत आहे! Welcome. Dinner is served until 10:30 PM.",
      "time": "Sample notice"
    }
  ],
  "order": {
    "on": true,
    "food": {
      "wa": "919623004864",
      "sms": ""
    },
    "desk": {
      "wa": "918956364864",
      "sms": ""
    }
  },
  "toil": [
    {
      "id": "t1",
      "n": "Toothbrush & paste kit",
      "p": "",
      "a": true
    },
    {
      "id": "t2",
      "n": "Soap",
      "p": "",
      "a": true
    },
    {
      "id": "t3",
      "n": "Shampoo sachet",
      "p": "",
      "a": true
    },
    {
      "id": "t4",
      "n": "Extra towel",
      "p": "",
      "a": true
    },
    {
      "id": "t5",
      "n": "Extra pillow",
      "p": "",
      "a": true
    },
    {
      "id": "t6",
      "n": "Extra blanket",
      "p": "",
      "a": true
    },
    {
      "id": "t7",
      "n": "Comb",
      "p": "",
      "a": true
    },
    {
      "id": "t8",
      "n": "Shaving kit",
      "p": "",
      "a": true
    },
    {
      "id": "t9",
      "n": "Slippers",
      "p": "",
      "a": true
    }
  ]
}$json$::jsonb)
on conflict (id) do nothing;

-- AFTER you create your admin user in Authentication > Users, run this (change the email):
-- insert into public.admins (user_id) select id from auth.users where email = 'YOUR_ADMIN_EMAIL';
