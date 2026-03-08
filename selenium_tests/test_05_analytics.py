import sys
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_analytics_page():
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, 10)
    try:
        driver.get("http://localhost:5173/login")
        wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter your email']"))).send_keys("thomsonshiju2028@mca.ajce.in")
        driver.find_element(By.XPATH, "//input[@placeholder='Enter your password']").send_keys("Nevin@123")
        driver.find_element(By.XPATH, "//button[text()='Login']").click()
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'System Health')]")))
        
        data_nav = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[text()='Data']/parent::a")))
        data_nav.click()
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'Data Analytics')]")))
        return True
    except Exception as e:
        print(f"Analytics page test exception: {e}")
        return False
    finally:
        driver.quit()

if __name__ == "__main__":
    if test_analytics_page():
        sys.exit(0)
    else:
        sys.exit(1)
