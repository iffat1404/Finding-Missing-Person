# backend/db.py

import mysql.connector
from mysql.connector import Error
from typing import List, Dict, Any
import numpy as np
from passlib.context import CryptContext

# --- IMPORTANT: MySQL Connection Configuration ---
# For production, these should be loaded from environment variables.
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "root",
    "database": "missing_person_db"
}

# --- Password Hashing Setup ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Database Connection Helper ---
def get_db_connection():
    """Establishes and returns a connection to the MySQL database."""
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except Error as e:
        print(f"Error connecting to MySQL Database: {e}")
        return None

# ==============================================================================
# SECTION: User Management
# ==============================================================================

def create_user(username: str, hashed_password: str, role: str = 'user') -> None:
    """Creates a new user with a pre-hashed password and a specified role."""
    conn = get_db_connection()
    if conn is None: return
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
            (username, hashed_password, role)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def get_user_id(username: str) -> int | None:
    """Returns the user ID for a given username, or None if not found."""
    conn = get_db_connection()
    if conn is None: return None
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        return user['id'] if user else None
    finally:
        cursor.close()
        conn.close()

def get_user_role(username: str) -> str | None:
    """Returns the role for a given username."""
    conn = get_db_connection()
    if conn is None: return None
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT role FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        return user['role'] if user else None
    finally:
        cursor.close()
        conn.close()

def verify_user_hashed(username: str, plain_password: str) -> int | None:
    """Verifies a user's password. Returns user_id on success, None on failure."""
    conn = get_db_connection()
    if conn is None: return None
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, password FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            return None
        if pwd_context.verify(plain_password, user['password']):
            return user['id']
        return None
    finally:
        cursor.close()
        conn.close()

# ==============================================================================
# SECTION: Missing Person Case Management
# ==============================================================================

def add_person(data: dict, embedding: np.ndarray, user_id: int) -> None:
    """Inserts a new missing-person record into the 'persons' table."""
    conn = get_db_connection()
    if conn is None: return
    cursor = conn.cursor()
    try:
        sql = "INSERT INTO persons (name, age, gender, loc, photo_path, embedding, created_by) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        values = (data.get("name"), data.get("age"), data.get("gender"), data.get("loc"), data.get("photo_path"), embedding.astype(np.float32).tobytes(), user_id)
        cursor.execute(sql, values)
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def find_matches(query_embedding: np.ndarray, strictness: float) -> List[Dict[str, Any]]:
    """Finds all persons matching a query embedding based on cosine similarity."""
    from face_utils import cosine  # Local import to avoid circular dependency
    conn = get_db_connection()
    if conn is None: return []
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, name, age, gender, loc, photo_path, embedding FROM persons")
        all_persons = cursor.fetchall()
        matches = []
        for person in all_persons:
            db_embedding = np.frombuffer(person['embedding'], dtype=np.float32)
            similarity = cosine(query_embedding, db_embedding)
            if similarity >= strictness:
                del person['embedding']
                person['similarity'] = round(similarity, 4)
                matches.append(person)
        matches.sort(key=lambda x: x['similarity'], reverse=True)
        return matches
    finally:
        cursor.close()
        conn.close()

def get_user_cases(user_id: int) -> List[Dict[str, Any]]:
    """Returns all active cases submitted by a specific user."""
    conn = get_db_connection()
    if conn is None: return []
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, name, age, gender, loc, photo_path FROM persons WHERE created_by = %s ORDER BY id DESC", (user_id,))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def get_all_active_cases() -> List[Dict[str, Any]]:
    """Returns all active cases, joined with the creator's username."""
    conn = get_db_connection()
    if conn is None: return []
    cursor = conn.cursor(dictionary=True)
    try:
        sql = """
            SELECT p.id, p.name, p.age, p.gender, p.loc, p.photo_path, u.username as created_by_user
            FROM persons p
            LEFT JOIN users u ON p.created_by = u.id
            ORDER BY p.id DESC
        """
        cursor.execute(sql)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
        
def get_case_creator(person_id: int) -> int | None:
    """Gets the user_id of the user who created a specific case."""
    conn = get_db_connection()
    if conn is None: return None
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT created_by FROM persons WHERE id = %s", (person_id,))
        result = cursor.fetchone()
        return result[0] if result else None
    finally:
        cursor.close()
        conn.close()

def get_case_name(person_id: int) -> str | None:
    """Gets the name associated with a specific case ID."""
    conn = get_db_connection()
    if conn is None: return None
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name FROM persons WHERE id = %s", (person_id,))
        result = cursor.fetchone()
        return result[0] if result else None
    finally:
        cursor.close()
        conn.close()

def mark_person_as_found(person_id: int) -> bool:
    """Moves a record from 'persons' to 'found_persons' and deletes the original."""
    conn = get_db_connection()
    if conn is None: return False
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM persons WHERE id = %s", (person_id,))
        row_to_move = cursor.fetchone()
        if row_to_move:
            column_names = [desc[0] for desc in cursor.description]
            placeholders = ', '.join(['%s'] * len(column_names))
            sql_insert = f"INSERT INTO found_persons ({', '.join(column_names)}) VALUES ({placeholders})"
            cursor.execute(sql_insert, row_to_move)
            cursor.execute("DELETE FROM persons WHERE id = %s", (person_id,))
            conn.commit()
            return True
        return False
    finally:
        cursor.close()
        conn.close()

def get_found_cases() -> List[Dict[str, Any]]:
    """Returns all cases from the 'found_persons' archive table."""
    conn = get_db_connection()
    if conn is None: return []
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, name, age, gender, loc, photo_path FROM found_persons ORDER BY id DESC")
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

# ==============================================================================
# SECTION: Notification Management
# ==============================================================================

def create_notification(user_id: int, message: str) -> None:
    """Creates a new notification for a specific user."""
    conn = get_db_connection()
    if conn is None: return
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO notifications (user_id, message) VALUES (%s, %s)", (user_id, message))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def get_unread_notifications(user_id: int) -> List[Dict[str, Any]]:
    """Fetches all notifications for a user, which the frontend can filter."""
    conn = get_db_connection()
    if conn is None: return []
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, message, is_read, created_at FROM notifications WHERE user_id = %s ORDER BY created_at DESC",
            (user_id,)
        )
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def mark_notification_as_read(notification_id: int, user_id: int) -> bool:
    """Marks a specific notification as read for the given user."""
    conn = get_db_connection()
    if conn is None: return False
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE notifications SET is_read = TRUE WHERE id = %s AND user_id = %s",
            (notification_id, user_id)
        )
        conn.commit()
        return cursor.rowcount > 0  # Returns True if a row was updated
    finally:
        cursor.close()
        conn.close()