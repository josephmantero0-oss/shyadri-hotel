-- Hotel site backend. Run this ONCE in Supabase: SQL Editor > New query > paste > Run.

create table if not exists public.site_config (
  id int primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.site_config enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create policy "site_config is public to read" on public.site_config for select using (true);
create policy "site_config is public to update" on public.site_config for update using (true) with check (true);
create policy "site_config is public to insert" on public.site_config for insert with check (true);

-- Starting content for Hotel Shyadri (id = 1)
insert into public.site_config (id, data) values (1, $json${
  "hotel": {
    "name": "Hotel Shyadri",
    "tagline": "Stay · Dine · Relax",
    "phone": "+91 8956364864",
    "ai_info": "Welcome to Hotel Shyadri! We offer delicious authentic Maharashtrian, Malvani and Chinese dishes. Check-in is 12 PM, checkout is 11 AM."
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
      "cat": "Starters (स्टार्टर्स)",
      "items": [
        { "id": "st1", "n": "Roasted Papad (रोस्टेड पापड)", "p": "20", "d": "Crispy roasted lentil papad", "v": true, "a": true },
        { "id": "st2", "n": "Fried Papad (फ्राय पापड)", "p": "30", "d": "Deep fried crispy papad", "v": true, "a": true },
        { "id": "st3", "n": "Masala Papad (मसाला पापड)", "p": "40", "d": "Papad topped with spiced onion, tomato & fresh coriander", "v": true, "a": true },
        { "id": "st4", "n": "Paneer Chilli (पनिर चिली)", "p": "210", "d": "Tossed cottage cheese with capsicum, onion & green chillies", "v": true, "a": true },
        { "id": "st5", "n": "Paneer Crispy (पनिर क्रिस्पी)", "p": "210", "d": "Crunchy golden-fried paneer tossed in savory sauce", "v": true, "a": true },
        { "id": "st6", "n": "Veg Crispy (व्हेज क्रिस्पी)", "p": "170", "d": "Crispy fried garden vegetables in sweet-spicy glaze", "v": true, "a": true },
        { "id": "st7", "n": "Chicken Chilli (चिकन चिली)", "p": "190", "d": "Succulent chicken tossed with bell peppers & green chillies", "v": false, "a": true },
        { "id": "st8", "n": "Chicken Crispy (चिकन क्रिस्पी)", "p": "190", "d": "Shredded crispy chicken tossed in spicy Indo-Chinese sauce", "v": false, "a": true },
        { "id": "st9", "n": "Chicken Manchurian (चिकन मंच्यूरियन)", "p": "190", "d": "Classic spiced fried chicken balls in rich Manchurian sauce", "v": false, "a": true },
        { "id": "st10", "n": "Chicken 65 (चिकन ६५)", "p": "190", "d": "South-Indian style spicy crisp fried chicken with curry leaves", "v": false, "a": true },
        { "id": "st11", "n": "Prawns Crispy (प्रॉन्स क्रिस्पी)", "p": "240", "d": "Crispy golden batter fried fresh sea prawns (APS)", "v": false, "a": true },
        { "id": "st12", "n": "Prawns Chilli (प्रॉन्स चिली)", "p": "240", "d": "Fresh prawns tossed with peppers & chilli garlic sauce (APS)", "v": false, "a": true },
        { "id": "st13", "n": "Prawns Fry (प्रॉन्स फ्राय)", "p": "240", "d": "Coastal spiced pan-fried fresh prawns (APS)", "v": false, "a": true }
      ]
    },
    {
      "cat": "Non-Veg Dishes (नॉनव्हेज डिशेस)",
      "items": [
        { "id": "nv1", "n": "Anda Masala (अंडा मसाला)", "p": "120", "d": "Boiled eggs simmered in rich spiced onion-tomato gravy", "v": false, "a": true },
        { "id": "nv2", "n": "Chicken Masala (चिकन मसाला)", "p": "160", "d": "Home-style spiced chicken curry in savory gravy", "v": false, "a": true },
        { "id": "nv3", "n": "Chicken Fry (चिकन फ्राय)", "p": "170", "d": "Pan-fried chicken pieces roasted with aromatic spices", "v": false, "a": true },
        { "id": "nv4", "n": "Chicken Sukha (चिकन सुखा)", "p": "170", "d": "Dry roasted chicken with coconut and Malvani masala", "v": false, "a": true },
        { "id": "nv5", "n": "Chicken Kolhapuri (चिकन कोल्हापूरी)", "p": "180", "d": "Fiery and bold Kolhapuri red gravy with chicken", "v": false, "a": true },
        { "id": "nv6", "n": "Chicken Handi Half (चिकन हांडी हाफ)", "p": "280", "d": "Clay-pot cooked chicken in creamy rich gravy (Half portion)", "v": false, "a": true },
        { "id": "nv7", "n": "Chicken Handi Full (चिकन हांडी फूल)", "p": "430", "d": "Clay-pot cooked chicken in creamy rich gravy (Full portion)", "v": false, "a": true },
        { "id": "nv8", "n": "Chicken Tikka Masala (चिकन टिक्का मसाला)", "p": "280", "d": "Charcoal grilled chicken tikka in luscious spiced gravy", "v": false, "a": true },
        { "id": "nv9", "n": "Butter Chicken Half (बटर चिकन हाफ)", "p": "290", "d": "Tender chicken in velvety buttery makhani gravy (Half)", "v": false, "a": true },
        { "id": "nv10", "n": "Butter Chicken Full (बटर चिकन फूल)", "p": "450", "d": "Tender chicken in velvety buttery makhani gravy (Full)", "v": false, "a": true },
        { "id": "nv11", "n": "Mutton Masala (मटन मसाला)", "p": "270", "d": "Tender goat meat slow-cooked in traditional fragrant gravy", "v": false, "a": true },
        { "id": "nv12", "n": "Mutton Fry (मटन फ्राय)", "p": "280", "d": "Pan-fried spiced mutton chunks with roasted garlic", "v": false, "a": true },
        { "id": "nv13", "n": "Mutton Sukha (मटन सुखा)", "p": "290", "d": "Dry roasted mutton cooked with toasted coconut & spices", "v": false, "a": true },
        { "id": "nv14", "n": "Mutton Kolhapuri (मटन कोल्हापूरी)", "p": "310", "d": "Authentic fiery red gravy mutton prepared Kolhapuri style", "v": false, "a": true }
      ]
    },
    {
      "cat": "Thalis & Meals (थाळी आणि जेवण)",
      "items": [
        { "id": "b1", "n": "Veg Thali (व्हेज थाळी)", "p": "180", "d": "Roti, rice, dal, 2 sabzi, sweet & papad", "v": true, "a": true },
        { "id": "b2", "n": "Fish Thali (मत्स्य थाळी)", "p": "320", "d": "Fish curry, fish fry, rice, bhakari/roti & solkadhi", "v": false, "a": true },
        { "id": "b3", "n": "Paneer Butter Masala (पनीर बटर मसाला)", "p": "240", "d": "Soft paneer cubes in creamy tomato and butter gravy", "v": true, "a": true }
      ]
    },
    {
      "cat": "Snacks (नाश्ता)",
      "items": [
        { "id": "sn1", "n": "Poha (पोहे)", "p": "60", "d": "Traditional warm flattened rice tempered with mustard & peanuts", "v": true, "a": true },
        { "id": "sn2", "n": "Sheera (शिरा)", "p": "100", "d": "Sweet semolina dessert made with pure ghee", "v": true, "a": true },
        { "id": "sn3", "n": "Kothimbir Vadi (कोथिंबीर वडी)", "p": "100", "d": "Crispy spiced fresh coriander fritters", "v": true, "a": true },
        { "id": "sn4", "n": "Misal Pav (मिसळ पाव)", "p": "90", "d": "Spicy sprouted bean curry served with fresh pav", "v": true, "a": true }
      ]
    },
    {
      "cat": "Drinks (पेये)",
      "items": [
        { "id": "c1", "n": "Masala Chai (मसाला चहा)", "p": "20", "d": "Freshly brewed milk tea with ginger and cardamom", "v": true, "a": true },
        { "id": "c2", "n": "Solkadhi (सोलकढी)", "p": "50", "d": "Refreshing coastal kokum & fresh coconut milk digestive drink", "v": true, "a": true },
        { "id": "c3", "n": "Kokum Sarbat (कोकम सरबत)", "p": "60", "d": "Cool and tangy traditional kokum cooler", "v": true, "a": true }
      ]
    }
  ],
  "notices": [
    {
      "id": "n1",
      "t": "स्वागत आहे! Welcome to Hotel Shyadri. Lunch is served from 12:00 PM to 3:30 PM, Dinner till 10:30 PM.",
      "time": "Notice"
    }
  ],
  "order": {
    "on": true,
    "food": { "wa": "918956364864", "sms": "" },
    "desk": { "wa": "918956364864", "sms": "" }
  },
  "toil": [
    { "id": "t1", "n": "Toothbrush & paste kit", "p": "", "a": true },
    { "id": "t2", "n": "Soap", "p": "", "a": true },
    { "id": "t3", "n": "Shampoo sachet", "p": "", "a": true },
    { "id": "t4", "n": "Extra towel", "p": "", "a": true },
    { "id": "t5", "n": "Extra pillow", "p": "", "a": true },
    { "id": "t6", "n": "Extra blanket", "p": "", "a": true },
    { "id": "t7", "n": "Comb", "p": "", "a": true },
    { "id": "t8", "n": "Shaving kit", "p": "", "a": true },
    { "id": "t9", "n": "Slippers", "p": "", "a": true }
  ],
  "pw": "f549436ca88326a9ab1dd189c8f26e20ee3e357cdcc5a8138a0d38af222f5d7e"
}$json$::jsonb)
on conflict (id) do update set data = excluded.data, updated_at = now();
