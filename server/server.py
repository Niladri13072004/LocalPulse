import json
import math
import os
import sqlite3
import uuid
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

# Import database initialization from db.py
import db

PORT = 5000

def haversine(lat1, lon1, lat2, lon2):
    # Radius of earth in km
    R = 6371.0
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def normalize_status(status_str):
    if not status_str:
        return None
    s = status_str.strip().lower().replace(' ', '_')
    if s in ('open', 'under_review', 'in_progress', 'resolved'):
        return s
    return None

def normalize_category(cat_str):
    if not cat_str or cat_str.lower() == 'all':
        return None
    cat_lower = cat_str.strip().lower()
    if cat_lower == 'water logging' or cat_lower == 'water_logging':
        return 'Water Logging'
    for c in ['Pothole', 'Garbage', 'Electricity', 'Safety', 'Others']:
        if c.lower() == cat_lower:
            return c
    return cat_str

def format_event_datetime(start_str, end_str):
    try:
        # Parse ISO string
        start_str = start_str.replace('Z', '')
        end_str = end_str.replace('Z', '')
        start_dt = datetime.fromisoformat(start_str)
        end_dt = datetime.fromisoformat(end_str)
        
        date_val = start_dt.strftime("%b %d, %Y")
        time_val = f"{start_dt.strftime('%I:%M %p')} - {end_dt.strftime('%I:%M %p')}"
        return date_val, time_val
    except Exception:
        return "", ""

class LocalPulseRequestHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        # Set proper CORS headers so frontend at http://localhost:8085 can connect
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        query_params = parse_qs(parsed_url.query)

        if path == '/api/issues':
            self._handle_get_issues(query_params)
        elif path == '/api/events':
            self._handle_get_events()
        else:
            self.send_response(404)
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"error": "Not Found"}')

    def do_POST(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        # Read POST body
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        try:
            body = json.loads(post_data) if post_data else {}
        except json.JSONDecodeError:
            body = {}

        if path == '/api/issues':
            self._handle_post_issue(body)
        elif path.startswith('/api/issues/') and path.endswith('/upvote'):
            # Path format: /api/issues/<id>/upvote
            parts = path.split('/')
            if len(parts) == 5:
                issue_id = parts[3]
                self._handle_upvote_issue(issue_id, body)
            else:
                self._send_bad_request()
        elif path.startswith('/api/issues/') and path.endswith('/comments'):
            # Path format: /api/issues/<id>/comments
            parts = path.split('/')
            if len(parts) == 5:
                issue_id = parts[3]
                self._handle_post_comment(issue_id, body)
            else:
                self._send_bad_request()
        else:
            self.send_response(404)
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"error": "Not Found"}')

    def do_PUT(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        try:
            body = json.loads(post_data) if post_data else {}
        except json.JSONDecodeError:
            body = {}

        if path.startswith('/api/issues/') and path.endswith('/status'):
            # Path format: /api/issues/<id>/status
            parts = path.split('/')
            if len(parts) == 5:
                issue_id = parts[3]
                self._handle_put_status(issue_id, body)
            else:
                self._send_bad_request()
        else:
            self.send_response(404)
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"error": "Not Found"}')

    def _send_bad_request(self, message="Bad Request"):
        self.send_response(400)
        self.send_header('Content-Type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode('utf-8'))

    def _handle_get_issues(self, query_params):
        status_filter = query_params.get('status', [None])[0]
        category_filter = query_params.get('category', [None])[0]
        radius_filter = query_params.get('radius', [None])[0]
        lat_filter = query_params.get('latitude', [None])[0]
        lon_filter = query_params.get('longitude', [None])[0]

        # Normalized filters
        norm_status = normalize_status(status_filter)
        norm_category = normalize_category(category_filter)

        conn = sqlite3.connect(db.DB_PATH)
        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.cursor()

        # Build query
        query = """
        SELECT i.id, i.title, i.description, i.category, i.image_urls, i.latitude, i.longitude,
               i.is_anonymous, i.status, i.priority, i.created_at,
               w.name as wardName, w.city as city,
               d.name as departmentName,
               u.full_name as reporterName
        FROM issues i
        LEFT JOIN wards w ON i.ward_id = w.id
        LEFT JOIN departments d ON i.department_id = d.id
        LEFT JOIN users u ON i.reporter_id = u.id
        WHERE 1=1
        """
        params = []
        if norm_status:
            query += " AND i.status = ?"
            params.append(norm_status)
        if norm_category:
            query += " AND i.category = ?"
            params.append(norm_category)

        cursor.execute(query, params)
        rows = cursor.fetchall()

        issues_list = []
        for row in rows:
            iss_id, title, desc, cat, img_urls_json, lat, lon, is_anon, status, priority, c_at, ward_name, city_name, dept_name, rep_name = row
            
            # Fetch upvotes count
            cursor.execute("SELECT COUNT(*) FROM issue_votes WHERE issue_id = ?", (iss_id,))
            upvotes_count = cursor.fetchone()[0]

            # Fetch comments
            cursor.execute("""
            SELECT ic.id, ic.content, ic.is_anonymous, ic.created_at, u.full_name
            FROM issue_comments ic
            LEFT JOIN users u ON ic.user_id = u.id
            WHERE ic.issue_id = ?
            ORDER BY ic.created_at ASC
            """, (iss_id,))
            comments_rows = cursor.fetchall()
            comments = []
            for c_row in comments_rows:
                c_id, c_content, c_anon, c_created, c_user_name = c_row
                comments.append({
                    "id": c_id,
                    "userName": "Anonymous" if c_anon or not c_user_name else c_user_name,
                    "content": c_content,
                    "isAnonymous": bool(c_anon),
                    "createdAt": c_created
                })

            # Fetch status history
            cursor.execute("""
            SELECT sh.id, sh.status_from, sh.status_to, sh.changed_by, sh.comment, sh.created_at, u.full_name
            FROM issue_status_history sh
            LEFT JOIN users u ON sh.changed_by = u.id
            WHERE sh.issue_id = ?
            ORDER BY sh.created_at ASC
            """, (iss_id,))
            history_rows = cursor.fetchall()
            status_history = []
            for h_row in history_rows:
                h_id, s_from, s_to, chg_by, h_comment, h_created, u_name = h_row
                # Fallback to system or raw text if not a user ID
                changed_by_name = u_name if u_name else (chg_by if chg_by else "System")
                status_history.append({
                    "id": h_id,
                    "statusFrom": s_from,
                    "statusTo": s_to,
                    "changedBy": changed_by_name,
                    "comment": h_comment,
                    "createdAt": h_created
                })

            try:
                img_urls = json.loads(img_urls_json)
            except Exception:
                img_urls = []

            issue_obj = {
                "id": iss_id,
                "title": title,
                "description": desc,
                "category": cat,
                "imageUrls": img_urls,
                "latitude": float(lat),
                "longitude": float(lon),
                "wardName": ward_name or "Unknown Ward",
                "city": city_name or "Unknown City",
                "isAnonymous": bool(is_anon),
                "reporterName": "Anonymous Citizen" if is_anon or not rep_name else rep_name,
                "status": status,
                "priority": priority,
                "departmentName": dept_name or "Municipality",
                "createdAt": c_at,
                "upvotes": upvotes_count,
                "upvotedByUser": False, # client handles user-specific toggle state
                "comments": comments,
                "statusHistory": status_history
            }
            issues_list.append(issue_obj)

        conn.close()

        # Apply Haversine filter if lat, lon, radius are supplied
        if radius_filter and lat_filter and lon_filter:
            try:
                r_val = float(radius_filter)
                lat_val = float(lat_filter)
                lon_val = float(lon_filter)
                
                filtered_issues = []
                for iss in issues_list:
                    dist = haversine(lat_val, lon_val, iss["latitude"], iss["longitude"])
                    if dist <= r_val:
                        filtered_issues.append(iss)
                issues_list = filtered_issues
            except ValueError:
                pass

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(issues_list).encode('utf-8'))

    def _handle_get_events(self):
        conn = sqlite3.connect(db.DB_PATH)
        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.cursor()

        cursor.execute("""
        SELECT id, title, description, category, image_url, latitude, longitude, address, start_time, end_time, is_official, attendees
        FROM events
        ORDER BY start_time ASC
        """)
        rows = cursor.fetchall()
        conn.close()

        events_list = []
        for row in rows:
            ev_id, title, desc, cat, img, lat, lon, addr, s_time, e_time, official, atts = row
            date_val, time_val = format_event_datetime(s_time, e_time)
            events_list.append({
                "id": ev_id,
                "title": title,
                "description": desc,
                "category": cat,
                "date": date_val or s_time.split('T')[0],
                "time": time_val or f"{s_time} - {e_time}",
                "location": addr,
                "attendees": atts,
                "isOfficial": bool(official),
                "image": img,
                "latitude": lat,
                "longitude": lon,
                "startTime": s_time,
                "endTime": e_time
            })

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(events_list).encode('utf-8'))

    def _handle_post_issue(self, body):
        # Resolve fields
        title = body.get('title')
        description = body.get('description')
        category = body.get('category', 'Others')
        image_urls = body.get('imageUrls', [])
        latitude = body.get('latitude')
        longitude = body.get('longitude')
        ward_name = body.get('wardName')
        city = body.get('city')
        is_anonymous = 1 if body.get('isAnonymous') else 0
        reporter_name = body.get('reporterName')
        priority = body.get('priority', 'medium')
        if priority not in ('critical', 'high', 'medium', 'low'):
            priority = 'medium'
        department_name = body.get('departmentName')

        if not title or not description or latitude is None or longitude is None:
            self._send_bad_request("Missing title, description, latitude, or longitude")
            return

        try:
            latitude = float(latitude)
            longitude = float(longitude)
        except (ValueError, TypeError):
            self._send_bad_request("Invalid latitude or longitude format")
            return

        if not (-90.0 <= latitude <= 90.0) or not (-180.0 <= longitude <= 180.0):
            self._send_bad_request("Latitude must be between -90 and 90, and longitude between -180 and 180")
            return

        conn = sqlite3.connect(db.DB_PATH)
        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.cursor()

        # Resolve ward
        ward_id = 'w1111111-1111-1111-1111-111111111111' # Default Rajwada Indore
        if ward_name and city:
            cursor.execute("SELECT id FROM wards WHERE name = ? AND city = ?", (ward_name, city))
            row = cursor.fetchone()
            if row:
                ward_id = row[0]
            else:
                # Create ward
                ward_id = str(uuid.uuid4())
                cursor.execute("INSERT INTO wards (id, name, city) VALUES (?, ?, ?)", (ward_id, ward_name, city))

        # Resolve department
        dept_id = None
        if department_name:
            cursor.execute("SELECT id FROM departments WHERE name = ?", (department_name,))
            row = cursor.fetchone()
            if row:
                dept_id = row[0]

        # Resolve reporter
        reporter_id = None
        if reporter_name and not is_anonymous:
            email = f"{reporter_name.lower().replace(' ', '')}@localpulse.in"
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            row = cursor.fetchone()
            if row:
                reporter_id = row[0]
            else:
                reporter_id = str(uuid.uuid4())
                cursor.execute("INSERT OR IGNORE INTO users (id, email, full_name, role) VALUES (?, ?, ?, 'citizen')",
                               (reporter_id, email, reporter_name))

        issue_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat() + 'Z'

        # Insert issue
        cursor.execute("""
        INSERT INTO issues (id, title, description, category, image_urls, latitude, longitude, ward_id, is_anonymous, reporter_id, status, priority, department_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)
        """, (issue_id, title, description, category, json.dumps(image_urls), latitude, longitude, ward_id, is_anonymous, reporter_id, priority, dept_id, created_at, created_at))

        # Insert history
        history_id = str(uuid.uuid4())
        cursor.execute("""
        INSERT INTO issue_status_history (id, issue_id, status_from, status_to, changed_by, comment, created_at)
        VALUES (?, ?, NULL, 'open', 'System', ?, ?)
        """, (history_id, issue_id, f"Issue registered in {ward_name or 'city'}.", created_at))

        conn.commit()
        conn.close()

        # Return full new issue details
        new_issue = {
            "id": issue_id,
            "title": title,
            "description": description,
            "category": category,
            "imageUrls": image_urls,
            "latitude": float(latitude),
            "longitude": float(longitude),
            "wardName": ward_name or "Unknown Ward",
            "city": city or "Unknown City",
            "isAnonymous": bool(is_anonymous),
            "reporterName": "Anonymous Citizen" if is_anonymous or not reporter_name else reporter_name,
            "status": "open",
            "priority": priority,
            "departmentName": department_name or "Municipality",
            "createdAt": created_at,
            "upvotes": 0,
            "upvotedByUser": False,
            "comments": [],
            "statusHistory": [{
                "id": history_id,
                "statusFrom": None,
                "statusTo": "open",
                "changedBy": "System",
                "comment": f"Issue registered in {ward_name or 'city'}.",
                "createdAt": created_at
            }]
        }

        self.send_response(201)
        self.send_header('Content-Type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(new_issue).encode('utf-8'))

    def _handle_upvote_issue(self, issue_id, body):
        user_id = body.get('userId') or 'guest-user'
        
        conn = sqlite3.connect(db.DB_PATH)
        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.cursor()

        # Verify issue exists
        cursor.execute("SELECT id FROM issues WHERE id = ?", (issue_id,))
        if not cursor.fetchone():
            conn.close()
            self._send_bad_request("Issue not found")
            return

        # Ensure user exists (to satisfy FK if enabled)
        cursor.execute("INSERT OR IGNORE INTO users (id, email, full_name, role) VALUES (?, ?, ?, 'citizen')",
                       (user_id, f"{user_id}@dummy.com", "Guest User"))

        # Check existing vote
        cursor.execute("SELECT 1 FROM issue_votes WHERE issue_id = ? AND user_id = ?", (issue_id, user_id))
        vote_exists = cursor.fetchone()

        if vote_exists:
            cursor.execute("DELETE FROM issue_votes WHERE issue_id = ? AND user_id = ?", (issue_id, user_id))
            upvoted = False
        else:
            cursor.execute("INSERT INTO issue_votes (issue_id, user_id) VALUES (?, ?)", (issue_id, user_id))
            upvoted = True

        conn.commit()

        # Get count
        cursor.execute("SELECT COUNT(*) FROM issue_votes WHERE issue_id = ?", (issue_id,))
        count = cursor.fetchone()[0]
        conn.close()

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps({"upvotes": count, "upvotedByUser": upvoted}).encode('utf-8'))

    def _handle_post_comment(self, issue_id, body):
        content = body.get('content')
        user_name = body.get('userName', 'Anonymous')
        is_anonymous = 1 if body.get('isAnonymous') else 0

        if not content:
            self._send_bad_request("Missing comment content")
            return

        conn = sqlite3.connect(db.DB_PATH)
        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.cursor()

        # Verify issue exists
        cursor.execute("SELECT id FROM issues WHERE id = ?", (issue_id,))
        if not cursor.fetchone():
            conn.close()
            self._send_bad_request("Issue not found")
            return

        email = f"{user_name.lower().replace(' ', '')}@localpulse.in"
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        if row:
            user_id = row[0]
        else:
            user_id = str(uuid.uuid4())
            cursor.execute("INSERT OR IGNORE INTO users (id, email, full_name, role) VALUES (?, ?, ?, 'citizen')",
                           (user_id, email, user_name))

        comment_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat() + 'Z'

        cursor.execute("""
        INSERT INTO issue_comments (id, issue_id, user_id, content, is_anonymous, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (comment_id, issue_id, user_id, content, is_anonymous, created_at))

        conn.commit()
        conn.close()

        comment_obj = {
            "id": comment_id,
            "userName": "Anonymous" if is_anonymous else user_name,
            "content": content,
            "isAnonymous": bool(is_anonymous),
            "createdAt": created_at
        }

        self.send_response(201)
        self.send_header('Content-Type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(comment_obj).encode('utf-8'))

    def _handle_put_status(self, issue_id, body):
        new_status = body.get('status')
        changed_by = body.get('changedBy', 'System')
        comment = body.get('comment', '')

        norm_status = normalize_status(new_status)
        if not norm_status:
            self._send_bad_request("Invalid status value")
            return

        conn = sqlite3.connect(db.DB_PATH)
        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.cursor()

        # Get current status
        cursor.execute("SELECT status FROM issues WHERE id = ?", (issue_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            self._send_bad_request("Issue not found")
            return
        old_status = row[0]

        # Update status
        updated_at = datetime.utcnow().isoformat() + 'Z'
        cursor.execute("UPDATE issues SET status = ?, updated_at = ? WHERE id = ?", (norm_status, updated_at, issue_id))

        # Insert history
        history_id = str(uuid.uuid4())
        cursor.execute("""
        INSERT INTO issue_status_history (id, issue_id, status_from, status_to, changed_by, comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (history_id, issue_id, old_status, norm_status, changed_by, comment, updated_at))

        conn.commit()
        conn.close()

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps({"success": True, "status": norm_status}).encode('utf-8'))

def run():
    # Make sure DB is initialized
    db.init_db()

    server_address = ('', PORT)
    httpd = HTTPServer(server_address, LocalPulseRequestHandler)
    print(f"Starting backend REST API server on port {PORT}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    print("Stopping server...")

if __name__ == '__main__':
    run()
