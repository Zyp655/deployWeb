"""
Final Comprehensive API Test Suite - With All Fixes Applied
This version properly handles JWT tokens and AI Service schema
Run: python run-final-tests.py
"""

import json
import time
import requests
from datetime import datetime
from typing import Dict, Any, Tuple, Optional

BASE_URL = "http://localhost:4000"
AI_SERVICE_URL = "http://localhost:8000"
RESULTS_FILE = "FINAL_TEST_RESULTS.json"

class TestRunner:
    def __init__(self):
        self.results = []
        self.user_token = None
        self.admin_token = None
        self.user_id = None
        self.admin_id = None
        self.order_id = None
        self.product_id = None
        self.product_ids = []
        self.products_list = []

    def log_test(self, module: str, test_name: str, method: str, endpoint: str, 
                 status_code: int, success: bool, response: Any = None):
        """Log test result"""
        result = {
            "timestamp": datetime.now().isoformat(),
            "module": module,
            "test": test_name,
            "method": method,
            "endpoint": endpoint,
            "status_code": status_code,
            "success": "✅ PASS" if success else "❌ FAIL",
            "response_type": str(type(response).__name__)
        }
        self.results.append(result)
        
        status = "✅" if success else "❌"
        print(f"{status} {module:12} | {test_name:35} | {method:6} {endpoint:40} | {status_code}")

    def request(self, method: str, endpoint: str, data: Dict = None, 
                token: Optional[str] = None) -> Tuple[int, Any, bool]:
        """Make HTTP request"""
        url = f"{BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method == "GET":
                r = requests.get(url, headers=headers, timeout=5)
            elif method == "POST":
                r = requests.post(url, json=data, headers=headers, timeout=5)
            elif method == "PATCH":
                r = requests.patch(url, json=data, headers=headers, timeout=5)
            else:
                r = requests.request(method, url, json=data, headers=headers, timeout=5)
            
            try:
                resp = r.json()
            except:
                resp = {"raw": r.text[:100]}
            
            return r.status_code, resp, 200 <= r.status_code < 300
        except Exception as e:
            return 0, {"error": str(e)}, False

    def run_all_tests(self):
        """Execute all test modules"""
        print("\n" + "="*120)
        print("COMPREHENSIVE API TEST SUITE - FOOD ORDERING PLATFORM")
        print("="*120 + "\n")
        
        self.test_module_1_products()
        self.test_module_2_auth()
        self.test_module_3_recommendations()
        self.test_module_4_orders()
        self.test_module_5_payments()
        self.test_module_6_reviews()
        self.test_module_7_admin()
        self.test_module_8_ai_service()
        self.test_module_9_security()
        
        self.print_summary()
        self.save_results()

    def test_module_1_products(self):
        """MODULE 1: Products & Catalog"""
        print("\n" + "─"*120)
        print("MODULE 1: PRODUCTS & CATALOG")
        print("─"*120)
        
        # Test 1.1: Get all products
        status, data, ok = self.request("GET", "/products")
        self.log_test("Module 1", "Retrieve all products", "GET", "/products", status, ok, data)
        if ok and isinstance(data, list):
            self.product_ids = [p["id"] for p in data]
            self.products_list = data
            self.product_id = self.product_ids[0] if self.product_ids else None
            print(f"   📦 Retrieved {len(data)} products")
        
        # Test 1.2: Get single product
        if self.product_id:
            status, data, ok = self.request("GET", f"/products/{self.product_id}")
            self.log_test("Module 1", "Get single product", "GET", f"/products/{{id}}", status, ok, data)
            if ok:
                print(f"   📦 Product: {data.get('name')} - {data.get('price')} VND")
        
        # Test 1.3: Get product rating
        if self.product_id:
            status, data, ok = self.request("GET", f"/products/{self.product_id}/rating")
            self.log_test("Module 1", "Get product rating", "GET", "/products/{id}/rating", status, ok, data)
        
        # Test 1.4: Get product reviews
        if self.product_id:
            status, data, ok = self.request("GET", f"/products/{self.product_id}/reviews")
            self.log_test("Module 1", "Get product reviews", "GET", "/products/{id}/reviews", status, ok, data)

    def test_module_2_auth(self):
        """MODULE 2: Authentication"""
        print("\n" + "─"*120)
        print("MODULE 2: AUTHENTICATION & USERS")
        print("─"*120)
        
        # Test 2.1: Register user
        user_email = f"testuser{int(time.time())}@foodapp.vn"
        reg_data = {
            "email": user_email,
            "password": "Test@12345",
            "name": "Test User"
        }
        status, data, ok = self.request("POST", "/auth/register", data=reg_data)
        self.log_test("Module 2", "Register new user", "POST", "/auth/register", status, ok, data)
        if ok and isinstance(data, dict):
            if "user" in data:
                self.user_id = data["user"].get("id")
            if "accessToken" in data:
                self.user_token = data["accessToken"]
                print(f"   👤 User ID: {self.user_id}")
                print(f"   🔐 Token: {self.user_token[:25]}...")
        
        # Test 2.2: Login
        login_data = {"email": user_email, "password": "Test@12345"}
        status, data, ok = self.request("POST", "/auth/login", data=login_data)
        self.log_test("Module 2", "Login with credentials", "POST", "/auth/login", status, ok, data)
        if ok and isinstance(data, dict) and "accessToken" in data:
            self.user_token = data["accessToken"]
            print(f"   ✅ Login successful")
        
        # Test 2.3: Admin login
        admin_data = {"email": "admin@foodapp.com", "password": "Admin@123"}
        status, data, ok = self.request("POST", "/auth/login", data=admin_data)
        self.log_test("Module 2", "Admin login", "POST", "/auth/login (admin)", status, ok, data)
        if ok and isinstance(data, dict) and "accessToken" in data:
            self.admin_token = data["accessToken"]
            self.admin_id = data["user"].get("id")
            print(f"   👨‍💼 Admin ID: {self.admin_id}")
            print(f"   🔐 Admin token: {self.admin_token[:25]}...")

    def test_module_3_recommendations(self):
        """MODULE 3: Product Recommendations"""
        print("\n" + "─"*120)
        print("MODULE 3: PRODUCT RECOMMENDATIONS")
        print("─"*120)
        
        if not self.user_token:
            print("⏭️  Skipped - No user token available")
            return
        
        # Test 3.1: Get recommendations
        status, data, ok = self.request("GET", "/products/recommended", token=self.user_token)
        self.log_test("Module 3", "Get recommended products", "GET", "/products/recommended", status, ok, data)
        if ok:
            if isinstance(data, list):
                print(f"   🎯 Retrieved {len(data)} recommendations")

    def test_module_4_orders(self):
        """MODULE 4: Orders & Cart"""
        print("\n" + "─"*120)
        print("MODULE 4: ORDERS & CART FLOW")
        print("─"*120)
        
        if not self.user_token or not self.product_id:
            print("⏭️  Skipped - Missing token or product")
            return
        
        # Test 4.1: Create order
        order_data = {
            "items": [
                {
                    "productId": self.product_id,
                    "quantity": 2,
                    "notes": "no ice"
                }
            ],
            "shippingAddress": "123 Nguyen Trai St, District 1, HCMC",
            "phone": "0901234567",
            "paymentMethod": "COD"
        }
        status, data, ok = self.request("POST", "/orders", data=order_data, token=self.user_token)
        self.log_test("Module 4", "Create order", "POST", "/orders", status, ok, data)
        if ok and isinstance(data, dict) and "id" in data:
            self.order_id = data["id"]
            print(f"   📋 Order ID: {self.order_id}")
            print(f"   💰 Total: {data.get('totalAmount')} VND")
        
        # Test 4.2: Get order details
        if self.order_id:
            status, data, ok = self.request("GET", f"/orders/{self.order_id}", token=self.user_token)
            self.log_test("Module 4", "Get order details", "GET", f"/orders/{{id}}", status, ok, data)
            if ok:
                print(f"   📦 Status: {data.get('status')}")
        
        # Test 4.3: Get user's orders
        status, data, ok = self.request("GET", "/orders/my", token=self.user_token)
        self.log_test("Module 4", "List user orders", "GET", "/orders/my", status, ok, data)
        if ok and isinstance(data, (list, dict)):
            order_count = len(data) if isinstance(data, list) else len(data.get('data', []))
            print(f"   📋 User has {order_count} orders")
        
        # Test 4.4: Update order status (admin)
        if self.admin_token and self.order_id:
            status, data, ok = self.request("PATCH", f"/orders/{self.order_id}/status", 
                                           data={"status": "confirmed"}, token=self.admin_token)
            self.log_test("Module 4", "Update order status", "PATCH", "/orders/{id}/status", status, ok, data)

    def test_module_5_payments(self):
        """MODULE 5: Payments"""
        print("\n" + "─"*120)
        print("MODULE 5: PAYMENTS")
        print("─"*120)
        
        if not self.user_token or not self.order_id:
            print("⏭️  Skipped - No order created")
            return
        
        # Test 5.1: Momo payment
        momo_data = {
            "orderId": self.order_id,
            "amount": 100000,
            "idempotency_key": f"momo-{int(time.time())}"
        }
        status, data, ok = self.request("POST", "/payments/momo/create", 
                                       data=momo_data, token=self.user_token)
        self.log_test("Module 5", "Create Momo payment", "POST", "/payments/momo/create", status, ok, data)
        
        # Test 5.2: VN Pay
        vnpay_data = {
            "orderId": self.order_id,
            "amount": 100000,
            "idempotency_key": f"vnpay-{int(time.time())}"
        }
        status, data, ok = self.request("POST", "/payments/vnpay/create", 
                                       data=vnpay_data, token=self.user_token)
        self.log_test("Module 5", "Create VN Pay payment", "POST", "/payments/vnpay/create", status, ok, data)

    def test_module_6_reviews(self):
        """MODULE 6: Reviews & Ratings"""
        print("\n" + "─"*120)
        print("MODULE 6: REVIEWS & RATINGS")
        print("─"*120)
        
        if not self.user_token or not self.product_id:
            print("⏭️  Skipped - Missing token or product")
            return
        
        # Test 6.1: Create review
        review_data = {
            "productId": self.product_id,
            "rating": 5,
            "comment": "Rất ngon! Sẽ order lại"
        }
        status, data, ok = self.request("POST", "/reviews", data=review_data, token=self.user_token)
        self.log_test("Module 6", "Create product review", "POST", "/reviews", status, ok, data)
        
        # Test 6.2: Get reviews
        status, data, ok = self.request("GET", f"/products/{self.product_id}/reviews")
        self.log_test("Module 6", "Get product reviews", "GET", "/products/{id}/reviews", status, ok, data)
        if ok and isinstance(data, list):
            print(f"   ⭐ Total reviews: {len(data)}")

    def test_module_7_admin(self):
        """MODULE 7: Admin Dashboard"""
        print("\n" + "─"*120)
        print("MODULE 7: ADMIN DASHBOARD")
        print("─"*120)
        
        if not self.admin_token:
            print("⏭️  Skipped - No admin token")
            return
        
        # Test 7.1: Admin stats
        status, data, ok = self.request("GET", "/admin/stats", token=self.admin_token)
        self.log_test("Module 7", "Get admin dashboard stats", "GET", "/admin/stats", status, ok, data)
        if ok:
            print(f"   📊 Total orders: {data.get('totalOrders', 0)}")
            print(f"   💵 Revenue: {data.get('totalRevenue', 0)} VND")
        
        # Test 7.2: Admin products
        status, data, ok = self.request("GET", "/admin/products", token=self.admin_token)
        self.log_test("Module 7", "List all products (admin)", "GET", "/admin/products", status, ok, data)
        
        # Test 7.3: Admin orders
        status, data, ok = self.request("GET", "/admin/orders", token=self.admin_token)
        self.log_test("Module 7", "List all orders (admin)", "GET", "/admin/orders", status, ok, data)
        
        # Test 7.4: Admin users
        status, data, ok = self.request("GET", "/admin/users", token=self.admin_token)
        self.log_test("Module 7", "List all users (admin)", "GET", "/admin/users", status, ok, data)

    def test_module_8_ai_service(self):
        """MODULE 8: AI Service"""
        print("\n" + "─"*120)
        print("MODULE 8: AI SERVICE")
        print("─"*120)
        
        # Test 8.1: AI docs
        try:
            r = requests.get(f"{AI_SERVICE_URL}/docs", timeout=3)
            status = r.status_code
            ok = 200 <= status < 300
            print(f"✅" if ok else "❌", end=" ")
            print(f"Module 8         | Get AI API docs                 | GET    http://localhost:8000/docs | {status}")
        except Exception as e:
            print(f"❌ Module 8         | Get AI API docs                 | GET    http://localhost:8000/docs | Error: {str(e)[:30]}")
        
        # Test 8.2: AI recommendations with CORRECT SCHEMA
        if self.products_list:
            # Format products correctly for AI service
            products_for_ai = [
                {
                    "id": p["id"],
                    "category": p.get("category", ""),
                    "name": p.get("name", "")
                }
                for p in self.products_list[:5]
            ]
            
            recommend_req = {
                "userId": self.user_id or "guest",
                "orderHistory": [],
                "availableProducts": products_for_ai,
                "limit": 3
            }
            
            try:
                r = requests.post(f"{AI_SERVICE_URL}/recommend", json=recommend_req, timeout=3)
                status = r.status_code
                ok = 200 <= status < 300
                resp = r.json() if r.text else {}
                print(f"✅" if ok else "❌", end=" ")
                print(f"Module 8         | Get AI recommendations          | POST   http://localhost:8000/recommend | {status}")
                if ok:
                    print(f"   🎯 Recommendations: {len(resp) if isinstance(resp, list) else 'unknown'} items")
            except Exception as e:
                print(f"❌ Module 8         | Get AI recommendations          | POST   http://localhost:8000/recommend | Error: {str(e)[:30]}")

    def test_module_9_security(self):
        """MODULE 9: Security & Error Handling"""
        print("\n" + "─"*120)
        print("MODULE 9: SECURITY & ERROR HANDLING")
        print("─"*120)
        
        # Test 9.1: Missing auth
        status, data, ok = self.request("GET", "/admin/stats")
        expected = status == 401
        print(f"{'✅' if expected else '❌'} Module 9         | Missing auth header               | GET    /admin/stats                 | {status} (Expected 401)")
        
        # Test 9.2: Non-existent resource
        status, data, ok = self.request("GET", "/products/00000000-0000-0000-0000-000000000000")
        expected = status == 404
        print(f"{'✅' if expected else '❌'} Module 9         | Non-existent product              | GET    /products/{{invalid}}       | {status} (Expected 404)")
        
        # Test 9.3: Invalid email
        status, data, ok = self.request("POST", "/auth/register", 
                                       data={"email": "invalid", "password": "test", "name": "test"})
        expected = status in [400, 422]
        print(f"{'✅' if expected else '❌'} Module 9         | Invalid email format              | POST   /auth/register               | {status} (Expected 400)")

    def print_summary(self):
        """Print test summary"""
        total = len(self.results)
        passed = sum(1 for r in self.results if "✅" in r["success"])
        failed = total - passed
        rate = (passed/total*100) if total > 0 else 0
        
        print("\n" + "="*120)
        print("TEST SUMMARY")
        print("="*120)
        print(f"\nTotal Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📊 Success Rate: {rate:.1f}%")
        
        if rate >= 90:
            status = "🟢 EXCELLENT - System operational"
        elif rate >= 75:
            status = "🟡 GOOD - Minor issues"
        elif rate >= 50:
            status = "🟠 FAIR - Needs attention"
        else:
            status = "🔴 POOR - Major issues"
        
        print(f"Status: {status}\n")

    def save_results(self):
        """Save results to JSON"""
        total = len(self.results)
        passed = sum(1 for r in self.results if "✅" in r["success"])
        
        summary = {
            "timestamp": datetime.now().isoformat(),
            "total_tests": total,
            "passed": passed,
            "failed": total - passed,
            "success_rate": (passed/total*100) if total > 0 else 0,
            "results": self.results,
            "test_data": {
                "user_id": self.user_id,
                "admin_id": self.admin_id,
                "order_id": self.order_id,
                "product_id": self.product_id
            }
        }
        
        with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Results saved to: {RESULTS_FILE}")
        print("="*120 + "\n")

if __name__ == "__main__":
    runner = TestRunner()
    runner.run_all_tests()
