# backend/db.py

from __future__ import annotations

import sqlite3
from typing import List, Dict, Any

import numpy as np
from passlib.context import CryptContext

# Import the cosine function from your face_utils
from face_utils import cosine

DB_PATH = "missing.db"

# --- Password Hashing Setup (matches api.py) ---
# We define it here as well for the verification function
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Helper to convert DB rows to dictionaries ---
def dict_factory(cursor, row):
    """Converts a database row into a dictionary."""
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

# --- Schema Setup (No changes needed here) ---
def create_tables():
    """Create base tables if they don't exist."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    # Users table
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            username  TEXT UNIQUE NOT NULL,
            password  TEXT NOT NULL
        );
        """
    )
    # Persons table
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS persons (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT,
            age         INTEGER,
            gender      TEXT,
            loc         TEXT,
            date        TEXT,
            notes       TEXT,
            photo_path  TEXT,
            embedding   BLOB,
            created_by  INTEGER,
            FOREIGN KEY (created_by) REFERENCES users(id)
        );
        """
    )
    # Note: The lightweight migration for optional columns from the original file is omitted for simplicity
    # but could be added back if needed.
    conn.commit()
    conn.close()

# --- User Management (Updated for API) ---

def create_user(username: str, hashed_password: str) -> None:
    """Creates a new user with a pre-hashed password."""
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            (username, hashed_password)
        )
        conn.commit()
    finally:
        conn.close()

def get_user_id(username: str) -> int | None:
    """Returns the user ID for a given username, or None if not found."""
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute("SELECT id FROM users WHERE username=?", (username,)).fetchone()
    conn.close()
    return row[0] if row else None

def verify_user_hashed(username: str, plain_password: str) -> int | None:
    """
    Verifies a user by checking the plain password against the stored hash.
    Returns user_id on success, None on failure.
    """
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute("SELECT id, password FROM users WHERE username=?", (username,)).fetchone()
    conn.close()
    if not row:
        return None # User not found
    
    user_id, stored_hashed_password = row
    if pwd_context.verify(plain_password, stored_hashed_password):
        return user_id
    return None

# --- Missing Person Records (Updated for API) ---

def add_person(data: dict, embedding: np.ndarray, user_id: int) -> None:
    """Insert a new missing-person record."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        INSERT INTO persons (name, age, gender, loc, photo_path, embedding, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            data.get("name"),
            data.get("age"),
            data.get("gender"),
            data.get("loc"),
            data.get("photo_path"),
            embedding.astype(np.float32).tobytes(),
            user_id,
        ),
    )
    conn.commit()
    conn.close()

def find_matches(query_embedding: np.ndarray, strictness: float) -> List[Dict[str, Any]]:
    """
    Finds all persons in the database matching the query embedding.
    Returns a list of dictionaries (API-friendly).
    """
    conn = sqlite3.connect(DB_PATH)
    # Use the dict_factory to get results as dictionaries
    conn.row_factory = dict_factory
    
    # Fetch all records to compare against
    all_persons_rows = conn.execute(
        "SELECT id, name, age, gender, loc, photo_path, embedding FROM persons"
    ).fetchall()
    conn.close()

    matches = []
    for person in all_persons_rows:
        # Convert the embedding from a blob back to a numpy array
        db_embedding = np.frombuffer(person['embedding'], dtype=np.float32)
        
        # Calculate similarity
        similarity = cosine(query_embedding, db_embedding)
        
        if similarity >= strictness:
            # Don't include the raw embedding in the API response
            del person['embedding']
            person['similarity'] = round(similarity, 4) # Add similarity score
            matches.append(person)
    
    # Sort matches by the highest similarity
    matches.sort(key=lambda x: x['similarity'], reverse=True)
    
    return matches

def get_user_cases(user_id: int) -> List[Dict[str, Any]]:
    """
    Return all active cases for the given user as a list of dictionaries.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = dict_factory # Use our dictionary factory

    # Select all relevant columns for cases created by the specific user
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, name, age, gender, loc, photo_path
        FROM persons
        WHERE created_by = ?
        ORDER BY id DESC
        """,
        (user_id,)
    )
    cases = cursor.fetchall()
    conn.close()
    return cases


def create_tables():
    # ... (existing code for users and persons tables) ...
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    # ...
    # Add this part:
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS found_persons AS SELECT * FROM persons WHERE 0;
        """
    )
    conn.commit()
    conn.close()

# --- New Functions for Marking and Getting Found Cases ---

def mark_person_as_found(person_id: int) -> bool:
    """Move a record from 'persons' to 'found_persons' and delete the original.
    Returns True on success, False if the person was not found."""
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        # Check if the person exists in the active 'persons' table
        cur.execute("SELECT * FROM persons WHERE id = ?", (person_id,))
        row = cur.fetchone()
        if row:
            # Insert the record into the archive table
            cur.execute("INSERT INTO found_persons SELECT * FROM persons WHERE id = ?", (person_id,))
            # Delete the record from the active table
            cur.execute("DELETE FROM persons WHERE id = ?", (person_id,))
            conn.commit()
            return True
    return False

def get_found_cases() -> List[Dict[str, Any]]:
    """
    Return all found/resolved cases as a list of dictionaries.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, name, age, gender, loc, photo_path
        FROM found_persons
        ORDER BY id DESC
        """
    )
    cases = cursor.fetchall()
    conn.close()
    return cases
# --- Auto-run setup ---
create_tables()