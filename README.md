# Adaptive Smart Study Planner (ASSP) Installation Guide

## Prerequisites

Before running the project, ensure the following software is installed:

* Python 3.12 or higher
* Node.js 18 or higher
* MySQL Server 8.0 or higher
* Git

---
# Installation Guide

## Clone Repository

Clone the project repository and navigate to the project directory:

```bash
git clone https://github.com/hossanacamerlite/adaptive-smart-study-planner.git

cd adaptive-smart-study-planner
```

---

## Environment Variables

Within the folder `assp-frontend`, copy the `.env.example` file and paste within `assp-frontend` and rename it to `.env`
The following information must be configured:

### MySQL database credentials
* Please obtain your database username and password and update their respective fields it in the `.env` file.

Fields to be updated:
```bash
DATABASE_URL="mysql://your_database_username:your_database_password@localhost:3306/adaptive_study_planner"
DATABASE_USER="your_database_username"
DATABASE_PASSWORD="your_database_password"
```

### Google OAuth Client and Secret Key

Note the **insturction** below first and then refer to this to obtain your [Google Client and Secret key](https://www.youtube.com/watch?v=D8DMj2lQMwo))

**Google Client and Secret key instruction:**

In the youtube tutorial above:

At timeline `0:41`, please add the following fields before creating the OAuth Client:
<img width="564" height="586" alt="image" src="https://github.com/user-attachments/assets/122cd1c5-87e1-4117-afb4-16ee8ab14575" />

At timeline `0:45`, please take note of your google client and secret key, copy and paste them into your `.env` file in their respective fields. You may stop the video once you have your client and secret keys

Fields to be updated:
```bash
GOOGLE_CLIENT_ID="Your Google Client Key"
GOOGLE_CLIENT_SECRET="Your Google Secret Key"
```

### Google Gemini API key 
(Refer to this to obtain your [Gemini API Key](https://ai.google.dev/gemini-api/docs/api-key))

Fields to be updated:
```bash
GEMINI_API_KEY="Your Google Gemini Key"
```

**Note:** The AI Quiz Generation feature requires a valid Google Gemini API key.

---

## Have one terminal open for backend server and another for frontend development
## Backend Setup

Open a terminal and run:

```bash
cd assp-backend

python -m venv venv
(Make sure your python version is at least 3.12++)

.\venv\Scripts\activate

pip install -r requirements.txt

python app.py
```

The backend server should start successfully.

---

## Frontend Setup

Open a second terminal and run:

```bash
(Ensure your terminal directory is in the `adaptive-smart-study-planner` repository first

cd assp-frontend

npm install

npx prisma generate

npx prisma db push

npm run dev
```

The frontend development server should start successfully. Please view the system at 

---

## Accessing the Application

After both frontend and backend servers are running, open the following URL in a web browser:

```text
http://localhost:3000
```

### Supported Browsers

* Google Chrome
* Microsoft Edge
* Mozilla Firefox

---

## Troubleshooting

### Backend Server Fails to Start

#### Possible Causes

* Python is not installed.
* Virtual environment is not activated.
* Required dependencies are missing.

#### Solution

Install the required Python packages:

```bash
pip install -r requirements.txt
```

Ensure Python 3.12 or higher is installed and the virtual environment is activated before running:

```bash
python app.py
```

---

### Frontend Server Fails to Start

#### Possible Causes

* Node.js is not installed.
* Required Node.js packages have not been installed.

#### Solution

Install the required packages and restart the frontend server:

```bash
npm install

npm run dev
```

Ensure Node.js version 18 or higher is installed.

---

### Database Connection Error

#### Possible Causes

* MySQL Server is not running.
* Incorrect database credentials.
* Database schema has not been synchronized.

#### Solution

Verify the database configuration in the `.env` file and synchronize Prisma with the database:

```bash
npx prisma generate

npx prisma db push
```

---

## Database Configuration

Ensure MySQL Server is installed and running.

Synchronize Prisma with the database schema using:

To update your database:
```bash
npx prisma generate

npx prisma db push
```

To synchronise `assp-frontend/prisma/schema.prisma`:
```bash
npx prisma generate

npx prisma db pull
```

---

### Application Cannot Be Accessed

#### Possible Causes

* Backend server is not running.
* Frontend server is not running.

#### Solution

Ensure both servers are running successfully and access the application through:

```text
http://localhost:3000
```

---

### AI Quiz Generation Not Working

#### Possible Causes

* Missing or invalid Google Gemini API key.
* Internet connection is unavailable.
* API quota has been exceeded.

#### Solution

Verify that the Gemini API key is correctly configured and ensure the device has an active internet connection.
