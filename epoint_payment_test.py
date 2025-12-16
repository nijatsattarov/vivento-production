#!/usr/bin/env python3
"""
Epoint.az Payment Integration Test
Tests the REAL Epoint payment integration with provided API keys
"""

import requests
import json
import base64
import sys
from datetime import datetime
import time

class EpointPaymentTester:
    def __init__(self):
        self.base_url = "https://card-preview-repair.preview.emergentagent.com"
        self.admin_email = "admin@vivento.az"
        self.admin_password = "Vivento123!"
        self.epoint_public_key = "i000201147"
        self.epoint_private_key = "o0sMdgLNqDZGFMuaA0vxCL7g"
        
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request to API"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            
            print(f"   {method} {url}")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == expected_status:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                try:
                    error_detail = response.json()
                except:
                    error_detail = response.text
                return False, f"Expected {expected_status}, got {response.status_code}: {error_detail}"

        except Exception as e:
            return False, f"Request exception: {str(e)}"

    def test_admin_login(self):
        """Test admin login to get authentication token"""
        print(f"\n🔐 Testing Admin Login...")
        
        login_data = {
            "email": self.admin_email,
            "password": self.admin_password
        }
        
        success, response = self.make_request("POST", "auth/login", login_data, 200)
        
        if success and isinstance(response, dict) and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            self.log_test("Admin Login", True, f"Successfully logged in as {self.admin_email}")
            return True
        else:
            self.log_test("Admin Login", False, str(response))
            return False

    def test_balance_endpoint(self):
        """Test Case 1: GET /api/balance - Get current user balance"""
        print(f"\n💰 Test Case 1: Balance Endpoint...")
        
        if not self.token:
            self.log_test("Balance Endpoint", False, "No authentication token")
            return False
        
        success, response = self.make_request("GET", "balance", expected_status=200)
        
        if success and isinstance(response, dict):
            # Verify expected fields
            required_fields = ["balance", "free_invitations_used", "free_invitations_remaining"]
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test("Balance Endpoint", False, f"Missing fields: {missing_fields}")
                return False
            
            print(f"   Balance: {response.get('balance')} AZN")
            print(f"   Free invitations used: {response.get('free_invitations_used')}")
            print(f"   Free invitations remaining: {response.get('free_invitations_remaining')}")
            
            self.log_test("Balance Endpoint", True, f"Balance: {response.get('balance')} AZN")
            return True
        else:
            self.log_test("Balance Endpoint", False, str(response))
            return False

    def test_payment_creation(self):
        """Test Case 2: POST /api/payments/create - Create payment"""
        print(f"\n💳 Test Case 2: Payment Creation...")
        
        if not self.token:
            self.log_test("Payment Creation", False, "No authentication token")
            return None
        
        payment_data = {
            "amount": 5.0,
            "description": "Test payment for Epoint integration"
        }
        
        success, response = self.make_request("POST", "payments/create", payment_data, 200)
        
        if success and isinstance(response, dict):
            # Verify expected fields
            required_fields = ["order_id", "payment_id", "checkout_url", "data", "signature"]
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test("Payment Creation", False, f"Missing fields: {missing_fields}")
                return None
            
            print(f"   Order ID: {response.get('order_id')}")
            print(f"   Payment ID: {response.get('payment_id')}")
            print(f"   Checkout URL: {response.get('checkout_url')}")
            print(f"   Amount: {response.get('amount')} AZN")
            
            # Verify checkout URL
            expected_checkout_url = "https://epoint.az/api/1/checkout"
            if response.get('checkout_url') != expected_checkout_url:
                self.log_test("Payment Creation - Checkout URL", False, 
                             f"Expected {expected_checkout_url}, got {response.get('checkout_url')}")
                return None
            
            self.log_test("Payment Creation", True, f"Payment created with ID: {response.get('payment_id')}")
            return response.get('payment_id')
        else:
            self.log_test("Payment Creation", False, str(response))
            return None

    def test_epoint_data_structure(self, payment_response):
        """Test Case 5: Verify Epoint Data Structure"""
        print(f"\n🔍 Test Case 5: Epoint Data Structure Verification...")
        
        if not payment_response or 'data' not in payment_response:
            self.log_test("Epoint Data Structure", False, "No payment data to verify")
            return False
        
        try:
            # Decode the base64 "data" field
            encoded_data = payment_response['data']
            decoded_bytes = base64.b64decode(encoded_data)
            decoded_string = decoded_bytes.decode('utf-8')
            decoded_data = json.loads(decoded_string)
            
            print(f"   Decoded payment data:")
            for key, value in decoded_data.items():
                print(f"     {key}: {value}")
            
            # Verify required fields
            required_fields = [
                "public_key", "amount", "currency", "description", 
                "order_id", "success_redirect_url", "error_redirect_url", "callback_url"
            ]
            
            missing_fields = [field for field in required_fields if field not in decoded_data]
            
            if missing_fields:
                self.log_test("Epoint Data Structure", False, f"Missing fields: {missing_fields}")
                return False
            
            # Verify public key matches expected
            if decoded_data.get('public_key') != self.epoint_public_key:
                self.log_test("Epoint Data Structure", False, 
                             f"Public key mismatch. Expected: {self.epoint_public_key}, Got: {decoded_data.get('public_key')}")
                return False
            
            # Verify amount
            expected_amount = "5.0"
            if decoded_data.get('amount') != expected_amount:
                self.log_test("Epoint Data Structure", False, 
                             f"Amount mismatch. Expected: {expected_amount}, Got: {decoded_data.get('amount')}")
                return False
            
            # Verify currency
            if decoded_data.get('currency') != "AZN":
                self.log_test("Epoint Data Structure", False, 
                             f"Currency mismatch. Expected: AZN, Got: {decoded_data.get('currency')}")
                return False
            
            # Verify URLs contain correct domains
            callback_url = decoded_data.get('callback_url', '')
            success_url = decoded_data.get('success_redirect_url', '')
            error_url = decoded_data.get('error_redirect_url', '')
            
            if not callback_url.startswith(self.base_url):
                self.log_test("Epoint Data Structure", False, 
                             f"Callback URL domain mismatch: {callback_url}")
                return False
            
            print(f"   ✅ Public key verified: {decoded_data.get('public_key')}")
            print(f"   ✅ Amount verified: {decoded_data.get('amount')} {decoded_data.get('currency')}")
            print(f"   ✅ Callback URL verified: {callback_url}")
            
            self.log_test("Epoint Data Structure", True, "All required fields present and valid")
            return True
            
        except Exception as e:
            self.log_test("Epoint Data Structure", False, f"Error decoding data: {str(e)}")
            return False

    def test_payment_status_check(self, payment_id):
        """Test Case 3: GET /api/payments/{payment_id}/status - Check payment status"""
        print(f"\n📊 Test Case 3: Payment Status Check...")
        
        if not self.token or not payment_id:
            self.log_test("Payment Status Check", False, "No authentication token or payment ID")
            return False
        
        success, response = self.make_request("GET", f"payments/{payment_id}/status", expected_status=200)
        
        if success and isinstance(response, dict):
            # Verify expected fields
            required_fields = ["payment_id", "amount", "status", "created_at"]
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test("Payment Status Check", False, f"Missing fields: {missing_fields}")
                return False
            
            print(f"   Payment ID: {response.get('payment_id')}")
            print(f"   Amount: {response.get('amount')} AZN")
            print(f"   Status: {response.get('status')}")
            print(f"   Created: {response.get('created_at')}")
            
            self.log_test("Payment Status Check", True, f"Status: {response.get('status')}")
            return True
        else:
            self.log_test("Payment Status Check", False, str(response))
            return False

    def test_transaction_history(self):
        """Test Case 4: GET /api/balance/transactions - Get transaction history"""
        print(f"\n📋 Test Case 4: Transaction History...")
        
        if not self.token:
            self.log_test("Transaction History", False, "No authentication token")
            return False
        
        success, response = self.make_request("GET", "balance/transactions", expected_status=200)
        
        if success and isinstance(response, dict):
            transactions = response.get('transactions', [])
            total_count = response.get('total_count', 0)
            
            print(f"   Total transactions: {total_count}")
            print(f"   Returned transactions: {len(transactions)}")
            
            if transactions:
                print(f"   Recent transactions:")
                for i, tx in enumerate(transactions[:3]):  # Show first 3
                    print(f"     {i+1}. {tx.get('description', 'N/A')} - {tx.get('amount', 0)} AZN ({tx.get('transaction_type', 'N/A')})")
            
            self.log_test("Transaction History", True, f"Retrieved {len(transactions)} transactions")
            return True
        else:
            self.log_test("Transaction History", False, str(response))
            return False

    def run_all_tests(self):
        """Run all Epoint payment integration tests"""
        print("🚀 Starting Epoint.az Payment Integration Tests...")
        print(f"   Base URL: {self.base_url}")
        print(f"   Admin credentials: {self.admin_email}")
        print(f"   Epoint Public Key: {self.epoint_public_key}")
        print(f"   Epoint Private Key: {self.epoint_private_key[:10]}...")
        
        # Step 1: Admin Login
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return self.get_results()
        
        # Step 2: Test Balance Endpoint
        self.test_balance_endpoint()
        
        # Step 3: Test Payment Creation and get payment data
        print(f"\n💳 Creating test payment...")
        success, payment_response = self.make_request("POST", "payments/create", {
            "amount": 5.0,
            "description": "Test payment for Epoint integration"
        }, 200)
        
        if success and isinstance(payment_response, dict):
            payment_id = payment_response.get('payment_id')
            
            # Verify payment creation response
            required_fields = ["order_id", "payment_id", "checkout_url", "data", "signature"]
            missing_fields = [field for field in required_fields if field not in payment_response]
            
            if missing_fields:
                self.log_test("Payment Creation", False, f"Missing fields: {missing_fields}")
            else:
                print(f"   ✅ Payment created successfully")
                print(f"   Order ID: {payment_response.get('order_id')}")
                print(f"   Payment ID: {payment_id}")
                print(f"   Checkout URL: {payment_response.get('checkout_url')}")
                self.log_test("Payment Creation", True, f"Payment ID: {payment_id}")
                
                # Step 4: Verify Epoint Data Structure
                self.test_epoint_data_structure(payment_response)
                
                # Step 5: Test Payment Status Check
                if payment_id:
                    self.test_payment_status_check(payment_id)
        else:
            self.log_test("Payment Creation", False, str(payment_response))
        
        # Step 6: Test Transaction History
        self.test_transaction_history()
        
        return self.get_results()

    def get_results(self):
        """Get test results summary"""
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        results = {
            "test_type": "Epoint Payment Integration",
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": f"{success_rate:.1f}%",
            "test_details": self.test_results,
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"\n📊 Epoint Payment Integration Test Results:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        # Show failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        return results

def main():
    """Main test execution"""
    tester = EpointPaymentTester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open('/app/epoint_payment_test_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Results saved to /app/epoint_payment_test_results.json")
    
    # Return appropriate exit code
    return 0 if results["failed_tests"] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())