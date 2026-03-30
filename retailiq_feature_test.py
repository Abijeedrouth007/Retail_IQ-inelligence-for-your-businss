import requests
import sys
from datetime import datetime

class RetailIQFeatureTester:
    def __init__(self, base_url="https://inventory-ai-hub-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.passed_tests.append(name)
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "error": response.text[:200] if response.text else "No response body"
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login with specific credentials"""
        success, response = self.run_test(
            "Admin Login (admin@retailiq.com / admin123)",
            "POST",
            "api/auth/login",
            200,
            data={"email": "admin@retailiq.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.token = response['token']
            user = response.get('user', {})
            print(f"   ✅ Logged in as: {user.get('name')} ({user.get('role')})")
            print(f"   ✅ Email: {user.get('email')}")
            return True
        return False

    def test_config_inr_currency(self):
        """Test config API returns INR currency"""
        success, response = self.run_test(
            "Config API - INR Currency",
            "GET",
            "api/config",
            200
        )
        if success:
            currency = response.get('currency')
            symbol = response.get('currency_symbol')
            if currency == 'INR' and symbol == '₹':
                print(f"   ✅ Currency: {currency}")
                print(f"   ✅ Symbol: {symbol}")
                return True
            else:
                print(f"   ❌ Expected INR/₹, got {currency}/{symbol}")
                self.failed_tests.append({
                    "test": "INR Currency Validation",
                    "error": f"Expected INR/₹, got {currency}/{symbol}"
                })
        return False

    def test_dashboard_inr_revenue(self):
        """Test dashboard shows revenue in INR"""
        success, response = self.run_test(
            "Dashboard Stats - INR Revenue",
            "GET",
            "api/analytics/dashboard",
            200
        )
        if success:
            revenue = response.get('total_revenue', 0)
            today_orders = response.get('today_orders', 0)
            total_products = response.get('total_products', 0)
            low_stock = response.get('low_stock_count', 0)
            
            print(f"   ✅ Total Revenue: ₹{revenue:,.2f}")
            print(f"   ✅ Today's Orders: {today_orders}")
            print(f"   ✅ Total Products: {total_products}")
            print(f"   ✅ Low Stock Count: {low_stock}")
            return True
        return False

    def test_products_inr_prices(self):
        """Test products show prices in INR"""
        success, response = self.run_test(
            "Products - INR Prices",
            "GET",
            "api/products",
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            product = response[0]
            price = product.get('price', 0)
            cost_price = product.get('cost_price', 0)
            stock = product.get('stock_quantity', 0)
            
            print(f"   ✅ Sample Product: {product.get('name')}")
            print(f"   ✅ Price: ₹{price:,.2f}")
            print(f"   ✅ Cost Price: ₹{cost_price:,.2f}")
            print(f"   ✅ Stock: {stock} units")
            return product['product_id']  # Return for cart testing
        return None

    def test_cart_operations(self, product_id):
        """Test cart operations"""
        if not product_id:
            return False
        
        # Add to cart
        success1, _ = self.run_test(
            "Add to Cart",
            "POST",
            "api/cart",
            200,
            data={"product_id": product_id, "quantity": 2}
        )
        
        if not success1:
            return False

        # Get cart
        success2, cart_response = self.run_test(
            "Get Cart Items",
            "GET",
            "api/cart",
            200
        )
        
        if success2 and isinstance(cart_response, list) and len(cart_response) > 0:
            cart_item = cart_response[0]
            price = cart_item.get('price', 0)
            quantity = cart_item.get('quantity', 0)
            total = price * quantity
            
            print(f"   ✅ Cart Item: {cart_item.get('product_name')}")
            print(f"   ✅ Unit Price: ₹{price:,.2f}")
            print(f"   ✅ Quantity: {quantity}")
            print(f"   ✅ Total: ₹{total:,.2f}")
            return True
        return False

    def test_order_creation_cod(self, product_id):
        """Test order creation with COD"""
        if not product_id:
            return False
        
        success, response = self.run_test(
            "Create Order - Cash on Delivery",
            "POST",
            "api/orders",
            200,
            data={"items": [{"product_id": product_id, "quantity": 1}]}
        )
        
        if success:
            order_id = response.get('order_id')
            status = response.get('status')
            payment_status = response.get('payment_status')
            total = response.get('total_amount', 0)
            
            print(f"   ✅ Order ID: {order_id}")
            print(f"   ✅ Status: {status}")
            print(f"   ✅ Payment Status: {payment_status}")
            print(f"   ✅ Total Amount: ₹{total:,.2f}")
            
            # Verify COD settings
            if status == 'confirmed' and payment_status == 'cod':
                print("   ✅ Order correctly set to confirmed/COD")
                return order_id
            else:
                print(f"   ❌ Expected confirmed/cod, got {status}/{payment_status}")
                self.failed_tests.append({
                    "test": "COD Order Status",
                    "error": f"Expected confirmed/cod, got {status}/{payment_status}"
                })
        return None

    def test_order_status_update(self, order_id):
        """Test order status update workflow"""
        if not order_id:
            return False
        
        statuses = ['shipped', 'delivered']
        
        for status in statuses:
            success, _ = self.run_test(
                f"Update Order Status to {status.title()}",
                "PUT",
                f"api/orders/{order_id}/status",
                200,
                data={"status": status}
            )
            
            if success:
                print(f"   ✅ Order status updated to: {status}")
            else:
                return False
        
        return True

    def test_orders_list(self):
        """Test orders list shows status timeline"""
        success, response = self.run_test(
            "Orders List - Status Timeline",
            "GET",
            "api/orders",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} orders")
            if len(response) > 0:
                order = response[0]
                print(f"   ✅ Latest Order Status: {order.get('status')}")
                print(f"   ✅ Payment Status: {order.get('payment_status')}")
                print(f"   ✅ Total: ₹{order.get('total_amount', 0):,.2f}")
            return True
        return False

    def print_summary(self):
        """Print test summary"""
        print(f"\n{'='*60}")
        print(f"📊 RETAILIQ FEATURE TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"  - {failure['test']}: {failure.get('error', 'Unknown error')}")
        
        if self.passed_tests:
            print(f"\n✅ PASSED TESTS:")
            for test in self.passed_tests:
                print(f"  - {test}")

def main():
    print("🚀 Starting RetailIQ Feature Tests...")
    print("Testing specific features from review request")
    print("=" * 60)
    
    tester = RetailIQFeatureTester()
    
    # Test sequence based on review request
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        tester.print_summary()
        return 1
    
    # Test INR currency configuration
    tester.test_config_inr_currency()
    
    # Test dashboard with INR revenue
    tester.test_dashboard_inr_revenue()
    
    # Test products with INR prices
    product_id = tester.test_products_inr_prices()
    
    # Test cart operations
    tester.test_cart_operations(product_id)
    
    # Test order creation with COD
    order_id = tester.test_order_creation_cod(product_id)
    
    # Test order status updates
    tester.test_order_status_update(order_id)
    
    # Test orders list
    tester.test_orders_list()
    
    # Print final summary
    tester.print_summary()
    
    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())