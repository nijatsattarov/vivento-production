#!/usr/bin/env python3
import requests
import tempfile
import os
from PIL import Image
import io

class FileUploadTester:
    def __init__(self, base_url="https://epoint-payment.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        
    def authenticate(self):
        """Get authentication token"""
        register_data = {
            "name": "File Upload Test User",
            "email": "filetest@vivento.az",
            "password": "TestPass123!"
        }
        
        response = requests.post(
            f"{self.base_url}/api/auth/register",
            json=register_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['access_token']
            print(f"✅ Authentication successful")
            return True
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            return False
    
    def create_test_image(self, width=200, height=200, format='JPEG'):
        """Create a test image in memory"""
        img = Image.new('RGB', (width, height), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format=format)
        img_bytes.seek(0)
        return img_bytes
    
    def test_image_upload(self):
        """Test /api/upload/image endpoint"""
        print("\n🔍 Testing Image Upload Endpoint...")
        
        if not self.token:
            print("❌ No authentication token")
            return False
            
        # Create test image
        test_image = self.create_test_image()
        
        files = {
            'file': ('test_image.jpg', test_image, 'image/jpeg')
        }
        
        headers = {
            'Authorization': f'Bearer {self.token}'
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/upload/image",
                files=files,
                headers=headers,
                timeout=30
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Image upload successful")
                print(f"   Filename: {data.get('filename')}")
                print(f"   URL: {data.get('url')}")
                print(f"   Message: {data.get('message')}")
                return True
            else:
                print(f"   ❌ Image upload failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception during image upload: {str(e)}")
            return False
    
    def test_background_upload(self):
        """Test /api/upload/background endpoint"""
        print("\n🔍 Testing Background Upload Endpoint...")
        
        # Create larger test image for background
        test_image = self.create_test_image(800, 600)
        
        files = {
            'file': ('test_background.jpg', test_image, 'image/jpeg')
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/upload/background",
                files=files,
                timeout=30
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Background upload successful")
                print(f"   Filename: {data.get('filename')}")
                print(f"   URL: {data.get('url')}")
                print(f"   Message: {data.get('message')}")
                return True
            else:
                print(f"   ❌ Background upload failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception during background upload: {str(e)}")
            return False
    
    def test_invalid_file_upload(self):
        """Test upload with invalid file type"""
        print("\n🔍 Testing Invalid File Upload...")
        
        if not self.token:
            print("❌ No authentication token")
            return False
        
        # Create text file instead of image
        text_content = b"This is not an image file"
        
        files = {
            'file': ('test.txt', io.BytesIO(text_content), 'text/plain')
        }
        
        headers = {
            'Authorization': f'Bearer {self.token}'
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/upload/image",
                files=files,
                headers=headers,
                timeout=30
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 400:
                print(f"   ✅ Invalid file properly rejected")
                print(f"   Error: {response.json().get('detail', 'No detail')}")
                return True
            else:
                print(f"   ❌ Invalid file not properly rejected: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception during invalid file test: {str(e)}")
            return False
    
    def test_demo_invitation_endpoint(self):
        """Test demo invitation endpoint"""
        print("\n🔍 Testing Demo Invitation Endpoint...")
        
        # First create an event to test demo invitation
        if not self.token:
            print("❌ No authentication token")
            return False
            
        event_data = {
            "name": "Demo Test Event",
            "date": "2024-12-25T18:00:00Z",
            "location": "Test Location",
            "custom_design": {
                "canvasSize": {"width": 400, "height": 600},
                "elements": [
                    {
                        "id": "test-element",
                        "type": "text",
                        "content": "Demo Test",
                        "x": 50, "y": 100, "width": 300, "height": 50,
                        "fontSize": 24, "color": "#000000"
                    }
                ]
            }
        }
        
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        try:
            # Create event
            response = requests.post(
                f"{self.base_url}/api/events",
                json=event_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"   ❌ Failed to create test event: {response.status_code}")
                return False
                
            event = response.json()
            event_id = event['id']
            print(f"   Created test event: {event_id}")
            
            # Test demo invitation
            demo_token = f"demo-{event_id}"
            response = requests.get(
                f"{self.base_url}/api/invite/{demo_token}",
                timeout=10
            )
            
            print(f"   Demo invitation status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Demo invitation working")
                print(f"   Guest name: {data.get('guest', {}).get('name')}")
                print(f"   Event name: {data.get('event', {}).get('name')}")
                return True
            else:
                print(f"   ❌ Demo invitation failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Exception during demo invitation test: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all file upload tests"""
        print("🚀 Starting File Upload Tests...")
        print(f"   Base URL: {self.base_url}")
        
        results = {
            "authentication": False,
            "image_upload": False,
            "background_upload": False,
            "invalid_file_rejection": False,
            "demo_invitation": False
        }
        
        # Authenticate first
        results["authentication"] = self.authenticate()
        
        if results["authentication"]:
            results["image_upload"] = self.test_image_upload()
            results["invalid_file_rejection"] = self.test_invalid_file_upload()
        
        results["background_upload"] = self.test_background_upload()
        results["demo_invitation"] = self.test_demo_invitation_endpoint()
        
        # Summary
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        print(f"\n📊 File Upload Test Results:")
        print(f"   Total Tests: {total}")
        print(f"   Passed: {passed}")
        print(f"   Failed: {total - passed}")
        print(f"   Success Rate: {passed/total*100:.1f}%")
        
        for test_name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"   {test_name}: {status}")
        
        return results

if __name__ == "__main__":
    tester = FileUploadTester()
    results = tester.run_all_tests()