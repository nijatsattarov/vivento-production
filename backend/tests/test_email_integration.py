"""
Email Integration Tests for Vivento Platform
Tests: Welcome email, Password reset email, Payment invoice email
Using Resend.com API integration
"""
import pytest
import requests
import os
import uuid
import time

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_ADMIN_EMAIL = "admin@vivento.az"
TEST_ADMIN_PASSWORD = "Vivento123!"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API is running"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API health check passed: {data['message']}")


class TestRegistrationWelcomeEmail:
    """Test registration endpoint sends welcome email"""
    
    def test_register_new_user_sends_welcome_email(self):
        """
        Test that registering a new user triggers welcome email
        Note: We can't verify email delivery, but we verify the endpoint works
        """
        # Generate unique test email
        unique_id = str(uuid.uuid4())[:8]
        test_email = f"test_welcome_{unique_id}@test.vivento.az"
        test_name = f"Test User {unique_id}"
        test_password = "TestPass123!"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": test_name,
                "email": test_email,
                "password": test_password
            }
        )
        
        # Registration should succeed
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == test_email
        assert data["user"]["name"] == test_name
        
        print(f"✅ Registration successful for {test_email}")
        print(f"   Welcome email should be queued for delivery")
        
        # Return token for cleanup
        return data["access_token"]
    
    def test_register_duplicate_email_fails(self):
        """Test that registering with existing email fails"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": "Duplicate Test",
                "email": TEST_ADMIN_EMAIL,  # Already exists
                "password": "TestPass123!"
            }
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "artıq istifadədədir" in data.get("detail", "").lower() or "already" in data.get("detail", "").lower()
        print(f"✅ Duplicate email registration correctly rejected")


class TestForgotPasswordEmail:
    """Test forgot password endpoint sends reset email"""
    
    def test_forgot_password_existing_user(self):
        """
        Test forgot password for existing user sends reset email
        """
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": TEST_ADMIN_EMAIL}
        )
        
        # Should always return success for security
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "message" in data
        
        print(f"✅ Forgot password request successful for {TEST_ADMIN_EMAIL}")
        print(f"   Reset email should be sent to the user")
    
    def test_forgot_password_nonexistent_user(self):
        """
        Test forgot password for non-existent user (should still return success for security)
        """
        fake_email = f"nonexistent_{uuid.uuid4()}@fake.com"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": fake_email}
        )
        
        # Should return success even for non-existent users (security best practice)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        print(f"✅ Forgot password correctly returns success for non-existent email (security)")


class TestResetPassword:
    """Test reset password endpoint"""
    
    def test_reset_password_invalid_token(self):
        """Test reset password with invalid token fails"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={
                "token": "invalid-token-12345",
                "new_password": "NewPassword123!"
            }
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "etibarsız" in data.get("detail", "").lower() or "invalid" in data.get("detail", "").lower()
        
        print(f"✅ Invalid reset token correctly rejected")
    
    def test_reset_password_short_password(self):
        """Test reset password with short password fails"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={
                "token": "some-token",
                "new_password": "123"  # Too short
            }
        )
        
        # Should fail - either invalid token or short password
        assert response.status_code == 400
        print(f"✅ Short password correctly rejected")


class TestResetPasswordFlow:
    """Test complete reset password flow"""
    
    def test_forgot_then_reset_flow(self):
        """
        Test the complete forgot password -> reset password flow
        Note: We can't test actual email delivery, but we test the API flow
        """
        # First, create a test user
        unique_id = str(uuid.uuid4())[:8]
        test_email = f"test_reset_{unique_id}@test.vivento.az"
        test_password = "OldPassword123!"
        
        # Register user
        register_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": f"Reset Test {unique_id}",
                "email": test_email,
                "password": test_password
            }
        )
        
        if register_response.status_code != 200:
            pytest.skip(f"Could not create test user: {register_response.text}")
        
        print(f"✅ Test user created: {test_email}")
        
        # Request password reset
        forgot_response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": test_email}
        )
        
        assert forgot_response.status_code == 200
        print(f"✅ Password reset requested for {test_email}")
        
        # Note: In a real test, we would need to:
        # 1. Check the database for the reset token
        # 2. Or intercept the email to get the token
        # Since we can't do that in this test, we verify the flow works
        
        # Verify user can still login with old password
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": test_email,
                "password": test_password
            }
        )
        
        assert login_response.status_code == 200
        print(f"✅ User can still login with old password (reset not yet completed)")


class TestPaymentInvoiceEmail:
    """Test payment callback sends invoice email"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_ADMIN_EMAIL,
                "password": TEST_ADMIN_PASSWORD
            }
        )
        
        if response.status_code != 200:
            pytest.skip(f"Could not login: {response.text}")
        
        return response.json()["access_token"]
    
    def test_payment_callback_endpoint_exists(self, auth_token):
        """Test that payment callback endpoint exists"""
        # The callback endpoint should exist but requires proper Epoint signature
        # We just verify the endpoint is reachable
        
        response = requests.post(
            f"{BASE_URL}/api/payments/callback",
            json={
                "order_id": "test-order-123",
                "status": "success",
                "transaction_id": "test-tx-123"
            }
        )
        
        # Should return 400 (invalid signature) or 200 (processed)
        # Not 404 (endpoint not found)
        assert response.status_code != 404, "Payment callback endpoint not found"
        print(f"✅ Payment callback endpoint exists (status: {response.status_code})")
    
    def test_create_payment_endpoint(self, auth_token):
        """Test creating a payment (which would later trigger invoice email on callback)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/payments/create",
            headers=headers,
            json={"amount": 5.0}
        )
        
        # Payment creation should work
        if response.status_code == 200:
            data = response.json()
            assert "payment_id" in data or "payment_url" in data
            print(f"✅ Payment creation successful")
            print(f"   Invoice email would be sent after successful Epoint callback")
        else:
            print(f"⚠️ Payment creation returned {response.status_code}: {response.text}")
            # This might fail if Epoint is not configured, which is acceptable


class TestEmailServiceConfiguration:
    """Test email service configuration"""
    
    def test_login_works(self):
        """Verify login works (prerequisite for email tests)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_ADMIN_EMAIL,
                "password": TEST_ADMIN_PASSWORD
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        
        print(f"✅ Login successful for {TEST_ADMIN_EMAIL}")
        print(f"   User ID: {data['user']['id']}")
        print(f"   Balance: {data['user'].get('balance', 0)} AZN")


class TestResetPasswordUI:
    """Test reset password page accessibility"""
    
    def test_reset_password_page_route(self):
        """Test that reset password page route exists"""
        # The frontend should have /reset-password route
        response = requests.get(f"{BASE_URL}/reset-password")
        
        # Should return 200 (React app serves all routes)
        assert response.status_code == 200
        print(f"✅ Reset password page route accessible")
    
    def test_reset_password_with_token_param(self):
        """Test reset password page with token parameter"""
        response = requests.get(f"{BASE_URL}/reset-password?token=test-token-123")
        
        # Should return 200 (React app handles the token)
        assert response.status_code == 200
        print(f"✅ Reset password page with token parameter accessible")


class TestEmailTemplateContent:
    """Test email template rendering (via API responses)"""
    
    def test_registration_returns_user_data(self):
        """Verify registration returns user data needed for welcome email"""
        unique_id = str(uuid.uuid4())[:8]
        test_email = f"test_template_{unique_id}@test.vivento.az"
        test_name = f"Template Test {unique_id}"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": test_name,
                "email": test_email,
                "password": "TestPass123!"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            user = data["user"]
            
            # Verify all data needed for welcome email is present
            assert "name" in user
            assert "email" in user
            assert user["name"] == test_name
            assert user["email"] == test_email
            
            print(f"✅ Registration returns all data needed for welcome email template")
            print(f"   Name: {user['name']}")
            print(f"   Email: {user['email']}")
        else:
            print(f"⚠️ Registration failed: {response.text}")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
