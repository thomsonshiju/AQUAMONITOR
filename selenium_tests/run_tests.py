import subprocess
import glob
import os
import sys

def run_all():
    # Find all test files in the directory
    # Get directory of this script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    tests = sorted(glob.glob(os.path.join(current_dir, "test_*.py")))
    
    print("="*40)
    print("STARTING SELENIUM TEST SUITE")
    print("="*40)
    
    passed = 0
    failed = 0
    
    for test in tests:
        test_filename = os.path.basename(test)
        print(f"Running {test_filename}...", end=" ", flush=True)
        # Run test
        result = subprocess.run([sys.executable, test], capture_output=True, text=True)
        if result.returncode == 0:
            print("[\033[92mPASSED\033[0m]")
            passed += 1
        else:
            print("[\033[91mFAILED\033[0m]")
            print("--- Output ---")
            print(result.stdout)
            print(result.stderr)
            print("--------------")
            failed += 1
            
    print("="*40)
    print(f"RESULTS: {passed} PASSED, {failed} FAILED")
    print("="*40)

if __name__ == "__main__":
    run_all()
