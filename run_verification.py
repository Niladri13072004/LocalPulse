import subprocess
import time
import socket
import os
import sys

def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.connect(('127.0.0.1', port))
            return True
        except ConnectionRefusedError:
            return False
        except Exception:
            return False

def wait_for_port(port, timeout=30):
    start_time = time.time()
    while time.time() - start_time < timeout:
        if is_port_open(port):
            return True
        time.sleep(1)
    return False

def main():
    print("Starting E2E verification...")
    
    # Clean up existing screenshots
    screenshot_dir = r"C:\Users\HP\.gemini\antigravity\scratch\LocalPulse\screenshots"
    if os.path.exists(screenshot_dir):
        print(f"Cleaning up existing screenshots in: {screenshot_dir}")
        for f in os.listdir(screenshot_dir):
            if f.endswith('.png'):
                try:
                    os.remove(os.path.join(screenshot_dir, f))
                except Exception as e:
                    print(f"Failed to remove {f}: {e}")
    
    # 1. Initialize/seed the database just in case
    print("Running db.py to seed database...")
    subprocess.run([sys.executable, "server/db.py"], check=True)
    
    frontend_process = None
    backend_process = None
    
    # 2. Check and start frontend if needed
    if not is_port_open(8085):
        print("Frontend on port 8085 is not running. Starting Expo web on port 8085...")
        # Start Expo web on port 8085
        env = os.environ.copy()
        env["PORT"] = "8085"
        # We run it using shell to properly execute expo/npm
        frontend_process = subprocess.Popen(
            "npx expo start --web --port 8085", 
            shell=True,
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        print("Waiting for frontend port 8085 to open...")
        if wait_for_port(8085, 45):
            print("Frontend port 8085 is now active.")
        else:
            print("Timeout waiting for frontend to start.")
    else:
        print("Frontend is already running on port 8085.")
        
    # 3. Check and start backend if needed
    if not is_port_open(5000):
        print("Backend on port 5000 is not running. Starting backend...")
        backend_process = subprocess.Popen(
            [sys.executable, "server/server.py"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        print("Waiting for backend port 5000 to open...")
        if wait_for_port(5000, 15):
            print("Backend port 5000 is now active.")
        else:
            print("Timeout waiting for backend to start.")
    else:
        print("Backend is already running on port 5000.")

    # 4. Run the automate_run.py script
    print("Running E2E browser automation (automate_run.py)...")
    try:
        automation_res = subprocess.run(
            [sys.executable, "automate_run.py"],
            capture_output=True,
            text=True
        )
        print("--- Automation STDOUT ---")
        print(automation_res.stdout)
        print("--- Automation STDERR ---")
        print(automation_res.stderr)
        
        if automation_res.returncode == 0:
            print("Automation completed successfully.")
        else:
            print(f"Automation failed with exit code: {automation_res.returncode}")
    except Exception as e:
        print(f"Failed to run automate_run.py: {e}")
        
    # 5. Clean up processes we started
    if backend_process:
        print("Stopping backend process...")
        backend_process.terminate()
        try:
            backend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            backend_process.kill()
            
    if frontend_process:
        print("Stopping frontend process...")
        subprocess.run(f"taskkill /F /T /PID {frontend_process.pid}", shell=True, capture_output=True)

    # 6. Verify screenshots
    screenshot_dir = r"C:\Users\HP\.gemini\antigravity\scratch\LocalPulse\screenshots"
    print(f"Checking screenshots in: {screenshot_dir}")
    if os.path.exists(screenshot_dir):
        files = os.listdir(screenshot_dir)
        print(f"Found {len(files)} screenshots:")
        for f in sorted(files):
            size = os.path.getsize(os.path.join(screenshot_dir, f))
            print(f"  - {f} ({size} bytes)")
    else:
        print("Screenshot directory does not exist!")

if __name__ == "__main__":
    main()
