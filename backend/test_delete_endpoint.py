import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_URL = "http://localhost:8000"
# This script assumes you have a way to get a token or are running in dev mode with mock tokens
# For local testing, we can use the dev mock token if configured

def test_bulk_delete():
    # Note: Requires a valid session/token if not in dev mock mode
    # Assuming we can test the logic via the router directly if needed, 
    # but here we'll just check if the endpoint exists and responds to OPTIONS
    try:
        response = requests.options(f"{API_URL}/timetable/bulk")
        print(f"OPTIONS /timetable/bulk: {response.status_code}")
        
        # Test DELETE schema/endpoint existence
        # We won't actually delete unless we have a token
        print("Backend check completed (Connectivity/Existence)")
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_bulk_delete()
