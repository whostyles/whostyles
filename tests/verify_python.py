import os
import sys
import json

# Add src/python to path so we can import whostyles
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/python')))

from whostyles import Whostyles

def main():
    matrix_path = os.path.join(os.path.dirname(__file__), 'matrix.json')
    if not os.path.exists(matrix_path):
        print("Error: matrix.json not found")
        sys.exit(1)
        
    with open(matrix_path, 'r') as f:
        matrix = json.load(f)
        
    passed = 0
    failed = 0
    
    for test in matrix:
        print(f"Testing: {test['name']}")
        
        if test.get('is_corruption_test'):
            decoded = Whostyles.decode(test['hash'])
            if decoded is not None:
                print("  [FAIL] Corruption test decoded successfully, but should have failed (returned None)")
                failed += 1
            else:
                print("  [PASS]")
                passed += 1
            continue

        # Test Encoding
        encoded = Whostyles.encode(test['input']['config'], test['input']['colors'])
        if encoded != test['hash']:
            print(f"  [FAIL] Encoding mismatch. Expected {test['hash']}, got {encoded}")
            failed += 1
            continue
            
        # Test Decoding
        decoded = Whostyles.decode(test['hash'])
        if not decoded:
            print("  [FAIL] Decode returned None")
            failed += 1
            continue
            
        decode_fail = False

        # Check config values
        for k, v in test['input']['config'].items():
            if decoded['config'].get(k) != v:
                print(f"  [FAIL] Config mismatch for {k}. Expected {v}, got {decoded['config'].get(k)}")
                decode_fail = True
                
        # Check color values
        for k, v in test['input']['colors'].items():
            if decoded['colors'].get(k) != v:
                print(f"  [FAIL] Color mismatch for {k}. Expected {v}, got {decoded['colors'].get(k)}")
                decode_fail = True
                
        if decode_fail:
            failed += 1
        else:
            print("  [PASS]")
            passed += 1
            
    print(f"\nTests completed. {passed} passed, {failed} failed.")
    if failed > 0:
        sys.exit(1)

if __name__ == '__main__':
    main()
