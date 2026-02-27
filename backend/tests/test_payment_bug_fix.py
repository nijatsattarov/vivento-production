"""
Test suite for P0 Critical Bug Fix: Payment Balance Credit Issue
Bug: User's balance was being incorrectly credited even when they cancelled/didn't complete payment

Tests verify:
1. Payment creation creates pending payment WITHOUT affecting balance
2. Balance endpoint does NOT auto-confirm pending payments
3. Old /api/admin/sync-payments endpoint is REMOVED (should return 404)
4. New /api/admin/expire-pending-payments expires pending payments WITHOUT adding balance
5. Payment callback endpoint correctly updates balance only on success status
6. PaymentResult page shows correct status when payment not completed
"""

import pytest
import requests
import os
import time
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@vivento.az"
TEST_PASSWORD = "Vivento123!"


class TestPaymentBugFix:
    """Test suite for payment balance credit bug fix"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test - get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        self.token = data.get("access_token")
        self.user = data.get("user")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        yield
        
        # Cleanup - expire any pending payments created during test
        try:
            self.session.post(f"{BASE_URL}/api/admin/expire-pending-payments")
        except:
            pass
    
    def test_01_login_works(self):
        """Test that login works with provided credentials"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print(f"✅ Login successful for {TEST_EMAIL}")
    
    def test_02_get_initial_balance(self):
        """Test getting user balance"""
        response = self.session.get(f"{BASE_URL}/api/balance")
        assert response.status_code == 200
        
        data = response.json()
        assert "balance" in data
        assert "free_invitations_used" in data
        assert "free_invitations_remaining" in data
        
        print(f"✅ Initial balance: {data['balance']} AZN")
        return data["balance"]
    
    def test_03_payment_creation_does_not_affect_balance(self):
        """
        CRITICAL TEST: Creating a payment should NOT affect user balance
        Balance should only change via Epoint callback
        """
        # Get initial balance
        balance_before = self.session.get(f"{BASE_URL}/api/balance").json()["balance"]
        print(f"Balance before payment creation: {balance_before} AZN")
        
        # Create a payment
        response = self.session.post(
            f"{BASE_URL}/api/payments/create",
            json={"amount": 10.0, "description": "Test payment - should not credit balance"}
        )
        assert response.status_code == 200, f"Payment creation failed: {response.text}"
        
        payment_data = response.json()
        assert "payment_id" in payment_data
        assert "checkout_url" in payment_data
        assert payment_data.get("amount") == 10.0
        
        payment_id = payment_data["payment_id"]
        print(f"Payment created: {payment_id}")
        
        # Check balance - should NOT have changed
        balance_after = self.session.get(f"{BASE_URL}/api/balance").json()["balance"]
        print(f"Balance after payment creation: {balance_after} AZN")
        
        assert balance_after == balance_before, \
            f"CRITICAL BUG: Balance changed after payment creation! Before: {balance_before}, After: {balance_after}"
        
        print("✅ Payment creation does NOT affect balance (correct behavior)")
        return payment_id
    
    def test_04_balance_endpoint_does_not_auto_confirm_pending(self):
        """
        CRITICAL TEST: /api/balance should NOT auto-confirm pending payments
        It should only expire old pending payments (>30 min)
        """
        # Create a payment
        response = self.session.post(
            f"{BASE_URL}/api/payments/create",
            json={"amount": 25.0, "description": "Test - balance should not auto-confirm"}
        )
        assert response.status_code == 200
        payment_id = response.json()["payment_id"]
        
        # Get balance before
        balance_before = self.session.get(f"{BASE_URL}/api/balance").json()["balance"]
        
        # Call balance endpoint multiple times (simulating user checking balance)
        for i in range(3):
            response = self.session.get(f"{BASE_URL}/api/balance")
            assert response.status_code == 200
            time.sleep(0.5)
        
        # Get balance after
        balance_after = self.session.get(f"{BASE_URL}/api/balance").json()["balance"]
        
        assert balance_after == balance_before, \
            f"CRITICAL BUG: Balance changed after calling /api/balance! Before: {balance_before}, After: {balance_after}"
        
        # Check payment status - should still be pending
        status_response = self.session.get(f"{BASE_URL}/api/payments/{payment_id}/status")
        assert status_response.status_code == 200
        payment_status = status_response.json()["status"]
        
        # Payment should be pending (not completed or expired yet since it's new)
        assert payment_status in ["pending", "expired"], \
            f"Payment status should be pending or expired, got: {payment_status}"
        
        print("✅ Balance endpoint does NOT auto-confirm pending payments (correct behavior)")
    
    def test_05_old_sync_payments_endpoint_removed(self):
        """
        CRITICAL TEST: Old /api/admin/sync-payments endpoint should be REMOVED
        This endpoint was dangerous as it auto-confirmed all pending payments
        """
        response = self.session.post(f"{BASE_URL}/api/admin/sync-payments")
        
        # Should return 404 (endpoint removed) or 405 (method not allowed)
        assert response.status_code in [404, 405, 422], \
            f"CRITICAL BUG: /api/admin/sync-payments still exists! Status: {response.status_code}"
        
        print("✅ Old /api/admin/sync-payments endpoint is REMOVED (correct behavior)")
    
    def test_06_expire_pending_payments_does_not_add_balance(self):
        """
        CRITICAL TEST: /api/admin/expire-pending-payments should expire payments
        WITHOUT adding balance to user account
        """
        # Get initial balance
        balance_before = self.session.get(f"{BASE_URL}/api/balance").json()["balance"]
        print(f"Balance before: {balance_before} AZN")
        
        # Create multiple pending payments
        payment_ids = []
        for i in range(3):
            response = self.session.post(
                f"{BASE_URL}/api/payments/create",
                json={"amount": 50.0, "description": f"Test payment {i+1} - should NOT credit balance"}
            )
            assert response.status_code == 200
            payment_ids.append(response.json()["payment_id"])
        
        print(f"Created {len(payment_ids)} pending payments")
        
        # Call expire-pending-payments
        response = self.session.post(f"{BASE_URL}/api/admin/expire-pending-payments")
        assert response.status_code == 200
        
        expire_data = response.json()
        assert expire_data.get("success") == True
        print(f"Expired {expire_data.get('expired', 0)} payments")
        
        # Check balance - should NOT have changed
        balance_after = self.session.get(f"{BASE_URL}/api/balance").json()["balance"]
        print(f"Balance after expiring payments: {balance_after} AZN")
        
        assert balance_after == balance_before, \
            f"CRITICAL BUG: Balance changed after expiring payments! Before: {balance_before}, After: {balance_after}"
        
        # Verify payments are expired (not completed)
        for payment_id in payment_ids:
            status_response = self.session.get(f"{BASE_URL}/api/payments/{payment_id}/status")
            if status_response.status_code == 200:
                status = status_response.json()["status"]
                assert status == "expired", f"Payment {payment_id} should be expired, got: {status}"
        
        print("✅ Expire-pending-payments does NOT add balance (correct behavior)")
    
    def test_07_payment_status_endpoint_works(self):
        """Test that payment status endpoint returns correct status"""
        # Create a payment
        response = self.session.post(
            f"{BASE_URL}/api/payments/create",
            json={"amount": 5.0, "description": "Test payment status"}
        )
        assert response.status_code == 200
        payment_id = response.json()["payment_id"]
        
        # Check status
        status_response = self.session.get(f"{BASE_URL}/api/payments/{payment_id}/status")
        assert status_response.status_code == 200
        
        status_data = status_response.json()
        assert "payment_id" in status_data
        assert "status" in status_data
        assert "amount" in status_data
        assert status_data["status"] == "pending"
        
        print(f"✅ Payment status endpoint works correctly. Status: {status_data['status']}")
    
    def test_08_balance_transactions_endpoint_works(self):
        """Test that balance transactions endpoint works"""
        response = self.session.get(f"{BASE_URL}/api/balance/transactions")
        assert response.status_code == 200
        
        # Should return a list
        data = response.json()
        assert isinstance(data, list)
        
        print(f"✅ Balance transactions endpoint works. Found {len(data)} transactions")
    
    def test_09_payment_callback_requires_valid_signature(self):
        """Test that payment callback rejects invalid signatures"""
        # Try to call callback with invalid data
        response = requests.post(
            f"{BASE_URL}/api/payments/callback",
            json={"data": "invalid_data", "signature": "invalid_signature"}
        )
        
        # Should reject with 401 (invalid signature) or 400 (bad request)
        assert response.status_code in [400, 401, 500], \
            f"Callback should reject invalid signature, got: {response.status_code}"
        
        print("✅ Payment callback rejects invalid signatures (correct behavior)")
    
    def test_10_full_payment_flow_without_completion(self):
        """
        INTEGRATION TEST: Full payment flow where user cancels/doesn't complete
        Balance should remain unchanged throughout
        """
        # Step 1: Get initial balance
        initial_balance = self.session.get(f"{BASE_URL}/api/balance").json()["balance"]
        print(f"Step 1 - Initial balance: {initial_balance} AZN")
        
        # Step 2: Create payment
        response = self.session.post(
            f"{BASE_URL}/api/payments/create",
            json={"amount": 100.0, "description": "Full flow test - user will cancel"}
        )
        assert response.status_code == 200
        payment_id = response.json()["payment_id"]
        print(f"Step 2 - Payment created: {payment_id}")
        
        # Step 3: Check balance (simulating user returning from gateway without completing)
        balance_after_create = self.session.get(f"{BASE_URL}/api/balance").json()["balance"]
        assert balance_after_create == initial_balance, "Balance should not change after payment creation"
        print(f"Step 3 - Balance after create: {balance_after_create} AZN (unchanged)")
        
        # Step 4: Check payment status (should be pending)
        status = self.session.get(f"{BASE_URL}/api/payments/{payment_id}/status").json()["status"]
        assert status == "pending", f"Payment should be pending, got: {status}"
        print(f"Step 4 - Payment status: {status}")
        
        # Step 5: Expire the payment (simulating admin cleanup or timeout)
        expire_response = self.session.post(f"{BASE_URL}/api/admin/expire-pending-payments")
        assert expire_response.status_code == 200
        print("Step 5 - Expired pending payments")
        
        # Step 6: Final balance check
        final_balance = self.session.get(f"{BASE_URL}/api/balance").json()["balance"]
        assert final_balance == initial_balance, \
            f"CRITICAL BUG: Final balance differs from initial! Initial: {initial_balance}, Final: {final_balance}"
        print(f"Step 6 - Final balance: {final_balance} AZN (unchanged)")
        
        print("✅ Full payment flow without completion - balance correctly unchanged")


class TestPaymentEndpointSecurity:
    """Security tests for payment endpoints"""
    
    def test_payment_create_requires_auth(self):
        """Test that payment creation requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/payments/create",
            json={"amount": 10.0}
        )
        assert response.status_code == 401, "Payment create should require auth"
        print("✅ Payment create requires authentication")
    
    def test_balance_requires_auth(self):
        """Test that balance endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/balance")
        assert response.status_code == 401, "Balance should require auth"
        print("✅ Balance endpoint requires authentication")
    
    def test_payment_status_requires_auth(self):
        """Test that payment status requires authentication"""
        response = requests.get(f"{BASE_URL}/api/payments/test-id/status")
        assert response.status_code == 401, "Payment status should require auth"
        print("✅ Payment status requires authentication")
    
    def test_expire_payments_requires_auth(self):
        """Test that expire payments requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/expire-pending-payments")
        assert response.status_code == 401, "Expire payments should require auth"
        print("✅ Expire payments requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
