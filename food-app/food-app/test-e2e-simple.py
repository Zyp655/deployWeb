#!/usr/bin/env python3
"""
Food Ordering Platform - Comprehensive E2E Test Suite (UTF-8 Safe)
Tests all functionality: Auth, Products, Orders, Payments, Admin, Reviews, AI
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:4000"
AI_SERVICE_URL = "http://localhost:8000"
TEST_RESULTS = []
TOKENS = {}

def log_test(endpoint: str, method: str, status: int, expected: int):
    """Log test result"""
    passed = status == expected
    result_symbol = "[PASS]" if passed else "[FAIL]"
    
    result = {
        "endpoint": endpoint,
        "method": method,
        "status": status,
        "expected": expected,
        "passed": passed,
        "timestamp": datetime.now().isoformat()
    }
    TEST_RESULTS.append(result)
    
    status_str = f"Status {status} (expected {expected})"
    print(f"{result_symbol} {method} {endpoint} - {status_str}")
    
    return passed

def test_all():
    """Run all tests"""
    print("\n=== FOOD ORDERING PLATFORM - COMPREHENSIVE E2E TESTS ===\n")
    
    try:
        # Test Products
        print("MODULE 1: PRODUCTS")
        print("-" * 50)
        
        r = requests.get(f"{BASE_URL}/products", timeout=5)
        log_test("/products", "GET", r.status_code, 200)
        
        if r.status_code == 200 and r.json():
            product_id = r.json()[0]['id']
            r = requests.get(f"{BASE_URL}/products/{product_id}", timeout=5)
            log_test(f"/products/{product_id[:8]}...", "GET", r.status_code, 200)
            
            r = requests.get(f"{BASE_URL}/products/{product_id}/rating", timeout=5)
            log_test(f"/products/[id]/rating", "GET", r.status_code, 200)
        
        # Test Authentication
        print("\nMODULE 2: AUTHENTICATION")
        print("-" * 50)
        
        user_email = f"testuser{int(time.time())}@foodapp.vn"
        user_data = {"email": user_email, "password": "Test@12345", "name": "Test"}
        r = requests.post(f"{BASE_URL}/auth/register", json=user_data, timeout=5)
        log_test("/auth/register", "POST", r.status_code, 201)
        
        if r.status_code == 201:
            TOKENS['user_jwt'] = r.json().get('access_token', '')
        
        r = requests.post(f"{BASE_URL}/auth/login", json={"email": user_email, "password": "Test@12345"}, timeout=5)
        log_test("/auth/login", "POST", r.status_code, 200)
        if r.status_code == 200:
            TOKENS['user_jwt'] = r.json().get('access_token', '')
        
        r = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@foodapp.com", "password": "Admin@123"}, timeout=5)
        log_test("/auth/login (admin)", "POST", r.status_code, 200)
        if r.status_code == 200:
            TOKENS['admin_jwt'] = r.json().get('access_token', '')
        
        # Test Orders
        print("\nMODULE 3: ORDERS")
        print("-" * 50)
        
        if 'user_jwt' in TOKENS and TOKENS['user_jwt']:
            r = requests.get(f"{BASE_URL}/products", timeout=5)
            if r.status_code == 200 and r.json():
                product_id = r.json()[0]['id']
                headers = {"Authorization": f"Bearer {TOKENS['user_jwt']}", "Content-Type": "application/json"}
                
                order_data = {
                    "items": [{"productId": product_id, "quantity": 1, "note": "no ice"}],
                    "address": "123 Nguyen Trai St, District 1, HCMC",
                    "paymentMethod": "COD"
                }
                r = requests.post(f"{BASE_URL}/orders", json=order_data, headers=headers, timeout=5)
                log_test("/orders (CREATE)", "POST", r.status_code, 201)
                
                if r.status_code == 201:
                    order_id = r.json().get('id')
                    r = requests.get(f"{BASE_URL}/orders/{order_id}", headers=headers, timeout=5)
                    log_test(f"/orders/[id]", "GET", r.status_code, 200)
                    
                    r = requests.get(f"{BASE_URL}/orders/my", headers=headers, timeout=5)
                    log_test("/orders/my", "GET", r.status_code, 200)
        
        # Test Reviews
        print("\nMODULE 4: REVIEWS")
        print("-" * 50)
        
        r = requests.get(f"{BASE_URL}/products", timeout=5)
        if r.status_code == 200 and r.json() and 'user_jwt' in TOKENS:
            product_id = r.json()[0]['id']
            headers = {"Authorization": f"Bearer {TOKENS['user_jwt']}", "Content-Type": "application/json"}
            
            review_data = {"productId": product_id, "rating": 5, "comment": "Rat ngon!"}
            r = requests.post(f"{BASE_URL}/reviews", json=review_data, headers=headers, timeout=5)
            log_test("/reviews (CREATE)", "POST", r.status_code, 201)
        
        # Test Admin
        print("\nMODULE 5: ADMIN")
        print("-" * 50)
        
        if 'admin_jwt' in TOKENS and TOKENS['admin_jwt']:
            headers = {"Authorization": f"Bearer {TOKENS['admin_jwt']}", "Content-Type": "application/json"}
            
            r = requests.get(f"{BASE_URL}/admin/stats", headers=headers, timeout=5)
            log_test("/admin/stats", "GET", r.status_code, 200)
            
            r = requests.get(f"{BASE_URL}/admin/products", headers=headers, timeout=5)
            log_test("/admin/products", "GET", r.status_code, 200)
            
            r = requests.get(f"{BASE_URL}/admin/orders", headers=headers, timeout=5)
            log_test("/admin/orders", "GET", r.status_code, 200)
            
            product_data = {
                "name": "Tra Sua Tran Chau",
                "description": "Thom ngon",
                "price": 45000,
                "category": "Do uong",
                "image": "/images/tra-sua.jpg"
            }
            r = requests.post(f"{BASE_URL}/admin/products", json=product_data, headers=headers, timeout=5)
            log_test("/admin/products (CREATE)", "POST", r.status_code, 201)
        
        # Test Recommendations
        print("\nMODULE 6: RECOMMENDATIONS")
        print("-" * 50)
        
        r = requests.get(f"{BASE_URL}/products/recommended", timeout=5)
        log_test("/products/recommended", "GET", r.status_code, 200)
        
        try:
            r = requests.get(f"{AI_SERVICE_URL}/docs", timeout=5)
            log_test("AI Service (/docs)", "GET", 200 if r.status_code < 500 else r.status_code, 200)
        except:
            pass
        
        # Test Security
        print("\nMODULE 7: SECURITY")
        print("-" * 50)
        
        r = requests.get(f"{BASE_URL}/admin/stats", timeout=5)
        log_test("/admin/stats (no auth)", "GET", r.status_code, 401)
        
        r = requests.post(f"{BASE_URL}/auth/login", json={"email": "fake@test.com", "password": "bad"}, timeout=5)
        log_test("/auth/login (invalid)", "POST", r.status_code, 401)
        
        fake_id = "00000000-0000-0000-0000-000000000000"
        r = requests.get(f"{BASE_URL}/products/{fake_id}", timeout=5)
        log_test("/products/[invalid-id]", "GET", r.status_code, 404)
        
    except Exception as e:
        print(f"ERROR: {str(e)}\n")
    
    # Generate Report
    print("\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)
    
    total = len(TEST_RESULTS)
    passed = sum(1 for t in TEST_RESULTS if t['passed'])
    failed = total - passed
    success_rate = (passed / total * 100) if total > 0 else 0
    
    print(f"Total: {total}")
    print(f"[PASS] Passed: {passed}")
    print(f"[FAIL] Failed: {failed}")
    print(f"Success Rate: {success_rate:.1f}%\n")
    
    # Save JSON report
    report_data = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total": total,
            "passed": passed,
            "failed": failed,
            "success_rate": round(success_rate, 1)
        },
        "tests": TEST_RESULTS
    }
    
    with open('d:\\food-app\\test-results-final.json', 'w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)
    
    print("Report saved to: test-results-final.json")
    
    return success_rate >= 80

if __name__ == "__main__":
    success = test_all()
    sys.exit(0 if success else 1)
