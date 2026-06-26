import sqlite3
import os
import json
from datetime import datetime, timedelta

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "db"))
DB_PATH = os.path.join(DB_DIR, "localpulse.db")

def init_db():
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR)

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    # Create tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_email TEXT,
        contact_phone TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        boundary TEXT,
        department_contacts TEXT DEFAULT '{}',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT CHECK (role IN ('citizen', 'admin')) DEFAULT 'citizen' NOT NULL,
        ward_id TEXT REFERENCES wards(id) ON DELETE SET NULL,
        xp INTEGER DEFAULT 0 NOT NULL,
        badges TEXT DEFAULT '[]',
        preferred_language TEXT DEFAULT 'en' NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS issues (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        image_urls TEXT DEFAULT '[]',
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        ward_id TEXT REFERENCES wards(id) ON DELETE SET NULL,
        is_anonymous INTEGER DEFAULT 0 NOT NULL,
        reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        status TEXT CHECK (status IN ('open', 'under_review', 'in_progress', 'resolved')) DEFAULT 'open' NOT NULL,
        priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium' NOT NULL,
        department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS issue_votes (
        issue_id TEXT REFERENCES issues(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (issue_id, user_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS issue_comments (
        id TEXT PRIMARY KEY,
        issue_id TEXT REFERENCES issues(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        is_anonymous INTEGER DEFAULT 0 NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS issue_status_history (
        id TEXT PRIMARY KEY,
        issue_id TEXT REFERENCES issues(id) ON DELETE CASCADE,
        status_from TEXT,
        status_to TEXT NOT NULL,
        changed_by TEXT,
        comment TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        creator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        image_url TEXT,
        latitude REAL,
        longitude REAL,
        address TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_official INTEGER DEFAULT 0 NOT NULL,
        attendees INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS service_providers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        service_type TEXT NOT NULL,
        contact_phone TEXT NOT NULL,
        description TEXT,
        rating REAL DEFAULT 0.0,
        status TEXT CHECK (status IN ('unverified', 'verified')) DEFAULT 'unverified' NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    """)

    conn.commit()

    # Seed departments
    depts = [
        ('d1111111-1111-1111-1111-111111111111', 'Road Department', 'roads@localpulse.gov.in', '+919999911111'),
        ('d2222222-2222-2222-2222-222222222222', 'Drainage & Water Team', 'drainage@localpulse.gov.in', '+919999922222'),
        ('d3333333-3333-3333-3333-333333333333', 'Electricity Board', 'electricity@localpulse.gov.in', '+919999933333'),
        ('d4444444-4444-4444-4444-444444444444', 'Sanitation & Waste Dept', 'waste@localpulse.gov.in', '+919999944444'),
        ('d5555555-5555-5555-5555-555555555555', 'Public Safety & Police', 'safety@localpulse.gov.in', '+919999955555')
    ]
    for d_id, name, email, phone in depts:
        cursor.execute("INSERT OR IGNORE INTO departments (id, name, contact_email, contact_phone) VALUES (?, ?, ?, ?)",
                       (d_id, name, email, phone))

    # Seed wards
    wards = [
        ('w1111111-1111-1111-1111-111111111111', 'Rajwada Ward', 'Indore', 'POLYGON((75.8500 22.7150, 75.8600 22.7150, 75.8600 22.7250, 75.8500 22.7250, 75.8500 22.7150))', '{"roads": "+919999911111", "waste": "+919999944444"}'),
        ('w2222222-2222-2222-2222-222222222222', 'Kankarbagh Ward', 'Patna', 'POLYGON((85.1400 25.5900, 85.1600 25.5900, 85.1600 25.6100, 85.1400 25.6100, 85.1400 25.5900))', '{"drainage": "+919999922222", "roads": "+919999911111"}'),
        ('w3333333-3333-3333-3333-333333333333', 'Pink City Ward', 'Jaipur', 'POLYGON((75.8100 26.9100, 75.8300 26.9100, 75.8300 26.9300, 75.8100 26.9300, 75.8100 26.9100))', '{"waste": "+919999944444", "safety": "+919999955555"}'),
        ('w4444444-4444-4444-4444-444444444444', 'Hazratganj Ward', 'Lucknow', 'POLYGON((80.9300 26.8400, 80.9500 26.8400, 80.9500 26.8600, 80.9300 26.8600, 80.9300 26.8400))', '{"roads": "+919999911111", "electricity": "+919999933333"}'),
        ('w5555555-5555-5555-5555-555555555555', 'Dharampeth Ward', 'Nagpur', 'POLYGON((79.0400 21.1300, 79.0600 21.1300, 79.0600 21.1500, 79.0400 21.1500, 79.0400 21.1300))', '{"drainage": "+919999922222", "waste": "+919999944444"}'),
        ('w6666666-6666-6666-6666-666666666666', 'Salt Lake Ward', 'Kolkata', 'POLYGON((88.4000 22.5600, 88.4300 22.5600, 88.4300 22.5900, 88.4000 22.5900, 88.4000 22.5600))', '{"electricity": "+919999933333", "safety": "+919999955555"}')
    ]
    for w_id, name, city, boundary, contacts in wards:
        cursor.execute("INSERT OR IGNORE INTO wards (id, name, city, boundary, department_contacts) VALUES (?, ?, ?, ?, ?)",
                       (w_id, name, city, boundary, contacts))

    # Seed users
    users = [
        ('u1111111-1111-1111-1111-111111111111', 'aman@localpulse.in', 'Aman Verma', 'citizen', 'w1111111-1111-1111-1111-111111111111', 10),
        ('u2222222-2222-2222-2222-222222222222', 'neha@localpulse.in', 'Neha Sharma', 'citizen', 'w3333333-3333-3333-3333-333333333333', 20),
        ('u3333333-3333-3333-3333-333333333333', 'divya@localpulse.in', 'Divya Rastogi', 'citizen', 'w4444444-4444-4444-4444-444444444444', 30),
        ('u-siddharth-jain', 'siddharth@localpulse.in', 'Siddharth Jain', 'citizen', 'w1111111-1111-1111-1111-111111111111', 0),
        ('u-rakesh-yadav', 'rakesh@localpulse.in', 'Rakesh Yadav', 'citizen', 'w4444444-4444-4444-4444-444444444444', 0),
        ('u-officer-vikram', 'vikram@localpulse.gov.in', 'Officer Vikram Singh', 'admin', 'w1111111-1111-1111-1111-111111111111', 0),
        ('u-officer-rahul', 'rahul@localpulse.gov.in', 'Officer Rahul Gupta', 'admin', 'w3333333-3333-3333-3333-333333333333', 0),
        ('u-officer-alok', 'alok@localpulse.gov.in', 'Officer Alok Mishra', 'admin', 'w4444444-4444-4444-4444-444444444444', 0)
    ]
    for u_id, email, name, role, ward_id, xp in users:
        cursor.execute("INSERT OR IGNORE INTO users (id, email, full_name, role, ward_id, xp) VALUES (?, ?, ?, ?, ?, ?)",
                       (u_id, email, name, role, ward_id, xp))

    # Seed service providers
    sps = [
        ('sp111111-1111-1111-1111-111111111111', 'Ramesh Kumar', 'Plumber', '+919876543210', 'Experienced plumber specializing in leakage repair and pipe fitting.', 4.8, 'verified'),
        ('sp222222-2222-2222-2222-222222222222', 'Suresh Sharma', 'Electrician', '+919876543211', 'Expert electrician for home wiring, switchboard fix, and appliances.', 4.5, 'verified'),
        ('sp333333-3333-3333-3333-333333333333', 'Sunita Sen', 'Tutor', '+919876543212', 'Secondary math and science private tutor. Home and online classes.', 4.9, 'verified'),
        ('sp444444-4444-4444-4444-444444444444', 'Amit Patel', 'Mechanic', '+919876543213', 'Two-wheeler and four-wheeler repairs. Quick road assistance.', 4.2, 'unverified'),
        ('sp555555-5555-5555-5555-555555555555', 'Karan Singh', 'Plumber', '+919876543214', '24/7 emergency plumbing services. Clear pricing.', 4.0, 'unverified')
    ]
    for sp_id, name, stype, phone, desc, rating, status in sps:
        cursor.execute("INSERT OR IGNORE INTO service_providers (id, name, service_type, contact_phone, description, rating, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (sp_id, name, stype, phone, desc, rating, status))

    # Seed issues
    issues = [
        ('issue-indore-1', 'Major Potholes near Rajwada Gate', 
         'Multiple deep potholes right in front of the main entrance to Rajwada palace. It is causing extreme traffic congestion and posing a hazard to two-wheeler riders.',
         'Pothole', json.dumps(['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600']),
         22.7196, 75.8577, 'w1111111-1111-1111-1111-111111111111', 0, 'u1111111-1111-1111-1111-111111111111',
         'under_review', 'high', 'd1111111-1111-1111-1111-111111111111', 
         (datetime.utcnow() - timedelta(days=3)).isoformat()),
         
        ('issue-patna-1', 'Severe Water Logging in Kankarbagh Sector-H',
         "Following yesterday's moderate rainfall, the main road of Sector-H is completely submerged under 2 feet of water. Drains appear to be completely choked with trash.",
         'Water Logging', json.dumps(['https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600']),
         25.5940, 85.1560, 'w2222222-2222-2222-2222-222222222222', 1, None,
         'open', 'critical', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),
         
        ('issue-jaipur-1', 'Overflowing Waste Bin in Johri Bazar',
         'The community garbage bin is overflowing. Garbage is scattered all over the road, creating an intolerable smell and attracting stray animals.',
         'Garbage', json.dumps(['https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=600']),
         26.9215, 75.8242, 'w3333333-3333-3333-3333-333333333333', 0, 'u2222222-2222-2222-2222-222222222222',
         'in_progress', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),
         
        ('issue-lucknow-1', 'Broken Streetlights causing dark spot near Hazratganj Metro',
         'Three consecutive streetlights on the side street near Hazratganj metro station exit are non-functional. The lane becomes pitch dark after 7 PM, creating a safety hazard, especially for women.',
         'Electricity', json.dumps(['https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=600']),
         26.8510, 80.9425, 'w4444444-4444-4444-4444-444444444444', 0, 'u3333333-3333-3333-3333-333333333333',
         'resolved', 'high', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=10)).isoformat())
    ]
    for row in issues:
        cursor.execute("""
        INSERT OR IGNORE INTO issues (
            id, title, description, category, image_urls, latitude, longitude,
            ward_id, is_anonymous, reporter_id, status, priority, department_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, row)

    # ── Additional seed issues (174 new issues: 29 per city) ──────────────────
    extra_issues = [
        # ═══════════════════════════════════════════════════════════════════════
        #  INDORE  (ward w1111111-..., base coords 22.72, 75.86)
        # ═══════════════════════════════════════════════════════════════════════
        ('issue-indore-2', 'Cracked road surface on MG Road near Treasure Island Mall',
         'The asphalt on MG Road has developed wide cracks over a 200-metre stretch. Two-wheelers are skidding during rain.',
         'Pothole', json.dumps([]), 22.7235, 75.8570,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'open', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-indore-3', 'Water logging near Chhappan Dukan after light rain',
         'Even 15 minutes of drizzle leads to knee-deep water near the famous 56 shops area. Drain outlets seem blocked.',
         'Water Logging', json.dumps([]), 22.7185, 75.8610,
         'w1111111-1111-1111-1111-111111111111', 1, None,
         'open', 'critical', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-indore-4', 'Garbage pile-up behind Sarafa Bazar',
         'Rotting garbage has been lying uncollected for 4 days behind the Sarafa lane. Strong foul smell is affecting nearby shop owners.',
         'Garbage', json.dumps([]), 22.7191, 75.8565,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'under_review', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-indore-5', 'Frequent power cuts in Rajwada colony',
         'Residents of Rajwada colony are facing 3-4 hour power cuts every day since last week. Inverters are also failing.',
         'Electricity', json.dumps([]), 22.7200, 75.8550,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'in_progress', 'high', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=6)).isoformat()),

        ('issue-indore-6', 'Uncovered manhole on Nath Mandir Road',
         'An open manhole without any barricade near the Nath Mandir temple is extremely dangerous, especially at night.',
         'Safety', json.dumps([]), 22.7210, 75.8590,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'open', 'critical', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-indore-7', 'Broken speed breaker near Daly College',
         'The speed breaker near Daly College main gate has broken apart. Jagged concrete edges are damaging vehicle tyres.',
         'Pothole', json.dumps([]), 22.7150, 75.8680,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'open', 'medium', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=8)).isoformat()),

        ('issue-indore-8', 'Stagnant water breeding mosquitoes near Juni Indore',
         'A large pool of stagnant water has formed near Juni Indore bus stop. Dengue cases are rising in the area.',
         'Water Logging', json.dumps([]), 22.7170, 75.8530,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'under_review', 'high', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),

        ('issue-indore-9', 'Overflowing dustbin at Palasia Square',
         'The large municipal dustbin at Palasia Square has not been emptied for a week. Stray cattle are spreading the waste further.',
         'Garbage', json.dumps([]), 22.7240, 75.8620,
         'w1111111-1111-1111-1111-111111111111', 1, None,
         'open', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-indore-10', 'Dangling electric wires near Sapna Sangeeta Road',
         'Low-hanging live wires on Sapna Sangeeta Road are a serious electrocution risk. Wires were dislodged after a truck hit them.',
         'Electricity', json.dumps([]), 22.7255, 75.8650,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'in_progress', 'critical', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-indore-11', 'No street lights on Bypass Road stretch near Bhawarkua',
         'A 500-metre stretch on the bypass road near Bhawarkua has zero working lights. Multiple chain-snatching incidents reported.',
         'Safety', json.dumps([]), 22.7280, 75.8540,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'open', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=7)).isoformat()),

        ('issue-indore-12', 'Collapsed road edge near Bhanwarkuan underpass',
         'The road edge near Bhanwarkuan underpass has caved in due to drainage leak. Two-wheelers cannot pass safely.',
         'Pothole', json.dumps([]), 22.7295, 75.8510,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'resolved', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=15)).isoformat()),

        ('issue-indore-13', 'Sewage overflow on Mahatma Gandhi Road',
         'Raw sewage is flowing onto the main road near Kotwali police station. Vehicles are splashing it on pedestrians.',
         'Water Logging', json.dumps([]), 22.7175, 75.8580,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'open', 'critical', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-indore-14', 'Illegal dumping near Krishnapura Chhatri',
         'Construction debris and household waste is being dumped illegally near the heritage site Krishnapura Chhatri.',
         'Garbage', json.dumps([]), 22.7205, 75.8555,
         'w1111111-1111-1111-1111-111111111111', 1, None,
         'under_review', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=9)).isoformat()),

        ('issue-indore-15', 'Transformer sparking near Cloth Market',
         'The distribution transformer near the old cloth market sparks every evening. Shopkeepers are terrified of a fire.',
         'Electricity', json.dumps([]), 22.7192, 75.8548,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'in_progress', 'critical', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-indore-16', 'Stray dog menace near Annapurna Temple',
         'A pack of aggressive stray dogs near Annapurna Temple area has bitten 3 people in the past week.',
         'Safety', json.dumps([]), 22.7160, 75.8600,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'open', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-indore-17', 'Sinking road near LIG Colony',
         'Road surface near LIG Colony main entrance is gradually sinking. A large depression has formed causing vehicle damage.',
         'Pothole', json.dumps([]), 22.7130, 75.8700,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'open', 'medium', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=12)).isoformat()),

        ('issue-indore-18', 'Flooded underpass at Geeta Bhawan',
         'The underpass at Geeta Bhawan fills up with 3 feet of water every monsoon shower. Cars get stranded regularly.',
         'Water Logging', json.dumps([]), 22.7220, 75.8640,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'in_progress', 'critical', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-indore-19', 'E-waste dumped near Regal Square',
         'Old monitors, wires and circuit boards have been dumped openly near Regal Square. This is hazardous to children playing nearby.',
         'Garbage', json.dumps([]), 22.7245, 75.8560,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'open', 'low', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=11)).isoformat()),

        ('issue-indore-20', 'Flickering streetlights on AB Road',
         'Multiple streetlights on AB Road between Palasia and LIG are flickering continuously, causing visibility issues for drivers.',
         'Electricity', json.dumps([]), 22.7260, 75.8670,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'open', 'low', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=14)).isoformat()),

        ('issue-indore-21', 'Missing railing on Kahn River bridge',
         'Protective railing on the small bridge over Kahn River near Rajwada is missing. Pedestrians, especially children, are at risk.',
         'Safety', json.dumps([]), 22.7180, 75.8520,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'under_review', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=6)).isoformat()),

        ('issue-indore-22', 'Pothole cluster on Ring Road near Vijay Nagar',
         'At least 8 deep potholes on Ring Road near Vijay Nagar turn. Multiple accidents reported in the last month.',
         'Pothole', json.dumps([]), 22.7510, 75.8930,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'open', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),

        ('issue-indore-23', 'Drain collapse near Nehru Stadium',
         'A section of the main drain near Nehru Stadium has collapsed. Foul water is flowing on the footpath.',
         'Water Logging', json.dumps([]), 22.7155, 75.8595,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'open', 'medium', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=10)).isoformat()),

        ('issue-indore-24', 'Dead animal carcass on Kanadia Road',
         'A dead cow carcass has been lying on Kanadia Road for 2 days. No municipal team has come to remove it.',
         'Garbage', json.dumps([]), 22.7350, 75.8450,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'resolved', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=18)).isoformat()),

        ('issue-indore-25', 'Exposed high-tension cable near railway crossing',
         'A high-tension cable is hanging low near the Rajwada railway crossing. Rain could make this lethal.',
         'Electricity', json.dumps([]), 22.7188, 75.8538,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'in_progress', 'critical', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-indore-26', 'Eve-teasing complaints near Holkar Science College',
         'Multiple women have reported eve-teasing near Holkar Science College bus stop in the evening hours.',
         'Safety', json.dumps([]), 22.7215, 75.8575,
         'w1111111-1111-1111-1111-111111111111', 1, None,
         'under_review', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-indore-27', 'Abandoned vehicle blocking footpath on South Tukoganj',
         'An abandoned auto-rickshaw has been blocking the footpath on South Tukoganj for over a month.',
         'Others', json.dumps([]), 22.7230, 75.8605,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'open', 'low', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=20)).isoformat()),

        ('issue-indore-28', 'Broken bench and litter in Nehru Park',
         'The concrete bench near the fountain in Nehru Park is broken. Broken glass and litter around the area is unsafe for kids.',
         'Others', json.dumps([]), 22.7195, 75.8615,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'open', 'low', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=16)).isoformat()),

        ('issue-indore-29', 'Traffic signal not working at Rajwada Chowk',
         'The traffic signal at Rajwada Chowk has been non-functional for 3 days. Traffic jams during peak hours are chaotic.',
         'Others', json.dumps([]), 22.7198, 75.8572,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'in_progress', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-indore-30', 'Loose gravel on newly tarred Sneh Nagar road',
         'The recently tarred road in Sneh Nagar has loose gravel everywhere. Motorcyclists are losing traction and slipping.',
         'Pothole', json.dumps([]), 22.7270, 75.8490,
         'w1111111-1111-1111-1111-111111111111', 0, None,
         'open', 'medium', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=7)).isoformat()),

        # ═══════════════════════════════════════════════════════════════════════
        #  PATNA  (ward w2222222-..., base coords 25.59, 85.14)
        # ═══════════════════════════════════════════════════════════════════════
        ('issue-patna-2', 'Massive pothole on Bailey Road near Patna Museum',
         'A crater-sized pothole on Bailey Road right in front of the museum entrance is slowing traffic to a crawl.',
         'Pothole', json.dumps([]), 25.6120, 85.1210,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-patna-3', 'Flooded lane in Boring Road area after rain',
         'Boring Road area lanes get flooded with just 30 minutes of rain. Shops are forced to shut down.',
         'Water Logging', json.dumps([]), 25.6050, 85.1300,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'critical', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-patna-4', 'Garbage strewn across Kankarbagh Main Road',
         'Municipal garbage trucks have not visited in 5 days. Piles of garbage on the main road are creating a hygiene crisis.',
         'Garbage', json.dumps([]), 25.5935, 85.1545,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'under_review', 'high', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-patna-5', 'Electricity pole tilted dangerously on Dak Bungalow Road',
         'A wooden electricity pole is tilting at a 45-degree angle. Any strong wind could bring it crashing down on pedestrians.',
         'Electricity', json.dumps([]), 25.6100, 85.1380,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'in_progress', 'critical', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-patna-6', 'No CCTV on dark stretch near Patna Junction',
         'The approach road to Patna Junction from the south side has no CCTVs and no lights. Robberies have been reported.',
         'Safety', json.dumps([]), 25.6080, 85.1420,
         'w2222222-2222-2222-2222-222222222222', 1, None,
         'open', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),

        ('issue-patna-7', 'Road cave-in near Kankarbagh Sector-3A',
         'Part of the road in Sector-3A has caved in revealing old sewer pipes. Vehicles cannot pass through.',
         'Pothole', json.dumps([]), 25.5920, 85.1580,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'under_review', 'critical', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-patna-8', 'Clogged storm drain on Frazer Road',
         'The main storm drain on Frazer Road is completely blocked with plastic waste. Water backs up onto the road during rain.',
         'Water Logging', json.dumps([]), 25.6145, 85.1250,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'high', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=6)).isoformat()),

        ('issue-patna-9', 'Overflowing community bin near Gandhi Maidan',
         'The large community dustbin at the edge of Gandhi Maidan is overflowing. Crows and stray animals scatter waste everywhere.',
         'Garbage', json.dumps([]), 25.6090, 85.1340,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'in_progress', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=7)).isoformat()),

        ('issue-patna-10', 'Sparking transformer in residential colony near Rajendra Nagar',
         'The local transformer in Rajendra Nagar colony has been sparking every night. Residents fear fire.',
         'Electricity', json.dumps([]), 25.5970, 85.1490,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'critical', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-patna-11', 'Illegal encroachment blocking fire exit at Harding Park',
         'Vendors have set up permanent stalls blocking the emergency exit of Harding Park. This is a fire safety hazard.',
         'Safety', json.dumps([]), 25.6060, 85.1280,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'under_review', 'medium', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=8)).isoformat()),

        ('issue-patna-12', 'Uneven road surface near Patna Women\'s College',
         'The approach road to Patna Women\'s College is extremely uneven with raised patches and loose stones.',
         'Pothole', json.dumps([]), 25.6030, 85.1360,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'medium', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=10)).isoformat()),

        ('issue-patna-13', 'Waterlogged parking lot at Patliputra Karkhana',
         'The parking lot near Patliputra Karkhana complex remains waterlogged for days after rain. Vehicles get stuck in mud.',
         'Water Logging', json.dumps([]), 25.5895, 85.1620,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'low', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=13)).isoformat()),

        ('issue-patna-14', 'Medical waste dumped openly near PMCH',
         'Biomedical waste including syringes and bandages is being dumped in the open drain near Patna Medical College Hospital.',
         'Garbage', json.dumps([]), 25.6110, 85.1440,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'critical', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-patna-15', 'Power outage lasting 8+ hours in Kankarbagh Sector-5',
         'Sector-5 has been facing daily power outages of 8 or more hours. Food spoilage and heat stroke cases rising.',
         'Electricity', json.dumps([]), 25.5910, 85.1570,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'in_progress', 'high', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-patna-16', 'Unauthorized construction blocking drainage near Boring Canal Road',
         'A new building under construction near Boring Canal Road has diverted the drainage channel, causing flooding to adjacent homes.',
         'Safety', json.dumps([]), 25.6040, 85.1310,
         'w2222222-2222-2222-2222-222222222222', 1, None,
         'open', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=6)).isoformat()),

        ('issue-patna-17', 'Broken footpath tiles near Exhibition Road',
         'Footpath tiles on Exhibition Road are cracked and raised. Several pedestrians have tripped and injured themselves.',
         'Pothole', json.dumps([]), 25.6070, 85.1400,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'low', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=15)).isoformat()),

        ('issue-patna-18', 'Sewage mixing with drinking water in Sector-4',
         'Residents of Sector-4 are reporting foul-smelling tap water. A sewage line may have leaked into the water supply pipe.',
         'Water Logging', json.dumps([]), 25.5930, 85.1555,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'in_progress', 'critical', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-patna-19', 'Plastic bags clogging Ganga ghat drain outlet',
         'The drain outlet at Collectorate Ghat is choked with plastic bags. Water is backing up and creating a stench.',
         'Garbage', json.dumps([]), 25.6160, 85.1190,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=9)).isoformat()),

        ('issue-patna-20', 'Street light pole rusted and about to fall near Danapur',
         'An old rusted street light pole near Danapur Cantonment gate is leaning badly. One strong gust could topple it.',
         'Electricity', json.dumps([]), 25.5880, 85.0500,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'high', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=11)).isoformat()),

        ('issue-patna-21', 'Reckless driving by autos near Mahavir Mandir',
         'Auto-rickshaw drivers near Mahavir Mandir drive recklessly on the wrong side. No traffic police presence despite complaints.',
         'Safety', json.dumps([]), 25.6095, 85.1370,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'medium', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=7)).isoformat()),

        ('issue-patna-22', 'Road markings faded on Ashok Rajpath',
         'Lane markings and zebra crossings on Ashok Rajpath near Patna University have completely faded. Causes confusion for drivers.',
         'Pothole', json.dumps([]), 25.6130, 85.1230,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'low', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=19)).isoformat()),

        ('issue-patna-23', 'Overflowing naala near Income Tax Golumbar',
         'The open drain (naala) near Income Tax Golumbar overflows during every heavy rain, flooding nearby shops.',
         'Water Logging', json.dumps([]), 25.6010, 85.1450,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'under_review', 'high', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-patna-24', 'Construction debris dumped on pavement near Patna Sahib',
         'Rubble and sand from a nearby construction site have been dumped on the public pavement near Patna Sahib Gurudwara.',
         'Garbage', json.dumps([]), 25.6040, 85.1650,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'low', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=14)).isoformat()),

        ('issue-patna-25', 'Faulty meter causing inflated electricity bills in Sector-2',
         'Multiple families in Sector-2 have received abnormally high electricity bills. Meters appear to be faulty.',
         'Electricity', json.dumps([]), 25.5945, 85.1535,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'medium', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=12)).isoformat()),

        ('issue-patna-26', 'Children playing near open well in Saguna More',
         'An uncovered abandoned well in Saguna More residential area is a death trap. Children often play near it unsupervised.',
         'Safety', json.dumps([]), 25.5850, 85.0780,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'under_review', 'critical', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-patna-27', 'Damaged road divider on Hartali Mor',
         'The concrete road divider on Hartali Mor has been smashed by a truck and left unrepaired for weeks.',
         'Others', json.dumps([]), 25.5960, 85.1510,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'medium', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=17)).isoformat()),

        ('issue-patna-28', 'Broken public toilet facility at Gandhi Maidan',
         'The Sulabh public toilet at Gandhi Maidan has no running water and broken locks. People are using open areas instead.',
         'Others', json.dumps([]), 25.6085, 85.1335,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=8)).isoformat()),

        ('issue-patna-29', 'Noise pollution from illegal DJ near Kankarbagh market',
         'An event venue in Kankarbagh market plays loud DJ music until 2 AM every weekend, violating noise norms.',
         'Others', json.dumps([]), 25.5925, 85.1550,
         'w2222222-2222-2222-2222-222222222222', 1, None,
         'open', 'low', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),

        ('issue-patna-30', 'Pothole-ridden service lane near Boring Road crossing',
         'The service lane parallel to Boring Road main carriageway has potholes every few metres. Auto-rickshaws refuse to ply.',
         'Pothole', json.dumps([]), 25.6055, 85.1290,
         'w2222222-2222-2222-2222-222222222222', 0, None,
         'open', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        # ═══════════════════════════════════════════════════════════════════════
        #  JAIPUR  (ward w3333333-..., base coords 26.92, 75.79)
        # ═══════════════════════════════════════════════════════════════════════
        ('issue-jaipur-2', 'Deep pothole near Hawa Mahal traffic signal',
         'A dangerous pothole has opened up right at the traffic signal near Hawa Mahal. Tourists and locals alike are at risk.',
         'Pothole', json.dumps([]), 26.9240, 75.8268,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'open', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-jaipur-3', 'Waterlogging at Chandpole Gate underpass',
         'The Chandpole Gate underpass collects waist-deep water within an hour of rainfall. Vehicles and pedestrians are stranded.',
         'Water Logging', json.dumps([]), 26.9180, 75.8150,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'open', 'critical', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-jaipur-4', 'Uncollected waste at Tripolia Bazar',
         'Shopkeepers at Tripolia Bazar say the garbage truck has not arrived in 6 days. Rats are infesting the market.',
         'Garbage', json.dumps([]), 26.9225, 75.8210,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'in_progress', 'high', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),

        ('issue-jaipur-5', 'Broken electricity meter box sparking in Bapu Bazar',
         'The electricity meter box outside a row of shops in Bapu Bazar is broken and sparking intermittently.',
         'Electricity', json.dumps([]), 26.9205, 75.8230,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'under_review', 'critical', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-jaipur-6', 'Chain snatching hotspot near Manak Chowk',
         'Multiple chain snatching incidents reported near Manak Chowk in the evening hours. No police patrol visible.',
         'Safety', json.dumps([]), 26.9235, 75.8255,
         'w3333333-3333-3333-3333-333333333333', 1, None,
         'open', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-jaipur-7', 'Road subsidence on MI Road near Panch Batti',
         'The road surface on MI Road near Panch Batti circle has sunk by about 6 inches. A water main leak underneath is suspected.',
         'Pothole', json.dumps([]), 26.9160, 75.8100,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'in_progress', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=6)).isoformat()),

        ('issue-jaipur-8', 'Flooded residential colony near Nahargarh Road',
         'Colony lanes near the foot of Nahargarh Road get severely flooded. Water enters ground-floor homes.',
         'Water Logging', json.dumps([]), 26.9310, 75.8170,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'open', 'high', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-jaipur-9', 'Burning of waste in open near Galta Gate',
         'People are burning household and plastic waste openly near Galta Gate. Toxic smoke affecting residents.',
         'Garbage', json.dumps([]), 26.9280, 75.8350,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'open', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=7)).isoformat()),

        ('issue-jaipur-10', 'Low voltage issue in Kishanpole Bazar area',
         'Persistent low voltage in Kishanpole Bazar is damaging electrical appliances. ACs and refrigerators are burning out.',
         'Electricity', json.dumps([]), 26.9200, 75.8195,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'open', 'medium', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=9)).isoformat()),

        ('issue-jaipur-11', 'Missing manhole cover near City Palace',
         'A manhole cover near the City Palace tourist area is missing. A tourist almost fell in yesterday.',
         'Safety', json.dumps([]), 26.9256, 75.8266,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'in_progress', 'critical', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-jaipur-12', 'Broken road near Amber Road junction',
         'The road near Amber Road and Zorawar Singh Gate junction is badly broken with exposed rebar.',
         'Pothole', json.dumps([]), 26.9350, 75.8310,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'open', 'medium', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=11)).isoformat()),

        ('issue-jaipur-13', 'Choked drain causing water backup at Chaura Rasta',
         'The main drain at Chaura Rasta is choked. Grey water backs up into roadside shops whenever it rains.',
         'Water Logging', json.dumps([]), 26.9220, 75.8220,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'under_review', 'high', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),

        ('issue-jaipur-14', 'Stray cattle eating from open garbage near Sanganeri Gate',
         'Open garbage heaps near Sanganeri Gate attract stray cattle which then block traffic on the main road.',
         'Garbage', json.dumps([]), 26.9100, 75.8000,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'open', 'low', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=12)).isoformat()),

        ('issue-jaipur-15', 'Frequent power failures in walled city area',
         'The walled city area of Jaipur faces 5-6 power cuts daily lasting 1-2 hours each. Tourism businesses are badly affected.',
         'Electricity', json.dumps([]), 26.9230, 75.8240,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'in_progress', 'high', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=8)).isoformat()),

        ('issue-jaipur-16', 'Unguarded railway crossing near Chandpole',
         'The railway crossing near Chandpole has no gates or warning signals. Accidents happen regularly.',
         'Safety', json.dumps([]), 26.9175, 75.8120,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'under_review', 'critical', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-jaipur-17', 'Crater-like pothole on JLN Marg',
         'A huge pothole on JLN Marg near SMS Stadium has been causing accidents for weeks. Temporary filling keeps washing away.',
         'Pothole', json.dumps([]), 26.9070, 75.8020,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'open', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=10)).isoformat()),

        ('issue-jaipur-18', 'Stagnant rainwater pool near Albert Hall',
         'A large pool of stagnant rainwater near Albert Hall Museum is becoming a mosquito breeding ground.',
         'Water Logging', json.dumps([]), 26.9120, 75.8130,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'open', 'medium', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=6)).isoformat()),

        ('issue-jaipur-19', 'Rotting vegetable waste at Ramganj market',
         'Unsold vegetables are rotting at Ramganj wholesale market. The stench and flies are unbearable for shoppers.',
         'Garbage', json.dumps([]), 26.9150, 75.8280,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'open', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-jaipur-20', 'Exposed underground cable near Tonk Road',
         'Underground electrical cable is exposed after road digging on Tonk Road. Workers left the site without covering it.',
         'Electricity', json.dumps([]), 26.8980, 75.8060,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'open', 'critical', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-jaipur-21', 'Broken street mirrors at blind curve near Zorawar Singh Gate',
         'Convex mirrors at a dangerous blind curve near Zorawar Singh Gate are broken. Multiple near-miss accidents daily.',
         'Safety', json.dumps([]), 26.9300, 75.8290,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'open', 'medium', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=13)).isoformat()),

        ('issue-jaipur-22', 'Damaged speed breaker near SMS Hospital',
         'The speed breaker outside SMS Hospital gate is half-destroyed. Sharp edges are damaging car underbodies.',
         'Pothole', json.dumps([]), 26.9050, 75.8080,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'resolved', 'medium', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=20)).isoformat()),

        ('issue-jaipur-23', 'Leaking water pipeline flooding Johari Bazar lane',
         'A leaking municipal water pipeline is flooding a narrow lane in Johari Bazar. Shop goods are getting water damaged.',
         'Water Logging', json.dumps([]), 26.9218, 75.8245,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'in_progress', 'high', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-jaipur-24', 'Foul smell from clogged sewer at Chandpole Bazar',
         'A clogged sewer line at Chandpole Bazar is emitting an unbearable foul smell. Customers are avoiding the market.',
         'Garbage', json.dumps([]), 26.9190, 75.8140,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'under_review', 'high', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),

        ('issue-jaipur-25', 'Streetlight outage on entire stretch of Station Road',
         'All streetlights on Station Road from the railway station to MI Road are out. The 1 km stretch is pitch dark at night.',
         'Electricity', json.dumps([]), 26.9170, 75.8050,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'open', 'high', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=7)).isoformat()),

        ('issue-jaipur-26', 'Illegal parking blocking ambulance route near SMS Hospital',
         'Illegal car parking on the approach road to SMS Hospital emergency is blocking ambulance access regularly.',
         'Safety', json.dumps([]), 26.9055, 75.8075,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'in_progress', 'critical', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-jaipur-27', 'Faded zebra crossing near Government Hostel Circle',
         'The zebra crossing near Government Hostel Circle is completely faded. Students crossing the busy road are at risk.',
         'Others', json.dumps([]), 26.9140, 75.8110,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'open', 'low', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=18)).isoformat()),

        ('issue-jaipur-28', 'Public water tap running 24/7 near Surajpole',
         'A public water tap near Surajpole has a broken valve and has been running continuously for a week, wasting water.',
         'Others', json.dumps([]), 26.9195, 75.8290,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'open', 'medium', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=6)).isoformat()),

        ('issue-jaipur-29', 'Crumbling heritage wall near Nahargarh Fort base',
         'Part of the outer heritage wall near the base of Nahargarh Fort is crumbling. Stones fall on the road below.',
         'Others', json.dumps([]), 26.9370, 75.8155,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'under_review', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-jaipur-30', 'Loose gravel on Amer Road causing skids',
         'Recently resurfaced Amer Road has loose gravel that causes two-wheelers to skid. Two accidents this week already.',
         'Pothole', json.dumps([]), 26.9380, 75.8340,
         'w3333333-3333-3333-3333-333333333333', 0, None,
         'open', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        # ═══════════════════════════════════════════════════════════════════════
        #  LUCKNOW  (ward w4444444-..., base coords 26.85, 80.95)
        # ═══════════════════════════════════════════════════════════════════════
        ('issue-lucknow-2', 'Deep potholes on Shahnajaf Road',
         'The road from Hazratganj to La Martiniere has deep potholes that fill with water during rain, hiding their depth.',
         'Pothole', json.dumps([]), 26.8520, 80.9460,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'open', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-lucknow-3', 'Waterlogging at Kaiserbagh crossing',
         'The Kaiserbagh crossing gets waterlogged after every shower. Traffic is diverted for hours causing massive jams.',
         'Water Logging', json.dumps([]), 26.8480, 80.9380,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'open', 'critical', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-lucknow-4', 'Garbage dump near Residency heritage site',
         'Trash is being dumped near the historic Residency compound wall. It is spoiling the heritage experience for visitors.',
         'Garbage', json.dumps([]), 26.8540, 80.9400,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'under_review', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=6)).isoformat()),

        ('issue-lucknow-5', 'Exposed electric wiring at Aminabad bus stop',
         'Open electric wires are hanging from the bus stop shelter roof at Aminabad. A serious shock hazard in rain.',
         'Electricity', json.dumps([]), 26.8465, 80.9350,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'in_progress', 'critical', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-lucknow-6', 'Purse snatching incidents near Janpath Market',
         'At least 5 purse snatching incidents have been reported near Janpath Market this month. More police patrolling needed.',
         'Safety', json.dumps([]), 26.8500, 80.9440,
         'w4444444-4444-4444-4444-444444444444', 1, None,
         'open', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-lucknow-7', 'Uneven road near Charbagh Railway Station exit',
         'The road surface outside Gate No. 2 of Charbagh station is extremely uneven. Auto-rickshaws bounce violently.',
         'Pothole', json.dumps([]), 26.8550, 80.9230,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'open', 'medium', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=10)).isoformat()),

        ('issue-lucknow-8', 'Flooded basement parking at Saharaganj Mall area',
         'Basement parking areas near Saharaganj Mall flood during monsoon. Cars have been damaged multiple times.',
         'Water Logging', json.dumps([]), 26.8530, 80.9300,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'open', 'high', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),

        ('issue-lucknow-9', 'Waste burning in open near Gomti riverbank',
         'Residents near Gomti riverbank are burning waste in the open every evening. Smoke enters nearby apartments.',
         'Garbage', json.dumps([]), 26.8600, 80.9500,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'open', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=8)).isoformat()),

        ('issue-lucknow-10', 'Fluctuating voltage damaging appliances in Lalbagh',
         'Lalbagh area is experiencing severe voltage fluctuations. Multiple AC compressors and refrigerators have burned out.',
         'Electricity', json.dumps([]), 26.8560, 80.9470,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'under_review', 'high', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=7)).isoformat()),

        ('issue-lucknow-11', 'Broken boundary wall of government school exposing children',
         'The boundary wall of the government primary school on MG Marg has collapsed. Children are exposed to traffic.',
         'Safety', json.dumps([]), 26.8495, 80.9410,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'in_progress', 'critical', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-lucknow-12', 'Road damaged by utility digging near GPO',
         'The road near GPO (General Post Office) was dug up for laying cables 3 months ago. It was never restored properly.',
         'Pothole', json.dumps([]), 26.8505, 80.9430,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'open', 'medium', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=14)).isoformat()),

        ('issue-lucknow-13', 'Overflowing drain near Hussainabad Clock Tower',
         'The drain near the iconic Hussainabad Clock Tower overflows regularly. Foul water pools around the heritage monument.',
         'Water Logging', json.dumps([]), 26.8690, 80.9150,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'under_review', 'high', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-lucknow-14', 'Plastic waste choking Gomti River near Daliganj Bridge',
         'Massive amounts of plastic waste floating in Gomti River near Daliganj Bridge. The river looks like a garbage dump.',
         'Garbage', json.dumps([]), 26.8720, 80.9280,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'open', 'high', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=6)).isoformat()),

        ('issue-lucknow-15', 'Defunct traffic signals at Parivartan Chowk',
         'Traffic signals at the busy Parivartan Chowk intersection have been non-functional for a week. Manual traffic control is failing.',
         'Electricity', json.dumps([]), 26.8475, 80.9370,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'in_progress', 'high', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),

        ('issue-lucknow-16', 'Abandoned building used by anti-social elements near Nakkhas',
         'An abandoned building near Nakkhas market is being used for illegal activities. Residents feel unsafe at night.',
         'Safety', json.dumps([]), 26.8580, 80.9200,
         'w4444444-4444-4444-4444-444444444444', 1, None,
         'open', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=9)).isoformat()),

        ('issue-lucknow-17', 'Pothole near Vidhan Sabha entrance',
         'A large pothole near the Vidhan Sabha (State Assembly) main road is embarrassing for the capital city image.',
         'Pothole', json.dumps([]), 26.8450, 80.9340,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'resolved', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=18)).isoformat()),

        ('issue-lucknow-18', 'Sewage leak into residential area near Narhi',
         'A broken sewage pipe is leaking into the lanes of Narhi residential colony. Children are falling sick.',
         'Water Logging', json.dumps([]), 26.8490, 80.9390,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'in_progress', 'critical', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-lucknow-19', 'Dead animals not cleared from Aminabad drain',
         'Dead rats and a dog carcass have been seen floating in the open drain at Aminabad. Health hazard for the dense market area.',
         'Garbage', json.dumps([]), 26.8470, 80.9345,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'open', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-lucknow-20', 'Power line sagging over kids\' playground in Gomti Nagar',
         'A power line has sagged dangerously low over a children\'s playground in Gomti Nagar. Children are at electrocution risk.',
         'Electricity', json.dumps([]), 26.8560, 80.9710,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'open', 'critical', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-lucknow-21', 'Lack of pedestrian crossing at Hazratganj main road',
         'There is no pedestrian crossing on the busy Hazratganj main road for a 500-metre stretch. Jaywalking is causing accidents.',
         'Safety', json.dumps([]), 26.8515, 80.9420,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'open', 'medium', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=11)).isoformat()),

        ('issue-lucknow-22', 'Badly patched road near KGMU hospital',
         'Road patches near KGMU hospital are uneven and poorly done. Ambulances are jolted badly on this stretch.',
         'Pothole', json.dumps([]), 26.8535, 80.9320,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'open', 'medium', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=13)).isoformat()),

        ('issue-lucknow-23', 'Blocked culvert causing flooding near Bakshi ka Talab',
         'A culvert near Bakshi ka Talab is completely blocked with debris. Surrounding fields and roads are flooded.',
         'Water Logging', json.dumps([]), 26.8900, 80.9100,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'open', 'high', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=7)).isoformat()),

        ('issue-lucknow-24', 'Overflowing skip bin near Chowk market',
         'The large skip bin placed at Chowk market is overflowing with market waste. No collection for 4 days.',
         'Garbage', json.dumps([]), 26.8610, 80.9180,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'open', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-lucknow-25', 'Electrical short circuit in street light panel near 1090 Chauraha',
         'The street light control panel at 1090 Chauraha short-circuited. An electrical fire burned the panel cabinet.',
         'Electricity', json.dumps([]), 26.8490, 80.9455,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'under_review', 'high', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=6)).isoformat()),

        ('issue-lucknow-26', 'Drug peddling activity reported near old Lucknow railway yard',
         'Residents near the old railway yard have noticed suspicious drug peddling activities in the evenings.',
         'Safety', json.dumps([]), 26.8570, 80.9250,
         'w4444444-4444-4444-4444-444444444444', 1, None,
         'open', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),

        ('issue-lucknow-27', 'Encroached footpath on Vidhan Sabha Marg',
         'Street vendors have completely encroached the footpath on Vidhan Sabha Marg. Pedestrians walk on the road amidst traffic.',
         'Others', json.dumps([]), 26.8460, 80.9335,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'open', 'low', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=16)).isoformat()),

        ('issue-lucknow-28', 'Broken public water hand pump in Aminabad colony',
         'The public hand pump in Aminabad colony has been broken for weeks. Residents have to walk far for water.',
         'Others', json.dumps([]), 26.8468, 80.9355,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'open', 'medium', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=10)).isoformat()),

        ('issue-lucknow-29', 'Fallen tree blocking lane near Butler Palace',
         'A large tree fell during last night\'s storm and is completely blocking a lane near Butler Palace colony.',
         'Others', json.dumps([]), 26.8540, 80.9480,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'in_progress', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-lucknow-30', 'Crumbling bridge railing on Gomti river bridge near Daliganj',
         'The railing on the old Gomti bridge at Daliganj is rusted and crumbling. Sections are completely missing.',
         'Safety', json.dumps([]), 26.8710, 80.9270,
         'w4444444-4444-4444-4444-444444444444', 0, None,
         'under_review', 'critical', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        # ═══════════════════════════════════════════════════════════════════════
        #  NAGPUR  (ward w5555555-..., base coords 21.15, 79.08)
        # ═══════════════════════════════════════════════════════════════════════
        ('issue-nagpur-1', 'Pothole causing accidents near Sitabuldi Fort',
         'A deep pothole on the approach road to Sitabuldi Fort has caused multiple bike accidents this week.',
         'Pothole', json.dumps([]), 21.1480, 79.0810,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-nagpur-2', 'Chronic waterlogging at Variety Square underpass',
         'Variety Square underpass floods every monsoon. This year it has already been closed 4 times in 2 weeks.',
         'Water Logging', json.dumps([]), 21.1420, 79.0760,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'in_progress', 'critical', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-nagpur-3', 'Garbage piling up at Dharampeth Colony corner',
         'The garbage collection point at Dharampeth Colony corner has not been serviced for a week. Stray animals everywhere.',
         'Garbage', json.dumps([]), 21.1450, 79.0780,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'high', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),

        ('issue-nagpur-4', 'Frequent power trips in Seminary Hills area',
         'Seminary Hills area is experiencing power trips 10-12 times daily. Electronic equipment is getting damaged.',
         'Electricity', json.dumps([]), 21.1530, 79.0720,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'under_review', 'high', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-nagpur-5', 'Unsafe pedestrian crossing at Rani Jhansi Square',
         'There is no pedestrian signal at the busy Rani Jhansi Square. Elderly people cannot cross safely.',
         'Safety', json.dumps([]), 21.1500, 79.0830,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'medium', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=7)).isoformat()),

        ('issue-nagpur-6', 'Broken road surface near Nagpur Railway Station',
         'The road surface near platform 1 exit of Nagpur Railway Station is badly broken with exposed metal rods.',
         'Pothole', json.dumps([]), 21.1490, 79.0870,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'medium', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=9)).isoformat()),

        ('issue-nagpur-7', 'Nag River overflow causing flooding in Mahal area',
         'The Nag River has overflowed at multiple points in Mahal area. Ground floor homes are inundated.',
         'Water Logging', json.dumps([]), 21.1460, 79.0920,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'critical', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-nagpur-8', 'Illegal dumping of industrial waste near MIDC',
         'A factory near MIDC Hingna is illegally dumping chemical waste in the open. Fumes are toxic.',
         'Garbage', json.dumps([]), 21.1200, 79.0300,
         'w5555555-5555-5555-5555-555555555555', 1, None,
         'under_review', 'critical', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-nagpur-9', 'Transformer blast in Sadar area',
         'A transformer in Sadar area exploded last night. The entire neighbourhood has been without power for 18 hours.',
         'Electricity', json.dumps([]), 21.1510, 79.0850,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'in_progress', 'critical', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-nagpur-10', 'Missing barricade at construction site near Law College Square',
         'A deep trench dug for metro construction near Law College Square has no barricade or warning signs at night.',
         'Safety', json.dumps([]), 21.1440, 79.0750,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'in_progress', 'critical', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-nagpur-11', 'Crater on Wardha Road near Airport T-point',
         'A large crater has formed on Wardha Road near the airport turn. Vehicles swerve suddenly to avoid it.',
         'Pothole', json.dumps([]), 21.1020, 79.0530,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=6)).isoformat()),

        ('issue-nagpur-12', 'Blocked storm water drain at Manish Nagar',
         'The storm water drain at Manish Nagar is completely blocked with construction debris and silt.',
         'Water Logging', json.dumps([]), 21.1100, 79.0600,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'high', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=8)).isoformat()),

        ('issue-nagpur-13', 'Overflowing waste at Ganeshpeth bus stand',
         'The dustbins at Ganeshpeth bus stand are perpetually overflowing. Passengers have to navigate through waste.',
         'Garbage', json.dumps([]), 21.1470, 79.0890,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-nagpur-14', 'Streetlights out on entire Amravati Road stretch',
         'All streetlights on a 2 km stretch of Amravati Road are non-functional. The road is pitch dark and dangerous.',
         'Electricity', json.dumps([]), 21.1550, 79.0680,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'high', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=10)).isoformat()),

        ('issue-nagpur-15', 'Stray dog packs near Ambazari Garden',
         'Large packs of stray dogs near Ambazari Garden chase joggers and morning walkers. Three bite cases reported.',
         'Safety', json.dumps([]), 21.1380, 79.0530,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),

        ('issue-nagpur-16', 'Sunken road patch near Cotton Market',
         'A freshly patched section on the road near Cotton Market has sunk within a week of repair. Poor quality work evident.',
         'Pothole', json.dumps([]), 21.1485, 79.0800,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'medium', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=12)).isoformat()),

        ('issue-nagpur-17', 'Overflowing sewer near Jaripatka locality',
         'The main sewer line near Jaripatka has been overflowing for 3 days. Raw sewage is on the streets.',
         'Water Logging', json.dumps([]), 21.1600, 79.0850,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'in_progress', 'critical', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-nagpur-18', 'Plastic waste in Futala Lake polluting water',
         'Visitors are dumping plastic bottles and food wrappers in Futala Lake. The lake water quality is deteriorating fast.',
         'Garbage', json.dumps([]), 21.1350, 79.0460,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'under_review', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=7)).isoformat()),

        ('issue-nagpur-19', 'Dangling cable from electricity pole on Central Avenue',
         'An electricity cable has snapped and is dangling from a pole on Central Avenue. Sparks visible during wind.',
         'Electricity', json.dumps([]), 21.1495, 79.0815,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'critical', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-nagpur-20', 'Eve-teasing reported near Kasturchand Park',
         'Women visiting Kasturchand Park in the evening have reported eve-teasing. The park lacks adequate lighting.',
         'Safety', json.dumps([]), 21.1465, 79.0770,
         'w5555555-5555-5555-5555-555555555555', 1, None,
         'open', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=6)).isoformat()),

        ('issue-nagpur-21', 'Pothole-ridden internal roads in Pratap Nagar',
         'Almost every internal road in Pratap Nagar has potholes. Residents feel the area has been neglected for years.',
         'Pothole', json.dumps([]), 21.1150, 79.0650,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'medium', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=15)).isoformat()),

        ('issue-nagpur-22', 'Rainwater entering houses in Bajaj Nagar',
         'Low-lying houses in Bajaj Nagar colony get flooded with every heavy rain. Drainage infrastructure is inadequate.',
         'Water Logging', json.dumps([]), 21.1410, 79.0710,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'high', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-nagpur-23', 'Dead fish washed up near Gorewada Lake',
         'Dozens of dead fish have washed up on the banks of Gorewada Lake. Possible water contamination suspected.',
         'Garbage', json.dumps([]), 21.1700, 79.0300,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'high', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-nagpur-24', 'Electric pole leaning after truck hit in Itwari',
         'A truck hit an electric pole in Itwari market area. The pole is now leaning at 30 degrees.',
         'Electricity', json.dumps([]), 21.1520, 79.0880,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'in_progress', 'high', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-nagpur-25', 'Uncovered construction pit near Shankar Nagar Square',
         'A deep pit dug for laying pipes near Shankar Nagar Square is left uncovered overnight without any marking.',
         'Safety', json.dumps([]), 21.1430, 79.0740,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'under_review', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-nagpur-26', 'Road cracks near Zero Mile',
         'The road near the iconic Zero Mile marker has developed cracks and is starting to break apart.',
         'Pothole', json.dumps([]), 21.1505, 79.0795,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'low', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=18)).isoformat()),

        ('issue-nagpur-27', 'Overflowing public toilet at Ganeshpeth',
         'The public toilet at Ganeshpeth bus terminal is in a deplorable condition. Sewage overflows onto the footpath.',
         'Others', json.dumps([]), 21.1475, 79.0895,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),

        ('issue-nagpur-28', 'Damaged bus shelter at Dharampeth Science College stop',
         'The bus shelter at Dharampeth Science College stop has a collapsed roof. Commuters have no shade from sun or rain.',
         'Others', json.dumps([]), 21.1445, 79.0785,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'low', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=21)).isoformat()),

        ('issue-nagpur-29', 'Noise from illegal stone crusher near Besa',
         'An illegal stone crushing unit near Besa village operates at night causing noise and dust pollution.',
         'Others', json.dumps([]), 21.0950, 79.0500,
         'w5555555-5555-5555-5555-555555555555', 0, None,
         'open', 'medium', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=8)).isoformat()),

        # ═══════════════════════════════════════════════════════════════════════
        #  KOLKATA  (ward w6666666-..., base coords 22.57, 88.36)
        # ═══════════════════════════════════════════════════════════════════════
        ('issue-kolkata-1', 'Pothole on EM Bypass near Science City',
         'A large pothole on EM Bypass near Science City exit ramp is causing traffic slowdowns and minor accidents.',
         'Pothole', json.dumps([]), 22.5400, 88.3960,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-kolkata-2', 'Severe waterlogging at Park Circus underpass',
         'Park Circus 7-point underpass is submerged under 4 feet of water after heavy rain. Traffic completely halted.',
         'Water Logging', json.dumps([]), 22.5370, 88.3630,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'critical', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-kolkata-3', 'Garbage overflow at Salt Lake Sector V bus stand',
         'The waste bins at Salt Lake Sector V bus stand have not been emptied for days. IT workers are complaining.',
         'Garbage', json.dumps([]), 22.5720, 88.4310,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'under_review', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),

        ('issue-kolkata-4', 'Frequent load shedding in Salt Lake Sector III',
         'Sector III of Salt Lake City is facing load shedding for 4-5 hours daily despite being a planned township.',
         'Electricity', json.dumps([]), 22.5780, 88.4100,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'in_progress', 'high', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-kolkata-5', 'Mugging incidents near Rabindra Sarobar metro station',
         'Two mugging incidents reported near Rabindra Sarobar metro station after 9 PM this week.',
         'Safety', json.dumps([]), 22.5130, 88.3640,
         'w6666666-6666-6666-6666-666666666666', 1, None,
         'open', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-kolkata-6', 'Road damaged by metro construction near Esplanade',
         'Roads around Esplanade metro construction site are badly damaged. Pedestrians and vehicles struggle daily.',
         'Pothole', json.dumps([]), 22.5650, 88.3530,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'under_review', 'medium', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=7)).isoformat()),

        ('issue-kolkata-7', 'Canal overflow flooding homes in Ultadanga',
         'The canal near Ultadanga has overflowed, flooding homes in the low-lying area. Residents are evacuating.',
         'Water Logging', json.dumps([]), 22.5890, 88.3890,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'in_progress', 'critical', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-kolkata-8', 'Heap of construction debris near Karunamoyee',
         'Construction debris from a nearby building project has been dumped on public land near Karunamoyee bus stand.',
         'Garbage', json.dumps([]), 22.5740, 88.4060,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'low', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=11)).isoformat()),

        ('issue-kolkata-9', 'Sparking junction box near Gariahat crossing',
         'An electrical junction box at Gariahat crossing sparks every time it rains. A major fire hazard.',
         'Electricity', json.dumps([]), 22.5180, 88.3680,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'critical', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-kolkata-10', 'Unlit lanes in Jadavpur University area',
         'Lanes around Jadavpur University campus are completely unlit. Female students feel unsafe walking at night.',
         'Safety', json.dumps([]), 22.4990, 88.3710,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=6)).isoformat()),

        ('issue-kolkata-11', 'Pothole cluster on VIP Road near Baguihati',
         'Multiple potholes on VIP Road near Baguihati make the stretch treacherous for drivers, especially at night.',
         'Pothole', json.dumps([]), 22.5950, 88.4050,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),

        ('issue-kolkata-12', 'Permanent puddle at Sealdah station exit',
         'A permanent water puddle at Sealdah station\'s south exit never dries up. Pedestrians wade through dirty water.',
         'Water Logging', json.dumps([]), 22.5680, 88.3700,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'medium', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=9)).isoformat()),

        ('issue-kolkata-13', 'Waste dumped in drain near Beleghata',
         'Household waste is being dumped directly into the storm drain at Beleghata. Blocks the drain completely.',
         'Garbage', json.dumps([]), 22.5600, 88.3830,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'high', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-kolkata-14', 'Streetlight out on AJC Bose Road for weeks',
         'Streetlights on a 300-metre stretch of AJC Bose Road have been non-functional for 3 weeks.',
         'Electricity', json.dumps([]), 22.5500, 88.3580,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'medium', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=13)).isoformat()),

        ('issue-kolkata-15', 'Broken footpath near Victoria Memorial',
         'The public footpath near Victoria Memorial\'s south gate has broken tiles and exposed nails. Tourists have been injured.',
         'Safety', json.dumps([]), 22.5445, 88.3430,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'in_progress', 'medium', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=8)).isoformat()),

        ('issue-kolkata-16', 'Road cave-in near Ruby Hospital on EM Bypass',
         'A section of road near Ruby Hospital on EM Bypass has caved in. A water main break underneath is suspected.',
         'Pothole', json.dumps([]), 22.5180, 88.3950,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'in_progress', 'critical', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=2)).isoformat()),

        ('issue-kolkata-17', 'Flooded metro construction site at Howrah Maidan',
         'Metro construction site at Howrah Maidan is flooded. Muddy water is flowing onto the main road.',
         'Water Logging', json.dumps([]), 22.5850, 88.3420,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'high', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=3)).isoformat()),

        ('issue-kolkata-18', 'Rotting fish waste near Maniktala fish market',
         'Fish waste from Maniktala market is dumped on the roadside daily. The stench is unbearable within 100 metres.',
         'Garbage', json.dumps([]), 22.5790, 88.3770,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'under_review', 'high', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=6)).isoformat()),

        ('issue-kolkata-19', 'Exposed cable from broken pole near New Market',
         'A broken wooden pole near New Market has an exposed live cable dangling at head height. Extremely dangerous.',
         'Electricity', json.dumps([]), 22.5570, 88.3530,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'in_progress', 'critical', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=1)).isoformat()),

        ('issue-kolkata-20', 'Pick-pocketing rampant on Gariahat Bridge',
         'Pick-pocketing incidents on Gariahat Bridge during evening rush hour have increased significantly.',
         'Safety', json.dumps([]), 22.5195, 88.3685,
         'w6666666-6666-6666-6666-666666666666', 1, None,
         'open', 'medium', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=7)).isoformat()),

        ('issue-kolkata-21', 'Broken manhole cover on CIT Road',
         'A broken manhole cover on CIT Road near Phoolbagan has its sharp edges sticking up, slashing vehicle tyres.',
         'Pothole', json.dumps([]), 22.5650, 88.3800,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'high', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=4)).isoformat()),

        ('issue-kolkata-22', 'Flooded pedestrian subway at Lake Market',
         'The pedestrian subway at Lake Market fills up with water even after mild rain. Pedestrians risk slipping.',
         'Water Logging', json.dumps([]), 22.5230, 88.3660,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'medium', 'd2222222-2222-2222-2222-222222222222',
         (datetime.utcnow() - timedelta(days=10)).isoformat()),

        ('issue-kolkata-23', 'Plastic waste in Rabindra Sarobar lake',
         'Plastic bags and bottles are polluting Rabindra Sarobar. The scenic lake is losing its beauty and ecology.',
         'Garbage', json.dumps([]), 22.5110, 88.3630,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=8)).isoformat()),

        ('issue-kolkata-24', 'Low-hanging wire near Deshapriya Park',
         'An internet cable has sagged to head height near Deshapriya Park entrance. Tall persons risk getting entangled.',
         'Electricity', json.dumps([]), 22.5165, 88.3600,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'low', 'd3333333-3333-3333-3333-333333333333',
         (datetime.utcnow() - timedelta(days=14)).isoformat()),

        ('issue-kolkata-25', 'Stray cattle on Eastern Metropolitan Bypass',
         'Stray cattle frequently wander onto EM Bypass near Kasba. This is an accident waiting to happen at night.',
         'Safety', json.dumps([]), 22.5100, 88.3930,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'high', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=5)).isoformat()),

        ('issue-kolkata-26', 'Pothole near Tollygunge Metro station',
         'A deep pothole right outside Tollygunge Metro station Gate 1 fills with water and is invisible during rain.',
         'Pothole', json.dumps([]), 22.4980, 88.3530,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'resolved', 'medium', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=22)).isoformat()),

        ('issue-kolkata-27', 'Broken public urinal near Shyambazar 5-point crossing',
         'The public urinal near Shyambazar 5-point crossing is broken and non-functional. Open urination on the rise.',
         'Others', json.dumps([]), 22.5930, 88.3720,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'medium', 'd4444444-4444-4444-4444-444444444444',
         (datetime.utcnow() - timedelta(days=9)).isoformat()),

        ('issue-kolkata-28', 'Damaged park bench in Central Park Salt Lake',
         'Multiple benches in Central Park, Salt Lake are broken and have rusted nails sticking out. Unsafe for visitors.',
         'Others', json.dumps([]), 22.5750, 88.4150,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'low', 'd1111111-1111-1111-1111-111111111111',
         (datetime.utcnow() - timedelta(days=17)).isoformat()),

        ('issue-kolkata-29', 'Illegal hoarding blocking footpath near Minto Park',
         'A large illegal advertising hoarding near Minto Park is blocking the entire footpath. Pedestrians walk on the road.',
         'Others', json.dumps([]), 22.5520, 88.3510,
         'w6666666-6666-6666-6666-666666666666', 0, None,
         'open', 'low', 'd5555555-5555-5555-5555-555555555555',
         (datetime.utcnow() - timedelta(days=12)).isoformat()),
    ]
    for row in extra_issues:
        cursor.execute("""
        INSERT OR IGNORE INTO issues (
            id, title, description, category, image_urls, latitude, longitude,
            ward_id, is_anonymous, reporter_id, status, priority, department_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, row)

    # Seed issue votes (with dummy users to satisfy foreign keys if enabled)
    # Indore: 45 votes
    for i in range(45):
        uid = f"vote-user-indore-{i}"
        cursor.execute("INSERT OR IGNORE INTO users (id, email, full_name, role) VALUES (?, ?, ?, 'citizen')",
                       (uid, f"{uid}@dummy.com", f"Indore Voter {i}"))
        cursor.execute("INSERT OR IGNORE INTO issue_votes (issue_id, user_id) VALUES ('issue-indore-1', ?)", (uid,))

    # Patna: 82 votes
    for i in range(82):
        uid = f"vote-user-patna-{i}"
        cursor.execute("INSERT OR IGNORE INTO users (id, email, full_name, role) VALUES (?, ?, ?, 'citizen')",
                       (uid, f"{uid}@dummy.com", f"Patna Voter {i}"))
        cursor.execute("INSERT OR IGNORE INTO issue_votes (issue_id, user_id) VALUES ('issue-patna-1', ?)", (uid,))

    # Jaipur: 21 votes
    for i in range(21):
        uid = f"vote-user-jaipur-{i}"
        cursor.execute("INSERT OR IGNORE INTO users (id, email, full_name, role) VALUES (?, ?, ?, 'citizen')",
                       (uid, f"{uid}@dummy.com", f"Jaipur Voter {i}"))
        cursor.execute("INSERT OR IGNORE INTO issue_votes (issue_id, user_id) VALUES ('issue-jaipur-1', ?)", (uid,))

    # Lucknow: 94 votes
    for i in range(94):
        uid = f"vote-user-lucknow-{i}"
        cursor.execute("INSERT OR IGNORE INTO users (id, email, full_name, role) VALUES (?, ?, ?, 'citizen')",
                       (uid, f"{uid}@dummy.com", f"Lucknow Voter {i}"))
        cursor.execute("INSERT OR IGNORE INTO issue_votes (issue_id, user_id) VALUES ('issue-lucknow-1', ?)", (uid,))

    # Seed comments
    comments = [
        ('c1', 'issue-indore-1', 'u-siddharth-jain', 'Almost slipped here yesterday on my scooty. Glad this has been reported!', 0,
         (datetime.utcnow() - timedelta(days=2, hours=12)).isoformat()),
        ('lc1', 'issue-lucknow-1', 'u-rakesh-yadav', 'Yes, this was really scary. Thanks to the team for fixing it!', 0,
         (datetime.utcnow() - timedelta(days=8)).isoformat())
    ]
    for row in comments:
        cursor.execute("INSERT OR IGNORE INTO issue_comments (id, issue_id, user_id, content, is_anonymous, created_at) VALUES (?, ?, ?, ?, ?, ?)", row)

    # Seed status history
    history = [
        ('sh1', 'issue-indore-1', None, 'open', 'System', 'Issue reported and mapped to Rajwada Ward.', (datetime.utcnow() - timedelta(days=3)).isoformat()),
        ('sh2', 'issue-indore-1', 'open', 'under_review', 'u-officer-vikram', 'Assigned to the road maintenance inspection team.', (datetime.utcnow() - timedelta(days=2)).isoformat()),
        ('sh-patna-1', 'issue-patna-1', None, 'open', 'System', 'Issue reported and mapped to Kankarbagh Ward.', (datetime.utcnow() - timedelta(days=1)).isoformat()),
        ('sh-jaipur-1', 'issue-jaipur-1', None, 'open', 'System', 'Issue reported and mapped to Pink City Ward.', (datetime.utcnow() - timedelta(days=5)).isoformat()),
        ('sh-jaipur-2', 'issue-jaipur-1', 'open', 'under_review', 'u-officer-rahul', 'Reviewing waste collection schedule for Johri Bazar.', (datetime.utcnow() - timedelta(days=4)).isoformat()),
        ('sh-jaipur-3', 'issue-jaipur-1', 'under_review', 'in_progress', 'u-officer-rahul', 'Sanitation truck dispatched for clearance and clean-up.', (datetime.utcnow() - timedelta(days=2)).isoformat()),
        ('sh-luck-1', 'issue-lucknow-1', None, 'open', 'System', 'Issue reported and mapped to Hazratganj Ward.', (datetime.utcnow() - timedelta(days=10)).isoformat()),
        ('sh-luck-2', 'issue-lucknow-1', 'open', 'in_progress', 'u-officer-alok', 'Repair order raised with electrical contractor.', (datetime.utcnow() - timedelta(days=9)).isoformat()),
        ('sh-luck-3', 'issue-lucknow-1', 'in_progress', 'resolved', 'u-officer-alok', 'Bulbs and wiring replaced. All streetlights are working fine now.', (datetime.utcnow() - timedelta(days=8)).isoformat())
    ]
    for sh_id, iss_id, s_from, s_to, changed_by, comm, c_at in history:
        cursor.execute("INSERT OR IGNORE INTO issue_status_history (id, issue_id, status_from, status_to, changed_by, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (sh_id, iss_id, s_from, s_to, changed_by, comm, c_at))

    # Seed events
    events = [
        ('ev-1', 'Rajwada Ward Cleanup Drive', 
         'Join local residents this Sunday morning to clean up Rajwada park and sort plastic waste. Trash bags and refreshments will be provided.',
         'Clean-up Drive', None, 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=600',
         22.7196, 75.8577, 'Rajwada Central Garden, Indore',
         '2026-06-28T07:30:00Z', '2026-06-28T10:30:00Z', 0, 38),
        ('ev-2', 'Monsoon Preparedness Townhall Meeting',
         'Official ward officer meeting discussing storm water drain improvements, emergency waterlogging contacts, and power line checks before monsoon arrival.',
         'Ward Meeting', None, 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600',
         25.5940, 85.1560, 'Ward Community Hall, Kankarbagh, Patna',
         '2026-07-02T17:30:00Z', '2026-07-02T19:30:00Z', 1, 75),
        ('ev-3', 'Pink City Heritage Walk & Civic Awareness Campaign',
         'Explore the heritage lanes of Jaipur while learning about civic rights and how to report local issues via the LocalPulse app. Free for all residents.',
         'Awareness Campaign', None, 'https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=600',
         26.9240, 75.8268, 'Hawa Mahal Gate, Jaipur',
         '2026-07-05T08:00:00Z', '2026-07-05T11:00:00Z', 0, 52),
        ('ev-4', 'Lucknow Drain Cleaning Mega Drive',
         'Join Lucknow Municipal Corporation volunteers for a mega drain cleaning drive before peak monsoon. Gloves and boots provided. Community lunch afterwards.',
         'Clean-up Drive', None, 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=600',
         26.8510, 80.9425, 'Hazratganj Crossing, Lucknow',
         '2026-07-06T07:00:00Z', '2026-07-06T12:00:00Z', 1, 110),
        ('ev-5', 'Nagpur Ward Safety & Emergency Preparedness Workshop',
         'Workshop covering fire safety, earthquake readiness, and first-aid basics for Dharampeth Ward residents. Conducted by NMC and local fire brigade.',
         'Workshop', None, 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=600',
         21.1450, 79.0780, 'Dharampeth Community Centre, Nagpur',
         '2026-07-08T16:00:00Z', '2026-07-08T19:00:00Z', 1, 65),
        ('ev-6', 'Salt Lake Cycling for Clean Air Rally',
         'Mass cycling rally from Salt Lake Central Park to Eco Park to promote clean air and sustainable transport. Open to all age groups.',
         'Rally', None, 'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?q=80&w=600',
         22.5750, 88.4150, 'Central Park, Salt Lake, Kolkata',
         '2026-07-10T06:00:00Z', '2026-07-10T09:00:00Z', 0, 88),
        ('ev-7', 'Indore Zero-Waste Ward Challenge Kickoff',
         'Launch event for the inter-ward zero-waste challenge. Learn composting, segregation, and recycling. Prizes for the cleanest ward!',
         'Awareness Campaign', None, 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600',
         22.7200, 75.8550, 'Town Hall, Rajwada, Indore',
         '2026-07-12T10:00:00Z', '2026-07-12T13:00:00Z', 1, 45),
        ('ev-8', 'Kolkata Monsoon Health Camp',
         'Free health check-up camp focusing on waterborne diseases, dengue prevention, and first-aid. Organized by KMC Health Dept and local NGOs.',
         'Health Camp', None, 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?q=80&w=600',
         22.5680, 88.3700, 'Sector II Community Hall, Salt Lake, Kolkata',
         '2026-07-15T09:00:00Z', '2026-07-15T15:00:00Z', 1, 130)
    ]
    for ev_id, title, desc, cat, creator, img, lat, lon, addr, s_time, e_time, official, atts in events:
        cursor.execute("""
        INSERT OR IGNORE INTO events (
            id, title, description, category, creator_id, image_url, latitude, longitude,
            address, start_time, end_time, is_official, attendees
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (ev_id, title, desc, cat, creator, img, lat, lon, addr, s_time, e_time, official, atts))

    conn.commit()
    conn.close()
    print("Database successfully initialized and seeded.")

if __name__ == "__main__":
    init_db()
