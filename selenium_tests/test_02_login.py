import sys
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_login():
    print("--- Testing Login Flow ---")
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, 15)
    
    try:
        driver.get("http://localhost:5173/login")
        
        # Verify page layout
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Welcome back')]")))
        print("Login Page Loaded ✅")
        
        # Insert credentials
        print("Entering credentials...")
        email_field = wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'auth-card-front')]//input[@type='email']")))
        email_field.send_keys("thomsonshiju2028@mca.ajce.in")
        
        pass_field = wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'auth-card-front')]//input[@type='password']")))
        pass_field.send_keys("Nevin@123")
        
        # Click login button
        submit_btn = wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'auth-card-front')]//button[@type='submit']")))
        driver.execute_script("arguments[0].click();", submit_btn)
        
        # Dashboard is loaded
        print("Waiting for redirection to Dashboard...")
        wait.until(EC.url_to_be("http://localhost:5173/"))
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'System Health')]")))
        print("Login Successful & Redirected to Dashboard ✅")
        
        # 3 Second Wait
        print("Waiting 3 seconds on the dashboard...")
        time.sleep(3)
        
        # Logout Logic
        print("Logging out...")
        # Find the logout button in the top navbar (it usually sits as the last button)
        logout_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "(//nav//button)[last()]")))
        driver.execute_script("arguments[0].click();", logout_btn)
        
        # Verify redirect to login
        wait.until(EC.url_contains("/login"))
        print("Logged out successfully ✅")
        
        return True
    except Exception as e:
        print(f"Login Test Failed ❌: {e}")
        return False
    finally:
        driver.quit()

if __name__ == "__main__":
    if test_login():
        sys.exit(0)
    else:
        sys.exit(1)
