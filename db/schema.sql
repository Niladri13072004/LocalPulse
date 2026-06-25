-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. WARDS TABLE (Geographic boundaries for city divisions)
CREATE TABLE IF NOT EXISTS wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    boundary GEOMETRY(Polygon, 4326) NOT NULL, -- PostGIS polygon representation
    department_contacts JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for spatial query optimization
CREATE INDEX IF NOT EXISTS idx_wards_boundary ON wards USING gist(boundary);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('citizen', 'admin')) DEFAULT 'citizen' NOT NULL,
    ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    xp INTEGER DEFAULT 0 NOT NULL,
    badges JSONB DEFAULT '[]'::jsonb,
    preferred_language VARCHAR(10) DEFAULT 'en' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ISSUES TABLE (Civic Reports)
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g. Pothole, Water Logging, Garbage
    image_urls TEXT[] DEFAULT '{}',
    coordinates GEOMETRY(Point, 4326) NOT NULL, -- PostGIS point
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    is_anonymous BOOLEAN DEFAULT false NOT NULL,
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) CHECK (status IN ('open', 'under_review', 'in_progress', 'resolved')) DEFAULT 'open' NOT NULL,
    priority VARCHAR(20) CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium' NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Spatial index for issues
CREATE INDEX IF NOT EXISTS idx_issues_coordinates ON issues USING gist(coordinates);
CREATE INDEX IF NOT EXISTS idx_issues_ward ON issues(ward_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);

-- 5. ISSUE VOTES (Upvotes)
CREATE TABLE IF NOT EXISTS issue_votes (
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (issue_id, user_id)
);

-- 6. ISSUE COMMENTS
CREATE TABLE IF NOT EXISTS issue_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. ISSUE STATUS HISTORY (Tracks issue resolution timelines)
CREATE TABLE IF NOT EXISTS issue_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    status_from VARCHAR(30),
    status_to VARCHAR(30) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- Clean-up Drive, Ward Meeting, Awareness
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    image_url TEXT,
    coordinates GEOMETRY(Point, 4326),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_official BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. SERVICE PROVIDERS TABLE
CREATE TABLE IF NOT EXISTS service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) NOT NULL, -- Plumber, Electrician, Tutor, etc.
    contact_phone VARCHAR(20) NOT NULL,
    description TEXT,
    rating NUMERIC(3,2) DEFAULT 0.00,
    status VARCHAR(20) CHECK (status IN ('unverified', 'verified')) DEFAULT 'unverified' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(30) NOT NULL, -- status_change, comment, nearby_issue, event
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
