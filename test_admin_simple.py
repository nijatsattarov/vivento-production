#!/usr/bin/env python3
import requests
import json
import time

def test_admin_registration():
    """Test admin user registration with different passwords"""
    base_url = "https://card-preview-repair.preview.emergentagent.com"
    
    # Try different admin credentials
    admin_credentials = [
        {"email": "admin@vivento.az", "password": "admin123"},
        {"email": "admin@vivento.az", "password": "AdminPass123!"},
        {"email": "admin@vivento.az", "password": "password"},
        {"email": "admin@vivento.az", "password": "admin"},
    ]
    
    for i, creds in enumerate(admin_credentials):
        print(f"\n🔍 Attempt {i+1}: Testing admin login with password: {creds['password']}")
        
        response = requests.post(
            f"{base_url}/api/auth/login",
            json=creds,
            timeout=10
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data['access_token']
            print(f"   ✅ Admin login successful!")
            print(f"   User: {data['user']['name']} ({data['user']['email']})")
            
            # Test admin template creation
            template_data = {
                "id": f"test-admin-template-{int(time.time())}",
                "name": "Test Admin Template",
                "category": "toy",
                "thumbnail_url": "https://example.com/thumb.jpg",
                "design_data": {"test": "data"},
                "is_premium": False
            }
            
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            admin_response = requests.post(
                f"{base_url}/api/admin/templates",
                json=template_data,
                headers=headers,
                timeout=10
            )
            
            print(f"   Admin template creation status: {admin_response.status_code}")
            if admin_response.status_code == 200:
                print(f"   ✅ Admin functionality confirmed!")
                return True
            else:
                print(f"   ❌ Admin functionality failed: {admin_response.text}")
        else:
            print(f"   ❌ Login failed: {response.text}")
    
    # Try registering new admin
    print(f"\n🔍 Trying to register new admin user...")
    
    timestamp = int(time.time())
    admin_data = {
        "name": "Admin User",
        "email": f"admin{timestamp}@vivento.az",
        "password": "AdminPass123!"
    }
    
    response = requests.post(
        f"{base_url}/api/auth/register",
        json=admin_data,
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data['access_token']
        print(f"   ✅ New admin registered successfully!")
        
        # Test admin functionality
        template_data = {
            "id": f"new-admin-template-{timestamp}",
            "name": "New Admin Template",
            "category": "toy",
            "thumbnail_url": "https://example.com/thumb.jpg",
            "design_data": {"test": "data"},
            "is_premium": False
        }
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        admin_response = requests.post(
            f"{base_url}/api/admin/templates",
            json=template_data,
            headers=headers,
            timeout=10
        )
        
        print(f"   Admin template creation status: {admin_response.status_code}")
        if admin_response.status_code == 200:
            print(f"   ✅ New admin functionality confirmed!")
            return True
        else:
            print(f"   ❌ New admin functionality failed: {admin_response.text}")
    else:
        print(f"   ❌ New admin registration failed: {response.text}")
    
    return False

if __name__ == "__main__":
    test_admin_registration()