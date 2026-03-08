import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def test_registration():
    options = Options()
    options.add_argument('--headless') # Run in headless mode so it doesn't pop up wildly if desired, but user might want to see it. I'll NOT use headless.
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, 10)
    try:
        driver.get("http://localhost:5173/signup")
        
        # Check for Create Account heading
        wait.until(EC.presence_of_element_located((By.XPATH, "//h1[text()='Create Account']")))
        
        # Check for inputs
        driver.find_element(By.XPATH, "//input[@placeholder='John Doe']")
        driver.find_element(By.XPATH, "//input[@placeholder='name@example.com']")
        driver.find_element(By.XPATH, "//button[text()='Sign Up']")
        
        return True
    except Exception as e:
        print(f"Registration test exception: {e}")
        return False
    finally:
        driver.quit()

if __name__ == "__main__":
    if test_registration():
        sys.exit(0)
    else:
        sys.exit(1)
