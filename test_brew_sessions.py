#!/usr/bin/env python3
"""Test script to verify brew session endpoints work correctly."""

import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_get_batch_brew_sessions():
    """Test getting brew sessions for a batch."""
    # Assuming batch ID 1 exists in test data
    response = requests.get(f"{BASE_URL}/batches/1/brew_sessions")
    
    if response.status_code == 200:
        sessions = response.json()
        print(f"✓ Successfully retrieved {len(sessions)} brew sessions for batch 1")
        
        # Check if sessions have the expected fields
        if sessions:
            session = sessions[0]
            expected_fields = ['grinder', 'filter', 'kettle', 'scale', 'brew_method', 'recipe']
            for field in expected_fields:
                if field in session:
                    print(f"  ✓ Field '{field}' is present with value: {session.get(field)}")
                else:
                    print(f"  ✗ Field '{field}' is missing")
    else:
        print(f"✗ Failed to get brew sessions: {response.status_code}")
        print(f"  Error: {response.text}")

def test_get_all_brew_sessions():
    """Test getting all brew sessions."""
    response = requests.get(f"{BASE_URL}/brew_sessions")
    
    if response.status_code == 200:
        sessions = response.json()
        print(f"\n✓ Successfully retrieved {len(sessions)} total brew sessions")
        
        # Check if sessions have the expected fields
        if sessions:
            session = sessions[0]
            expected_fields = ['grinder', 'filter', 'kettle', 'scale', 'brew_method', 'recipe']
            for field in expected_fields:
                if field in session:
                    print(f"  ✓ Field '{field}' is present with value: {session.get(field)}")
                else:
                    print(f"  ✗ Field '{field}' is missing")
    else:
        print(f"\n✗ Failed to get all brew sessions: {response.status_code}")
        print(f"  Error: {response.text}")

if __name__ == "__main__":
    print("Testing brew session endpoints...")
    print("Make sure the Flask server is running on localhost:5000")
    print("-" * 50)
    
    try:
        test_get_batch_brew_sessions()
        test_get_all_brew_sessions()
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to the server. Make sure the Flask app is running.")