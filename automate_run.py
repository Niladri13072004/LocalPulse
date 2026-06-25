import os
import time
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

# Target directories for screenshots (multiple paths to be safe)
SCREENSHOT_DIRS = [
    r"C:\Users\HP\.gemini\antigravity\brain\fd345166-5332-46eb-8d40-414b499c3ff8\scratch\screenshots",
    r"C:\Users\HP\.gemini\antigravity\brain\07016c1b-0f2e-42a3-a707-dced6a8a84ff\scratch\screenshots",
    r"C:\Users\HP\.gemini\antigravity\scratch\LocalPulse\screenshots"
]

for d in SCREENSHOT_DIRS:
    try:
        os.makedirs(d, exist_ok=True)
    except Exception as e:
        print(f"Warning: Could not create directory {d}: {e}")

def save_screenshot_robust(driver, filename):
    for d in SCREENSHOT_DIRS:
        try:
            path = os.path.join(d, filename)
            driver.save_screenshot(path)
            print(f"Saved screenshot to: {path}")
        except Exception as e:
            print(f"Could not save screenshot to {d}: {e}")

def init_driver():
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1280,800')
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    # Try using standard Chrome webdriver
    try:
        driver = webdriver.Chrome(options=chrome_options)
        print("Initialized Chrome WebDriver.")
        return driver
    except Exception as e:
        print(f"Error initializing Chrome: {e}")
        try:
            from webdriver_manager.chrome import ChromeDriverManager
            from selenium.webdriver.chrome.service import Service
            driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
            print("Initialized Chrome via WebDriverManager.")
            return driver
        except Exception as e2:
            print(f"Error initializing Chrome via WebDriverManager: {e2}")
            raise e

def find_and_click_text(driver, text, timeout=20):
    xpath = f"//*[text()='{text}' or contains(text(), '{text}')]"
    element = WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((By.XPATH, xpath))
    )
    driver.execute_script("arguments[0].scrollIntoView(true);", element)
    time.sleep(0.5)
    try:
        element.click()
    except Exception:
        driver.execute_script("arguments[0].click();", element)
    print(f"Clicked element with text: {text}")
    return element

def find_and_fill_input_robust(driver, xpath, value, timeout=20):
    element = WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((By.XPATH, xpath))
    )
    driver.execute_script("arguments[0].scrollIntoView(true);", element)
    time.sleep(0.5)
    element.clear()
    time.sleep(0.2)
    element.send_keys(value)
    time.sleep(0.2)
    driver.execute_script("""
        var element = arguments[0];
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    """, element)
    print(f"Robustly filled field (xpath: {xpath}) with '{value}'")
    return element

def find_and_fill_email(driver, value, timeout=20):
    xpath = "//input[@type='email'] | //input[@placeholder='name@example.com']"
    return find_and_fill_input_robust(driver, xpath, value, timeout)

def find_and_fill_password(driver, value, timeout=20):
    xpath = "//input[@type='password']"
    return find_and_fill_input_robust(driver, xpath, value, timeout)

def click_login_button(driver, timeout=20):
    xpath = "//div[@role='button'][contains(., 'Log In')] | //*[contains(text(), 'Log In')]"
    element = WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((By.XPATH, xpath))
    )
    driver.execute_script("arguments[0].scrollIntoView(true);", element)
    time.sleep(0.5)
    try:
        element.click()
    except Exception:
        driver.execute_script("arguments[0].click();", element)
    print("Clicked login button using robust XPath.")
    return element

def check_for_crashes(driver, page_name):
    # Check if there is a Red Screen of Death or compilation error
    html = driver.page_source.lower()
    crash_keywords = ["fatal error", "babel compilation error", "red screen of death", "unable to symbolicate", "unhandled exception"]
    for keyword in crash_keywords:
        if keyword in html:
            print(f"CRITICAL ERROR: Detected crash keyword '{keyword}' on page '{page_name}'!")
            return False
    return True

def run_automation():
    driver = init_driver()
    try:
        # Start at localhost:8085
        print("Navigating to http://localhost:8085")
        driver.get("http://localhost:8085")
        
        # Clear storage to reset state
        driver.execute_script("window.localStorage.clear(); window.sessionStorage.clear();")
        driver.get("http://localhost:8085")
        time.sleep(2)
        
        # Splash screen redirects to onboarding
        print("Waiting for splash screen transition...")
        time.sleep(3)
        
        # Verify no crash
        check_for_crashes(driver, "Onboarding Slide 1")
        
        # Onboarding flow
        save_screenshot_robust(driver, "02_onboarding_1.png")
        print("Captured onboarding slide 1.")
        
        find_and_click_text(driver, "Next")
        time.sleep(1)
        save_screenshot_robust(driver, "03_onboarding_2.png")
        print("Captured onboarding slide 2.")
        
        find_and_click_text(driver, "Next")
        time.sleep(1)
        save_screenshot_robust(driver, "04_onboarding_3.png")
        print("Captured onboarding slide 3.")
        
        find_and_click_text(driver, "Get Started")
        time.sleep(1.5)
        
        # Login flow - Citizen
        check_for_crashes(driver, "Citizen Login")
        save_screenshot_robust(driver, "05_login.png")
        print("Captured login view.")
        
        # Citizen is default. Enter credentials:
        find_and_fill_email(driver, "citizen@localpulse.org")
        find_and_fill_password(driver, "password123")
        
        # Find and click login button
        click_login_button(driver)
        time.sleep(3)
        
        # Citizen Home Feed
        check_for_crashes(driver, "Citizen Home Feed")
        save_screenshot_robust(driver, "06_citizen_home.png")
        print("Captured citizen home feed.")
        
        # Map View
        print("Navigating to Map view...")
        driver.get("http://localhost:8085/map")
        time.sleep(2)
        check_for_crashes(driver, "Citizen Map")
        save_screenshot_robust(driver, "07_citizen_map.png")
        print("Captured map view.")
        
        # Services view
        print("Navigating to Services view...")
        driver.get("http://localhost:8085/services")
        time.sleep(2)
        check_for_crashes(driver, "Citizen Services")
        save_screenshot_robust(driver, "08_citizen_services.png")
        print("Captured services view.")
        
        # Civic Academy (Learn) view
        print("Navigating to Learn view...")
        driver.get("http://localhost:8085/learn")
        time.sleep(2)
        check_for_crashes(driver, "Citizen Learn")
        save_screenshot_robust(driver, "09_citizen_learn.png")
        print("Captured learn view.")
        
        # Quiz l-1 view
        print("Navigating to Quiz l-1...")
        driver.get("http://localhost:8085/quiz/l-1")
        time.sleep(3)
        check_for_crashes(driver, "Quiz l-1 Start")
        save_screenshot_robust(driver, "10_citizen_quiz_start.png")
        print("Captured quiz start.")
        
        # Use JavaScript to click quiz options (React Native Web TouchableOpacity needs JS clicks)
        try:
            # Click "Ward Councillor (Parshad)" option using JS
            driver.execute_script("""
                var elements = document.querySelectorAll('div[role="button"]');
                for (var el of elements) {
                    if (el.textContent.includes('Ward Councillor')) {
                        el.click();
                        break;
                    }
                }
            """)
            time.sleep(1.5)
            save_screenshot_robust(driver, "10b_quiz_q1_answered.png")
            print("Answered Q1.")
            
            # Click "Next Question" button
            driver.execute_script("""
                var elements = document.querySelectorAll('div[role="button"]');
                for (var el of elements) {
                    if (el.textContent.includes('Next Question')) {
                        el.click();
                        break;
                    }
                }
            """)
            time.sleep(1.5)
            
            check_for_crashes(driver, "Quiz l-1 Q2")
            save_screenshot_robust(driver, "11_citizen_quiz_question2.png")
            print("Captured quiz question 2.")
            
            # Click second answer
            driver.execute_script("""
                var elements = document.querySelectorAll('div[role="button"]');
                for (var el of elements) {
                    if (el.textContent.includes('Representing ward problems')) {
                        el.click();
                        break;
                    }
                }
            """)
            time.sleep(1.5)
            
            # Click "Finish Quiz"
            driver.execute_script("""
                var elements = document.querySelectorAll('div[role="button"]');
                for (var el of elements) {
                    if (el.textContent.includes('Finish Quiz')) {
                        el.click();
                        break;
                    }
                }
            """)
            time.sleep(2)
            
            check_for_crashes(driver, "Quiz l-1 Completed")
            save_screenshot_robust(driver, "12_citizen_quiz_completed.png")
            print("Captured quiz completed.")
        except Exception as quiz_err:
            print(f"Quiz interaction skipped due to: {quiz_err}")
            save_screenshot_robust(driver, "12_citizen_quiz_skipped.png")
        
        # Logout
        print("Logging out...")
        driver.execute_script("window.localStorage.clear(); window.sessionStorage.clear();")
        driver.get("http://localhost:8085/login")
        time.sleep(2)
        
        # Login flow - Admin
        print("Initiating Admin flow...")
        check_for_crashes(driver, "Admin Login")
        save_screenshot_robust(driver, "13_admin_login.png")
        print("Captured admin login view.")
        
        # Select Authority Admin role tab
        find_and_click_text(driver, "Authority Admin")
        time.sleep(1)
        
        find_and_fill_email(driver, "admin@localpulse.org")
        find_and_fill_password(driver, "password123")
        
        click_login_button(driver)
        time.sleep(3)
        
        # Admin Dashboard
        print("Navigating to Admin Dashboard...")
        driver.get("http://localhost:8085/dashboard")
        time.sleep(2)
        check_for_crashes(driver, "Admin Dashboard")
        save_screenshot_robust(driver, "14_admin_dashboard.png")
        print("Captured admin dashboard.")
        
        # Issue queue
        print("Navigating to Issue Queue...")
        driver.get("http://localhost:8085/issue-queue")
        time.sleep(2)
        check_for_crashes(driver, "Admin Issue Queue")
        save_screenshot_robust(driver, "15_admin_issue_queue.png")
        print("Captured admin issue queue.")
        
        # Heatmap
        print("Navigating to Heatmap...")
        driver.get("http://localhost:8085/heatmap")
        time.sleep(2)
        check_for_crashes(driver, "Admin Heatmap")
        save_screenshot_robust(driver, "16_admin_heatmap.png")
        print("Captured admin heatmap.")
        
        # Ward detail / reports
        print("Navigating to Ward Detail / Reports...")
        driver.get("http://localhost:8085/ward-detail")
        time.sleep(2)
        check_for_crashes(driver, "Admin Ward Reports")
        save_screenshot_robust(driver, "17_admin_ward_reports.png")
        print("Captured admin ward reports.")
        
        print("Browser automation flow completed successfully.")
        
    except Exception as e:
        print(f"AUTOMATION ERROR: {e}")
        try:
            save_screenshot_robust(driver, "failure.png")
            print("Captured failure screenshot: failure.png")
        except Exception as e_inner:
            print(f"Failed to capture failure screenshot: {e_inner}")
        raise e
    finally:
        driver.quit()

if __name__ == "__main__":
    run_automation()
