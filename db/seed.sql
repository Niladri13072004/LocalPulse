-- Seed departments
INSERT INTO departments (id, name, contact_email, contact_phone) VALUES
('d1111111-1111-1111-1111-111111111111', 'Road Department', 'roads@localpulse.gov.in', '+919999911111'),
('d2222222-2222-2222-2222-222222222222', 'Drainage & Water Team', 'drainage@localpulse.gov.in', '+919999922222'),
('d3333333-3333-3333-3333-333333333333', 'Electricity Board', 'electricity@localpulse.gov.in', '+919999933333'),
('d4444444-4444-4444-4444-444444444444', 'Sanitation & Waste Dept', 'waste@localpulse.gov.in', '+919999944444'),
('d5555555-5555-5555-5555-555555555555', 'Public Safety & Police', 'safety@localpulse.gov.in', '+919999955555')
ON CONFLICT (id) DO NOTHING;

-- Seed wards with simple PostGIS polygon coordinates representing central zones of the 6 demo cities
-- Indore
INSERT INTO wards (id, name, city, boundary, department_contacts) VALUES
('w1111111-1111-1111-1111-111111111111', 'Rajwada Ward', 'Indore', ST_GeomFromText('POLYGON((75.8500 22.7150, 75.8600 22.7150, 75.8600 22.7250, 75.8500 22.7250, 75.8500 22.7150))', 4326), '{"roads": "+919999911111", "waste": "+919999944444"}')
ON CONFLICT (id) DO NOTHING;

-- Patna
INSERT INTO wards (id, name, city, boundary, department_contacts) VALUES
('w2222222-2222-2222-2222-222222222222', 'Kankarbagh Ward', 'Patna', ST_GeomFromText('POLYGON((85.1400 25.5900, 85.1600 25.5900, 85.1600 25.6100, 85.1400 25.6100, 85.1400 25.5900))', 4326), '{"drainage": "+919999922222", "roads": "+919999911111"}')
ON CONFLICT (id) DO NOTHING;

-- Jaipur
INSERT INTO wards (id, name, city, boundary, department_contacts) VALUES
('w3333333-3333-3333-3333-333333333333', 'Pink City Ward', 'Jaipur', ST_GeomFromText('POLYGON((75.8100 26.9100, 75.8300 26.9100, 75.8300 26.9300, 75.8100 26.9300, 75.8100 26.9100))', 4326), '{"waste": "+919999944444", "safety": "+919999955555"}')
ON CONFLICT (id) DO NOTHING;

-- Lucknow
INSERT INTO wards (id, name, city, boundary, department_contacts) VALUES
('w4444444-4444-4444-4444-444444444444', 'Hazratganj Ward', 'Lucknow', ST_GeomFromText('POLYGON((80.9300 26.8400, 80.9500 26.8400, 80.9500 26.8600, 80.9300 26.8600, 80.9300 26.8400))', 4326), '{"roads": "+919999911111", "electricity": "+919999933333"}')
ON CONFLICT (id) DO NOTHING;

-- Nagpur
INSERT INTO wards (id, name, city, boundary, department_contacts) VALUES
('w5555555-5555-5555-5555-555555555555', 'Dharampeth Ward', 'Nagpur', ST_GeomFromText('POLYGON((79.0400 21.1300, 79.0600 21.1300, 79.0600 21.1500, 79.0400 21.1500, 79.0400 21.1300))', 4326), '{"drainage": "+919999922222", "waste": "+919999944444"}')
ON CONFLICT (id) DO NOTHING;

-- Kolkata
INSERT INTO wards (id, name, city, boundary, department_contacts) VALUES
('w6666666-6666-6666-6666-666666666666', 'Salt Lake Ward', 'Kolkata', ST_GeomFromText('POLYGON((88.4000 22.5600, 88.4300 22.5600, 88.4300 22.5900, 88.4000 22.5900, 88.4000 22.5600))', 4326), '{"electricity": "+919999933333", "safety": "+919999955555"}')
ON CONFLICT (id) DO NOTHING;

-- Seed service providers
INSERT INTO service_providers (id, name, service_type, contact_phone, description, rating, status) VALUES
(gen_random_uuid(), 'Ramesh Kumar', 'Plumber', '+919876543210', 'Experienced plumber specializing in leakage repair and pipe fitting.', 4.8, 'verified'),
(gen_random_uuid(), 'Suresh Sharma', 'Electrician', '+919876543211', 'Expert electrician for home wiring, switchboard fix, and appliances.', 4.5, 'verified'),
(gen_random_uuid(), 'Sunita Sen', 'Tutor', '+919876543212', 'Secondary math and science private tutor. Home and online classes.', 4.9, 'verified'),
(gen_random_uuid(), 'Amit Patel', 'Mechanic', '+919876543213', 'Two-wheeler and four-wheeler repairs. Quick road assistance.', 4.2, 'unverified'),
(gen_random_uuid(), 'Karan Singh', 'Plumber', '+919876543214', '24/7 emergency plumbing services. Clear pricing.', 4.0, 'unverified')
ON CONFLICT (id) DO NOTHING;
