# Missing Person Finder 🔍

This is a web app I built to help report and find missing people. It uses a React frontend and a Python (FastAPI) backend.

The coolest feature is the admin's ability to search for a person using a photo, which uses facial recognition to find potential matches from the database.

---

## What it Can Do

The app has two types of users: regular users and admins.

*   **Anyone can:**
    -   Create a user account.
    -   Log in.
    -   Report a missing person by filling out a form and uploading their photo.
    -   See a list of the cases they personally submitted.

*   **Admins can do everything a user can, plus:**
    -   View **all** active missing person cases from all users.
    -   **Search for a person by uploading a photo.** The app will show a list of potential matches from the database, sorted by how similar the faces are.
    -   Mark a case as "Found," which moves it to an archive.
    -   View all the resolved cases in the "Found Cases" list.

---

## Tech I Used

*   **Frontend:** React (built with Vite) & Tailwind CSS
*   **Backend:** Python with the FastAPI framework
*   **Database:** MySQL
*   **Facial Recognition:** InsightFace library

---

## How to Run This on Your Computer

You'll need two terminals open: one for the backend and one for the frontend.

### 1. Backend Setup

```bash
# First, go into the backend folder
cd backend

# Create a Python virtual environment and activate it
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

# Install the necessary Python libraries
pip install -r requirements.txt

# --- IMPORTANT DATABASE STEP ---
# 1. Make sure you have MySQL running.
# 2. Create a new, empty database (schema) named 'missing_person_db'.
# 3. Update the username and password in `backend/db.py` to match your MySQL setup.
# 4. To create the tables, just run the backend server for the first time. (If that fails, use the provided SQL script.)

#SQL SCRIPT :

create database missing_person_db;
use missing_person_db;

-- Create the 'users' table with a role column
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC));

-- Create the 'persons' table for active cases
CREATE TABLE IF NOT EXISTS `persons` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NULL,
  `age` INT NULL,
  `gender` VARCHAR(50) NULL,
  `loc` TEXT NULL,
  `photo_path` VARCHAR(255) NULL,
  `embedding` BLOB NULL,
  `created_by` INT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_persons_users_idx` (`created_by` ASC),
  CONSTRAINT `fk_persons_users`
    FOREIGN KEY (`created_by`)
    REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE);

-- Create the 'found_persons' table (archive) with the same structure
CREATE TABLE IF NOT EXISTS `found_persons` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NULL,personsusers
  `age` INT NULL,
  `gender` VARCHAR(50) NULL,
  `loc` TEXT NULL,
  `photo_path` VARCHAR(255) NULL,
  `embedding` BLOB NULL,
  `created_by` INT NULL,
  PRIMARY KEY (`id`));
  
  
   CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            message VARCHAR(255) NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )

# --- CREATE YOUR ADMIN ACCOUNT (Run this only once) ---
# It will ask you to create a username and password for the admin.
python create_admin.py

# Finally, start the backend server!
uvicorn api:app --reload
# It will be running at http://localhost:8000
```

### 2. Frontend Setup (in a new terminal)

```bash
# Go into the frontend folder
cd frontend

# Install all the Node.js packages
npm install

# Start the frontend development server
npm run dev
# The website will open at http://localhost:5173
```

Now you're all set! You can register a regular user account on the website or log in with the admin account you created. Enjoy!