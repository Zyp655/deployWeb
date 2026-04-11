"""
Comprehensive API Testing Script for Food Ordering Platform
Run this script: python run-api-tests.py
"""

import json
import time
import requests
from datetime import datetime
from typing import Dict, Any

BASE_URL = "http://localhost:4000"
AI_SERVICE_URL = "http://localhost:8000"
RESULTS_FILE = "test_results.json"

# Global storage for tokens and IDs
test_data = {
    "test_token": None,
    "admin_token": None,
    "user_id": None,
    "order_id": None,
    "product_id": 1,
    "results": []
}

def log_test(module: str, test_name: str, method: str, endpoint: str, status_code: int, success: bool, details: str = ""):
    """Log test result"""
    result = {
        "timestamp": datetime.now().isoformat(),
        "module": module,
        "test": test_name,
        "method": method,
        "endpoint": endpoint,
        "status_code": status_code,
        "success": success,
        "details": details
    }
    test_data["results"].append(result)
    
    status_icon = "✅ PASS" if success else "❌ FAIL"
    print(f"{status_icon} | {module:20} | {test_name:30} | {method} {endpoint:30} | Status: {status_code}")
    if details:
        print(f"      Details: {details[:100]}")

def test_endpoint(method: str, endpoint: str, data: Dict = None, token: str = None, test_name: str = "", module: str = "") -> tuple:
    """Make HTTP request and return (status_code, response_dict, success)"""
    url = f"{BASE_URL}{endpoint}"
    headers = {
        "Content-Type": "application/json"
    }
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=5)
        elif method == "PATCH":
            response = requests.patch(url, json=data, headers=headers, timeout=5)
        else:
            response = requests.request(method, url, json=data, headers=headers, timeout=5)
        
        success = 200 <= response.status_code < 300
        try:
            resp_json = response.json()
        except:
            resp_json = {"raw": response.text[:200]}
        
        if test_name and module:
            log_test(module, test_name, method, endpoint, response.status_code, success, str(resp_json)[:100])
        
        return response.status_code, resp_json, success
    
    except requests.exceptions.ConnectionError as e:
        if test_name and module:
            log_test(module, test_name, method, endpoint, 0, False, f"Connection Error: {str(e)[:50]}")
        return 0, {"error": str(e)}, False
    except Exception as e:
        if test_name and module:
            log_test(module, test_name, method, endpoint, 0, False, f"Error: {str(e)[:50]}")
        return 0, {"error": str(e)}, False

# ========== MODULE 1: Basic API Connectivity & Products ==========
print("\n" + "="*100)
print("MODULE 1: Basic API Connectivity & Products")
print("="*100)

# Test 1.1: GET /products
status, resp, success = test_endpoint(
    "GET", "/products", 
    test_name="GET /products (all products)",
    module="Module 1"
)
if success and isinstance(resp, list):
    print(f"   → Retrieved {len(resp)} products")

# Test 1.2: GET /products/:id
status, resp, success = test_endpoint(
    "GET", "/products/1",
    test_name="GET /products/1 (single product)",
    module="Module 1"
)
if success and isinstance(resp, dict):
    print(f"   → Product: {resp.get('name', 'N/A')}")

# Test 1.3: GET /products/:id/rating
status, resp, success = test_endpoint(
    "GET", "/products/1/rating",
    test_name="GET /products/1/rating",
    module="Module 1"
)

# Test 1.4: GET /products/:id/reviews
status, resp, success = test_endpoint(
    "GET", "/products/1/reviews",
    test_name="GET /products/1/reviews",
    module="Module 1"
)

# ========== MODULE 2: Authentication & Users ==========
print("\n" + "="*100)
print("MODULE 2: Authentication & Users")
print("="*100)

# Test 2.1: POST /auth/register
register_data = {
    "email": "testuser@foodapp.vn",
    "password": "Test@12345",
    "name": "Test User"
}
status, resp, success = test_endpoint(
    "POST", "/auth/register",
    data=register_data,
    test_name="POST /auth/register",
    module="Module 2"
)

# Test 2.2: POST /auth/login
login_data = {
    "email": "testuser@foodapp.vn",
    "password": "Test@12345"
}
status, resp, success = test_endpoint(
    "POST", "/auth/login",
    data=login_data,
    test_name="POST /auth/login",
    module="Module 2"
)

if success and isinstance(resp, dict):
    if "access_token" in resp:
        test_data["test_token"] = resp["access_token"]
        print(f"   → Token received: {resp['access_token'][:20]}...")
    if "user" in resp and "id" in resp["user"]:
        test_data["user_id"] = resp["user"]["id"]
        print(f"   → User ID: {test_data['user_id']}")

# Test 2.3: Admin Login
admin_login_data = {
    "email": "admin@foodapp.com",
    "password": "Admin@123"
}
status, resp, success = test_endpoint(
    "POST", "/auth/login (admin)",
    data=admin_login_data,
    test_name="POST /auth/login (admin)",
    module="Module 2"
)

if success and isinstance(resp, dict) and "access_token" in resp:
    test_data["admin_token"] = resp["access_token"]
    print(f"   → Admin token received: {resp['access_token'][:20]}...")

# Test 2.4: Get authenticated user
status, resp, success = test_endpoint(
    "GET", "/orders/my",
    token=test_data["test_token"],
    test_name="GET /orders/my (authenticated)",
    module="Module 2"
)

# ========== MODULE 3: Products & Recommendations ==========
print("\n" + "="*100)
print("MODULE 3: Products & Recommendations")
print("="*100)

status, resp, success = test_endpoint(
    "GET", "/products/recommended",
    token=test_data["test_token"],
    test_name="GET /products/recommended",
    module="Module 3"
)

# ========== MODULE 4: Orders & Cart Flow ==========
print("\n" + "="*100)
print("MODULE 4: Orders & Cart Flow")
print("="*100)

if test_data["test_token"]:
    # Test 4.1: Create Order
    order_data = {
        "items": [
            {
                "productId": 1,
                "quantity": 2,
                "notes": "no ice"
            }
        ],
        "shippingAddress": "123 Nguyen Trai, District 1, HCMC",
        "phone": "0901234567",
        "paymentMethod": "COD"
    }
    
    status, resp, success = test_endpoint(
        "POST", "/orders",
        data=order_data,
        token=test_data["test_token"],
        test_name="POST /orders (create order)",
        module="Module 4"
    )
    
    if success and isinstance(resp, dict):
        if "id" in resp:
            test_data["order_id"] = resp["id"]
            print(f"   → Order ID: {test_data['order_id']}")

    # Test 4.2: Get Order Status
    if test_data["order_id"]:
        status, resp, success = test_endpoint(
            "GET", f"/orders/{test_data['order_id']}",
            token=test_data["test_token"],
            test_name="GET /orders/:id (order details)",
            module="Module 4"
        )

    # Test 4.3: Get User Orders
    status, resp, success = test_endpoint(
        "GET", "/orders/my",
        token=test_data["test_token"],
        test_name="GET /orders/my (user's orders)",
        module="Module 4"
    )

    # Test 4.4: Update Order Status (Admin only)
    if test_data["admin_token"] and test_data["order_id"]:
        update_data = {"status": "confirmed"}
        status, resp, success = test_endpoint(
            "PATCH", f"/orders/{test_data['order_id']}/status",
            data=update_data,
            token=test_data["admin_token"],
            test_name="PATCH /orders/:id/status (admin update)",
            module="Module 4"
        )

# ========== MODULE 5: Payments ==========
print("\n" + "="*100)
print("MODULE 5: Payments")
print("="*100)

if test_data["test_token"] and test_data["order_id"]:
    # Test 5.1: Momo Payment
    payment_data = {
        "orderId": test_data["order_id"],
        "amount": 100000,
        "idempotency_key": "test-momo-12345"
    }
    
    status, resp, success = test_endpoint(
        "POST", "/payments/momo/create",
        data=payment_data,
        token=test_data["test_token"],
        test_name="POST /payments/momo/create",
        module="Module 5"
    )

    # Test 5.2: VN Pay
    payment_data = {
        "orderId": test_data["order_id"],
        "amount": 100000,
        "idempotency_key": "test-vnpay-12345"
    }
    
    status, resp, success = test_endpoint(
        "POST", "/payments/vnpay/create",
        data=payment_data,
        token=test_data["test_token"],
        test_name="POST /payments/vnpay/create",
        module="Module 5"
    )

# ========== MODULE 6: Reviews & Ratings ==========
print("\n" + "="*100)
print("MODULE 6: Reviews & Ratings")
print("="*100)

if test_data["test_token"]:
    review_data = {
        "productId": 1,
        "rating": 5,
        "comment": "Rất ngon!"
    }
    
    status, resp, success = test_endpoint(
        "POST", "/reviews",
        data=review_data,
        token=test_data["test_token"],
        test_name="POST /reviews (create review)",
        module="Module 6"
    )

    status, resp, success = test_endpoint(
        "GET", "/products/1/reviews",
        test_name="GET /products/1/reviews (list reviews)",
        module="Module 6"
    )

# ========== MODULE 7: Admin Endpoints ==========
print("\n" + "="*100)
print("MODULE 7: Admin Endpoints")
print("="*100)

if test_data["admin_token"]:
    # Test 7.1: Admin Stats
    status, resp, success = test_endpoint(
        "GET", "/admin/stats",
        token=test_data["admin_token"],
        test_name="GET /admin/stats",
        module="Module 7"
    )

    # Test 7.2: Admin Products
    status, resp, success = test_endpoint(
        "GET", "/admin/products",
        token=test_data["admin_token"],
        test_name="GET /admin/products",
        module="Module 7"
    )

    # Test 7.3: Create Product
    product_data = {
        "name": "Trà Sữa Trân Châu",
        "price": 45000,
        "category": "Đồ uống",
        "image": "https://example.com/image.jpg",
        "description": "Test product"
    }
    
    status, resp, success = test_endpoint(
        "POST", "/admin/products",
        data=product_data,
        token=test_data["admin_token"],
        test_name="POST /admin/products (create product)",
        module="Module 7"
    )

    # Test 7.4: List all orders
    status, resp, success = test_endpoint(
        "GET", "/admin/orders",
        token=test_data["admin_token"],
        test_name="GET /admin/orders (all orders)",
        module="Module 7"
    )

    # Test 7.5: List all users
    status, resp, success = test_endpoint(
        "GET", "/admin/users",
        token=test_data["admin_token"],
        test_name="GET /admin/users (all users)",
        module="Module 7"
    )
else:
    print("⚠️  Admin token not available - skipping admin tests")

# ========== MODULE 8: AI Service ==========
print("\n" + "="*100)
print("MODULE 8: AI Service Endpoints")
print("="*100)

# Test 8.1: Check AI Service Documentation
try:
    response = requests.get(f"{AI_SERVICE_URL}/docs", timeout=3)
    status_code = response.status_code
    success = 200 <= status_code < 300
    log_test("Module 8", "GET /docs (AI Service)", "GET", f"{AI_SERVICE_URL}/docs", status_code, success)
except Exception as e:
    log_test("Module 8", "GET /docs (AI Service)", "GET", f"{AI_SERVICE_URL}/docs", 0, False, str(e)[:50])

# Test 8.2: AI Recommendations
try:
    recommend_data = {
        "user_id": test_data["user_id"] or "test_user",
        "order_history": []
    }
    response = requests.post(f"{AI_SERVICE_URL}/recommend", json=recommend_data, timeout=3)
    status_code = response.status_code
    success = 200 <= status_code < 300
    resp_json = response.json() if response.text else {}
    log_test("Module 8", "POST /recommend (AI Service)", "POST", f"{AI_SERVICE_URL}/recommend", status_code, success, str(resp_json)[:100])
except Exception as e:
    log_test("Module 8", "POST /recommend (AI Service)", "POST", f"{AI_SERVICE_URL}/recommend", 0, False, str(e)[:50])

# ========== MODULE 9: Error Handling & Security ==========
print("\n" + "="*100)
print("MODULE 9: Error Handling & Security")
print("="*100)

# Test 9.1: Authorization - Try accessing admin endpoint without token
status, resp, success = test_endpoint(
    "GET", "/admin/stats",
    test_name="GET /admin/stats (without auth)",
    module="Module 9"
)
if status == 401:
    print("   → ✅ Correctly denied without auth token")

# Test 9.2: Non-existent product
status, resp, success = test_endpoint(
    "GET", "/products/99999",
    test_name="GET /products/99999 (non-existent)",
    module="Module 9"
)
if status in [404, 400, 500]:
    print(f"   → ✅ Correctly returned error (status {status})")

# Test 9.3: Invalid email registration
invalid_register = {
    "email": "invalid-email",
    "password": "Test@12345",
    "name": "Test"
}
status, resp, success = test_endpoint(
    "POST", "/auth/register",
    data=invalid_register,
    test_name="POST /auth/register (invalid email)",
    module="Module 9"
)
if status in [400, 422]:
    print("   → ✅ Correctly rejected invalid email")

# Test 9.4: Missing required fields
incomplete_order = {
    "items": []
}
status, resp, success = test_endpoint(
    "POST", "/orders",
    data=incomplete_order,
    token=test_data["test_token"],
    test_name="POST /orders (missing fields)",
    module="Module 9"
)
if status in [400, 422]:
    print("   → ✅ Correctly rejected incomplete order")

# ========== Save Results ==========
print("\n" + "="*100)
print("TEST SUMMARY")
print("="*100)

# Calculate statistics
total_tests = len(test_data["results"])
passed_tests = sum(1 for r in test_data["results"] if r["success"])
failed_tests = total_tests - passed_tests

print(f"\nTotal Tests: {total_tests}")
print(f"Passed: {passed_tests} ✅")
print(f"Failed: {failed_tests} ❌")
print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "N/A")

# Save detailed results to JSON
with open(RESULTS_FILE, 'w') as f:
    json.dump({
        "timestamp": datetime.now().isoformat(),
        "total_tests": total_tests,
        "passed": passed_tests,
        "failed": failed_tests,
        "success_rate": (passed_tests/total_tests*100) if total_tests > 0 else 0,
        "test_data": test_data,
        "results": test_data["results"]
    }, f, indent=2)

print(f"\nDetailed results saved to: {RESULTS_FILE}")
