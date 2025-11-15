#!/usr/bin/env python3
"""
Backend API Testing for Pickup and Delivery Booking App
Tests all backend endpoints with realistic data
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BASE_URL = "https://quick-delivery-56.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_drivers = []
        self.created_bookings = []
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        })
        
    def test_admin_login(self):
        """Test admin login with correct and incorrect credentials"""
        print("\n=== Testing Admin Login API ===")
        
        # Test with correct credentials
        try:
            response = self.session.post(
                f"{BASE_URL}/admin/login",
                json={"username": "admin", "password": "admin123"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Login successful" and data.get("username") == "admin":
                    self.log_test("Admin Login - Valid Credentials", True, "Login successful with correct credentials", data)
                else:
                    self.log_test("Admin Login - Valid Credentials", False, f"Unexpected response format: {data}")
            else:
                self.log_test("Admin Login - Valid Credentials", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Admin Login - Valid Credentials", False, f"Request failed: {str(e)}")
        
        # Test with incorrect credentials
        try:
            response = self.session.post(
                f"{BASE_URL}/admin/login",
                json={"username": "admin", "password": "wrongpassword"},
                timeout=10
            )
            
            if response.status_code == 401:
                self.log_test("Admin Login - Invalid Credentials", True, "Correctly rejected invalid credentials")
            else:
                self.log_test("Admin Login - Invalid Credentials", False, f"Expected 401, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Admin Login - Invalid Credentials", False, f"Request failed: {str(e)}")
    
    def test_create_drivers(self):
        """Test driver creation"""
        print("\n=== Testing Driver Creation API ===")
        
        drivers_data = [
            {
                "name": "Rajesh Kumar",
                "phone": "9876543210",
                "vehicle_number": "DL01AB1234",
                "address": "Sector 15, Noida",
                "vehicle_type": "auto",
                "account_details": "HDFC Bank - 1234567890"
            },
            {
                "name": "Suresh Singh",
                "phone": "9876543211",
                "vehicle_number": "UP16CD5678",
                "address": "Gomti Nagar, Lucknow",
                "vehicle_type": "tempo",
                "account_details": "SBI Bank - 0987654321"
            }
        ]
        
        for i, driver_data in enumerate(drivers_data):
            try:
                response = self.session.post(
                    f"{BASE_URL}/drivers",
                    json=driver_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("id") and data.get("name") == driver_data["name"]:
                        self.created_drivers.append(data["id"])
                        self.log_test(f"Create Driver {i+1}", True, f"Driver {driver_data['name']} created successfully", {"driver_id": data["id"]})
                    else:
                        self.log_test(f"Create Driver {i+1}", False, f"Unexpected response format: {data}")
                else:
                    self.log_test(f"Create Driver {i+1}", False, f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test(f"Create Driver {i+1}", False, f"Request failed: {str(e)}")
    
    def test_get_drivers(self):
        """Test getting all drivers"""
        print("\n=== Testing Get All Drivers API ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/drivers", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    driver_count = len(data)
                    self.log_test("Get All Drivers", True, f"Retrieved {driver_count} drivers successfully", {"driver_count": driver_count})
                    
                    # Verify our created drivers are in the list
                    driver_ids = [driver.get("id") for driver in data]
                    for created_id in self.created_drivers:
                        if created_id in driver_ids:
                            self.log_test(f"Verify Driver {created_id}", True, "Created driver found in list")
                        else:
                            self.log_test(f"Verify Driver {created_id}", False, "Created driver not found in list")
                else:
                    self.log_test("Get All Drivers", False, f"Expected list, got: {type(data)}")
            else:
                self.log_test("Get All Drivers", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get All Drivers", False, f"Request failed: {str(e)}")
    
    def test_create_bookings(self):
        """Test booking creation"""
        print("\n=== Testing Booking Creation API ===")
        
        bookings_data = [
            {
                "pickup_address": "Connaught Place, New Delhi",
                "pickup_phone": "9123456789",
                "delivery_address": "India Gate, New Delhi",
                "delivery_phone": "9123456790",
                "goods_description": "Electronics package",
                "payment_method": "cash"
            },
            {
                "pickup_address": "Cyber City, Gurgaon",
                "pickup_phone": "9123456791",
                "delivery_address": "Sector 29, Gurgaon",
                "delivery_phone": "9123456792",
                "goods_description": "Documents",
                "payment_method": "upi"
            }
        ]
        
        for i, booking_data in enumerate(bookings_data):
            try:
                response = self.session.post(
                    f"{BASE_URL}/bookings",
                    json=booking_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("id") and data.get("status") == "pending":
                        self.created_bookings.append(data["id"])
                        self.log_test(f"Create Booking {i+1}", True, f"Booking created successfully with status pending", {"booking_id": data["id"]})
                    else:
                        self.log_test(f"Create Booking {i+1}", False, f"Unexpected response format: {data}")
                else:
                    self.log_test(f"Create Booking {i+1}", False, f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test(f"Create Booking {i+1}", False, f"Request failed: {str(e)}")
    
    def test_get_bookings(self):
        """Test getting all bookings"""
        print("\n=== Testing Get All Bookings API ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/bookings", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    booking_count = len(data)
                    self.log_test("Get All Bookings", True, f"Retrieved {booking_count} bookings successfully", {"booking_count": booking_count})
                    
                    # Verify our created bookings are in the list
                    booking_ids = [booking.get("id") for booking in data]
                    for created_id in self.created_bookings:
                        if created_id in booking_ids:
                            self.log_test(f"Verify Booking {created_id}", True, "Created booking found in list")
                        else:
                            self.log_test(f"Verify Booking {created_id}", False, "Created booking not found in list")
                else:
                    self.log_test("Get All Bookings", False, f"Expected list, got: {type(data)}")
            else:
                self.log_test("Get All Bookings", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get All Bookings", False, f"Request failed: {str(e)}")
    
    def test_assign_driver_to_booking(self):
        """Test assigning driver to booking"""
        print("\n=== Testing Assign Driver to Booking API ===")
        
        if not self.created_bookings or not self.created_drivers:
            self.log_test("Assign Driver to Booking", False, "No bookings or drivers available for assignment")
            return
        
        booking_id = self.created_bookings[0]
        driver_id = self.created_drivers[0]
        
        try:
            response = self.session.put(
                f"{BASE_URL}/bookings/{booking_id}/assign",
                json={"driver_id": driver_id},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Driver assigned successfully" and data.get("driver"):
                    self.log_test("Assign Driver to Booking", True, f"Driver assigned successfully to booking", {"booking_id": booking_id, "driver_id": driver_id})
                    
                    # Verify booking status changed to assigned
                    booking_response = self.session.get(f"{BASE_URL}/bookings", timeout=10)
                    if booking_response.status_code == 200:
                        bookings = booking_response.json()
                        assigned_booking = next((b for b in bookings if b.get("id") == booking_id), None)
                        if assigned_booking and assigned_booking.get("status") == "assigned":
                            self.log_test("Verify Booking Status Change", True, "Booking status changed to assigned")
                        else:
                            self.log_test("Verify Booking Status Change", False, f"Booking status not updated correctly: {assigned_booking.get('status') if assigned_booking else 'booking not found'}")
                else:
                    self.log_test("Assign Driver to Booking", False, f"Unexpected response format: {data}")
            else:
                self.log_test("Assign Driver to Booking", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Assign Driver to Booking", False, f"Request failed: {str(e)}")
    
    def test_update_booking_status(self):
        """Test updating booking status to completed"""
        print("\n=== Testing Update Booking Status API ===")
        
        if not self.created_bookings:
            self.log_test("Update Booking Status", False, "No bookings available for status update")
            return
        
        # Use the first booking (should be assigned from previous test)
        booking_id = self.created_bookings[0]
        
        try:
            response = self.session.put(
                f"{BASE_URL}/bookings/{booking_id}/status",
                json={"status": "completed"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Status updated successfully":
                    self.log_test("Update Booking Status", True, "Booking status updated to completed successfully")
                    
                    # Verify driver status changed back to available
                    driver_response = self.session.get(f"{BASE_URL}/drivers", timeout=10)
                    if driver_response.status_code == 200:
                        drivers = driver_response.json()
                        assigned_driver = next((d for d in drivers if d.get("id") == self.created_drivers[0]), None)
                        if assigned_driver and assigned_driver.get("status") == "available":
                            self.log_test("Verify Driver Status Change", True, "Driver status changed back to available")
                        else:
                            self.log_test("Verify Driver Status Change", False, f"Driver status not updated correctly: {assigned_driver.get('status') if assigned_driver else 'driver not found'}")
                else:
                    self.log_test("Update Booking Status", False, f"Unexpected response format: {data}")
            else:
                self.log_test("Update Booking Status", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Update Booking Status", False, f"Request failed: {str(e)}")
    
    def test_update_driver(self):
        """Test updating driver details"""
        print("\n=== Testing Update Driver API ===")
        
        if not self.created_drivers:
            self.log_test("Update Driver", False, "No drivers available for update")
            return
        
        driver_id = self.created_drivers[-1]  # Use last created driver
        updated_data = {
            "name": "Rajesh Kumar Updated",
            "phone": "9876543299",
            "vehicle_number": "DL01AB9999",
            "address": "Sector 20, Noida",
            "vehicle_type": "tempo",
            "account_details": "ICICI Bank - 9999999999"
        }
        
        try:
            response = self.session.put(
                f"{BASE_URL}/drivers/{driver_id}",
                json=updated_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("name") == updated_data["name"] and data.get("phone") == updated_data["phone"]:
                    self.log_test("Update Driver", True, "Driver details updated successfully")
                else:
                    self.log_test("Update Driver", False, f"Driver details not updated correctly: {data}")
            else:
                self.log_test("Update Driver", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Update Driver", False, f"Request failed: {str(e)}")
    
    def test_delete_driver(self):
        """Test deleting a driver"""
        print("\n=== Testing Delete Driver API ===")
        
        if len(self.created_drivers) < 2:
            self.log_test("Delete Driver", False, "Not enough drivers available for deletion test")
            return
        
        driver_id = self.created_drivers[-1]  # Delete last created driver
        
        try:
            response = self.session.delete(f"{BASE_URL}/drivers/{driver_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Driver deleted successfully":
                    self.log_test("Delete Driver", True, "Driver deleted successfully")
                    
                    # Verify driver is no longer in the list
                    drivers_response = self.session.get(f"{BASE_URL}/drivers", timeout=10)
                    if drivers_response.status_code == 200:
                        drivers = drivers_response.json()
                        driver_ids = [d.get("id") for d in drivers]
                        if driver_id not in driver_ids:
                            self.log_test("Verify Driver Deletion", True, "Driver successfully removed from list")
                        else:
                            self.log_test("Verify Driver Deletion", False, "Driver still exists in list after deletion")
                else:
                    self.log_test("Delete Driver", False, f"Unexpected response format: {data}")
            else:
                self.log_test("Delete Driver", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Delete Driver", False, f"Request failed: {str(e)}")
    
    def test_error_handling(self):
        """Test error handling for invalid IDs"""
        print("\n=== Testing Error Handling ===")
        
        # Test invalid booking ID
        try:
            response = self.session.put(
                f"{BASE_URL}/bookings/invalid_id/assign",
                json={"driver_id": "invalid_driver_id"},
                timeout=10
            )
            
            if response.status_code == 400:
                self.log_test("Invalid Booking ID Error", True, "Correctly handled invalid booking ID")
            else:
                self.log_test("Invalid Booking ID Error", False, f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Invalid Booking ID Error", False, f"Request failed: {str(e)}")
        
        # Test invalid driver ID
        try:
            response = self.session.delete(f"{BASE_URL}/drivers/invalid_id", timeout=10)
            
            if response.status_code == 400:
                self.log_test("Invalid Driver ID Error", True, "Correctly handled invalid driver ID")
            else:
                self.log_test("Invalid Driver ID Error", False, f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Invalid Driver ID Error", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Backend API Tests for: {BASE_URL}")
        print("=" * 60)
        
        # Run tests in sequence
        self.test_admin_login()
        self.test_create_drivers()
        self.test_get_drivers()
        self.test_create_bookings()
        self.test_get_bookings()
        self.test_assign_driver_to_booking()
        self.test_update_booking_status()
        self.test_update_driver()
        self.test_delete_driver()
        self.test_error_handling()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)