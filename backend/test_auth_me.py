import requests
import os

BASE_URL = "http://localhost:5000/api/auth"

def test_auth_flow():
    # 1. Login
    login_data = {
        "email": "admin@tourism.com",
        "password": "Admin@123456"
    }
    print(f"Attempting login with {login_data['email']}...")
    try:
        response = requests.post(f"{BASE_URL}/login", json=login_data)
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} - {response.text}")
            return
        
        data = response.json()
        access_token = data.get("access_token")
        print("Login successful. Received access token.")

        # 2. Call /me
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        print("Calling /me endpoint...")
        me_response = requests.get(f"{BASE_URL}/me", headers=headers)
        
        if me_response.status_code == 200:
            print("SUCCESS: /me returned 200 OK")
            print(f"User Data: {me_response.json()}")
        else:
            print(f"FAILED: /me returned {me_response.status_code}")
            print(f"Error: {me_response.text}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_auth_flow()
