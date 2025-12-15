#!/usr/bin/env python3
"""
Favorites Functionality Test Script
Tests the complete favorites flow as requested:
1. Register new user
2. Login and get access token  
3. Get first template ID from /api/templates
4. POST /api/favorites/{template_id} to add to favorites
5. GET /api/favorites to verify it was added
6. DELETE /api/favorites/{template_id} to remove from favorites
7. GET /api/favorites again to verify it was removed
"""

import requests
import json
import time
from datetime import datetime

class FavoritesAPITester:
    def __init__(self, base_url="https://card-preview-repair.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.test_results = []

    def log_result(self, step, success, details="", response_data=None):
        """Log test step result with detailed information"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"\n{status} Step {step}")
        if details:
            print(f"   Details: {details}")
        if response_data:
            print(f"   Response: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        
        self.test_results.append({
            "step": step,
            "success": success,
            "details": details,
            "response": response_data
        })
        return success

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request with proper headers and error handling"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 {method} {url}")
        if data:
            print(f"   Request Data: {json.dumps(data, indent=2, ensure_ascii=False)}")

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=15)
            else:
                raise ValueError(f"Unsupported method: {method}")

            print(f"   Status Code: {response.status_code}")
            
            try:
                response_json = response.json()
                print(f"   Response: {json.dumps(response_json, indent=2, ensure_ascii=False)}")
            except:
                response_json = {"text": response.text}
                print(f"   Response Text: {response.text}")

            success = response.status_code == expected_status
            return success, response_json if success else {"error": f"Expected {expected_status}, got {response.status_code}", "response": response_json}

        except Exception as e:
            error_msg = f"Request failed: {str(e)}"
            print(f"   Error: {error_msg}")
            return False, {"error": error_msg}

    def step1_register_user(self):
        """Step 1: Register a new test user or login if exists"""
        print("\n" + "="*60)
        print("STEP 1: Register New Test User (or Login if Exists)")
        print("="*60)
        
        user_data = {
            "name": "Favorites Test User",
            "email": "favoritetest@vivento.test",
            "password": "Test123!"
        }
        
        success, response = self.make_request('POST', 'auth/register', user_data, 200)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return self.log_result(
                "1: Register User", 
                True, 
                f"User registered successfully. Token: {self.token[:20]}...",
                {"user_id": self.user_id, "email": user_data["email"]}
            )
        else:
            # If registration failed (user exists), try to login
            if "Bu email artıq istifadədədir" in str(response):
                print("   User already exists, attempting login...")
                login_data = {
                    "email": user_data["email"],
                    "password": user_data["password"]
                }
                
                success, login_response = self.make_request('POST', 'auth/login', login_data, 200)
                
                if success and 'access_token' in login_response:
                    self.token = login_response['access_token']
                    self.user_id = login_response['user']['id']
                    return self.log_result(
                        "1: Register User (Login Fallback)", 
                        True, 
                        f"Existing user logged in successfully. Token: {self.token[:20]}...",
                        {"user_id": self.user_id, "email": user_data["email"]}
                    )
                else:
                    return self.log_result(
                        "1: Register User", 
                        False, 
                        "Registration failed and login fallback also failed",
                        {"register_response": response, "login_response": login_response}
                    )
            else:
                return self.log_result(
                    "1: Register User", 
                    False, 
                    "Failed to register user or get access token",
                    response
                )

    def step2_login_user(self):
        """Step 2: Login and verify access token works"""
        print("\n" + "="*60)
        print("STEP 2: Login and Verify Token")
        print("="*60)
        
        login_data = {
            "email": "favoritetest@vivento.test",
            "password": "Test123!"
        }
        
        success, response = self.make_request('POST', 'auth/login', login_data, 200)
        
        if success and 'access_token' in response:
            # Update token from login (should be same as registration)
            login_token = response['access_token']
            return self.log_result(
                "2: Login User", 
                True, 
                f"Login successful. Token matches: {login_token == self.token}",
                {"login_token": login_token[:20] + "...", "user": response.get('user', {})}
            )
        else:
            return self.log_result(
                "2: Login User", 
                False, 
                "Login failed",
                response
            )

    def step3_get_templates(self):
        """Step 3: Get first template ID from /api/templates"""
        print("\n" + "="*60)
        print("STEP 3: Get Templates and Select First Template ID")
        print("="*60)
        
        success, response = self.make_request('GET', 'templates', None, 200)
        
        if success and isinstance(response, list) and len(response) > 0:
            first_template = response[0]
            template_id = first_template.get('id')
            
            if template_id:
                self.template_id = template_id
                return self.log_result(
                    "3: Get Templates", 
                    True, 
                    f"Found {len(response)} templates. Selected template ID: {template_id}",
                    {
                        "total_templates": len(response),
                        "selected_template": {
                            "id": template_id,
                            "name": first_template.get('name', 'N/A'),
                            "category": first_template.get('category', 'N/A')
                        }
                    }
                )
            else:
                return self.log_result(
                    "3: Get Templates", 
                    False, 
                    "First template has no ID field",
                    first_template
                )
        else:
            return self.log_result(
                "3: Get Templates", 
                False, 
                f"No templates found or invalid response. Response type: {type(response)}",
                response
            )

    def step4_add_to_favorites(self):
        """Step 4: POST /api/favorites/{template_id} to add to favorites"""
        print("\n" + "="*60)
        print("STEP 4: Add Template to Favorites")
        print("="*60)
        
        if not hasattr(self, 'template_id'):
            return self.log_result(
                "4: Add to Favorites", 
                False, 
                "No template ID available from previous step"
            )
        
        success, response = self.make_request('POST', f'favorites/{self.template_id}', None, 200)
        
        if success:
            return self.log_result(
                "4: Add to Favorites", 
                True, 
                f"Template {self.template_id} added to favorites successfully",
                response
            )
        else:
            return self.log_result(
                "4: Add to Favorites", 
                False, 
                f"Failed to add template {self.template_id} to favorites",
                response
            )

    def step5_verify_favorites_added(self):
        """Step 5: GET /api/favorites to verify it was added"""
        print("\n" + "="*60)
        print("STEP 5: Verify Template Added to Favorites")
        print("="*60)
        
        success, response = self.make_request('GET', 'favorites', None, 200)
        
        if success:
            favorites = response.get('favorites', [])
            template_found = False
            
            # Check if our template is in the favorites
            for fav_template in favorites:
                if fav_template.get('id') == self.template_id:
                    template_found = True
                    break
            
            if template_found:
                return self.log_result(
                    "5: Verify Favorites Added", 
                    True, 
                    f"Template {self.template_id} found in favorites list ({len(favorites)} total favorites)",
                    {
                        "total_favorites": len(favorites),
                        "template_found": True,
                        "favorites": [{"id": t.get('id'), "name": t.get('name')} for t in favorites]
                    }
                )
            else:
                return self.log_result(
                    "5: Verify Favorites Added", 
                    False, 
                    f"Template {self.template_id} NOT found in favorites list",
                    {
                        "total_favorites": len(favorites),
                        "template_found": False,
                        "favorites": [{"id": t.get('id'), "name": t.get('name')} for t in favorites]
                    }
                )
        else:
            return self.log_result(
                "5: Verify Favorites Added", 
                False, 
                "Failed to get favorites list",
                response
            )

    def step6_remove_from_favorites(self):
        """Step 6: DELETE /api/favorites/{template_id} to remove from favorites"""
        print("\n" + "="*60)
        print("STEP 6: Remove Template from Favorites")
        print("="*60)
        
        if not hasattr(self, 'template_id'):
            return self.log_result(
                "6: Remove from Favorites", 
                False, 
                "No template ID available"
            )
        
        success, response = self.make_request('DELETE', f'favorites/{self.template_id}', None, 200)
        
        if success:
            return self.log_result(
                "6: Remove from Favorites", 
                True, 
                f"Template {self.template_id} removed from favorites successfully",
                response
            )
        else:
            return self.log_result(
                "6: Remove from Favorites", 
                False, 
                f"Failed to remove template {self.template_id} from favorites",
                response
            )

    def step7_verify_favorites_removed(self):
        """Step 7: GET /api/favorites again to verify it was removed"""
        print("\n" + "="*60)
        print("STEP 7: Verify Template Removed from Favorites")
        print("="*60)
        
        success, response = self.make_request('GET', 'favorites', None, 200)
        
        if success:
            favorites = response.get('favorites', [])
            template_found = False
            
            # Check if our template is still in the favorites
            for fav_template in favorites:
                if fav_template.get('id') == self.template_id:
                    template_found = True
                    break
            
            if not template_found:
                return self.log_result(
                    "7: Verify Favorites Removed", 
                    True, 
                    f"Template {self.template_id} successfully removed from favorites ({len(favorites)} remaining favorites)",
                    {
                        "total_favorites": len(favorites),
                        "template_found": False,
                        "favorites": [{"id": t.get('id'), "name": t.get('name')} for t in favorites]
                    }
                )
            else:
                return self.log_result(
                    "7: Verify Favorites Removed", 
                    False, 
                    f"Template {self.template_id} STILL found in favorites list (removal failed)",
                    {
                        "total_favorites": len(favorites),
                        "template_found": True,
                        "favorites": [{"id": t.get('id'), "name": t.get('name')} for t in favorites]
                    }
                )
        else:
            return self.log_result(
                "7: Verify Favorites Removed", 
                False, 
                "Failed to get favorites list for verification",
                response
            )

    def run_favorites_test(self):
        """Run the complete favorites functionality test"""
        print("🚀 STARTING FAVORITES FUNCTIONALITY TEST")
        print(f"   Base URL: {self.base_url}")
        print(f"   Test User: favoritetest@vivento.test")
        print(f"   Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run all test steps in sequence
        steps = [
            self.step1_register_user,
            self.step2_login_user,
            self.step3_get_templates,
            self.step4_add_to_favorites,
            self.step5_verify_favorites_added,
            self.step6_remove_from_favorites,
            self.step7_verify_favorites_removed
        ]
        
        all_passed = True
        for step_func in steps:
            if not step_func():
                all_passed = False
                print(f"\n❌ Test failed at {step_func.__name__}")
                break
        
        # Print final results
        print("\n" + "="*60)
        print("FAVORITES TEST RESULTS SUMMARY")
        print("="*60)
        
        passed_steps = sum(1 for result in self.test_results if result['success'])
        total_steps = len(self.test_results)
        
        print(f"Total Steps: {total_steps}")
        print(f"Passed Steps: {passed_steps}")
        print(f"Failed Steps: {total_steps - passed_steps}")
        print(f"Success Rate: {(passed_steps/total_steps*100):.1f}%" if total_steps > 0 else "0%")
        
        if all_passed:
            print("\n🎉 ALL FAVORITES FUNCTIONALITY TESTS PASSED!")
            print("   ✅ User registration working")
            print("   ✅ Authentication working")
            print("   ✅ Template retrieval working")
            print("   ✅ Add to favorites working")
            print("   ✅ Favorites list retrieval working")
            print("   ✅ Remove from favorites working")
            print("   ✅ Favorites persistence working")
        else:
            print("\n❌ FAVORITES FUNCTIONALITY TEST FAILED")
            print("   Check the detailed logs above for specific failure points")
        
        # Save detailed results
        results = {
            "test_name": "Favorites Functionality Test",
            "timestamp": datetime.now().isoformat(),
            "base_url": self.base_url,
            "overall_success": all_passed,
            "total_steps": total_steps,
            "passed_steps": passed_steps,
            "failed_steps": total_steps - passed_steps,
            "step_results": self.test_results
        }
        
        with open('/app/favorites_test_results.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Detailed results saved to /app/favorites_test_results.json")
        
        return all_passed

def main():
    """Main function to run the favorites test"""
    tester = FavoritesAPITester()
    success = tester.run_favorites_test()
    return 0 if success else 1

if __name__ == "__main__":
    import sys
    sys.exit(main())