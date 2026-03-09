import requests
import json
import sys
from datetime import datetime

class RetailIQAPITester:
    def __init__(self, base_url="https://inventory-ai-hub-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.customer_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "status": "PASS" if success else "FAIL",
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        print(f"{status} {name}: {details}")
        return success

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        request_headers = {'Content-Type': 'application/json'}
        
        if headers:
            request_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=request_headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=request_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=request_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=request_headers)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    return self.log_test(name, True, f"Status: {response.status_code}"), response_data
                except:
                    return self.log_test(name, True, f"Status: {response.status_code}"), {}
            else:
                error_detail = ""
                try:
                    error_data = response.json()
                    error_detail = error_data.get('detail', str(error_data))
                except:
                    error_detail = response.text[:100] if response.text else "No response text"
                
                return self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Error: {error_detail}"), {}

        except Exception as e:
            return self.log_test(name, False, f"Exception: {str(e)}"), {}

    def test_seed_data(self):
        """Test seed data initialization"""
        print("\n🌱 Testing Seed Data...")
        success, response = self.run_test(
            "Seed Data",
            "POST",
            "api/seed",
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login"""
        print("\n🔐 Testing Admin Authentication...")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": "admin@retailiq.com", "password": "admin123"}
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            self.log_test("Admin Token Retrieved", True, f"Token: {self.admin_token[:20]}...")
            return True
        return False

    def test_customer_signup_login(self):
        """Test customer signup and login"""
        print("\n👤 Testing Customer Authentication...")
        
        # Test signup
        timestamp = datetime.now().strftime("%H%M%S")
        customer_email = f"test_customer_{timestamp}@retailiq.com"
        customer_password = "TestPass123!"
        
        success, response = self.run_test(
            "Customer Signup",
            "POST",
            "api/auth/signup",
            200,
            data={
                "email": customer_email,
                "password": customer_password,
                "name": "Test Customer",
                "phone": "1234567890"
            }
        )
        
        if success and 'token' in response:
            self.customer_token = response['token']
            self.log_test("Customer Token Retrieved", True, f"Token: {self.customer_token[:20]}...")
            return True
        return False

    def test_dashboard_analytics(self):
        """Test dashboard analytics endpoints"""
        print("\n📊 Testing Dashboard Analytics...")
        if not self.admin_token:
            return self.log_test("Dashboard Analytics", False, "No admin token available")

        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test dashboard stats
        success1, _ = self.run_test(
            "Dashboard Stats",
            "GET",
            "api/analytics/dashboard",
            200,
            headers=headers
        )
        
        # Test sales trend
        success2, _ = self.run_test(
            "Sales Trend",
            "GET",
            "api/analytics/sales-trend",
            200,
            headers=headers,
            params={"days": 7}
        )
        
        # Test top products
        success3, _ = self.run_test(
            "Top Products",
            "GET",
            "api/analytics/top-products",
            200,
            headers=headers,
            params={"limit": 5}
        )
        
        # Test low stock
        success4, _ = self.run_test(
            "Low Stock Products",
            "GET",
            "api/analytics/low-stock",
            200,
            headers=headers
        )
        
        return success1 and success2 and success3 and success4

    def test_products_crud(self):
        """Test products CRUD operations"""
        print("\n📦 Testing Products CRUD...")
        if not self.admin_token:
            return self.log_test("Products CRUD", False, "No admin token available")

        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test get products
        success1, products_data = self.run_test(
            "Get Products",
            "GET",
            "api/products",
            200,
            headers=headers
        )
        
        # Test get categories
        success2, _ = self.run_test(
            "Get Categories",
            "GET",
            "api/products/categories/list",
            200,
            headers=headers
        )
        
        # Test create product
        test_product = {
            "name": "Test Product API",
            "description": "API test product",
            "category": "Test Category",
            "price": 99.99,
            "cost_price": 50.00,
            "stock_quantity": 100,
            "reorder_level": 10,
            "unit": "piece",
            "is_active": True
        }
        
        success3, created_product = self.run_test(
            "Create Product",
            "POST",
            "api/products",
            200,
            data=test_product,
            headers=headers
        )
        
        product_id = None
        if success3 and 'product_id' in created_product:
            product_id = created_product['product_id']
            
            # Test get single product
            success4, _ = self.run_test(
                "Get Single Product",
                "GET",
                f"api/products/{product_id}",
                200,
                headers=headers
            )
            
            # Test update product
            update_data = {"price": 89.99, "stock_quantity": 90}
            success5, _ = self.run_test(
                "Update Product",
                "PUT",
                f"api/products/{product_id}",
                200,
                data=update_data,
                headers=headers
            )
            
            # Test delete product
            success6, _ = self.run_test(
                "Delete Product",
                "DELETE",
                f"api/products/{product_id}",
                200,
                headers=headers
            )
            
            return success1 and success2 and success3 and success4 and success5 and success6
        
        return success1 and success2 and success3

    def test_cart_operations(self):
        """Test cart operations"""
        print("\n🛒 Testing Cart Operations...")
        if not self.customer_token:
            return self.log_test("Cart Operations", False, "No customer token available")

        headers = {'Authorization': f'Bearer {self.customer_token}'}
        
        # First get available products
        success1, products_data = self.run_test(
            "Get Products for Cart",
            "GET",
            "api/products",
            200
        )
        
        if not success1 or not products_data:
            return False
            
        # Add first product to cart
        first_product = products_data[0] if products_data else None
        if not first_product:
            return self.log_test("Cart Operations", False, "No products available for cart test")
            
        success2, _ = self.run_test(
            "Add to Cart",
            "POST",
            "api/cart",
            200,
            data={"product_id": first_product['product_id'], "quantity": 2},
            headers=headers
        )
        
        # Test get cart
        success3, cart_data = self.run_test(
            "Get Cart",
            "GET",
            "api/cart",
            200,
            headers=headers
        )
        
        # Test clear cart
        success4, _ = self.run_test(
            "Clear Cart",
            "DELETE",
            "api/cart",
            200,
            headers=headers
        )
        
        return success1 and success2 and success3 and success4

    def test_orders_operations(self):
        """Test orders operations"""
        print("\n📋 Testing Orders Operations...")
        if not self.customer_token:
            return self.log_test("Orders Operations", False, "No customer token available")

        headers = {'Authorization': f'Bearer {self.customer_token}'}
        
        # Get products first
        success1, products_data = self.run_test(
            "Get Products for Order",
            "GET",
            "api/products",
            200
        )
        
        if not success1 or not products_data:
            return False
            
        # Create order
        first_product = products_data[0] if products_data else None
        if not first_product:
            return self.log_test("Orders Operations", False, "No products available for order test")
            
        order_data = {
            "items": [
                {"product_id": first_product['product_id'], "quantity": 1}
            ]
        }
        
        success2, created_order = self.run_test(
            "Create Order",
            "POST",
            "api/orders",
            200,
            data=order_data,
            headers=headers
        )
        
        # Test get orders
        success3, _ = self.run_test(
            "Get Orders",
            "GET",
            "api/orders",
            200,
            headers=headers
        )
        
        # Test get specific order if created successfully
        if success2 and 'order_id' in created_order:
            success4, _ = self.run_test(
                "Get Single Order",
                "GET",
                f"api/orders/{created_order['order_id']}",
                200,
                headers=headers
            )
            return success1 and success2 and success3 and success4
        
        return success1 and success2 and success3

    def test_suppliers_crud(self):
        """Test suppliers CRUD operations"""
        print("\n🏪 Testing Suppliers CRUD...")
        if not self.admin_token:
            return self.log_test("Suppliers CRUD", False, "No admin token available")

        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test get suppliers
        success1, _ = self.run_test(
            "Get Suppliers",
            "GET",
            "api/suppliers",
            200,
            headers=headers
        )
        
        # Test create supplier
        test_supplier = {
            "name": "Test Supplier API",
            "email": "test@supplier.com",
            "phone": "1234567890",
            "address": "123 Test Street",
            "notes": "API test supplier"
        }
        
        success2, created_supplier = self.run_test(
            "Create Supplier",
            "POST",
            "api/suppliers",
            200,
            data=test_supplier,
            headers=headers
        )
        
        if success2 and 'supplier_id' in created_supplier:
            supplier_id = created_supplier['supplier_id']
            
            # Test update supplier
            update_data = {"name": "Updated Test Supplier", "phone": "9876543210"}
            success3, _ = self.run_test(
                "Update Supplier",
                "PUT",
                f"api/suppliers/{supplier_id}",
                200,
                data=update_data,
                headers=headers
            )
            
            # Test delete supplier
            success4, _ = self.run_test(
                "Delete Supplier",
                "DELETE",
                f"api/suppliers/{supplier_id}",
                200,
                headers=headers
            )
            
            return success1 and success2 and success3 and success4
        
        return success1 and success2

    def test_wishlist_operations(self):
        """Test wishlist operations"""
        print("\n💝 Testing Wishlist Operations...")
        if not self.customer_token:
            return self.log_test("Wishlist Operations", False, "No customer token available")

        headers = {'Authorization': f'Bearer {self.customer_token}'}
        
        # Get products first
        success1, products_data = self.run_test(
            "Get Products for Wishlist",
            "GET",
            "api/products",
            200
        )
        
        if not success1 or not products_data:
            return False
            
        # Add to wishlist
        first_product = products_data[0] if products_data else None
        if not first_product:
            return self.log_test("Wishlist Operations", False, "No products available for wishlist test")
            
        success2, _ = self.run_test(
            "Add to Wishlist",
            "POST",
            f"api/wishlist/{first_product['product_id']}",
            200,
            headers=headers
        )
        
        # Test get wishlist
        success3, wishlist_data = self.run_test(
            "Get Wishlist",
            "GET",
            "api/wishlist",
            200,
            headers=headers
        )
        
        # Remove from wishlist if added successfully
        if success2 and success3 and wishlist_data:
            wishlist_item = wishlist_data[0] if wishlist_data else None
            if wishlist_item and 'wishlist_id' in wishlist_item:
                success4, _ = self.run_test(
                    "Remove from Wishlist",
                    "DELETE",
                    f"api/wishlist/{wishlist_item['wishlist_id']}",
                    200,
                    headers=headers
                )
                return success1 and success2 and success3 and success4
        
        return success1 and success2 and success3

    def test_ai_chatbot(self):
        """Test AI chatbot functionality"""
        print("\n🤖 Testing AI Chatbot...")
        if not self.customer_token:
            return self.log_test("AI Chatbot", False, "No customer token available")

        headers = {'Authorization': f'Bearer {self.customer_token}'}
        
        # Test chat message
        chat_data = {
            "message": "Hello, can you help me with my store analytics?",
            "session_id": None
        }
        
        success, response = self.run_test(
            "AI Chat Message",
            "POST",
            "api/chat",
            200,
            data=chat_data,
            headers=headers
        )
        
        if success and response:
            has_response = 'response' in response and response['response']
            has_session = 'session_id' in response
            if has_response and has_session:
                self.log_test("AI Chat Response Quality", True, f"Response length: {len(response['response'])} chars")
                return True
            else:
                self.log_test("AI Chat Response Quality", False, "Missing response or session_id")
        
        return success

    def test_auth_me_endpoint(self):
        """Test the /auth/me endpoint"""
        print("\n🔍 Testing Auth Me Endpoint...")
        
        if self.admin_token:
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            success1, response = self.run_test(
                "Auth Me - Admin",
                "GET",
                "api/auth/me",
                200,
                headers=headers
            )
            
            if success1 and response:
                is_admin = response.get('role') == 'admin'
                self.log_test("Admin Role Verification", is_admin, f"Role: {response.get('role', 'unknown')}")
        
        if self.customer_token:
            headers = {'Authorization': f'Bearer {self.customer_token}'}
            success2, response = self.run_test(
                "Auth Me - Customer",
                "GET",
                "api/auth/me",
                200,
                headers=headers
            )
            
            if success2 and response:
                is_customer = response.get('role') == 'customer'
                self.log_test("Customer Role Verification", is_customer, f"Role: {response.get('role', 'unknown')}")
        
        return True

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting RetailIQ API Comprehensive Testing...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Core sequence of tests
        test_sequence = [
            self.test_seed_data,
            self.test_admin_login,
            self.test_customer_signup_login,
            self.test_auth_me_endpoint,
            self.test_dashboard_analytics,
            self.test_products_crud,
            self.test_suppliers_crud,
            self.test_cart_operations,
            self.test_orders_operations,
            self.test_wishlist_operations,
            self.test_ai_chatbot
        ]
        
        for test_func in test_sequence:
            try:
                test_func()
            except Exception as e:
                self.log_test(f"Exception in {test_func.__name__}", False, str(e))
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "No tests run")
        
        # Print failed tests
        failed_tests = [t for t in self.test_results if t['status'] == 'FAIL']
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  • {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = RetailIQAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "failed_tests": tester.tests_run - tester.tests_passed,
        "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
        "test_results": tester.test_results
    }
    
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Detailed results saved to: /app/backend_test_results.json")
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())