import subprocess
import time
import urllib.request
import urllib.error
import json
import os
import sqlite3

PORT = 5000
BASE_URL = f"http://127.0.0.1:{PORT}"

def run_tests():
    print("--- Starting Verification Tests ---")
    
    # 1. Clean and initialize database
    from db import init_db, DB_PATH
    if os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
        except Exception:
            pass
    init_db()

    # 2. Start server in a background process
    server_process = subprocess.Popen(
        ["python", "server/server.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    )
    
    # Wait for server to start
    time.sleep(1.5)

    try:
        # Test 1: GET /api/issues (all)
        print("Test 1: Fetch all issues...")
        req = urllib.request.Request(f"{BASE_URL}/api/issues")
        with urllib.request.urlopen(req) as resp:
            issues = json.loads(resp.read().decode('utf-8'))
            assert len(issues) == 4, f"Expected 4 issues, got {len(issues)}"
            print(f"  Passed! Fetched {len(issues)} issues.")

            # Validate structure
            first = issues[0]
            assert "id" in first
            assert "title" in first
            assert "description" in first
            assert "category" in first
            assert "latitude" in first
            assert "longitude" in first
            assert "upvotes" in first
            assert "comments" in first
            assert "statusHistory" in first
            print("  Passed! Issue structure validated.")

        # Test 2: GET /api/issues with status filter
        print("Test 2: Fetch issues with status='resolved'...")
        req = urllib.request.Request(f"{BASE_URL}/api/issues?status=resolved")
        with urllib.request.urlopen(req) as resp:
            resolved_issues = json.loads(resp.read().decode('utf-8'))
            assert len(resolved_issues) == 1, f"Expected 1 resolved issue, got {len(resolved_issues)}"
            assert resolved_issues[0]["title"] == "Broken Streetlights causing dark spot near Hazratganj Metro"
            print("  Passed! Status filtering works correctly.")

        # Test 3: GET /api/issues with category filter
        print("Test 3: Fetch issues with category='Water Logging'...")
        req = urllib.request.Request(f"{BASE_URL}/api/issues?category=Water%20Logging")
        with urllib.request.urlopen(req) as resp:
            water_issues = json.loads(resp.read().decode('utf-8'))
            assert len(water_issues) == 1, f"Expected 1 Water Logging issue, got {len(water_issues)}"
            assert water_issues[0]["category"] == "Water Logging"
            print("  Passed! Category filtering works correctly.")

        # Test 4: GET /api/issues with Haversine distance filtering
        # Indore central coordinates: 22.7196, 75.8577 (Rajwada gate)
        # Jaipur coordinates: 26.9215, 75.8242 (Johri Bazar) - ~470 km away
        print("Test 4: Haversine distance filtering (Indore within 5km)...")
        req = urllib.request.Request(f"{BASE_URL}/api/issues?latitude=22.7196&longitude=75.8577&radius=5")
        with urllib.request.urlopen(req) as resp:
            indore_issues = json.loads(resp.read().decode('utf-8'))
            # Should only return the Indore issue
            assert len(indore_issues) == 1, f"Expected 1 issue in Indore range, got {len(indore_issues)}"
            assert indore_issues[0]["city"] == "Indore"
            print("  Passed! Haversine distance filtering works correctly.")

        # Test 5: GET /api/events
        print("Test 5: Fetch community events...")
        req = urllib.request.Request(f"{BASE_URL}/api/events")
        with urllib.request.urlopen(req) as resp:
            events = json.loads(resp.read().decode('utf-8'))
            assert len(events) == 2, f"Expected 2 events, got {len(events)}"
            
            # Validate structure
            ev1 = events[0]
            assert "id" in ev1
            assert "title" in ev1
            assert "date" in ev1
            assert "time" in ev1
            assert "location" in ev1
            assert "attendees" in ev1
            assert "isOfficial" in ev1
            assert ev1["attendees"] == 38
            assert ev1["isOfficial"] is False
            
            ev2 = events[1]
            assert ev2["attendees"] == 75
            assert ev2["isOfficial"] is True
            print("  Passed! Events fetching and formatting validated.")

        # Test 6: POST /api/issues
        print("Test 6: Create new issue...")
        new_issue_data = {
            "title": "Unsecured Manhole cover",
            "description": "An open and unsecured manhole cover on the footpath near the school.",
            "category": "Safety",
            "latitude": 22.7220,
            "longitude": 75.8600,
            "wardName": "Rajwada Ward",
            "city": "Indore",
            "isAnonymous": False,
            "reporterName": "Rahul Saxena",
            "priority": "critical",
            "departmentName": "Public Safety & Police"
        }
        req = urllib.request.Request(
            f"{BASE_URL}/api/issues",
            data=json.dumps(new_issue_data).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            new_issue = json.loads(resp.read().decode('utf-8'))
            assert new_issue["title"] == "Unsecured Manhole cover"
            assert new_issue["category"] == "Safety"
            assert new_issue["status"] == "open"
            assert new_issue["reporterName"] == "Rahul Saxena"
            new_issue_id = new_issue["id"]
            print("  Passed! New issue created successfully.")

        # Test 7: POST /api/issues/<id>/upvote
        print("Test 7: Upvoting new issue...")
        req = urllib.request.Request(
            f"{BASE_URL}/api/issues/{new_issue_id}/upvote",
            data=json.dumps({"userId": "test-user-1"}).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            upvote_res = json.loads(resp.read().decode('utf-8'))
            assert upvote_res["upvotes"] == 1
            assert upvote_res["upvotedByUser"] is True
            print("  Passed! Upvoting works correctly.")

        # Test 8: POST /api/issues/<id>/comments
        print("Test 8: Commenting on new issue...")
        comment_data = {
            "content": "This is extremely dangerous for kids walking to school.",
            "userName": "Preeti Sharma",
            "isAnonymous": False
        }
        req = urllib.request.Request(
            f"{BASE_URL}/api/issues/{new_issue_id}/comments",
            data=json.dumps(comment_data).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            comment_res = json.loads(resp.read().decode('utf-8'))
            assert comment_res["content"] == "This is extremely dangerous for kids walking to school."
            assert comment_res["userName"] == "Preeti Sharma"
            print("  Passed! Commenting works correctly.")

        # Test 9: PUT /api/issues/<id>/status
        print("Test 9: Updating issue status...")
        status_data = {
            "status": "in_progress",
            "changedBy": "Officer Vikram Singh",
            "comment": "Barricaded the area and scheduled concrete cover repair."
        }
        req = urllib.request.Request(
            f"{BASE_URL}/api/issues/{new_issue_id}/status",
            data=json.dumps(status_data).encode('utf-8'),
            headers={"Content-Type": "application/json"},
            method="PUT"
        )
        with urllib.request.urlopen(req) as resp:
            status_res = json.loads(resp.read().decode('utf-8'))
            assert status_res["success"] is True
            assert status_res["status"] == "in_progress"
            print("  Passed! Status updates work correctly.")

        print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!")

    except Exception as e:
        print(f"\nTEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        # Shut down backend server
        print("Terminating backend server process...")
        server_process.terminate()
        server_process.wait()
        print("Server process stopped.")

if __name__ == '__main__':
    run_tests()
