-- ============================================================================
-- Wedding Planner — party-based planning import
--
-- One-time import of the couple's spreadsheet (A TÁBLÁZAT - E&H.xlsx):
--   * 154 invitation groups / 309 people
--   * 20 round tables x 10 chairs
--   * 19 vendors
--   * 3 budget line items (deposits) incl. payment references
--
-- Safe to run on the current empty project. Every INSERT is guarded, so
-- running the file twice does not duplicate anything. The spreadsheet itself
-- is never changed.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. New columns for party invitations, vendors and deposits
-- ----------------------------------------------------------------------------
alter table public.guests
  add column if not exists party_size integer not null default 1,
  add column if not exists side text not null default 'shared',
  add column if not exists category text not null default 'friends',
  add column if not exists notes text,
  add column if not exists invite_sent boolean not null default false,
  add column if not exists invite_reminder boolean not null default false,
  add column if not exists invite_type text,
  add column if not exists confirmed_count integer;

alter table public.guests
  drop constraint if exists guests_party_size_check;
alter table public.guests
  add constraint guests_party_size_check check (party_size > 0);

alter table public.guests
  drop constraint if exists guests_confirmed_count_check;
alter table public.guests
  add constraint guests_confirmed_count_check
  check (confirmed_count is null or confirmed_count >= 0);

alter table public.vendors
  add column if not exists handled_by text,
  add column if not exists link text,
  add column if not exists offer_requested boolean not null default false,
  add column if not exists offer_summary text,
  add column if not exists price_note text,
  add column if not exists notes text,
  add column if not exists agreed boolean not null default false;

alter table public.budget
  add column if not exists quantity numeric(10, 2),
  add column if not exists unit_price numeric(12, 2),
  add column if not exists vendor_name text,
  add column if not exists notes text,
  add column if not exists payment_method text,
  add column if not exists payment_reference text;

alter table public.rsvp_submissions
  add column if not exists party_size integer not null default 1;

alter table public.rsvp_submissions
  drop constraint if exists rsvp_submissions_party_size_check;
alter table public.rsvp_submissions
  add constraint rsvp_submissions_party_size_check check (party_size > 0);

create index if not exists guests_side_idx on public.guests (side);
create index if not exists guests_category_idx on public.guests (category);

-- ----------------------------------------------------------------------------
-- 2. Guest list — one row per invitation group
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.guests) then
    insert into public.guests
      (name, party_size, side, category, rsvp_status, invite_sent,
       invite_reminder, email, phone, notes)
    values
      ('Szülők - E', 2, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Ida mama + Tata', 2, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Krisztináék', 4, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Kelemen Gyula', 2, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Kelemen Árpi', 3, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Kiss Brigi (2/4)', 2, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Buba néni', 1, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Bozesan Melinda', 3, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Babika', 1, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Feri bácsi', 1, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Andi + Karcsi', 2, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Anca + Ana', 2, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Józsika', 2, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Henter csaba', 3, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Bözse + Willy', 2, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Aranka + Lajcsi', 2, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Andras', 2, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Carmenek (2/4)', 2, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Orsiék', 2, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Cami', 2, 'eszter', 'family', 'pending', false, false, null, null, null),
      ('Hodor család', 2, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Szabó Zoltán', 2, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Köble család', 2, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Kakucs család', 2, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Kakucs Orsi', 2, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Kakucs Huni', 2, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Szőcs Jocó', 2, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Szőcs Boró', 2, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Szőcs Tamás', 2, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Walter Isti', 2, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Walter Zsolti', 2, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Hegedűs Zsolti', 2, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Lehel + Kinga', 2, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Zolyómiék', 2, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Ruszki', 3, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Judithék', 2, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Ildikóék', 2, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Gabikáék', 4, 'eszter', 'family_friends', 'pending', false, false, null, null, null),
      ('Varga Kitty + Gáspi', 2, 'eszter', 'friends', 'pending', false, false, null, null, null),
      ('Urkon Krisztina', 1, 'eszter', 'friends', 'pending', false, false, null, null, null),
      ('Szilagyi Dorka + Gyula', 2, 'eszter', 'friends', 'pending', false, false, null, null, null),
      ('György Kinga', 1, 'eszter', 'friends', 'pending', false, false, null, null, null),
      ('Demeter-Kocsis Bogi + Szabi', 2, 'eszter', 'friends', 'pending', false, false, null, null, null),
      ('Oltean Annamária + Gyuri', 2, 'eszter', 'friends', 'pending', false, false, null, null, null),
      ('Hodor Adrienn + Jens', 2, 'eszter', 'friends', 'pending', false, false, null, null, null),
      ('Hodor Zsuzsi + Péter', 2, 'eszter', 'friends', 'pending', false, false, null, null, null),
      ('Szekernyés Peti', 1, 'eszter', 'friends', 'pending', false, false, null, null, null),
      ('Köble Nóra', 1, 'eszter', 'friends', 'pending', false, false, null, null, null),
      ('Gere Editke + Pista ?', 2, 'eszter', 'friends', 'pending', false, false, null, null, null),
      ('Székely Noémi', 1, 'eszter', 'friends', 'pending', false, false, null, null, null),
      ('Budik Kriszta +  Ádám', 2, 'eszter', 'friends', 'pending', false, false, null, null, null),
      ('Csiszér Ágota', 1, 'eszter', 'friends', 'pending', false, false, null, null, null),
      ('Fischer Anna + Dávid', 2, 'eszter', 'friends', 'pending', false, false, null, null, null),
      ('Krika Orsolya', 1, 'eszter', 'friends', 'pending', false, false, null, null, null),
      ('Szülők - H', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Dávid + Róza', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Mami', 1, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Szovátai Mama + Tata', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Kiss Jani + Eni', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Kiss Boglárka', 1, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Kiss Botond', 1, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Ilus + Pista', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Grama Család', 3, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Gyulus', 1, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Gyuri bátyja + Erzsi', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Ilon + Tibi', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Molnár Annamária + Feri', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Bocsárdi család', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Bocsárdi Zsófi', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Bocsárdi Marci', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Bocsárdi Gergő + Marjo', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Bocsárdi Levente', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Laki család', 3, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Laki Anna', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Laki Balázs', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Laki Dávid + Timi', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Szász Sándor', 4, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Magyari Márton', 5, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Végh család', 4, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Albikáék', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Betti', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Anita', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Szász Kati', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Szoniék', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Dalma', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Szász Jancsi', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Szász Levente', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Szász Ibolya', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Bandi Andi', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Szabó Szilárd', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Szabó Dorottya', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Szabó testvér', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Magyari Salamon Éva', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Szigethy Imola', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Szász Márta', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Szász Jancsi 2', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Kelemen Kinga', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Szász Attila', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Szász Sándor', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Szigeti Enikő', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Hajni (Déva)', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Ildiék', 4, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Ella + Domi', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Zsombiék', 3, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Balázsék', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Tibiék', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Barni', 1, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Bartus Attila', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Zsuzsiek', 3, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Piriék', 2, 'huni', 'family', 'pending', false, false, null, null, null),
      ('Budik család', 2, 'huni', 'family_friends', 'pending', false, false, null, null, null),
      ('Budik Szabolcs', 2, 'huni', 'family_friends', 'pending', false, false, null, null, null),
      ('Dobos család', 3, 'huni', 'family_friends', 'pending', false, false, null, null, null),
      ('Domokos család', 4, 'huni', 'family_friends', 'pending', false, false, null, null, null),
      ('Ferenczi család', 4, 'huni', 'family_friends', 'pending', false, false, null, null, null),
      ('Székely Ilonka', 1, 'huni', 'family_friends', 'pending', false, false, null, null, null),
      ('Székely Sanyi', 1, 'huni', 'family_friends', 'pending', false, false, null, null, null),
      ('Lóriék', 2, 'huni', 'family_friends', 'pending', false, false, null, null, null),
      ('Florinék', 2, 'huni', 'family_friends', 'pending', false, false, null, null, null),
      ('Alinaék', 2, 'huni', 'family_friends', 'pending', false, false, null, null, null),
      ('Loredanaék', 2, 'huni', 'family_friends', 'pending', false, false, null, null, null),
      ('Monaék', 3, 'huni', 'family_friends', 'pending', false, false, null, null, null),
      ('Navratil Gabi', 2, 'huni', 'family_friends', 'pending', false, false, null, null, null),
      ('Hatos Attila +  Niki', 2, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Simon Róbert + Brigi', 2, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Kovács Ákos + Adrienn', 2, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Incze Gáspár', 1, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Dávid Soma + Noémi', 2, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Tőkés Bence + Boró', 2, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Török István +', 2, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Kolcsár Gedeon', 2, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Székely Adrienn', 1, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Szász Tamás + Beácska', 2, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Lázár Balázs + Bogica', 2, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Piras Giorgia', 1, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Günther Nahrich Nyeko +  Laura', 2, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Sinisi Sara', 1, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Acosta Laura Alvarez + Darius', 2, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Kirsanova Anna + Juan', 2, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Cardia Alessandro +', 2, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Sipos Zsuzsi', 1, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Kiss Ágó', 1, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('László Petra', 2, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Ambarus-Egyed Ágnes', 1, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Sárkány Roni', 1, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Puskás', 1, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Sándor Andi', 2, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Göllner Blanka', 2, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Ungvári Bence', 1, 'huni', 'friends', 'pending', false, false, null, null, null),
      ('Zenekar', 5, 'shared', 'staff', 'pending', false, false, null, null, null),
      ('DJ', 1, 'shared', 'staff', 'pending', false, false, null, null, null),
      ('Foto', 2, 'shared', 'staff', 'pending', false, false, null, null, null),
      ('Video', 2, 'shared', 'staff', 'pending', false, false, null, null, null),
      ('CM', 1, 'shared', 'staff', 'pending', false, false, null, null, null);
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- 3. Seating plan — 20 tables with 10 chairs each
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.seating_tables) then
    insert into public.seating_tables (table_number, capacity)
    values
      (1, 10),
      (2, 10),
      (3, 10),
      (4, 10),
      (5, 10),
      (6, 10),
      (7, 10),
      (8, 10),
      (9, 10),
      (10, 10),
      (11, 10),
      (12, 10),
      (13, 10),
      (14, 10),
      (15, 10),
      (16, 10),
      (17, 10),
      (18, 10),
      (19, 10),
      (20, 10);
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- 4. Vendors — category, contact, offer, price note and agreement
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.vendors) then
    insert into public.vendors
      (category, name, contact_info, handled_by, link, offer_requested,
       offer_summary, price_note, notes, agreed, status)
    values
      ('Helyszín', 'Teleki kastély', 'Diavolo', null, null, true, '?', '?', '*5000 RON előleg', true, 'booked'),
      ('Zene', 'Project X', 'Nagy Misi', 'Huni', null, true, 'Zenekar + Sax?', '15000 + 2500 RON', '*1000 RON előleg', true, 'booked'),
      ('Zene', 'Dinamik', 'Bereczki Szili', 'Huni', null, true, 'zenekar + DJ (?)', '9000 RON + 1000 RON', null, false, 'contacted'),
      ('Zene', 'Melamour', null, 'Eszter', null, false, null, null, null, false, 'researching'),
      ('Zene', 'AKS', 'Ákoska', 'Huni', null, true, null, '650.0', null, true, 'booked'),
      ('Fotó', 'Bereczky Sándor', null, 'Huni', null, true, '?', '€1300-1500', null, false, 'contacted'),
      ('Fotó', 'Kocsis Zalán', null, 'Huni', null, false, null, null, null, false, 'researching'),
      ('Fotó', 'Lukácsi Alpár', null, 'Huni', null, true, 'Foto', '?', null, false, 'contacted'),
      ('Videó', 'Farczádi Ferenc', null, 'Huni', null, true, 'Video', '€1500-1800', null, false, 'contacted'),
      ('Videó', 'Scheitli Dávid', null, 'Huni', null, true, 'Video', '750.0', null, true, 'booked'),
      ('Ceremóniamester', 'Farczádi Attila', null, null, null, false, null, null, 'uncsi', false, 'researching'),
      ('Ceremóniamester', 'Berencsy Martin', null, 'Dávid', null, false, null, null, null, false, 'researching'),
      ('Ceremóniamester', 'Ceremony host (to confirm)', null, 'Eszter', null, false, null, null, null, false, 'researching'),
      ('Candy bar', 'Ramona', null, null, null, true, null, null, null, true, 'booked'),
      ('Candy bar', 'Joffre', null, null, null, false, null, null, null, false, 'researching'),
      ('Candy bar', 'Magic', null, null, null, false, null, null, null, false, 'researching'),
      ('Tiramisu', 'Cheesecake House', null, null, 'https://thecheesecakehouse.ro/candy-bar', false, null, '~5500 RON', null, false, 'researching'),
      ('Tiramisu', 'Artisan', null, null, 'https://www.cofetaria-artizan.ro/info-evenimente/', false, null, null, null, false, 'researching'),
      ('Tiramisu', 'Ramona/Nova Cake', null, null, null, true, null, null, null, true, 'booked');
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- 5. Budget — the three deposits, with payment references
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.budget) then
    insert into public.budget
      (category, item, estimated_cost, estimated_currency, actual_cost,
       actual_currency, paid, quantity, unit_price, vendor_name, notes,
       payment_method, payment_reference)
    values
      ('venue', 'Előleg', 5000.00, 'RON', 5000.00, 'RON', true, 1.00, 5000.00, 'Diavolo', null, 'Utalás', 'payment_proof_Factura_Avans_Castel_Moments.pdf'),
      ('music', 'Előleg', 1000.00, 'RON', 1000.00, 'RON', true, 1.00, 1000.00, 'Project X', null, 'Utalás', 'payment_proof_- Projekt_X.pdf'),
      ('music', 'Előleg', 1800.00, 'RON', 1800.00, 'RON', false, 1.00, 1800.00, 'DJ AKS', null, 'Utalás', null);
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- 6. Realtime and RLS are already set up by schema.sql. Done.
-- ----------------------------------------------------------------------------
