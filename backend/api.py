# backend/api.py

import os
import uuid
from datetime import timedelta, datetime

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from jose import JWTError, jwt

# Import our custom modules
import db
import face_utils

# --- Configuration & Setup ---
SECRET_KEY = "a_very_secret_key_that_you_should_definitely_change"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Increased for easier development
PHOTOS_DIR = "photos"

# Ensure the photos directory exists on startup
os.makedirs(PHOTOS_DIR, exist_ok=True)

# OAuth2 scheme points to the login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# Initialize the FastAPI app
app = FastAPI(title="Missing Person Finder API")

# --- CORS Middleware ---
# Allows our React frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Static File Serving ---
# This makes images in the 'photos' folder accessible via a URL
app.mount("/photos", StaticFiles(directory=PHOTOS_DIR), name="photos")

# --- Pydantic Models (Data Validation) ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class UserCreate(BaseModel):
    username: str
    password: str

# --- JWT & Authentication Dependencies ---
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None or role is None:
            raise credentials_exception
        user_id = db.get_user_id(username)
        if user_id is None:
            raise credentials_exception
        return {"id": user_id, "username": username, "role": role}
    except JWTError:
        raise credentials_exception

async def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return current_user

# --- API Endpoints ---

@app.post("/api/register")
async def register_user(user: UserCreate):
    """Endpoint for regular users to create a new account."""
    if db.get_user_id(user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = db.pwd_context.hash(user.password)
    db.create_user(user.username, hashed_password, role='user')
    return {"message": "User created successfully"}

@app.post("/api/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Endpoint for both users and admins to log in."""
    user_id = db.verify_user_hashed(form_data.username, form_data.password)
    if not user_id:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    user_role = db.get_user_role(form_data.username)
    if not user_role:
        raise HTTPException(status_code=404, detail="User role not found.")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username, "role": user_role},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user_role}

@app.post("/api/person/register")
async def register_person(
    photo: UploadFile = File(...),
    name: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    loc: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Endpoint for logged-in users to register a new missing person case."""
    try:
        image_bytes = await photo.read()
        embedding = face_utils.get_embedding(image_bytes)
        
        file_extension = os.path.splitext(photo.filename)[1]
        photo_filename = f"{uuid.uuid4()}{file_extension}"
        photo_path = os.path.join(PHOTOS_DIR, photo_filename)
        
        with open(photo_path, "wb") as f:
            f.write(image_bytes)
            
        person_data = {"name": name, "age": age, "gender": gender, "loc": loc, "photo_path": photo_path}
        db.add_person(person_data, embedding, current_user['id'])
        
        return {"message": "Person registered successfully", "filename": photo_filename}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.post("/api/person/search")
async def search_by_photo(
    photo: UploadFile = File(...),
    strictness: float = Form(0.4),
    admin: dict = Depends(get_current_admin_user) # Secured for admins only
):
    """Admin-only endpoint to search for a person by photo."""
    try:
        query_bytes = await photo.read()
        q_emb = face_utils.get_embedding(query_bytes)
        matches = db.find_matches(q_emb, strictness)
        base_url = "http://localhost:8000"
        for match in matches:
            photo_path = match.get('photo_path')
            if photo_path and isinstance(photo_path, str):
                clean_path = photo_path.replace('\\', '/').lstrip('photos/')
                match['photo_url'] = f"{base_url}/photos/{clean_path}"
        return {"matches": matches}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")

@app.get("/api/person/my-cases")
async def get_my_cases(current_user: dict = Depends(get_current_user)):
    """Endpoint for a regular user to see their own submitted cases."""
    try:
        cases = db.get_user_cases(current_user['id'])
        base_url = "http://localhost:8000"
        for case in cases:
            photo_path = case.get('photo_path')
            if photo_path and isinstance(photo_path, str):
                clean_path = photo_path.replace('\\', '/').lstrip('photos/')
                case['photo_url'] = f"{base_url}/photos/{clean_path}"
        return {"cases": cases}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve cases: {e}")

@app.post("/api/person/{person_id}/mark-found")
async def mark_case_as_found(person_id: int, admin: dict = Depends(get_current_admin_user)):
    """Admin-only endpoint to mark a case as found."""
    success = db.mark_person_as_found(person_id)
    if not success:
        raise HTTPException(status_code=404, detail="Person not found in active cases.")
    return {"message": "Case marked as found successfully."}

@app.get("/api/person/found-cases")
async def get_all_found_cases(admin: dict = Depends(get_current_admin_user)):
    """Admin-only endpoint to view all resolved/found cases."""
    try:
        cases = db.get_found_cases()
        base_url = "http://localhost:8000"
        for case in cases:
            photo_path = case.get('photo_path')
            if photo_path and isinstance(photo_path, str):
                clean_path = photo_path.replace('\\', '/').lstrip('photos/')
                case['photo_url'] = f"{base_url}/photos/{clean_path}"
        return {"cases": cases}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve found cases: {e}")
    


@app.get("/api/person/all-active-cases")
async def get_all_cases(admin: dict = Depends(get_current_admin_user)):
    """Admin-only endpoint to view all active cases from all users."""
    try:
        cases = db.get_all_active_cases()
        base_url = "http://localhost:8000"
        for case in cases:
            photo_path = case.get('photo_path')
            if photo_path and isinstance(photo_path, str):
                clean_path = photo_path.replace('\\', '/').lstrip('photos/')
                case['photo_url'] = f"{base_url}/photos/{clean_path}"
        return {"cases": cases}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve all cases: {e}")
    


@app.post("/api/person/{person_id}/mark-found")
async def mark_case_as_found(person_id: int, admin: dict = Depends(get_current_admin_user)):
    try:
        # --- Notification Logic ---
        # Get the case details *before* moving/deleting it.
        case_creator_id = db.get_case_creator(person_id)
        case_name = db.get_case_name(person_id)

        # --- Database Action ---
        success = db.mark_person_as_found(person_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Person not found in active cases.")
        
        # --- Create Notification on Success ---
        # This part will now run correctly.
        if case_creator_id and case_name:
            message = f"Update: Your registered case for '{case_name}' has been marked as found by an administrator."
            db.create_notification(case_creator_id, message)
        
        return {"message": "Case marked as found and user notified."}

    except Exception as e:
        # This will catch any unexpected errors and report them properly
        print(f"ERROR in mark_case_as_found: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred while marking case as found.")
# ADD these THREE NEW endpoints to api.py

@app.get("/api/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Fetches all notifications for the logged-in user."""
    notifications = db.get_unread_notifications(current_user['id'])
    return {"notifications": notifications}

@app.post("/api/notifications/{notification_id}/read")
async def mark_as_read(notification_id: int, current_user: dict = Depends(get_current_user)):
    """Marks a specific notification as read."""
    success = db.mark_notification_as_read(notification_id, current_user['id'])
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found or access denied.")
    return {"message": "Notification marked as read."}