import requests
import sys
import json
from datetime import datetime, timezone
import time

class ViventoStaticPagesAPITester:
    def __init__(self, base_url="https://vivento-invites.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.admin_user_id = None
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
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if token:
            test_headers['Authorization'] = f'Bearer {token}'
        elif self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text}"
                
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        print("\n🔐 Testing Admin Authentication...")
        
        admin_login_data = {
            "email": "admin@vivento.az",
            "password": "Vivento123!"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=admin_login_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_user_id = response['user']['id']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_setup_pages_endpoint(self):
        """Test POST /api/admin/setup-pages (P0 - Critical)"""
        print("\n🏗️ Testing Setup Pages Endpoint (P0 - Critical)...")
        
        success, response = self.run_test(
            "Setup Pages Endpoint (No Auth Required)",
            "POST",
            "admin/setup-pages",
            200
        )
        
        if success and isinstance(response, dict):
            if 'message' in response or 'success' in response:
                print(f"   ✅ Setup pages response: {response}")
                return True
            else:
                self.log_test("Setup Pages Response Validation", False, "Invalid response format")
                return False
        return False

    def test_public_pages_access(self):
        """Test public pages access (privacy, terms, contact)"""
        print("\n🌐 Testing Public Pages Access...")
        
        page_slugs = ["privacy", "terms", "contact"]
        all_passed = True
        
        for slug in page_slugs:
            success, response = self.run_test(
                f"Public Page - {slug}",
                "GET",
                f"pages/{slug}",
                200
            )
            
            if success and isinstance(response, dict):
                # Validate required fields
                required_fields = ["title", "content", "published"]
                missing_fields = [field for field in required_fields if field not in response]
                
                if missing_fields:
                    self.log_test(f"Public Page {slug} Structure", False, f"Missing fields: {missing_fields}")
                    all_passed = False
                else:
                    title = response.get('title', 'No title')
                    content_length = len(response.get('content', ''))
                    published = response.get('published', False)
                    
                    print(f"   ✅ {slug}: {title} ({content_length} chars, published: {published})")
                    
                    # Validate content contains HTML tags
                    content = response.get('content', '')
                    html_tags = ['<h2>', '<h3>', '<p>', '<ul>', '<li>', '<a>']
                    found_tags = [tag for tag in html_tags if tag in content]
                    
                    if found_tags:
                        print(f"     HTML tags found: {', '.join(found_tags)}")
                    else:
                        print(f"     ⚠️  No HTML tags found in content")
            else:
                all_passed = False
        
        return all_passed

    def test_admin_pages_management(self):
        """Test admin pages management endpoints"""
        if not self.admin_token:
            self.log_test("Admin Pages Management", False, "No admin token available")
            return False
            
        print("\n👑 Testing Admin Pages Management...")
        
        # Test GET /api/admin/pages
        success, response = self.run_test(
            "Get Admin Pages",
            "GET",
            "admin/pages",
            200
        )
        
        if not success:
            return False
            
        if not isinstance(response, list):
            self.log_test("Admin Pages Response Type", False, "Expected list response")
            return False
            
        print(f"   ✅ Found {len(response)} pages in admin")
        
        # Validate we have the expected 3 pages
        expected_slugs = ["privacy", "terms", "contact"]
        found_slugs = [page.get('slug') for page in response if 'slug' in page]
        
        missing_slugs = [slug for slug in expected_slugs if slug not in found_slugs]
        if missing_slugs:
            self.log_test("Admin Pages Completeness", False, f"Missing pages: {missing_slugs}")
            return False
        
        # Test updating privacy page
        privacy_update_data = {
            "title": "Updated Privacy Policy - Test",
            "content": "<h2>Test Privacy Policy Update</h2><p>This content was updated via API test on " + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + "</p><h3>Data Collection</h3><p>We collect necessary information only.</p><ul><li>Personal information</li><li>Usage data</li></ul>",
            "meta_description": "Updated privacy policy for testing",
            "published": True
        }
        
        success_update, response_update = self.run_test(
            "Update Privacy Page",
            "PUT",
            "admin/pages/privacy",
            200,
            data=privacy_update_data
        )
        
        if not success_update:
            return False
            
        # Verify the update was saved by getting the page again
        success_verify, response_verify = self.run_test(
            "Verify Privacy Page Update",
            "GET",
            "pages/privacy",
            200
        )
        
        if success_verify and isinstance(response_verify, dict):
            updated_content = response_verify.get('content', '')
            if "Test Privacy Policy Update" in updated_content:
                print(f"   ✅ Privacy page update verified successfully")
                return True
            else:
                self.log_test("Privacy Page Update Verification", False, "Updated content not found")
                return False
        
        return False

    def test_page_content_structure(self):
        """Test page content structure validation"""
        print("\n📋 Testing Page Content Structure...")
        
        page_slugs = ["privacy", "terms", "contact"]
        all_passed = True
        
        for slug in page_slugs:
            success, response = self.run_test(
                f"Page Structure - {slug}",
                "GET",
                f"pages/{slug}",
                200
            )
            
            if success and isinstance(response, dict):
                # Validate all required fields
                required_fields = ["id", "slug", "title", "content", "meta_description", "published", "created_at", "updated_at"]
                missing_fields = [field for field in required_fields if field not in response]
                
                if missing_fields:
                    self.log_test(f"Page Structure {slug}", False, f"Missing fields: {missing_fields}")
                    all_passed = False
                    continue
                
                # Validate field types and content
                validations = []
                
                # Check slug matches
                if response.get('slug') != slug:
                    validations.append(f"slug mismatch: expected {slug}, got {response.get('slug')}")
                
                # Check published is boolean
                if not isinstance(response.get('published'), bool):
                    validations.append(f"published should be boolean, got {type(response.get('published'))}")
                
                # Check content contains HTML
                content = response.get('content', '')
                if not any(tag in content for tag in ['<h2>', '<h3>', '<p>', '<ul>', '<li>', '<a>']):
                    validations.append("content should contain HTML tags")
                
                # Check dates are present
                for date_field in ['created_at', 'updated_at']:
                    if not response.get(date_field):
                        validations.append(f"{date_field} is missing or empty")
                
                if validations:
                    self.log_test(f"Page Structure {slug}", False, "; ".join(validations))
                    all_passed = False
                else:
                    print(f"   ✅ {slug}: All structure validations passed")
                    print(f"     ID: {response.get('id')}")
                    print(f"     Title: {response.get('title')}")
                    print(f"     Content length: {len(content)} chars")
                    print(f"     Published: {response.get('published')}")
                    print(f"     Meta description: {response.get('meta_description', 'None')}")
            else:
                all_passed = False
        
        return all_passed

    def run_static_pages_tests(self):
        """Run all static pages functionality tests"""
        print("🚀 Starting Vivento Static Pages API Tests...")
        print(f"   Base URL: {self.base_url}")
        print(f"   Admin credentials: admin@vivento.az / Vivento123!")
        
        # Test 1: Setup Pages Endpoint (P0 - Critical)
        print("\n" + "="*60)
        print("TEST 1: Setup Pages Endpoint (P0 - Critical)")
        print("="*60)
        self.test_setup_pages_endpoint()
        
        # Test 2: Public Pages Access
        print("\n" + "="*60)
        print("TEST 2: Public Pages Access")
        print("="*60)
        self.test_public_pages_access()
        
        # Test 3: Admin Authentication and Pages Management
        print("\n" + "="*60)
        print("TEST 3: Admin Pages Management")
        print("="*60)
        if self.test_admin_login():
            self.test_admin_pages_management()
        else:
            print("❌ Admin login failed - skipping admin tests")
        
        # Test 4: Page Content Structure Validation
        print("\n" + "="*60)
        print("TEST 4: Page Content Structure Validation")
        print("="*60)
        self.test_page_content_structure()
        
        return self.get_results()

    def get_results(self):
        """Get test results summary"""
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        results = {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": f"{success_rate:.1f}%",
            "test_details": self.test_results
        }
        
        print(f"\n" + "="*60)
        print("📊 STATIC PAGES TEST RESULTS SUMMARY")
        print("="*60)
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        if self.tests_run - self.tests_passed > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test']}: {result['details']}")
        
        return results

def main():
    tester = ViventoStaticPagesAPITester()
    results = tester.run_static_pages_tests()
    
    # Save results to file
    with open('/app/static_pages_test_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Results saved to /app/static_pages_test_results.json")
    
    # Return appropriate exit code
    return 0 if results["failed_tests"] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())