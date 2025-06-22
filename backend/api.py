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
from passlib.context import CryptContext

import db
import face_utils

# --- Configuration & Setup ---
SECRET_KEY = "a_very_secret_key_change_this"  # Change this to a real secret key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
PHOTOS_DIR = "photos"

# Ensure the photos directory exists
os.makedirs(PHOTOS_DIR, exist_ok=True)

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# OAuth2 Scheme for token dependency
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") # Note: We use /api/login, not /token

app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Serve Static Photos ---
# This makes images in the 'photos' folder accessible via URL like http://.../photos/image.jpg
app.mount("/photos", StaticFiles(directory=PHOTOS_DIR), name="photos")

# --- Pydantic Models (Data Shapes) ---
class Token(BaseModel):
    access_token: str
    token_type: str

class User(BaseModel):
    username: str

class UserCreate(User):
    password: str

# --- JWT & Authentication Helpers ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

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
        if username is None:
            raise credentials_exception
        user_id = db.get_user_id(username) # You'll need to create this function in db.py
        if user_id is None:
            raise credentials_exception
        return {"id": user_id, "username": username}
    except JWTError:
        raise credentials_exception

# --- API Endpoints ---

@app.post("/api/register", response_model=User)
async def register_user(user: UserCreate):
    db_user = db.get_user_id(user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    db.create_user(user.username, hashed_password) # Modify db.py to take hashed pw
    return {"username": user.username}

@app.post("/api/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user_id = db.verify_user_hashed(form_data.username, form_data.password) # New verify function needed
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/person/register")
async def register_person(
    photo: UploadFile = File(...),
    name: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    loc: str = Form(...),
    # ... add all other form fields from your streamlit app
    current_user: dict = Depends(get_current_user)
):
    try:
        image_bytes = await photo.read()
        embedding = face_utils.get_embedding(image_bytes)
        
        # Save photo with a unique name
        file_extension = os.path.splitext(photo.filename)[1]
        photo_filename = f"{uuid.uuid4()}{file_extension}"
        photo_path = os.path.join(PHOTOS_DIR, photo_filename)
        
        with open(photo_path, "wb") as f:
            f.write(image_bytes)
            
        # Create data dict and add to DB
        person_data = { "name": name, "age": age, "gender": gender, "loc": loc, "photo_path": photo_path } # add other fields
        db.add_person(person_data, embedding, current_user['id'])
        
        return {"message": "Person registered successfully", "filename": photo_filename}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# In backend/api.py

@app.post("/api/person/search")
async def search_by_photo(
    photo: UploadFile = File(...),
    strictness: float = Form(0.4),
    # current_user: dict = Depends(get_current_user) # Temporarily commented out for easier debugging
):
    try:
        query_bytes = await photo.read()
        q_emb = face_utils.get_embedding(query_bytes)
        matches = db.find_matches(q_emb, strictness)
        
        # --- ROBUST URL CONSTRUCTION ---
        base_url = "http://localhost:8000"
        for match in matches:
            photo_path = match.get('photo_path') # Use .get() for safety
            if photo_path and isinstance(photo_path, str):
                # Ensure path uses forward slashes for URLs
                clean_path = photo_path.replace('\\', '/')
                # Remove 'photos/' prefix if it exists, as the static mount handles it
                if clean_path.startswith('photos/'):
                    clean_path = clean_path[len('photos/'):]

                match['photo_url'] = f"{base_url}/photos/{clean_path}"
            else:
                # Provide a placeholder if the path is missing
                match['photo_url'] = None
        
        # --- END OF ROBUST URL CONSTRUCTION ---

        return {"matches": matches}
    except ValueError as e:
        # This catches "No face detected"
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # This catches any other unexpected error and returns a proper JSON response
        print(f"An unexpected error occurred in search: {e}") # Log it for debugging
        raise HTTPException(status_code=500, detail="An internal server error occurred during search.")
    


@app.get("/api/person/my-cases")
async def get_my_cases(current_user: dict = Depends(get_current_user)):
    """
    Fetches all cases registered by the currently authenticated user.
    """
    try:
        user_id = current_user['id']
        cases = db.get_user_cases(user_id) # We will create this function in db.py

        # --- Construct full photo_url for each case ---
        base_url = "http://localhost:8000"
        for case in cases:
            photo_path = case.get('photo_path')
            if photo_path and isinstance(photo_path, str):
                clean_path = photo_path.replace('\\', '/')
                if clean_path.startswith('photos/'):
                    clean_path = clean_path[len('photos/'):]
                case['photo_url'] = f"{base_url}/photos/{clean_path}"
            else:
                case['photo_url'] = None
        
        return {"cases": cases}
    except Exception as e:
        print(f"Error in get_my_cases: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user cases.")
    

@app.post("/api/person/{person_id}/mark-found")
async def mark_case_as_found(person_id: int, current_user: dict = Depends(get_current_user)):
    success = db.mark_person_as_found(person_id)
    if not success:
        raise HTTPException(status_code=404, detail="Person not found in active cases.")
    return {"message": "Case marked as found successfully."}

@app.get("/api/person/found-cases")
async def get_all_found_cases(current_user: dict = Depends(get_current_user)):
    try:
        cases = db.get_found_cases()
        base_url = "http://localhost:8000"
        for case in cases:
            photo_path = case.get('photo_path')
            if photo_path and isinstance(photo_path, str):
                clean_path = photo_path.replace('\\', '/')
                if clean_path.startswith('photos/'):
                    clean_path = clean_path[len('photos/'):]
                case['photo_url'] = f"{base_url}/photos/{clean_path}"
        return {"cases": cases}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve found cases.")