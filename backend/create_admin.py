# backend/create_admin.py
import getpass
import db  # Your existing db.py module

def main():
    """A command-line script to securely create an admin user."""
    print("--- Create Admin User ---")
    
    # Get username and check if it already exists
    username = input("Enter admin username: ").strip()
    if not username:
        print("Username cannot be empty.")
        return
        
    if db.get_user_id(username):
        print(f"Error: User '{username}' already exists.")
        return

    # Get password securely without showing it on screen
    password = getpass.getpass("Enter admin password: ")
    if not password:
        print("Password cannot be empty.")
        return
        
    password_confirm = getpass.getpass("Confirm admin password: ")
    if password != password_confirm:
        print("Error: Passwords do not match.")
        return

    # Hash the password using the function from our db module
    hashed_password = db.pwd_context.hash(password)

    # Create the user with the 'admin' role
    try:
        db.create_user(username, hashed_password, role='admin')
        print(f"✅ Admin user '{username}' created successfully!")
    except Exception as e:
        print(f"❌ Failed to create admin user. Error: {e}")

if __name__ == "__main__":
    main()