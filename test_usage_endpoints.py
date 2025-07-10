#!/usr/bin/env python3
"""
Test script to verify usage endpoint functionality.
Run this script to test if usage checking works correctly.
"""

import sys
import os
import requests
import json

# Add the src directory to the path so we can import the application
sys.path.insert(0, 'src')

# Set up environment
os.environ['PYTHONPATH'] = 'src'
os.environ['DATA_DIR'] = 'test_usage_data'

# Test configuration
API_BASE_URL = "http://localhost:5000/api"
TEST_DATA_DIR = "test_usage_data"

def create_test_data():
    """Create test data for usage checking."""
    print("Creating test data...")
    
    # Create test data directory
    os.makedirs(TEST_DATA_DIR, exist_ok=True)
    
    # Create test bean type
    bean_type_data = {"name": "Test Arabica", "description": "Test bean type for usage checking"}
    response = requests.post(f"{API_BASE_URL}/bean_types", json=bean_type_data)
    if response.status_code != 201:
        print(f"Failed to create bean type: {response.status_code} - {response.text}")
        return None
    bean_type = response.json()
    print(f"Created bean type: {bean_type}")
    
    # Create test roaster
    roaster_data = {"name": "Test Roaster", "description": "Test roaster"}
    response = requests.post(f"{API_BASE_URL}/roasters", json=roaster_data)
    if response.status_code != 201:
        print(f"Failed to create roaster: {response.status_code} - {response.text}")
        return None
    roaster = response.json()
    print(f"Created roaster: {roaster}")
    
    # Create test product using the bean type
    product_data = {
        "product_name": "Test Coffee Product",
        "roaster": roaster["name"],
        "bean_type": [bean_type["name"]],  # Array format as used in the app
        "country": ["Ethiopia"],
        "description": "Test product for usage checking"
    }
    response = requests.post(f"{API_BASE_URL}/products", json=product_data)
    if response.status_code != 201:
        print(f"Failed to create product: {response.status_code} - {response.text}")
        return None
    product = response.json()
    print(f"Created product: {product}")
    
    return {
        "bean_type": bean_type,
        "roaster": roaster,
        "product": product
    }

def test_usage_checking(test_data):
    """Test the usage checking endpoints."""
    print("\nTesting usage checking...")
    
    bean_type = test_data["bean_type"]
    
    # Test usage endpoint
    response = requests.get(f"{API_BASE_URL}/bean_types/{bean_type['id']}/usage")
    if response.status_code != 200:
        print(f"Usage check failed: {response.status_code} - {response.text}")
        return False
    
    usage_info = response.json()
    print(f"Usage info: {usage_info}")
    
    # Verify the bean type is reported as in use
    if not usage_info.get('in_use'):
        print("ERROR: Bean type should be reported as in use!")
        return False
    
    if usage_info.get('usage_count') != 1:
        print(f"ERROR: Expected usage count 1, got {usage_info.get('usage_count')}")
        return False
    
    if usage_info.get('usage_type') != 'products':
        print(f"ERROR: Expected usage type 'products', got {usage_info.get('usage_type')}")
        return False
    
    print("✅ Usage checking works correctly!")
    return True

def test_reference_updating(test_data):
    """Test the reference updating functionality."""
    print("\nTesting reference updating...")
    
    bean_type = test_data["bean_type"]
    
    # Create a replacement bean type
    replacement_data = {"name": "Replacement Arabica", "description": "Replacement for testing"}
    response = requests.post(f"{API_BASE_URL}/bean_types", json=replacement_data)
    if response.status_code != 201:
        print(f"Failed to create replacement bean type: {response.status_code} - {response.text}")
        return False
    replacement = response.json()
    print(f"Created replacement bean type: {replacement}")
    
    # Test replacing references
    update_data = {
        "action": "replace",
        "replacement_id": replacement["id"]
    }
    response = requests.post(f"{API_BASE_URL}/bean_types/{bean_type['id']}/update_references", json=update_data)
    if response.status_code != 200:
        print(f"Reference update failed: {response.status_code} - {response.text}")
        return False
    
    update_result = response.json()
    print(f"Update result: {update_result}")
    
    if update_result.get('updated_count') != 1:
        print(f"ERROR: Expected to update 1 product, got {update_result.get('updated_count')}")
        return False
    
    # Verify the original bean type is no longer in use
    response = requests.get(f"{API_BASE_URL}/bean_types/{bean_type['id']}/usage")
    if response.status_code == 200:
        usage_info = response.json()
        if usage_info.get('in_use'):
            print("ERROR: Original bean type should no longer be in use after replacement!")
            return False
    
    # Verify the replacement bean type is now in use
    response = requests.get(f"{API_BASE_URL}/bean_types/{replacement['id']}/usage")
    if response.status_code == 200:
        usage_info = response.json()
        if not usage_info.get('in_use'):
            print("ERROR: Replacement bean type should be in use!")
            return False
    
    print("✅ Reference updating works correctly!")
    return True

def cleanup_test_data():
    """Clean up test data."""
    print("\nCleaning up test data...")
    import shutil
    if os.path.exists(TEST_DATA_DIR):
        shutil.rmtree(TEST_DATA_DIR)
    print("Test data cleaned up.")

def main():
    """Main test function."""
    print("Starting usage endpoint tests...")
    print("Make sure the Flask server is running on localhost:5000")
    
    try:
        # Test if server is running
        response = requests.get(f"{API_BASE_URL}/bean_types")
        if response.status_code != 200:
            print(f"Server not responding: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("ERROR: Cannot connect to Flask server. Make sure it's running on localhost:5000")
        print("Run: PYTHONPATH=src DATA_DIR=test_usage_data uv run python3 -m coffeejournal.wsgi")
        return False
    
    try:
        # Create test data
        test_data = create_test_data()
        if not test_data:
            print("Failed to create test data")
            return False
        
        # Test usage checking
        if not test_usage_checking(test_data):
            return False
        
        # Test reference updating
        if not test_reference_updating(test_data):
            return False
        
        print("\n🎉 All tests passed!")
        return True
    
    except Exception as e:
        print(f"Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        cleanup_test_data()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)