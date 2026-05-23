begin;

insert into tournament_groups (name, display_order)
values
  ('A', 1), ('B', 2), ('C', 3), ('D', 4), ('E', 5), ('F', 6),
  ('G', 7), ('H', 8), ('I', 9), ('J', 10), ('K', 11), ('L', 12)
on conflict (name) do update
set display_order = excluded.display_order;

merge into teams as t
using (
  values
    ('Mexico', 'MEX', '🇲🇽', 'CONCACAF'),
    ('South Africa', 'RSA', '🇿🇦', 'CAF'),
    ('South Korea', 'KOR', '🇰🇷', 'AFC'),
    ('Czechia', 'CZE', '🇨🇿', 'UEFA'),
    ('Canada', 'CAN', '🇨🇦', 'CONCACAF'),
    ('Bosnia and Herzegovina', 'BIH', '🇧🇦', 'UEFA'),
    ('Qatar', 'QAT', '🇶🇦', 'AFC'),
    ('Switzerland', 'SUI', '🇨🇭', 'UEFA'),
    ('Brazil', 'BRA', '🇧🇷', 'CONMEBOL'),
    ('Morocco', 'MAR', '🇲🇦', 'CAF'),
    ('Haiti', 'HAI', '🇭🇹', 'CONCACAF'),
    ('Scotland', 'SCO', '🏴', 'UEFA'),
    ('United States', 'USA', '🇺🇸', 'CONCACAF'),
    ('Paraguay', 'PAR', '🇵🇾', 'CONMEBOL'),
    ('Australia', 'AUS', '🇦🇺', 'AFC'),
    ('Turkiye', 'TUR', '🇹🇷', 'UEFA'),
    ('Germany', 'GER', '🇩🇪', 'UEFA'),
    ('Curacao', 'CUW', '🇨🇼', 'CONCACAF'),
    ('Cote d''Ivoire', 'CIV', '🇨🇮', 'CAF'),
    ('Ecuador', 'ECU', '🇪🇨', 'CONMEBOL'),
    ('Netherlands', 'NED', '🇳🇱', 'UEFA'),
    ('Japan', 'JPN', '🇯🇵', 'AFC'),
    ('Sweden', 'SWE', '🇸🇪', 'UEFA'),
    ('Tunisia', 'TUN', '🇹🇳', 'CAF'),
    ('Belgium', 'BEL', '🇧🇪', 'UEFA'),
    ('Egypt', 'EGY', '🇪🇬', 'CAF'),
    ('Iran', 'IRN', '🇮🇷', 'AFC'),
    ('New Zealand', 'NZL', '🇳🇿', 'OFC'),
    ('Spain', 'ESP', '🇪🇸', 'UEFA'),
    ('Cape Verde', 'CPV', '🇨🇻', 'CAF'),
    ('Saudi Arabia', 'KSA', '🇸🇦', 'AFC'),
    ('Uruguay', 'URU', '🇺🇾', 'CONMEBOL'),
    ('France', 'FRA', '🇫🇷', 'UEFA'),
    ('Senegal', 'SEN', '🇸🇳', 'CAF'),
    ('Iraq', 'IRQ', '🇮🇶', 'AFC'),
    ('Norway', 'NOR', '🇳🇴', 'UEFA'),
    ('Argentina', 'ARG', '🇦🇷', 'CONMEBOL'),
    ('Algeria', 'ALG', '🇩🇿', 'CAF'),
    ('Austria', 'AUT', '🇦🇹', 'UEFA'),
    ('Jordan', 'JOR', '🇯🇴', 'AFC'),
    ('Portugal', 'POR', '🇵🇹', 'UEFA'),
    ('Democratic Republic of Congo', 'COD', '🇨🇩', 'CAF'),
    ('Uzbekistan', 'UZB', '🇺🇿', 'AFC'),
    ('Colombia', 'COL', '🇨🇴', 'CONMEBOL'),
    ('England', 'ENG', '🏴', 'UEFA'),
    ('Croatia', 'CRO', '🇭🇷', 'UEFA'),
    ('Ghana', 'GHA', '🇬🇭', 'CAF'),
    ('Panama', 'PAN', '🇵🇦', 'CONCACAF')
) as src(name, short_name, flag_emoji, confederation)
on t.short_name = src.short_name
when matched then update set
  name = src.name,
  flag_emoji = src.flag_emoji,
  confederation = src.confederation,
  updated_at = now()
when not matched then insert (name, short_name, flag_emoji, confederation)
values (src.name, src.short_name, src.flag_emoji, src.confederation);

delete from group_teams
where group_id in (select id from tournament_groups where name between 'A' and 'L');

insert into group_teams (group_id, team_id)
select g.id, t.id
from (
  values
    ('A', 'MEX'), ('A', 'RSA'), ('A', 'KOR'), ('A', 'CZE'),
    ('B', 'CAN'), ('B', 'BIH'), ('B', 'QAT'), ('B', 'SUI'),
    ('C', 'BRA'), ('C', 'MAR'), ('C', 'HAI'), ('C', 'SCO'),
    ('D', 'USA'), ('D', 'PAR'), ('D', 'AUS'), ('D', 'TUR'),
    ('E', 'GER'), ('E', 'CUW'), ('E', 'CIV'), ('E', 'ECU'),
    ('F', 'NED'), ('F', 'JPN'), ('F', 'SWE'), ('F', 'TUN'),
    ('G', 'BEL'), ('G', 'EGY'), ('G', 'IRN'), ('G', 'NZL'),
    ('H', 'ESP'), ('H', 'CPV'), ('H', 'KSA'), ('H', 'URU'),
    ('I', 'FRA'), ('I', 'SEN'), ('I', 'IRQ'), ('I', 'NOR'),
    ('J', 'ARG'), ('J', 'ALG'), ('J', 'AUT'), ('J', 'JOR'),
    ('K', 'POR'), ('K', 'COD'), ('K', 'UZB'), ('K', 'COL'),
    ('L', 'ENG'), ('L', 'CRO'), ('L', 'GHA'), ('L', 'PAN')
) as src(group_name, short_name)
join tournament_groups g on g.name = src.group_name
join teams t on t.short_name = src.short_name
on conflict do nothing;

with match_seed as (
  select *
  from (
    values
      (1, 'group'::match_phase, 'A', 'MEX', 'RSA', null::text, 'Estadio Azteca', 'Mexico City', '2026-06-11T15:00:00-04:00'::timestamptz),
      (2, 'group'::match_phase, 'A', 'KOR', 'CZE', null::text, 'Estadio Akron', 'Guadalajara', '2026-06-11T22:00:00-04:00'::timestamptz),
      (3, 'group'::match_phase, 'B', 'CAN', 'BIH', null::text, 'BMO Field', 'Toronto', '2026-06-12T15:00:00-04:00'::timestamptz),
      (4, 'group'::match_phase, 'D', 'USA', 'PAR', null::text, 'SoFi Stadium', 'Los Angeles', '2026-06-12T21:00:00-04:00'::timestamptz),
      (5, 'group'::match_phase, 'C', 'HAI', 'SCO', null::text, 'Gillette Stadium', 'Boston', '2026-06-13T21:00:00-04:00'::timestamptz),
      (6, 'group'::match_phase, 'D', 'AUS', 'TUR', null::text, 'BC Place', 'Vancouver', '2026-06-14T00:00:00-04:00'::timestamptz),
      (7, 'group'::match_phase, 'C', 'BRA', 'MAR', null::text, 'MetLife Stadium', 'New York/New Jersey', '2026-06-13T18:00:00-04:00'::timestamptz),
      (8, 'group'::match_phase, 'B', 'QAT', 'SUI', null::text, 'Levi''s Stadium', 'San Francisco Bay Area', '2026-06-13T15:00:00-04:00'::timestamptz),
      (9, 'group'::match_phase, 'E', 'CIV', 'ECU', null::text, 'Lincoln Financial Field', 'Philadelphia', '2026-06-14T19:00:00-04:00'::timestamptz),
      (10, 'group'::match_phase, 'E', 'GER', 'CUW', null::text, 'NRG Stadium', 'Houston', '2026-06-14T13:00:00-04:00'::timestamptz),
      (11, 'group'::match_phase, 'F', 'NED', 'JPN', null::text, 'AT&T Stadium', 'Dallas', '2026-06-14T16:00:00-04:00'::timestamptz),
      (12, 'group'::match_phase, 'F', 'SWE', 'TUN', null::text, 'Estadio BBVA', 'Monterrey', '2026-06-14T22:00:00-04:00'::timestamptz),
      (13, 'group'::match_phase, 'H', 'KSA', 'URU', null::text, 'Hard Rock Stadium', 'Miami', '2026-06-15T18:00:00-04:00'::timestamptz),
      (14, 'group'::match_phase, 'H', 'ESP', 'CPV', null::text, 'Mercedes-Benz Stadium', 'Atlanta', '2026-06-15T12:00:00-04:00'::timestamptz),
      (15, 'group'::match_phase, 'G', 'IRN', 'NZL', null::text, 'SoFi Stadium', 'Los Angeles', '2026-06-15T21:00:00-04:00'::timestamptz),
      (16, 'group'::match_phase, 'G', 'BEL', 'EGY', null::text, 'Lumen Field', 'Seattle', '2026-06-15T15:00:00-04:00'::timestamptz),
      (17, 'group'::match_phase, 'I', 'FRA', 'SEN', null::text, 'MetLife Stadium', 'New York/New Jersey', '2026-06-16T15:00:00-04:00'::timestamptz),
      (18, 'group'::match_phase, 'I', 'IRQ', 'NOR', null::text, 'Gillette Stadium', 'Boston', '2026-06-16T18:00:00-04:00'::timestamptz),
      (19, 'group'::match_phase, 'J', 'ARG', 'ALG', null::text, 'Arrowhead Stadium', 'Kansas City', '2026-06-16T21:00:00-04:00'::timestamptz),
      (20, 'group'::match_phase, 'J', 'AUT', 'JOR', null::text, 'Levi''s Stadium', 'San Francisco Bay Area', '2026-06-17T00:00:00-04:00'::timestamptz),
      (21, 'group'::match_phase, 'L', 'GHA', 'PAN', null::text, 'BMO Field', 'Toronto', '2026-06-17T19:00:00-04:00'::timestamptz),
      (22, 'group'::match_phase, 'L', 'ENG', 'CRO', null::text, 'AT&T Stadium', 'Dallas', '2026-06-17T16:00:00-04:00'::timestamptz),
      (23, 'group'::match_phase, 'K', 'POR', 'COD', null::text, 'NRG Stadium', 'Houston', '2026-06-17T13:00:00-04:00'::timestamptz),
      (24, 'group'::match_phase, 'K', 'UZB', 'COL', null::text, 'Estadio Azteca', 'Mexico City', '2026-06-17T22:00:00-04:00'::timestamptz),
      (25, 'group'::match_phase, 'A', 'CZE', 'RSA', null::text, 'Mercedes-Benz Stadium', 'Atlanta', '2026-06-18T12:00:00-04:00'::timestamptz),
      (26, 'group'::match_phase, 'B', 'SUI', 'BIH', null::text, 'SoFi Stadium', 'Los Angeles', '2026-06-18T15:00:00-04:00'::timestamptz),
      (27, 'group'::match_phase, 'B', 'CAN', 'QAT', null::text, 'BC Place', 'Vancouver', '2026-06-18T18:00:00-04:00'::timestamptz),
      (28, 'group'::match_phase, 'A', 'MEX', 'KOR', null::text, 'Estadio Akron', 'Guadalajara', '2026-06-18T21:00:00-04:00'::timestamptz),
      (29, 'group'::match_phase, 'C', 'BRA', 'HAI', null::text, 'Lincoln Financial Field', 'Philadelphia', '2026-06-19T21:00:00-04:00'::timestamptz),
      (30, 'group'::match_phase, 'C', 'SCO', 'MAR', null::text, 'Gillette Stadium', 'Boston', '2026-06-19T18:00:00-04:00'::timestamptz),
      (31, 'group'::match_phase, 'D', 'TUR', 'PAR', null::text, 'Levi''s Stadium', 'San Francisco Bay Area', '2026-06-20T00:00:00-04:00'::timestamptz),
      (32, 'group'::match_phase, 'D', 'USA', 'AUS', null::text, 'Lumen Field', 'Seattle', '2026-06-19T15:00:00-04:00'::timestamptz),
      (33, 'group'::match_phase, 'E', 'GER', 'CIV', null::text, 'BMO Field', 'Toronto', '2026-06-20T16:00:00-04:00'::timestamptz),
      (34, 'group'::match_phase, 'E', 'ECU', 'CUW', null::text, 'Arrowhead Stadium', 'Kansas City', '2026-06-20T20:00:00-04:00'::timestamptz),
      (35, 'group'::match_phase, 'F', 'NED', 'SWE', null::text, 'NRG Stadium', 'Houston', '2026-06-20T13:00:00-04:00'::timestamptz),
      (36, 'group'::match_phase, 'F', 'TUN', 'JPN', null::text, 'Estadio BBVA', 'Monterrey', '2026-06-21T00:00:00-04:00'::timestamptz),
      (37, 'group'::match_phase, 'H', 'URU', 'CPV', null::text, 'Hard Rock Stadium', 'Miami', '2026-06-21T18:00:00-04:00'::timestamptz),
      (38, 'group'::match_phase, 'H', 'ESP', 'KSA', null::text, 'Mercedes-Benz Stadium', 'Atlanta', '2026-06-21T12:00:00-04:00'::timestamptz),
      (39, 'group'::match_phase, 'G', 'BEL', 'IRN', null::text, 'SoFi Stadium', 'Los Angeles', '2026-06-21T15:00:00-04:00'::timestamptz),
      (40, 'group'::match_phase, 'G', 'NZL', 'EGY', null::text, 'BC Place', 'Vancouver', '2026-06-21T21:00:00-04:00'::timestamptz),
      (41, 'group'::match_phase, 'I', 'NOR', 'SEN', null::text, 'MetLife Stadium', 'New York/New Jersey', '2026-06-22T20:00:00-04:00'::timestamptz),
      (42, 'group'::match_phase, 'I', 'FRA', 'IRQ', null::text, 'Lincoln Financial Field', 'Philadelphia', '2026-06-22T17:00:00-04:00'::timestamptz),
      (43, 'group'::match_phase, 'J', 'ARG', 'AUT', null::text, 'AT&T Stadium', 'Dallas', '2026-06-22T13:00:00-04:00'::timestamptz),
      (44, 'group'::match_phase, 'J', 'JOR', 'ALG', null::text, 'Levi''s Stadium', 'San Francisco Bay Area', '2026-06-22T23:00:00-04:00'::timestamptz),
      (45, 'group'::match_phase, 'L', 'ENG', 'GHA', null::text, 'Gillette Stadium', 'Boston', '2026-06-23T16:00:00-04:00'::timestamptz),
      (46, 'group'::match_phase, 'L', 'PAN', 'CRO', null::text, 'BMO Field', 'Toronto', '2026-06-23T19:00:00-04:00'::timestamptz),
      (47, 'group'::match_phase, 'K', 'POR', 'UZB', null::text, 'NRG Stadium', 'Houston', '2026-06-23T13:00:00-04:00'::timestamptz),
      (48, 'group'::match_phase, 'K', 'COL', 'COD', null::text, 'Estadio Akron', 'Guadalajara', '2026-06-23T22:00:00-04:00'::timestamptz),
      (49, 'group'::match_phase, 'C', 'SCO', 'BRA', null::text, 'Hard Rock Stadium', 'Miami', '2026-06-24T18:00:00-04:00'::timestamptz),
      (50, 'group'::match_phase, 'C', 'MAR', 'HAI', null::text, 'Mercedes-Benz Stadium', 'Atlanta', '2026-06-24T18:00:00-04:00'::timestamptz),
      (51, 'group'::match_phase, 'B', 'SUI', 'CAN', null::text, 'BC Place', 'Vancouver', '2026-06-24T15:00:00-04:00'::timestamptz),
      (52, 'group'::match_phase, 'B', 'BIH', 'QAT', null::text, 'Lumen Field', 'Seattle', '2026-06-24T15:00:00-04:00'::timestamptz),
      (53, 'group'::match_phase, 'A', 'CZE', 'MEX', null::text, 'Estadio Azteca', 'Mexico City', '2026-06-24T21:00:00-04:00'::timestamptz),
      (54, 'group'::match_phase, 'A', 'RSA', 'KOR', null::text, 'Estadio BBVA', 'Monterrey', '2026-06-24T21:00:00-04:00'::timestamptz),
      (55, 'group'::match_phase, 'E', 'CUW', 'CIV', null::text, 'Lincoln Financial Field', 'Philadelphia', '2026-06-25T16:00:00-04:00'::timestamptz),
      (56, 'group'::match_phase, 'E', 'ECU', 'GER', null::text, 'MetLife Stadium', 'New York/New Jersey', '2026-06-25T16:00:00-04:00'::timestamptz),
      (57, 'group'::match_phase, 'F', 'JPN', 'SWE', null::text, 'AT&T Stadium', 'Dallas', '2026-06-25T19:00:00-04:00'::timestamptz),
      (58, 'group'::match_phase, 'F', 'TUN', 'NED', null::text, 'Arrowhead Stadium', 'Kansas City', '2026-06-25T19:00:00-04:00'::timestamptz),
      (59, 'group'::match_phase, 'D', 'TUR', 'USA', null::text, 'SoFi Stadium', 'Los Angeles', '2026-06-25T22:00:00-04:00'::timestamptz),
      (60, 'group'::match_phase, 'D', 'PAR', 'AUS', null::text, 'Levi''s Stadium', 'San Francisco Bay Area', '2026-06-25T22:00:00-04:00'::timestamptz),
      (61, 'group'::match_phase, 'I', 'NOR', 'FRA', null::text, 'Gillette Stadium', 'Boston', '2026-06-26T15:00:00-04:00'::timestamptz),
      (62, 'group'::match_phase, 'I', 'SEN', 'IRQ', null::text, 'BMO Field', 'Toronto', '2026-06-26T15:00:00-04:00'::timestamptz),
      (63, 'group'::match_phase, 'G', 'EGY', 'IRN', null::text, 'Lumen Field', 'Seattle', '2026-06-26T23:00:00-04:00'::timestamptz),
      (64, 'group'::match_phase, 'G', 'NZL', 'BEL', null::text, 'BC Place', 'Vancouver', '2026-06-26T23:00:00-04:00'::timestamptz),
      (65, 'group'::match_phase, 'H', 'CPV', 'KSA', null::text, 'NRG Stadium', 'Houston', '2026-06-26T20:00:00-04:00'::timestamptz),
      (66, 'group'::match_phase, 'H', 'URU', 'ESP', null::text, 'Estadio Akron', 'Guadalajara', '2026-06-26T20:00:00-04:00'::timestamptz),
      (67, 'group'::match_phase, 'L', 'PAN', 'ENG', null::text, 'MetLife Stadium', 'New York/New Jersey', '2026-06-27T17:00:00-04:00'::timestamptz),
      (68, 'group'::match_phase, 'L', 'CRO', 'GHA', null::text, 'Lincoln Financial Field', 'Philadelphia', '2026-06-27T17:00:00-04:00'::timestamptz),
      (69, 'group'::match_phase, 'J', 'ALG', 'AUT', null::text, 'Arrowhead Stadium', 'Kansas City', '2026-06-27T22:00:00-04:00'::timestamptz),
      (70, 'group'::match_phase, 'J', 'JOR', 'ARG', null::text, 'AT&T Stadium', 'Dallas', '2026-06-27T22:00:00-04:00'::timestamptz),
      (71, 'group'::match_phase, 'K', 'COL', 'POR', null::text, 'Hard Rock Stadium', 'Miami', '2026-06-27T19:30:00-04:00'::timestamptz),
      (72, 'group'::match_phase, 'K', 'COD', 'UZB', null::text, 'Mercedes-Benz Stadium', 'Atlanta', '2026-06-27T19:30:00-04:00'::timestamptz),
      (73, 'round_of_32'::match_phase, null::text, null::text, null::text, 'Runner-up Group A vs Runner-up Group B', 'SoFi Stadium', 'Los Angeles', '2026-06-28T15:00:00-04:00'::timestamptz),
      (74, 'round_of_32'::match_phase, null::text, null::text, null::text, 'Winner Group E vs 3rd Group A/B/C/D/F', 'Gillette Stadium', 'Boston', '2026-06-29T16:30:00-04:00'::timestamptz),
      (75, 'round_of_32'::match_phase, null::text, null::text, null::text, 'Winner Group F vs Runner-up Group C', 'Estadio BBVA', 'Monterrey', '2026-06-29T21:00:00-04:00'::timestamptz),
      (76, 'round_of_32'::match_phase, null::text, null::text, null::text, 'Winner Group C vs Runner-up Group F', 'NRG Stadium', 'Houston', '2026-06-29T13:00:00-04:00'::timestamptz),
      (77, 'round_of_32'::match_phase, null::text, null::text, null::text, 'Winner Group I vs 3rd Group C/D/F/G/H', 'MetLife Stadium', 'New York/New Jersey', '2026-06-30T17:00:00-04:00'::timestamptz),
      (78, 'round_of_32'::match_phase, null::text, null::text, null::text, 'Runner-up Group E vs Runner-up Group I', 'AT&T Stadium', 'Dallas', '2026-06-30T13:00:00-04:00'::timestamptz),
      (79, 'round_of_32'::match_phase, null::text, null::text, null::text, 'Winner Group A vs 3rd Group C/E/F/H/I', 'Estadio Azteca', 'Mexico City', '2026-06-30T21:00:00-04:00'::timestamptz),
      (80, 'round_of_32'::match_phase, null::text, null::text, null::text, 'Winner Group L vs 3rd Group E/H/I/J/K', 'Mercedes-Benz Stadium', 'Atlanta', '2026-07-01T12:00:00-04:00'::timestamptz),
      (81, 'round_of_32'::match_phase, null::text, null::text, null::text, 'Winner Group D vs 3rd Group B/E/F/I/J', 'Levi''s Stadium', 'San Francisco Bay Area', '2026-07-01T20:00:00-04:00'::timestamptz),
      (82, 'round_of_32'::match_phase, null::text, null::text, null::text, 'Winner Group G vs 3rd Group A/E/H/I/J', 'Lumen Field', 'Seattle', '2026-07-01T16:00:00-04:00'::timestamptz),
      (83, 'round_of_32'::match_phase, null::text, null::text, null::text, 'Runner-up Group K vs Runner-up Group L', 'BMO Field', 'Toronto', '2026-07-02T19:00:00-04:00'::timestamptz),
      (84, 'round_of_32'::match_phase, null::text, null::text, null::text, 'Winner Group H vs Runner-up Group J', 'SoFi Stadium', 'Los Angeles', '2026-07-02T15:00:00-04:00'::timestamptz),
      (85, 'round_of_32'::match_phase, null::text, null::text, null::text, 'Winner Group B vs 3rd Group E/F/G/I/J', 'BC Place', 'Vancouver', '2026-07-02T23:00:00-04:00'::timestamptz),
      (86, 'round_of_32'::match_phase, null::text, null::text, null::text, 'Winner Group J vs Runner-up Group H', 'Hard Rock Stadium', 'Miami', '2026-07-03T18:00:00-04:00'::timestamptz),
      (87, 'round_of_32'::match_phase, null::text, null::text, null::text, 'Winner Group K vs 3rd Group D/E/I/J/L', 'Arrowhead Stadium', 'Kansas City', '2026-07-03T21:30:00-04:00'::timestamptz),
      (88, 'round_of_32'::match_phase, null::text, null::text, null::text, 'Runner-up Group D vs Runner-up Group G', 'AT&T Stadium', 'Dallas', '2026-07-03T14:00:00-04:00'::timestamptz),
      (89, 'round_of_16'::match_phase, null::text, null::text, null::text, 'Winner Match 74 vs Winner Match 77', 'Lincoln Financial Field', 'Philadelphia', '2026-07-04T17:00:00-04:00'::timestamptz),
      (90, 'round_of_16'::match_phase, null::text, null::text, null::text, 'Winner Match 73 vs Winner Match 75', 'NRG Stadium', 'Houston', '2026-07-04T13:00:00-04:00'::timestamptz),
      (91, 'round_of_16'::match_phase, null::text, null::text, null::text, 'Winner Match 76 vs Winner Match 78', 'MetLife Stadium', 'New York/New Jersey', '2026-07-05T16:00:00-04:00'::timestamptz),
      (92, 'round_of_16'::match_phase, null::text, null::text, null::text, 'Winner Match 79 vs Winner Match 80', 'Estadio Azteca', 'Mexico City', '2026-07-05T20:00:00-04:00'::timestamptz),
      (93, 'round_of_16'::match_phase, null::text, null::text, null::text, 'Winner Match 83 vs Winner Match 84', 'AT&T Stadium', 'Dallas', '2026-07-06T15:00:00-04:00'::timestamptz),
      (94, 'round_of_16'::match_phase, null::text, null::text, null::text, 'Winner Match 81 vs Winner Match 82', 'Lumen Field', 'Seattle', '2026-07-06T20:00:00-04:00'::timestamptz),
      (95, 'round_of_16'::match_phase, null::text, null::text, null::text, 'Winner Match 86 vs Winner Match 88', 'Mercedes-Benz Stadium', 'Atlanta', '2026-07-07T12:00:00-04:00'::timestamptz),
      (96, 'round_of_16'::match_phase, null::text, null::text, null::text, 'Winner Match 85 vs Winner Match 87', 'BC Place', 'Vancouver', '2026-07-07T16:00:00-04:00'::timestamptz),
      (97, 'quarter_final'::match_phase, null::text, null::text, null::text, 'Winner Match 89 vs Winner Match 90', 'Gillette Stadium', 'Boston', '2026-07-09T16:00:00-04:00'::timestamptz),
      (98, 'quarter_final'::match_phase, null::text, null::text, null::text, 'Winner Match 93 vs Winner Match 94', 'SoFi Stadium', 'Los Angeles', '2026-07-10T15:00:00-04:00'::timestamptz),
      (99, 'quarter_final'::match_phase, null::text, null::text, null::text, 'Winner Match 91 vs Winner Match 92', 'Hard Rock Stadium', 'Miami', '2026-07-11T17:00:00-04:00'::timestamptz),
      (100, 'quarter_final'::match_phase, null::text, null::text, null::text, 'Winner Match 95 vs Winner Match 96', 'Arrowhead Stadium', 'Kansas City', '2026-07-11T21:00:00-04:00'::timestamptz),
      (101, 'semi_final'::match_phase, null::text, null::text, null::text, 'Winner Match 97 vs Winner Match 98', 'AT&T Stadium', 'Dallas', '2026-07-14T15:00:00-04:00'::timestamptz),
      (102, 'semi_final'::match_phase, null::text, null::text, null::text, 'Winner Match 99 vs Winner Match 100', 'Mercedes-Benz Stadium', 'Atlanta', '2026-07-15T15:00:00-04:00'::timestamptz),
      (103, 'third_place'::match_phase, null::text, null::text, null::text, 'Loser Match 101 vs Loser Match 102', 'Hard Rock Stadium', 'Miami', '2026-07-18T17:00:00-04:00'::timestamptz),
      (104, 'final'::match_phase, null::text, null::text, null::text, 'Winner Match 101 vs Winner Match 102', 'MetLife Stadium', 'New York/New Jersey', '2026-07-19T15:00:00-04:00'::timestamptz)
  ) as v(match_number, phase, group_name, home_code, away_code, round_label, stadium, city, scheduled_at)
),
resolved_matches as (
  select
    ms.match_number,
    ms.phase,
    g.id as group_id,
    th.id as home_team_id,
    ta.id as away_team_id,
    ms.round_label,
    ms.stadium,
    ms.city,
    ms.scheduled_at
  from match_seed ms
  left join tournament_groups g on g.name = ms.group_name
  left join teams th on th.short_name = ms.home_code
  left join teams ta on ta.short_name = ms.away_code
)
merge into matches as m
using resolved_matches as src
on m.match_number = src.match_number
when matched then update set
  home_team_id = src.home_team_id,
  away_team_id = src.away_team_id,
  group_id = src.group_id,
  phase = src.phase,
  round_label = src.round_label,
  stadium = src.stadium,
  city = src.city,
  scheduled_at = src.scheduled_at,
  status = 'scheduled',
  updated_at = now()
when not matched then insert (
  home_team_id,
  away_team_id,
  group_id,
  phase,
  match_number,
  round_label,
  stadium,
  city,
  scheduled_at,
  status
) values (
  src.home_team_id,
  src.away_team_id,
  src.group_id,
  src.phase,
  src.match_number,
  src.round_label,
  src.stadium,
  src.city,
  src.scheduled_at,
  'scheduled'
);

commit;
