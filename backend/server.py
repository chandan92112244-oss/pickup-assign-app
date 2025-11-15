from fastapi import FastAPI, APIRouter, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Helper function to convert ObjectId to string
def str_object_id(obj):
    if isinstance(obj, dict):
        if '_id' in obj and isinstance(obj['_id'], ObjectId):
            obj['_id'] = str(obj['_id'])
    return obj

# ============== MODELS ==============

# Driver Models
class DriverCreate(BaseModel):
    name: str
    phone: str
    vehicle_number: str
    address: str
    vehicle_type: str
    account_details: str

class Driver(BaseModel):
    id: Optional[str] = None
    name: str
    phone: str
    vehicle_number: str
    address: str
    vehicle_type: str
    account_details: str
    status: str = "available"  # available, busy
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Booking Models
class BookingCreate(BaseModel):
    pickup_address: str
    pickup_phone: str
    delivery_address: str
    delivery_phone: str
    goods_description: Optional[str] = ""
    payment_method: str = "cash"  # cash, upi

class Booking(BaseModel):
    id: Optional[str] = None
    pickup_address: str
    pickup_phone: str
    delivery_address: str
    delivery_phone: str
    goods_description: Optional[str] = ""
    payment_method: str
    status: str = "pending"  # pending, assigned, completed, cancelled
    assigned_driver_id: Optional[str] = None
    assigned_driver_details: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AssignDriver(BaseModel):
    driver_id: str

# Admin Models
class AdminLogin(BaseModel):
    username: str
    password: str

class AdminCreate(BaseModel):
    username: str
    password: str

# ============== ADMIN ENDPOINTS ==============

@api_router.post("/admin/init")
async def initialize_admin(admin: AdminCreate):
    """Initialize admin account (only if no admin exists)"""
    existing_admin = await db.admins.find_one({"username": admin.username})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    # Hash password
    hashed_password = bcrypt.hashpw(admin.password.encode('utf-8'), bcrypt.gensalt())
    
    admin_doc = {
        "username": admin.username,
        "password_hash": hashed_password.decode('utf-8'),
        "created_at": datetime.utcnow()
    }
    
    await db.admins.insert_one(admin_doc)
    return {"message": "Admin created successfully"}

@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    """Admin login endpoint"""
    admin = await db.admins.find_one({"username": credentials.username})
    
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not bcrypt.checkpw(credentials.password.encode('utf-8'), admin['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"message": "Login successful", "username": credentials.username}

# ============== DRIVER ENDPOINTS ==============

@api_router.post("/drivers", response_model=Driver)
async def create_driver(driver: DriverCreate):
    """Add new driver"""
    driver_dict = driver.dict()
    driver_dict['status'] = 'available'
    driver_dict['created_at'] = datetime.utcnow()
    
    result = await db.drivers.insert_one(driver_dict)
    driver_dict['id'] = str(result.inserted_id)
    
    return Driver(**driver_dict)

@api_router.get("/drivers", response_model=List[Driver])
async def get_all_drivers():
    """Get all drivers"""
    drivers = await db.drivers.find().to_list(1000)
    
    for driver in drivers:
        driver['id'] = str(driver['_id'])
        del driver['_id']
    
    return [Driver(**driver) for driver in drivers]

@api_router.put("/drivers/{driver_id}", response_model=Driver)
async def update_driver(driver_id: str, driver: DriverCreate):
    """Update driver details"""
    try:
        obj_id = ObjectId(driver_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid driver ID")
    
    driver_dict = driver.dict()
    
    result = await db.drivers.update_one(
        {"_id": obj_id},
        {"$set": driver_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    updated_driver = await db.drivers.find_one({"_id": obj_id})
    updated_driver['id'] = str(updated_driver['_id'])
    del updated_driver['_id']
    
    return Driver(**updated_driver)

@api_router.delete("/drivers/{driver_id}")
async def delete_driver(driver_id: str):
    """Delete driver"""
    try:
        obj_id = ObjectId(driver_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid driver ID")
    
    result = await db.drivers.delete_one({"_id": obj_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    return {"message": "Driver deleted successfully"}

# ============== BOOKING ENDPOINTS ==============

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking: BookingCreate):
    """Create new booking"""
    booking_dict = booking.dict()
    booking_dict['status'] = 'pending'
    booking_dict['assigned_driver_id'] = None
    booking_dict['assigned_driver_details'] = None
    booking_dict['created_at'] = datetime.utcnow()
    
    result = await db.bookings.insert_one(booking_dict)
    booking_dict['id'] = str(result.inserted_id)
    
    return Booking(**booking_dict)

@api_router.get("/bookings", response_model=List[Booking])
async def get_all_bookings():
    """Get all bookings"""
    bookings = await db.bookings.find().sort('created_at', -1).to_list(1000)
    
    for booking in bookings:
        booking['id'] = str(booking['_id'])
        del booking['_id']
    
    return [Booking(**booking) for booking in bookings]

@api_router.put("/bookings/{booking_id}/assign")
async def assign_driver_to_booking(booking_id: str, assign: AssignDriver):
    """Assign driver to booking"""
    try:
        booking_obj_id = ObjectId(booking_id)
        driver_obj_id = ObjectId(assign.driver_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")
    
    # Get driver details
    driver = await db.drivers.find_one({"_id": driver_obj_id})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Prepare driver details
    driver_details = {
        "id": str(driver['_id']),
        "name": driver['name'],
        "phone": driver['phone'],
        "vehicle_number": driver['vehicle_number'],
        "vehicle_type": driver['vehicle_type']
    }
    
    # Update booking
    result = await db.bookings.update_one(
        {"_id": booking_obj_id},
        {
            "$set": {
                "assigned_driver_id": str(driver_obj_id),
                "assigned_driver_details": driver_details,
                "status": "assigned"
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Update driver status
    await db.drivers.update_one(
        {"_id": driver_obj_id},
        {"$set": {"status": "busy"}}
    )
    
    return {"message": "Driver assigned successfully", "driver": driver_details}

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status_update: dict):
    """Update booking status"""
    try:
        obj_id = ObjectId(booking_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid booking ID")
    
    new_status = status_update.get('status')
    if new_status not in ['pending', 'assigned', 'completed', 'cancelled']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # If completing or cancelling, free up the driver
    if new_status in ['completed', 'cancelled']:
        booking = await db.bookings.find_one({"_id": obj_id})
        if booking and booking.get('assigned_driver_id'):
            await db.drivers.update_one(
                {"_id": ObjectId(booking['assigned_driver_id'])},
                {"$set": {"status": "available"}}
            )
    
    result = await db.bookings.update_one(
        {"_id": obj_id},
        {"$set": {"status": new_status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": "Status updated successfully"}

@api_router.get("/")
async def root():
    return {"message": "Pickup Delivery API"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
