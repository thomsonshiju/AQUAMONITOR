import subprocess
import glob
import os
import sys

def run_all():
    # Get directory of this script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    tests = sorted(glob.glob(os.path.join(current_dir, "test_*.py")))
    
    print("\n" + "="*50)
    print(" 🚀 STARTING SELENIUM TEST SUITE ".center(50, "="))
    print("="*50 + "\n")
    
    passed = 0
    failed = 0
    
    for test in tests:
        test_filename = os.path.basename(test)
        print(f"\n▶️ Running {test_filename}...")
        print("-" * 50)
        
        # Run test and stream the output live to the console
        result = subprocess.run([sys.executable, test])
        
        print("-" * 50)
        if result.returncode == 0:
            print(f"✅ [\033[92mPASSED\033[0m] {test_filename}")
            passed += 1
        else:
            print(f"❌ [\033[91mFAILED\033[0m] {test_filename}")
            failed += 1
            
    print("\n" + "="*50)
    print(f" 📊 FINAL RESULTS: {passed} PASSED, {failed} FAILED ".center(50, "="))
    print("="*50 + "\n")
    
    # Return exit code based on total failures
    return 1 if failed > 0 else 0

if __name__ == "__main__":
    sys.exit(run_all())
