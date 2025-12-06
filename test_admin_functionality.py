#!/usr/bin/env python3
import requests
import json
import time

class AdminFunctionalityTester:
    def __init__(self, base_url="https://payment-deploy-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.regular_token = None
        
    def authenticate_admin(self):
        """Authenticate as admin user"""
        # First register admin user
        admin_data = {
            "name": "Admin User",
            "email": "admin@vivento.az",
            "password": "AdminPass123!"
        }
        
        response = requests.post(
            f"{self.base_url}/api/auth/register",
            json=admin_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            self.admin_token = data['access_token']
            print(f"✅ Admin authentication successful")
            return True
        elif response.status_code == 400 and "artıq istifadədədir" in response.text:
            # Admin already exists, try to login
            login_data = {
                "email": "admin@vivento.az",
                "password": "AdminPass123!"
            }
            
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data['access_token']
                print(f"✅ Admin login successful")
                return True
            else:
                print(f"❌ Admin login failed: {response.status_code}")
                return False
        else:
            print(f"❌ Admin authentication failed: {response.status_code}")
            return False
    
    def authenticate_regular_user(self):
        """Authenticate as regular user"""
        timestamp = int(time.time())
        user_data = {
            "name": f"Regular User {timestamp}",
            "email": f"regular{timestamp}@vivento.az",
            "password": "RegularPass123!"
        }
        
        response = requests.post(
            f"{self.base_url}/api/auth/register",
            json=user_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            self.regular_token = data['access_token']
            print(f"✅ Regular user authentication successful")
            return True
        else:
            print(f"❌ Regular user authentication failed: {response.status_code}")
            return False
    
    def test_admin_create_template(self):
        """Test admin template creation"""
        print("\n🔍 Testing Admin Template Creation...")
        
        if not self.admin_token:
            print("❌ No admin token")
            return False
        
        template_data = {
            "id": f"admin-test-template-{int(time.time())}",
            "name": "Admin Test Template",
            "category": "toy",
            "thumbnail_url": "https://example.com/thumbnail.jpg",
            "design_data": {
                "canvasSize": {"width": 400, "height": 600},
                "elements": [
                    {
                        "id": "admin-element",
                        "type": "text",
                        "content": "Admin Template",
                        "x": 50, "y": 100, "width": 300, "height": 50,
                        "fontSize": 24, "color": "#000000"
                    }
                ]
            },
            "is_premium": False
        }
        
        headers = {
            'Authorization': f'Bearer {self.admin_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/admin/templates",
                json=template_data,
                headers=headers,
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Admin template creation successful")
                print(f"   Message: {data.get('message')}")
                print(f"   Template ID: {data.get('id')}")
                return True, template_data['id']
            else:
                print(f"   ❌ Admin template creation failed: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"   ❌ Exception during admin template creation: {str(e)}")
            return False, None
    
    def test_admin_update_template(self, template_id):
        """Test admin template update"""
        print("\n🔍 Testing Admin Template Update...")
        
        if not self.admin_token or not template_id:
            print("❌ No admin token or template ID")
            return False
        
        update_data = {
            "name": "Updated Admin Test Template",
            "category": "nişan",
            "is_premium": True
        }
        
        headers = {
            'Authorization': f'Bearer {self.admin_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.put(
                f"{self.base_url}/api/admin/templates/{template_id}",
                json=update_data,
                headers=headers,
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Admin template update successful")
                print(f"   Message: {data.get('message')}")
                return True
            else:
                print(f"   ❌ Admin template update failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception during admin template update: {str(e)}")
            return False
    
    def test_admin_delete_template(self, template_id):
        """Test admin template deletion"""
        print("\n🔍 Testing Admin Template Deletion...")
        
        if not self.admin_token or not template_id:
            print("❌ No admin token or template ID")
            return False
        
        headers = {
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        try:
            response = requests.delete(
                f"{self.base_url}/api/admin/templates/{template_id}",
                headers=headers,
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Admin template deletion successful")
                print(f"   Message: {data.get('message')}")
                return True
            else:
                print(f"   ❌ Admin template deletion failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception during admin template deletion: {str(e)}")
            return False
    
    def test_regular_user_admin_access(self):
        """Test that regular users cannot access admin endpoints"""
        print("\n🔍 Testing Regular User Admin Access Restriction...")
        
        if not self.regular_token:
            print("❌ No regular user token")
            return False
        
        template_data = {
            "id": "unauthorized-template",
            "name": "Unauthorized Template",
            "category": "toy"
        }
        
        headers = {
            'Authorization': f'Bearer {self.regular_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/admin/templates",
                json=template_data,
                headers=headers,
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 403:
                print(f"   ✅ Regular user properly blocked from admin access")
                print(f"   Error: {response.json().get('detail', 'No detail')}")
                return True
            else:
                print(f"   ❌ Regular user not properly blocked: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception during regular user admin test: {str(e)}")
            return False
    
    def test_unauthenticated_admin_access(self):
        """Test that unauthenticated users cannot access admin endpoints"""
        print("\n🔍 Testing Unauthenticated Admin Access Restriction...")
        
        template_data = {
            "id": "unauthenticated-template",
            "name": "Unauthenticated Template",
            "category": "toy"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/admin/templates",
                json=template_data,
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 401:
                print(f"   ✅ Unauthenticated user properly blocked")
                print(f"   Error: {response.json().get('detail', 'No detail')}")
                return True
            else:
                print(f"   ❌ Unauthenticated user not properly blocked: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception during unauthenticated admin test: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all admin functionality tests"""
        print("🚀 Starting Admin Functionality Tests...")
        print(f"   Base URL: {self.base_url}")
        
        results = {
            "admin_authentication": False,
            "regular_user_authentication": False,
            "admin_create_template": False,
            "admin_update_template": False,
            "admin_delete_template": False,
            "regular_user_blocked": False,
            "unauthenticated_blocked": False
        }
        
        # Authenticate users
        results["admin_authentication"] = self.authenticate_admin()
        results["regular_user_authentication"] = self.authenticate_regular_user()
        
        # Test unauthenticated access first
        results["unauthenticated_blocked"] = self.test_unauthenticated_admin_access()
        
        # Test regular user access restriction
        if results["regular_user_authentication"]:
            results["regular_user_blocked"] = self.test_regular_user_admin_access()
        
        # Test admin functionality
        template_id = None
        if results["admin_authentication"]:
            success, template_id = self.test_admin_create_template()
            results["admin_create_template"] = success
            
            if success and template_id:
                results["admin_update_template"] = self.test_admin_update_template(template_id)
                results["admin_delete_template"] = self.test_admin_delete_template(template_id)
        
        # Summary
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        print(f"\n📊 Admin Functionality Test Results:")
        print(f"   Total Tests: {total}")
        print(f"   Passed: {passed}")
        print(f"   Failed: {total - passed}")
        print(f"   Success Rate: {passed/total*100:.1f}%")
        
        for test_name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"   {test_name}: {status}")
        
        return results

if __name__ == "__main__":
    tester = AdminFunctionalityTester()
    results = tester.run_all_tests()