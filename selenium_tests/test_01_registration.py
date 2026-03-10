import sys
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_registration():
    print("--- Testing Registration Flow ---")
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, 15)

    try:
        driver.get("http://localhost:5173/signup")
        
        # Wait for Create Account heading
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Create Account')]")))
        print("Registration Page Loaded ✅")
        
        # Testing Password Mismatch Scenario
        print("Testing Password Mismatch Scenario...")
        name_field = wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'auth-card-back')]//input[@type='text']")))
        name_field.send_keys("Test User")
        
        email_field = wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'auth-card-back')]//input[@type='email']")))
        test_email = f"user_{int(time.time())}@aquamonitor.com"
        email_field.send_keys(test_email)
        
        pass_field = wait.until(EC.presence_of_element_located((By.XPATH, "(//div[contains(@class, 'auth-card-back')]//input[@type='password'])[1]")))
        pass_field.send_keys("SecurePass@123")
        
        confirm_pass_field = wait.until(EC.presence_of_element_located((By.XPATH, "(//div[contains(@class, 'auth-card-back')]//input[@type='password'])[2]")))
        confirm_pass_field.send_keys("SecurePass@Wrong")
        
        submit_btn = wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'auth-card-back')]//button[@type='submit']")))
        driver.execute_script("arguments[0].click();", submit_btn) # Safely click ignoring overlays
        
        # Wait for error message
        time.sleep(2) # Extra buffer for react state update
        try:
            wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Passwords do not match')]")))
            print("Password Mismatch Error Displayed correctly ✅")
        except Exception as e:
            print("Failed to find Password mismatch error message.")
            try:
                print(driver.page_source[:3000])
            except:
                pass
            raise e
        
        # Testing Successful Registration
        print("Testing Successful Registration...")
        # Clear the confirm password field and input correct password
        confirm_field = wait.until(EC.presence_of_element_located((By.XPATH, "(//div[contains(@class, 'auth-card-back')]//input[@type='password'])[2]")))
        confirm_field.send_keys(u'\ue009' + 'a' + u'\ue003') # Ctrl+A, Backspace
        confirm_field.clear() 
        confirm_field.send_keys("SecurePass@123")
        
        submit_btn = wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'auth-card-back')]//button[@type='submit']")))
        driver.execute_script("arguments[0].click();", submit_btn)
        
        print("Waiting for redirection to Dashboard...")
        wait.until(EC.url_to_be("http://localhost:5173/"))
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'System Health')]")))
        print("Registration Successful & Redirected to Dashboard ✅")
        
        print("Waiting 3 seconds on the dashboard...")
        time.sleep(3)
        
        print("Logging out...")
        # Find the logout button in the top navbar
        logout_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "(//nav//button)[last()]")))
        driver.execute_script("arguments[0].click();", logout_btn)
        
        # Verify redirect to login
        wait.until(EC.url_contains("/login"))
        print("Logged out successfully ✅")
        
        return True
    except Exception as e:
        print(f"Registration Test Failed ❌: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        driver.quit()

if __name__ == "__main__":
    if test_registration():
        sys.exit(0)
    else:
        sys.exit(1)
