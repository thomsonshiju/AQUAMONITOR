import sys
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_automation_page():
    print("--- Testing Automation Page Flow ---")
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, 15)
    
    try:
        # 1. Login
        driver.get("http://localhost:5173/login")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Welcome back')]")))
        print("Login Page Loaded ✅")
        
        email_field = wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'auth-card-front')]//input[@type='email']")))
        email_field.send_keys("thomsonshiju2028@mca.ajce.in")
        pass_field = wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'auth-card-front')]//input[@type='password']")))
        pass_field.send_keys("Nevin@123")
        
        submit_btn = wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'auth-card-front')]//button[@type='submit']")))
        driver.execute_script("arguments[0].click();", submit_btn)
        
        # 2. Navigate to Dashboard (Home Page)
        print("Waiting for redirection to Dashboard...")
        wait.until(EC.url_to_be("http://localhost:5173/"))
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'System Health')]")))
        print("Login Successful & Redirected to Dashboard ✅")
        
        print("Waiting 3 seconds on Home Page...")
        time.sleep(3)
        
        # 3. Test Automation Page
        print("Navigating to Automation Page...")
        auto_nav = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[text()='Automation']/parent::a")))
        driver.execute_script("arguments[0].click();", auto_nav)
        
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'Smart Logic')]")))
        print("Automation Page Loaded correctly ✅")
        
        print("Waiting 3 seconds on the Automation Page...")
        time.sleep(3)
        
        # 4. Test Manual Control Save
        print("Switching to Manual Control...")
        manual_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Manual Control')]")))
        driver.execute_script("arguments[0].click();", manual_btn)
        
        apply_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Apply Logic')]")))
        driver.execute_script("arguments[0].click();", apply_btn)
        
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Settings saved successfully')]")))
        print("Manual Transfer and Save Successful ✅")
        time.sleep(3) # Wait for success message to disappear
        
        # 5. Test Automatic Control Save
        print("Switching to Autonomous AI...")
        auto_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Autonomous AI')]")))
        driver.execute_script("arguments[0].click();", auto_btn)
        
        apply_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Apply Logic')]")))
        driver.execute_script("arguments[0].click();", apply_btn)
        
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Settings saved successfully')]")))
        print("Automatic Transfer and Save Successful ✅")
        time.sleep(2)
        
        # 6. Logout
        print("Logging out...")
        logout_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "(//nav//button)[last()]")))
        driver.execute_script("arguments[0].click();", logout_btn)
        
        wait.until(EC.url_contains("/login"))
        print("Logged out successfully ✅")
        
        return True
    except Exception as e:
        print(f"Automation Page Test Failed ❌: {e}")
        return False
    finally:
        driver.quit()

if __name__ == "__main__":
    if test_automation_page():
        sys.exit(0)
    else:
        sys.exit(1)
