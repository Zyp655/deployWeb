"""
Improved Comprehensive API Testing Script for Food Ordering Platform
This version properly handles JWT tokens and uses actual UUIDs
Run this script: python run-api-tests-improved.py
"""

import json
import time
import requests
from datetime import datetime
from typing import Dict, Any, Tuple

BASE_URL = "http://localhost:4000"
AI_SERVICE_URL = "http://localhost:8000"
RESULTS_FILE = "test_results_detailed.json"

# Global storage for tokens and IDs
test_data = {
    "test_token": None,
    "admin_token": None,
    "user_id": None,
    "order_id": None,
    "product_id": None,
    "product_ids": [],
    "results": []
}

def log_test(module: str, test_name: str, method: str, endpoint: str, status_code: int, success: bool, details: str = "", response_body: dict = None):
    """Log test result"""
    result = {
        "timestamp": datetime.now().isoformat(),
        "module": module,
        "test": test_name,
        "method": method,
        "endpoint": endpoint,
        "status_code": status_code,
        "success": success,
        "details": details,
        "response": response_body
    }
    test_data["results"].append(result)
    
    status_icon = "✅ PASS" if success else "❌ FAIL"
    print(f"{status_icon:8} | {module:20} | {test_name:35} | {method:6} | Status: {status_code:3}")

def test_endpoint(method: str, endpoint: str, data: Dict = None, token: str = None, test_name: str = "", module: str = "") -> Tuple[int, Dict, bool]:
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
            log_test(module, test_name, method, endpoint, response.status_code, success, str(resp_json)[:100], resp_json)
        
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
print("\n" + "="*120)
print("MODULE 1: Basic API Connectivity & Products")
print("="*120)

# Test 1.1: GET /products
status, resp, success = test_endpoint(
    "GET", "/products", 
    test_name="Retrieve all products",
    module="Module 1"
)
if success and isinstance(resp, list):
    print(f"   ✓ Retrieved {len(resp)} products")
    test_data["product_ids"] = [p["id"] for p in resp]
    if test_data["product_ids"]:
        test_data["product_id"] = test_data["product_ids"][0]
        print(f"   ✓ Using product ID: {test_data['product_id'][:8]}...")

# Test 1.2: GET /products/:id (using actual UUID)
if test_data["product_id"]:
    status, resp, success = test_endpoint(
        "GET", f"/products/{test_data['product_id']}",
        test_name="Get single product by ID",
        module="Module 1"
    )
    if success and isinstance(resp, dict):
        print(f"   ✓ Product: {resp.get('name', 'N/A')}")
        print(f"   ✓ Price: {resp.get('price', 'N/A')}")
        print(f"   ✓ Category: {resp.get('category', 'N/A')}")
        print(f"   ✓ Rating: {resp.get('rating', 'N/A')}")

# Test 1.3: GET /products/:id/rating
if test_data["product_id"]:
    status, resp, success = test_endpoint(
        "GET", f"/products/{test_data['product_id']}/rating",
        test_name="Get product rating",
        module="Module 1"
    )

# Test 1.4: GET /products/:id/reviews
if test_data["product_id"]:
    status, resp, success = test_endpoint(
        "GET", f"/products/{test_data['product_id']}/reviews",
        test_name="Get product reviews",
        module="Module 1"
    )

# ========== MODULE 2: Authentication & Users ==========
print("\n" + "="*120)
print("MODULE 2: Authentication & Users")
print("="*120)

# Test 2.1: POST /auth/register
register_data = {
    "email": f"testuser{int(time.time())}@foodapp.vn",
    "password": "Test@12345",
    "name": "Test User"
}
status, resp, success = test_endpoint(
    "POST", "/auth/register",
    data=register_data,
    test_name="Register new user",
    module="Module 2"
)
if success and isinstance(resp, dict):
    if "user" in resp:
        test_data["user_id"] = resp["user"].get("id")
        print(f"   ✓ User registered: {test_data['user_id'][:8]}...")
    if "access_token" in resp:
        test_data["test_token"] = resp["access_token"]
        print(f"   ✓ JWT Token received: {test_data['test_token'][:20]}...")

# Test 2.2: POST /auth/login
login_data = {
    "email": register_data["email"],
    "password": "Test@12345"
}
status, resp, success = test_endpoint(
    "POST", "/auth/login",
    data=login_data,
    test_name="Login with credentials",
    module="Module 2"
)
if success and isinstance(resp, dict):
    if "user" in resp:
        print(f"   ✓ User ID: {resp['user'].get('id', 'N/A')[:8]}...")
    if "access_token" in resp:
        test_data["test_token"] = resp["access_token"]
        print(f"   ✓ JWT Token received: {test_data['test_token'][:20]}...")

# Test 2.3: Admin Login
admin_login_data = {
    "email": "admin@foodapp.com",
    "password": "Admin@123"
}
status, resp, success = test_endpoint(
    "POST", "/auth/login",
    data=admin_login_data,
    test_name="Admin login",
    module="Module 2"
)
if success and isinstance(resp, dict):
    if "access_token" in resp:
        test_data["admin_token"] = resp["access_token"]
        print(f"   ✓ Admin token received: {test_data['admin_token'][:20]}...")
    if "user" in resp:
        print(f"   ✓ User role: {resp['user'].get('role', 'N/A')}")

# Test 2.4: Get authenticated user orders
if test_data["test_token"]:
    status, resp, success = test_endpoint(
        "GET", "/orders/my",
        token=test_data["test_token"],
        test_name="Get user's orders",
        module="Module 2"
    )
    if success:
        if isinstance(resp, list):
            print(f"   ✓ Retrieved {len(resp)} orders")
        elif isinstance(resp, dict) and "data" in resp:
            print(f"   ✓ Retrieved {len(resp.get('data', []))} orders")

# ========== MODULE 3: Products & Recommendations ==========
print("\n" + "="*120)
print("MODULE 3: Products & Recommendations")
print("="*120)

if test_data["test_token"]:
    status, resp, success = test_endpoint(
        "GET", "/products/recommended",
        token=test_data["test_token"],
        test_name="Get recommended products",
        module="Module 3"
    )
    if success:
        if isinstance(resp, list):
            print(f"   ✓ Retrieved {len(resp)} recommended products")
        elif isinstance(resp, dict) and "data" in resp:
            print(f"   ✓ Retrieved {len(resp.get('data', []))} recommended products")

# ========== MODULE 4: Orders & Cart Flow ==========
print("\n" + "="*120)
print("MODULE 4: Orders & Cart Flow")
print("="*120)

if test_data["test_token"] and test_data["product_id"]:
    # Test 4.1: Create Order
    order_data = {
        "items": [
            {
                "productId": test_data["product_id"],
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
        test_name="Create order",
        module="Module 4"
    )
    
    if success and isinstance(resp, dict):
        if "id" in resp:
            test_data["order_id"] = resp["id"]
            print(f"   ✓ Order created: {test_data['order_id'][:8]}...")
            print(f"   ✓ Order status: {resp.get('status', 'N/A')}")
            print(f"   ✓ Total amount: {resp.get('totalAmount', 'N/A')}")

    # Test 4.2: Get Order Details
    if test_data["order_id"]:
        status, resp, success = test_endpoint(
            "GET", f"/orders/{test_data['order_id']}",
            token=test_data["test_token"],
            test_name="Get order details",
            module="Module 4"
        )
        if success:
            print(f"   ✓ Order status: {resp.get('status', 'N/A')}")
            print(f"   ✓ Items count: {len(resp.get('items', []))}")

    # Test 4.3: Update Order Status (Admin only)
    if test_data["admin_token"] and test_data["order_id"]:
        update_data = {"status": "confirmed"}
        status, resp, success = test_endpoint(
            "PATCH", f"/orders/{test_data['order_id']}/status",
            data=update_data,
            token=test_data["admin_token"],
            test_name="Update order status (admin)",
            module="Module 4"
        )
        if success:
            print(f"   ✓ New status: {resp.get('status', 'N/A')}")

# ========== MODULE 5: Payments ==========
print("\n" + "="*120)
print("MODULE 5: Payments")
print("="*120)

if test_data["test_token"] and test_data["order_id"]:
    # Test 5.1: Momo Payment
    payment_data = {
        "orderId": test_data["order_id"],
        "amount": 100000,
        "idempotency_key": f"test-momo-{int(time.time())}"
    }
    
    status, resp, success = test_endpoint(
        "POST", "/payments/momo/create",
        data=payment_data,
        token=test_data["test_token"],
        test_name="Create Momo payment",
        module="Module 5"
    )
    if success:
        print(f"   ✓ Payment link generated")

    # Test 5.2: VN Pay
    payment_data = {
        "orderId": test_data["order_id"],
        "amount": 100000,
        "idempotency_key": f"test-vnpay-{int(time.time())}"
    }
    
    status, resp, success = test_endpoint(
        "POST", "/payments/vnpay/create",
        data=payment_data,
        token=test_data["test_token"],
        test_name="Create VN Pay payment",
        module="Module 5"
    )
    if success:
        print(f"   ✓ Payment link generated")

# ========== MODULE 6: Reviews & Ratings ==========
print("\n" + "="*120)
print("MODULE 6: Reviews & Ratings")
print("="*120)

if test_data["test_token"] and test_data["product_id"]:
    review_data = {
        "productId": test_data["product_id"],
        "rating": 5,
        "comment": "Rất ngon!"
    }
    
    status, resp, success = test_endpoint(
        "POST", "/reviews",
        data=review_data,
        token=test_data["test_token"],
        test_name="Create product review",
        module="Module 6"
    )
    if success:
        print(f"   ✓ Review created")

    status, resp, success = test_endpoint(
        "GET", f"/products/{test_data['product_id']}/reviews",
        test_name="Get product reviews",
        module="Module 6"
    )
    if success:
        if isinstance(resp, list):
            print(f"   ✓ Retrieved {len(resp)} reviews")
        else:
            print(f"   ✓ Reviews retrieved")

# ========== MODULE 7: Admin Endpoints ==========
print("\n" + "="*120)
print("MODULE 7: Admin Endpoints")
print("="*120)

if test_data["admin_token"]:
    # Test 7.1: Admin Stats
    status, resp, success = test_endpoint(
        "GET", "/admin/stats",
        token=test_data["admin_token"],
        test_name="Get admin stats/dashboard",
        module="Module 7"
    )
    if success:
        print(f"   ✓ Total orders: {resp.get('totalOrders', 'N/A')}")
        print(f"   ✓ Total revenue: {resp.get('totalRevenue', 'N/A')}")
        print(f"   ✓ Total customers: {resp.get('totalCustomers', 'N/A')}")

    # Test 7.2: List all products
    status, resp, success = test_endpoint(
        "GET", "/admin/products",
        token=test_data["admin_token"],
        test_name="Get all products (admin)",
        module="Module 7"
    )
    if success:
        if isinstance(resp, list):
            print(f"   ✓ Retrieved {len(resp)} products")
        elif isinstance(resp, dict) and "data" in resp:
            print(f"   ✓ Retrieved {len(resp.get('data', []))} products")

    # Test 7.3: Create new product
    product_data = {
        "name": f"Trà Sữa Trân Châu {int(time.time())}",
        "price": 45000,
        "category": "Đồ uống",
        "image": "https://example.com/image.jpg",
        "description": "Trà sữa với trân châu ngon lạ",
        "rating": 0
    }
    
    status, resp, success = test_endpoint(
        "POST", "/admin/products",
        data=product_data,
        token=test_data["admin_token"],
        test_name="Create new product (admin)",
        module="Module 7"
    )
    if success:
        print(f"   ✓ Product created: {resp.get('id', 'N/A')[:8]}...")

    # Test 7.4: List all orders
    status, resp, success = test_endpoint(
        "GET", "/admin/orders",
        token=test_data["admin_token"],
        test_name="Get all orders (admin)",
        module="Module 7"
    )
    if success:
        if isinstance(resp, list):
            print(f"   ✓ Retrieved {len(resp)} orders")
        elif isinstance(resp, dict) and "data" in resp:
            print(f"   ✓ Retrieved {len(resp.get('data', []))} orders")

    # Test 7.5: List all users
    status, resp, success = test_endpoint(
        "GET", "/admin/users",
        token=test_data["admin_token"],
        test_name="Get all users (admin)",
        module="Module 7"
    )
    if success:
        if isinstance(resp, list):
            print(f"   ✓ Retrieved {len(resp)} users")
        elif isinstance(resp, dict) and "data" in resp:
            print(f"   ✓ Retrieved {len(resp.get('data', []))} users")
else:
    print("⚠️  Admin token not available - skipping admin tests")

# ========== MODULE 8: AI Service ==========
print("\n" + "="*120)
print("MODULE 8: AI Service Endpoints")
print("="*120)

# Test 8.1: Check AI Service Documentation
try:
    response = requests.get(f"{AI_SERVICE_URL}/docs", timeout=3)
    status_code = response.status_code
    success = 200 <= status_code < 300
    log_test("Module 8", "Get AI API docs", "GET", f"{AI_SERVICE_URL}/docs", status_code, success)
    if success:
        print(f"   ✓ AI Service API available")
except Exception as e:
    log_test("Module 8", "Get AI API docs", "GET", f"{AI_SERVICE_URL}/docs", 0, False, str(e)[:50])

# Test 8.2: AI Recommendations
try:
    recommend_data = {
        "user_id": test_data["user_id"] or "test_user",
        "availableProducts": test_data["product_ids"][:5] if test_data["product_ids"] else []
    }
    response = requests.post(f"{AI_SERVICE_URL}/recommend", json=recommend_data, timeout=3)
    status_code = response.status_code
    success = 200 <= status_code < 300
    resp_json = response.json() if response.text else {}
    log_test("Module 8", "Get AI recommendations", "POST", f"{AI_SERVICE_URL}/recommend", status_code, success, str(resp_json)[:100], resp_json)
    if success:
        print(f"   ✓ Recommendations received")
except Exception as e:
    log_test("Module 8", "Get AI recommendations", "POST", f"{AI_SERVICE_URL}/recommend", 0, False, str(e)[:50])

# ========== MODULE 9: Error Handling & Security ==========
print("\n" + "="*120)
print("MODULE 9: Error Handling & Security")
print("="*120)

# Test 9.1: Authorization - Try accessing admin endpoint without token
status, resp, success = test_endpoint(
    "GET", "/admin/stats",
    test_name="Admin endpoint without auth",
    module="Module 9"
)
if status == 401:
    print("   ✓ ✅ Correctly denied - 401 Unauthorized")

# Test 9.2: Non-existent product
status, resp, success = test_endpoint(
    "GET", "/products/00000000-0000-0000-0000-000000000000",
    test_name="Get non-existent product",
    module="Module 9"
)
if status in [404, 400]:
    print(f"   ✓ ✅ Correctly handled - Status {status}")

# Test 9.3: Invalid email registration
invalid_register = {
    "email": "invalid-email",
    "password": "Test@12345",
    "name": "Test"
}
status, resp, success = test_endpoint(
    "POST", "/auth/register",
    data=invalid_register,
    test_name="Register with invalid email",
    module="Module 9"
)
if status in [400, 422]:
    print("   ✓ ✅ Correctly rejected - Invalid format")

# Test 9.4: Missing required fields in order
incomplete_order = {
    "items": []
}
status, resp, success = test_endpoint(
    "POST", "/orders",
    data=incomplete_order,
    token=test_data["test_token"],
    test_name="Create order with missing fields",
    module="Module 9"
)
if status in [400, 422, 401]:
    print(f"   ✓ ✅ Correctly handled - Status {status}")

# ========== Save Results ==========
print("\n" + "="*120)
print("TEST EXECUTION SUMMARY")
print("="*120)

# Calculate statistics
total_tests = len(test_data["results"])
passed_tests = sum(1 for r in test_data["results"] if r["success"])
failed_tests = total_tests - passed_tests

print(f"\nTotal Tests Executed: {total_tests}")
print(f"✅ PASSED: {passed_tests}")
print(f"❌ FAILED: {failed_tests}")
if total_tests > 0:
    success_rate = (passed_tests/total_tests*100)
    print(f"📊 Success Rate: {success_rate:.1f}%")
    
    # Pass rate assessment
    if success_rate >= 90:
        print("🟢 Status: EXCELLENT")
    elif success_rate >= 75:
        print("🟡 Status: GOOD")
    elif success_rate >= 50:
        print("🟠 Status: FAIR - Needs attention")
    else:
        print("🔴 Status: POOR - Major issues")

# Save detailed results to JSON
summary = {
    "timestamp": datetime.now().isoformat(),
    "total_tests": total_tests,
    "passed": passed_tests,
    "failed": failed_tests,
    "success_rate": (passed_tests/total_tests*100) if total_tests > 0 else 0,
    "test_data": test_data,
    "results": test_data["results"]
}

with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print(f"\n✅ Detailed results saved to: {RESULTS_FILE}")
print("="*120)
