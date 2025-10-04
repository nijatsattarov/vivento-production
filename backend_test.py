import requests
import sys
import json
from datetime import datetime, timezone
import time

class ViventoAPITester:
    def __init__(self, base_url="https://paperfree.preview.emergentagent.com"):
        self.base_url = base_url
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
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
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

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_register(self):
        """Test user registration"""
        timestamp = int(time.time())
        test_data = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@vivento.az",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST", 
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        # First register a user
        timestamp = int(time.time())
        register_data = {
            "name": f"Login Test User {timestamp}",
            "email": f"logintest{timestamp}@vivento.az", 
            "password": "LoginPass123!"
        }
        
        # Register user
        success, _ = self.run_test(
            "Pre-Login Registration",
            "POST",
            "auth/register", 
            200,
            data=register_data
        )
        
        if not success:
            return False
            
        # Now test login
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200, 
            data=login_data
        )
        
        return success and 'access_token' in response

    def test_facebook_login(self):
        """Test Facebook login (will fail with invalid token)"""
        facebook_data = {
            "access_token": "fake_facebook_token_for_testing"
        }
        
        # This should fail with 400 status
        success, response = self.run_test(
            "Facebook Login (Expected Failure)",
            "POST",
            "auth/facebook",
            400,  # Expecting failure
            data=facebook_data
        )
        
        return success  # Success means it properly rejected invalid token

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.token:
            self.log_test("Get Current User", False, "No token available")
            return False
            
        return self.run_test(
            "Get Current User",
            "GET",
            "auth/me", 
            200
        )[0]

    def test_get_templates(self):
        """Test getting templates"""
        return self.run_test(
            "Get Templates",
            "GET",
            "templates",
            200
        )[0]

    def test_get_templates_by_category(self):
        """Test getting templates by category"""
        return self.run_test(
            "Get Templates by Category",
            "GET", 
            "templates/toy",
            200
        )[0]

    def test_create_event(self):
        """Test creating an event"""
        if not self.token:
            self.log_test("Create Event", False, "No token available")
            return False, None
            
        event_data = {
            "name": "Test Toy Mərasimi",
            "date": "2024-12-25T18:00:00Z",
            "location": "Bakı, Azərbaycan",
            "map_link": "https://maps.google.com/test",
            "additional_notes": "Test tədbiri üçün əlavə qeydlər",
            "template_id": "template-toy-1"
        }
        
        success, response = self.run_test(
            "Create Event",
            "POST",
            "events",
            200,
            data=event_data
        )
        
        if success and 'id' in response:
            return True, response['id']
        return False, None

    def test_create_event_with_custom_design(self):
        """Test creating an event with custom design data"""
        if not self.token:
            self.log_test("Create Event with Custom Design", False, "No token available")
            return False, None
            
        # Create comprehensive custom design data that matches InvitationPage expectations
        custom_design = {
            "canvasSize": {
                "width": 400,
                "height": 600,
                "background": "#f8f9fa",
                "backgroundImage": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
            },
            "elements": [
                {
                    "id": "title-element",
                    "type": "text",
                    "content": "Toy Mərasimi",
                    "x": 50,
                    "y": 100,
                    "width": 300,
                    "height": 60,
                    "fontSize": 28,
                    "fontFamily": "Inter",
                    "color": "#2d3748",
                    "fontWeight": "bold",
                    "textAlign": "center",
                    "lineHeight": 1.4,
                    "letterSpacing": "normal"
                },
                {
                    "id": "date-element", 
                    "type": "text",
                    "content": "25 Dekabr 2024",
                    "x": 50,
                    "y": 200,
                    "width": 300,
                    "height": 40,
                    "fontSize": 18,
                    "fontFamily": "Inter",
                    "color": "#4a5568",
                    "fontWeight": "normal",
                    "textAlign": "center",
                    "lineHeight": 1.4,
                    "letterSpacing": "normal"
                },
                {
                    "id": "location-element",
                    "type": "text", 
                    "content": "Bakı, Azərbaycan",
                    "x": 50,
                    "y": 260,
                    "width": 300,
                    "height": 40,
                    "fontSize": 16,
                    "fontFamily": "Inter",
                    "color": "#718096",
                    "fontWeight": "normal",
                    "textAlign": "center",
                    "lineHeight": 1.4,
                    "letterSpacing": "normal"
                },
                {
                    "id": "decorative-image",
                    "type": "image",
                    "src": "https://images.unsplash.com/photo-1464207687429-7505649dae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                    "x": 150,
                    "y": 350,
                    "width": 100,
                    "height": 100,
                    "borderRadius": 50
                }
            ]
        }
        
        event_data = {
            "name": "Test Custom Design Toy Mərasimi",
            "date": "2024-12-25T18:00:00Z",
            "location": "Bakı, Azərbaycan",
            "map_link": "https://maps.google.com/test",
            "additional_notes": "Custom design test tədbiri",
            "template_id": "custom-template",
            "custom_design": custom_design
        }
        
        success, response = self.run_test(
            "Create Event with Custom Design",
            "POST",
            "events",
            200,
            data=event_data
        )
        
        if success and 'id' in response:
            # Verify custom_design was saved properly
            if 'custom_design' in response and response['custom_design']:
                print(f"   ✅ Custom design saved with {len(response['custom_design'].get('elements', []))} elements")
                return True, response['id']
            else:
                self.log_test("Create Event with Custom Design", False, "Custom design not saved in response")
                return False, None
        return False, None

    def test_get_user_events(self):
        """Test getting user events"""
        if not self.token:
            self.log_test("Get User Events", False, "No token available")
            return False
            
        return self.run_test(
            "Get User Events",
            "GET",
            "events",
            200
        )[0]

    def test_get_event_detail(self, event_id):
        """Test getting specific event details"""
        if not self.token or not event_id:
            self.log_test("Get Event Detail", False, "No token or event_id available")
            return False
            
        return self.run_test(
            "Get Event Detail",
            "GET",
            f"events/{event_id}",
            200
        )[0]

    def test_update_event(self, event_id):
        """Test updating an event"""
        if not self.token or not event_id:
            self.log_test("Update Event", False, "No token or event_id available")
            return False
            
        update_data = {
            "name": "Updated Test Toy Mərasimi",
            "date": "2024-12-26T19:00:00Z",
            "location": "Gəncə, Azərbaycan", 
            "additional_notes": "Yenilənmiş test tədbiri"
        }
        
        return self.run_test(
            "Update Event",
            "PUT",
            f"events/{event_id}",
            200,
            data=update_data
        )[0]

    def test_add_guest(self, event_id):
        """Test adding a guest to an event"""
        if not self.token or not event_id:
            self.log_test("Add Guest", False, "No token or event_id available")
            return False, None
            
        guest_data = {
            "name": "Test Qonaq",
            "phone": "+994501234567",
            "email": "testqonaq@example.com"
        }
        
        success, response = self.run_test(
            "Add Guest",
            "POST",
            f"events/{event_id}/guests",
            200,
            data=guest_data
        )
        
        if success and 'unique_token' in response:
            return True, response['unique_token']
        return False, None

    def test_get_event_guests(self, event_id):
        """Test getting event guests"""
        if not self.token or not event_id:
            self.log_test("Get Event Guests", False, "No token or event_id available")
            return False
            
        return self.run_test(
            "Get Event Guests",
            "GET",
            f"events/{event_id}/guests",
            200
        )[0]

    def test_public_invitation(self, guest_token):
        """Test public invitation endpoint"""
        if not guest_token:
            self.log_test("Public Invitation", False, "No guest token available")
            return False, None
            
        success, response = self.run_test(
            "Public Invitation",
            "GET",
            f"invite/{guest_token}",
            200
        )
        
        if success:
            return True, response
        return False, None

    def test_invitation_custom_design(self, guest_token):
        """Test invitation endpoint specifically for custom design data"""
        if not guest_token:
            self.log_test("Invitation Custom Design Test", False, "No guest token available")
            return False
            
        print(f"\n🎨 Testing Custom Design in Invitation...")
        print(f"   Guest Token: {guest_token}")
        
        success, response = self.run_test(
            "Invitation Custom Design Test",
            "GET",
            f"invite/{guest_token}",
            200
        )
        
        if not success:
            return False
            
        # Detailed validation of custom design structure
        try:
            event = response.get('event', {})
            custom_design = event.get('custom_design')
            
            print(f"   Event ID: {event.get('id', 'N/A')}")
            print(f"   Event Name: {event.get('name', 'N/A')}")
            
            if not custom_design:
                self.log_test("Custom Design Validation", False, "No custom_design field in event")
                return False
                
            print(f"   ✅ Custom design found in response")
            
            # Validate canvas size
            canvas_size = custom_design.get('canvasSize', {})
            if not canvas_size:
                self.log_test("Custom Design Canvas Validation", False, "No canvasSize in custom_design")
                return False
                
            print(f"   Canvas Size: {canvas_size.get('width')}x{canvas_size.get('height')}")
            print(f"   Background: {canvas_size.get('background', 'N/A')}")
            print(f"   Background Image: {canvas_size.get('backgroundImage', 'N/A')[:50]}...")
            
            # Validate elements
            elements = custom_design.get('elements', [])
            if not elements:
                self.log_test("Custom Design Elements Validation", False, "No elements in custom_design")
                return False
                
            print(f"   ✅ Found {len(elements)} design elements")
            
            # Validate each element structure
            for i, element in enumerate(elements):
                element_id = element.get('id', f'element-{i}')
                element_type = element.get('type', 'unknown')
                print(f"   Element {i+1}: {element_id} ({element_type})")
                
                # Check required fields based on InvitationPage expectations
                required_fields = ['id', 'type', 'x', 'y', 'width', 'height']
                missing_fields = [field for field in required_fields if field not in element]
                
                if missing_fields:
                    self.log_test("Custom Design Element Validation", False, 
                                f"Element {element_id} missing fields: {missing_fields}")
                    return False
                    
                if element_type == 'text':
                    text_fields = ['content', 'fontSize', 'color']
                    missing_text_fields = [field for field in text_fields if field not in element]
                    if missing_text_fields:
                        self.log_test("Custom Design Text Element Validation", False,
                                    f"Text element {element_id} missing fields: {missing_text_fields}")
                        return False
                    print(f"     Content: '{element.get('content', '')[:30]}...'")
                    print(f"     Font: {element.get('fontSize')}px {element.get('fontFamily', 'default')}")
                    
                elif element_type == 'image':
                    if 'src' not in element:
                        self.log_test("Custom Design Image Element Validation", False,
                                    f"Image element {element_id} missing src field")
                        return False
                    print(f"     Image: {element.get('src', '')[:50]}...")
            
            self.log_test("Custom Design Full Validation", True, 
                         f"Custom design validated: {len(elements)} elements, canvas {canvas_size.get('width')}x{canvas_size.get('height')}")
            return True
            
        except Exception as e:
            self.log_test("Custom Design Validation", False, f"Exception during validation: {str(e)}")
            return False

    def test_rsvp_response(self, guest_token):
        """Test RSVP response"""
        if not guest_token:
            self.log_test("RSVP Response", False, "No guest token available")
            return False
            
        rsvp_data = {
            "status": "gəlirəm"
        }
        
        return self.run_test(
            "RSVP Response",
            "POST",
            f"invite/{guest_token}/rsvp",
            200,
            data=rsvp_data
        )[0]

    def check_existing_custom_designs(self):
        """Check if there are existing events with custom_design data"""
        if not self.token:
            self.log_test("Check Existing Custom Designs", False, "No token available")
            return False
            
        print(f"\n🔍 Checking for existing events with custom_design...")
        
        success, response = self.run_test(
            "Get User Events for Custom Design Check",
            "GET",
            "events",
            200
        )
        
        if not success:
            return False
            
        events_with_custom_design = []
        total_events = len(response) if isinstance(response, list) else 0
        
        print(f"   Found {total_events} total events")
        
        if isinstance(response, list):
            for event in response:
                if event.get('custom_design'):
                    events_with_custom_design.append({
                        'id': event.get('id'),
                        'name': event.get('name'),
                        'has_elements': bool(event.get('custom_design', {}).get('elements')),
                        'element_count': len(event.get('custom_design', {}).get('elements', []))
                    })
        
        if events_with_custom_design:
            print(f"   ✅ Found {len(events_with_custom_design)} events with custom_design:")
            for event in events_with_custom_design:
                print(f"     - {event['name']} (ID: {event['id']}) - {event['element_count']} elements")
            self.log_test("Check Existing Custom Designs", True, 
                         f"Found {len(events_with_custom_design)} events with custom design")
        else:
            print(f"   ⚠️  No existing events with custom_design found")
            self.log_test("Check Existing Custom Designs", True, "No existing custom designs found")
        
        return True

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting Vivento API Tests...")
        print(f"   Base URL: {self.base_url}")
        
        # Basic connectivity
        self.test_root_endpoint()
        
        # Authentication tests
        if not self.test_register():
            print("❌ Registration failed - stopping auth-dependent tests")
            return self.get_results()
            
        self.test_login()
        self.test_facebook_login()
        self.test_get_current_user()
        
        # Template tests
        self.test_get_templates()
        self.test_get_templates_by_category()
        
        # Event management tests
        event_created, event_id = self.test_create_event()
        self.test_get_user_events()
        
        if event_created and event_id:
            self.test_get_event_detail(event_id)
            self.test_update_event(event_id)
            
            # Guest management tests
            guest_added, guest_token = self.test_add_guest(event_id)
            self.test_get_event_guests(event_id)
            
            # Public RSVP tests
            if guest_added and guest_token:
                invitation_success, invitation_data = self.test_public_invitation(guest_token)
                self.test_rsvp_response(guest_token)
        
        # Custom Design Tests - Create separate event with custom design
        print("\n🎨 Starting Custom Design Tests...")
        custom_event_created, custom_event_id = self.test_create_event_with_custom_design()
        
        if custom_event_created and custom_event_id:
            # Add guest to custom design event
            custom_guest_added, custom_guest_token = self.test_add_guest(custom_event_id)
            
            if custom_guest_added and custom_guest_token:
                # Test invitation with custom design
                self.test_invitation_custom_design(custom_guest_token)
        
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
        
        print(f"\n📊 Test Results Summary:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        return results

def main():
    tester = ViventoAPITester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open('/app/backend_test_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Results saved to /app/backend_test_results.json")
    
    # Return appropriate exit code
    return 0 if results["failed_tests"] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())