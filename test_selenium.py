import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_user_dashboard():
    print("--- Testing Normal User Flow ---")
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, 15)

    try:
        driver.get("http://localhost:5173/login")

        # Wait for Email field (using placeholder)
        wait.until(EC.presence_of_element_located(
            (By.XPATH, "//input[@placeholder='Enter your email']")
        ))

        # Fill Login Form
        driver.find_element(By.XPATH, "//input[@placeholder='Enter your email']").send_keys("thomsonshiju2028@mca.ajce.in")
        driver.find_element(By.XPATH, "//input[@placeholder='Enter your password']").send_keys("Nevin@123")

        # Click Login button
        driver.find_element(By.XPATH, "//button[text()='Login']").click()

        # Wait until Dashboard loads (System Health visible)
        wait.until(EC.presence_of_element_located(
            (By.XPATH, "//*[contains(text(),'System Health')]")
        ))
        print("Login Successful ✅ Dashboard Loaded")

        time.sleep(1) # Small pause for UI transitions

        # 1. Test Status Page
        print("Testing Status Page...")
        status_nav = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[text()='Status']/parent::a")))
        status_nav.click()
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'Device Status')]")))
        print("Status Page Loaded ✅")
        time.sleep(1)

        # 2. Test Automation Page
        print("Testing Automation Page...")
        auto_nav = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[text()='Automation']/parent::a")))
        auto_nav.click()
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'Smart Logic')]")))
        print("Automation Page Loaded ✅")
        time.sleep(1)

        # 3. Test Analytics Page
        print("Testing Analytics Page...")
        data_nav = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[text()='Data']/parent::a")))
        data_nav.click()
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'Data Analytics')]")))
        print("Analytics Page Loaded ✅")
        time.sleep(1)

        # 4. Test Profile Page
        print("Testing Profile Page...")
        profile_nav = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[text()='Profile']/parent::a")))
        profile_nav.click()
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'Account Profile')]")))
        print("Profile Page Loaded ✅")
        time.sleep(1)

        print("All user pages tested successfully! 🚀")

    except Exception as e:
        print(f"User Test Failed ❌: {e}")

    finally:
        driver.quit()

def test_admin_dashboard():
    print("\n--- Testing Admin Flow ---")
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, 15)

    try:
        driver.get("http://localhost:5173/login")

        # Wait for Email field (using placeholder)
        wait.until(EC.presence_of_element_located(
            (By.XPATH, "//input[@placeholder='Enter your email']")
        ))

        # Fill Admin Login Form
        driver.find_element(By.XPATH, "//input[@placeholder='Enter your email']").send_keys("manager@aquamonitor.com")
        driver.find_element(By.XPATH, "//input[@placeholder='Enter your password']").send_keys("manager123")

        # Click Login button
        driver.find_element(By.XPATH, "//button[text()='Login']").click()

        # Wait until Admin Console loads
        wait.until(EC.presence_of_element_located(
            (By.XPATH, "//*[contains(text(),'Admin Console')]")
        ))
        print("Admin Login Successful ✅ Admin Console Loaded")

        time.sleep(1)

        # 1. Test Admin Page
        print("Testing Admin Page...")
        admin_nav = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[text()='Admin']/parent::a")))
        admin_nav.click()
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'System orchestration')]")))
        print("Admin Page Loaded ✅")
        time.sleep(1)

        print("Admin pages tested successfully! 🚀")

    except Exception as e:
        print(f"Admin Test Failed ❌: {e}")

    finally:
        driver.quit()

if __name__ == "__main__":
    test_user_dashboard()
    test_admin_dashboard()