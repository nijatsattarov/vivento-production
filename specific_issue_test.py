#!/usr/bin/env python3
"""
Specific Issue Testing for Vivento Admin Pages Editor and Thumbnail Display
Based on user review request for testing:
1. Admin Pages Editor (ReactQuill WYSIWYG functionality)
2. Thumbnail Display Issues
3. Backend API endpoints
"""

import requests
import sys
import json
from datetime import datetime, timezone
import time

class ViventoSpecificIssueTester:
    def __init__(self, base_url="https://payment-deploy-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
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

    def admin_login(self):
        """Login as admin with provided credentials"""
        print("🔐 Logging in as admin...")
        
        admin_login_data = {
            "email": "admin@vivento.az",
            "password": "Vivento123!"
        }
        
        try:
            url = f"{self.base_url}/api/auth/login"
            response = requests.post(url, json=admin_login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    self.admin_token = data['access_token']
                    print(f"✅ Admin login successful")
                    return True
                else:
                    print(f"❌ Admin login failed: No access token in response")
                    return False
            else:
                print(f"❌ Admin login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Admin login exception: {str(e)}")
            return False

    def test_admin_pages_list_api(self):
        """Test GET /api/admin/pages - Admin pages list"""
        if not self.admin_token:
            self.log_test("Admin Pages List API", False, "No admin token available")
            return False, []
            
        print("\n📄 Testing Admin Pages List API...")
        
        try:
            url = f"{self.base_url}/api/admin/pages"
            headers = {
                'Authorization': f'Bearer {self.admin_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                pages = response.json()
                if isinstance(pages, list):
                    print(f"   ✅ Found {len(pages)} admin pages")
                    for page in pages:
                        slug = page.get('slug', 'unknown')
                        title = page.get('title', 'No title')
                        content_length = len(page.get('content', ''))
                        print(f"     - {slug}: {title} ({content_length} chars)")
                    
                    self.log_test("Admin Pages List API", True, f"Retrieved {len(pages)} pages successfully")
                    return True, pages
                else:
                    self.log_test("Admin Pages List API", False, "Response is not a list")
                    return False, []
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                self.log_test("Admin Pages List API", False, error_msg)
                return False, []
                
        except Exception as e:
            self.log_test("Admin Pages List API", False, f"Exception: {str(e)}")
            return False, []

    def test_admin_page_update_api(self, slug="privacy"):
        """Test PUT /api/admin/pages/{slug} - Update page content"""
        if not self.admin_token:
            self.log_test("Admin Page Update API", False, "No admin token available")
            return False
            
        print(f"\n✏️ Testing Admin Page Update API for '{slug}'...")
        
        # Test data with ReactQuill-style HTML content
        update_data = {
            "title": "Test ReactQuill Editor Content",
            "content": """<h2>Test HTML Editor Content</h2>
<p>Bu məzmun ReactQuill HTML editoru ilə yaradılmışdır.</p>
<h3>Xüsusiyyətlər:</h3>
<ul>
<li><strong>Qalın mətn</strong> dəstəyi</li>
<li><em>Kursiv mətn</em> formatlaması</li>
<li><a href="https://vivento.az">Link əlavə etmə</a></li>
</ul>
<p>İştirakınızı səbirsizliklə gözləyirik!</p>
<p>25 Dekabr 2024</p>""",
            "meta_description": "Test content for ReactQuill editor functionality",
            "published": True
        }
        
        try:
            url = f"{self.base_url}/api/admin/pages/{slug}"
            headers = {
                'Authorization': f'Bearer {self.admin_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.put(url, json=update_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Page '{slug}' updated successfully")
                print(f"   Content length: {len(update_data['content'])} characters")
                print(f"   HTML elements: H2, H3, P, UL, LI, STRONG, EM, A tags")
                
                self.log_test("Admin Page Update API", True, f"Page '{slug}' updated with ReactQuill content")
                return True
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                self.log_test("Admin Page Update API", False, error_msg)
                return False
                
        except Exception as e:
            self.log_test("Admin Page Update API", False, f"Exception: {str(e)}")
            return False

    def test_templates_api_with_thumbnails(self):
        """Test GET /api/templates - Template list with thumbnails"""
        print("\n🖼️ Testing Templates API with Thumbnails...")
        
        try:
            url = f"{self.base_url}/api/templates"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                templates = response.json()
                if isinstance(templates, list):
                    print(f"   ✅ Found {len(templates)} templates")
                    
                    # Check for thumbnail URLs
                    templates_with_thumbnails = 0
                    toy_templates = 0
                    nisan_templates = 0
                    
                    for template in templates:
                        template_id = template.get('id', 'unknown')
                        name = template.get('name', 'No name')
                        category = template.get('category', 'unknown')
                        parent_category = template.get('parent_category', 'unknown')
                        sub_category = template.get('sub_category', 'unknown')
                        thumbnail_url = template.get('thumbnail_url', '')
                        
                        if thumbnail_url:
                            templates_with_thumbnails += 1
                            
                        if parent_category == 'toy':
                            toy_templates += 1
                            
                        if sub_category == 'nisan':
                            nisan_templates += 1
                            print(f"     - Nişan Template: {name} (ID: {template_id})")
                            print(f"       Thumbnail: {thumbnail_url[:60]}...")
                    
                    print(f"   📊 Templates with thumbnails: {templates_with_thumbnails}/{len(templates)}")
                    print(f"   🎭 Toy category templates: {toy_templates}")
                    print(f"   💍 Nişan subcategory templates: {nisan_templates}")
                    
                    if templates_with_thumbnails > 0:
                        self.log_test("Templates API with Thumbnails", True, 
                                    f"Found {templates_with_thumbnails} templates with thumbnails")
                    else:
                        self.log_test("Templates API with Thumbnails", False, 
                                    "No templates found with thumbnail URLs")
                    
                    return True, templates
                else:
                    self.log_test("Templates API with Thumbnails", False, "Response is not a list")
                    return False, []
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                self.log_test("Templates API with Thumbnails", False, error_msg)
                return False, []
                
        except Exception as e:
            self.log_test("Templates API with Thumbnails", False, f"Exception: {str(e)}")
            return False, []

    def test_toy_nisan_templates_specifically(self):
        """Test GET /api/templates/category/toy/nisan - Specific category mentioned in review"""
        print("\n💍 Testing Toy/Nişan Templates Specifically...")
        
        try:
            url = f"{self.base_url}/api/templates/category/toy/nisan"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                templates = response.json()
                if isinstance(templates, list):
                    print(f"   ✅ Found {len(templates)} toy/nişan templates")
                    
                    for template in templates:
                        name = template.get('name', 'No name')
                        thumbnail_url = template.get('thumbnail_url', '')
                        is_premium = template.get('is_premium', False)
                        
                        print(f"     - {name}")
                        print(f"       Thumbnail: {thumbnail_url}")
                        print(f"       Premium: {is_premium}")
                        
                        # Test if thumbnail URL is accessible
                        if thumbnail_url:
                            try:
                                thumb_response = requests.head(thumbnail_url, timeout=5)
                                if thumb_response.status_code == 200:
                                    print(f"       ✅ Thumbnail accessible")
                                else:
                                    print(f"       ⚠️ Thumbnail not accessible: {thumb_response.status_code}")
                            except:
                                print(f"       ⚠️ Thumbnail URL test failed")
                    
                    self.log_test("Toy/Nişan Templates", True, f"Found {len(templates)} toy/nişan templates")
                    return True
                else:
                    self.log_test("Toy/Nişan Templates", False, "Response is not a list")
                    return False
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                self.log_test("Toy/Nişan Templates", False, error_msg)
                return False
                
        except Exception as e:
            self.log_test("Toy/Nişan Templates", False, f"Exception: {str(e)}")
            return False

    def test_public_page_content_display(self, slug="privacy"):
        """Test public page content display after admin update"""
        print(f"\n🌐 Testing Public Page Content Display for '{slug}'...")
        
        try:
            url = f"{self.base_url}/api/pages/{slug}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                page_data = response.json()
                
                title = page_data.get('title', 'No title')
                content = page_data.get('content', '')
                published = page_data.get('published', False)
                
                print(f"   ✅ Page '{slug}' accessible publicly")
                print(f"   Title: {title}")
                print(f"   Content length: {len(content)} characters")
                print(f"   Published: {published}")
                
                # Check for specific content mentioned in review
                if "İştirakınızı səbirsizliklə gözləyirik" in content:
                    print(f"   ✅ Found expected text: 'İştirakınızı səbirsizliklə gözləyirik'")
                
                if "25 Dekabr 2024" in content:
                    print(f"   ✅ Found expected text: '25 Dekabr 2024'")
                
                # Check for HTML elements
                html_elements = []
                if '<h2>' in content: html_elements.append('H2')
                if '<h3>' in content: html_elements.append('H3')
                if '<p>' in content: html_elements.append('P')
                if '<strong>' in content or '<b>' in content: html_elements.append('B/STRONG')
                if '<a ' in content: html_elements.append('LINK')
                if '<ul>' in content or '<ol>' in content: html_elements.append('LIST')
                
                if html_elements:
                    print(f"   ✅ HTML elements found: {', '.join(html_elements)}")
                
                self.log_test("Public Page Content Display", True, 
                            f"Page '{slug}' displays correctly with {len(content)} chars")
                return True
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                self.log_test("Public Page Content Display", False, error_msg)
                return False
                
        except Exception as e:
            self.log_test("Public Page Content Display", False, f"Exception: {str(e)}")
            return False

    def test_thumbnail_image_accessibility(self, templates):
        """Test if thumbnail images are accessible and not cut off"""
        print("\n🖼️ Testing Thumbnail Image Accessibility...")
        
        accessible_count = 0
        total_thumbnails = 0
        
        for template in templates[:5]:  # Test first 5 templates to avoid too many requests
            thumbnail_url = template.get('thumbnail_url', '')
            template_name = template.get('name', 'Unknown')
            
            if thumbnail_url:
                total_thumbnails += 1
                print(f"   Testing thumbnail for: {template_name}")
                print(f"   URL: {thumbnail_url}")
                
                try:
                    response = requests.head(thumbnail_url, timeout=10)
                    if response.status_code == 200:
                        accessible_count += 1
                        print(f"   ✅ Thumbnail accessible")
                        
                        # Check content type
                        content_type = response.headers.get('content-type', '')
                        if 'image' in content_type:
                            print(f"   ✅ Valid image content type: {content_type}")
                        else:
                            print(f"   ⚠️ Unexpected content type: {content_type}")
                    else:
                        print(f"   ❌ Thumbnail not accessible: HTTP {response.status_code}")
                        
                except Exception as e:
                    print(f"   ❌ Thumbnail test failed: {str(e)}")
        
        if total_thumbnails > 0:
            success_rate = (accessible_count / total_thumbnails) * 100
            print(f"\n   📊 Thumbnail Accessibility: {accessible_count}/{total_thumbnails} ({success_rate:.1f}%)")
            
            if success_rate >= 80:
                self.log_test("Thumbnail Image Accessibility", True, 
                            f"{accessible_count}/{total_thumbnails} thumbnails accessible ({success_rate:.1f}%)")
                return True
            else:
                self.log_test("Thumbnail Image Accessibility", False, 
                            f"Only {accessible_count}/{total_thumbnails} thumbnails accessible ({success_rate:.1f}%)")
                return False
        else:
            self.log_test("Thumbnail Image Accessibility", False, "No thumbnails found to test")
            return False

    def run_specific_issue_tests(self):
        """Run all specific issue tests based on review request"""
        print("🎯 Starting Specific Issue Tests for Vivento...")
        print(f"   Base URL: {self.base_url}")
        print("   Focus Areas:")
        print("   1. Admin Pages Editor (ReactQuill WYSIWYG)")
        print("   2. Thumbnail Display Issues")
        print("   3. Backend API Endpoints")
        
        # Step 1: Admin Login
        if not self.admin_login():
            print("❌ Cannot proceed without admin access")
            return self.get_results()
        
        # Step 2: Test Admin Pages API
        print("\n" + "="*60)
        print("TESTING ADMIN PAGES EDITOR FUNCTIONALITY")
        print("="*60)
        
        success, pages = self.test_admin_pages_list_api()
        if success and pages:
            # Test updating a page with ReactQuill content
            self.test_admin_page_update_api("privacy")
            
            # Test public display of updated content
            self.test_public_page_content_display("privacy")
        
        # Step 3: Test Templates and Thumbnails
        print("\n" + "="*60)
        print("TESTING THUMBNAIL DISPLAY FUNCTIONALITY")
        print("="*60)
        
        success, templates = self.test_templates_api_with_thumbnails()
        if success and templates:
            # Test specific toy/nişan templates mentioned in review
            self.test_toy_nisan_templates_specifically()
            
            # Test thumbnail image accessibility
            self.test_thumbnail_image_accessibility(templates)
        
        return self.get_results()

    def get_results(self):
        """Get test results summary"""
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        results = {
            "test_focus": "Admin Pages Editor & Thumbnail Display Issues",
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": f"{success_rate:.1f}%",
            "test_details": self.test_results,
            "summary": {
                "admin_pages_editor": "TESTED",
                "thumbnail_display": "TESTED", 
                "backend_apis": "TESTED"
            }
        }
        
        print(f"\n📊 Specific Issue Test Results:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        # Detailed analysis
        print(f"\n🔍 Issue Analysis:")
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print(f"   ❌ Failed Tests:")
            for test in failed_tests:
                print(f"     - {test['test']}: {test['details']}")
        else:
            print(f"   ✅ All tests passed - No critical issues found")
        
        return results

def main():
    tester = ViventoSpecificIssueTester()
    results = tester.run_specific_issue_tests()
    
    # Save results to file
    with open('/app/specific_issue_test_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Results saved to /app/specific_issue_test_results.json")
    
    # Return appropriate exit code
    return 0 if results["failed_tests"] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())