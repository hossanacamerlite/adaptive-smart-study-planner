# Adaptive Smart Study Planner (ASSP) Installation Guide

## Prerequisites

Before running the project, ensure the following software is installed:

* Python 3.12 or higher
* Node.js 18 or higher
* MySQL Server 8.0 or higher
* Git

---

## Clone Repository

Clone the project repository and navigate to the project directory:

```bash
git clone https://github.com/hossanacamerlite/adaptive-smart-study-planner.git

cd adaptive-smart-study-planner
```

---

## Environment Variables

Create and configure the `.env` file with the required environment variables.

The following information must be configured:

* MySQL database credentials
* Google Gemini API key

**Note:** The AI Quiz Generation feature requires a valid Google Gemini API key.

---

## Have one terminal open for backend server and another for frontend development
## Backend Setup

Open a terminal and run:

```bash
cd assp-backend

python -m venv venv

.\venv\Scripts\activate

pip install -r requirements.txt

python app.py
```

The backend server should start successfully.

---

## Frontend Setup

Open a second terminal and run:

```bash
cd assp-frontend

npm install

npm run dev
```

The frontend development server should start successfully.

---

## Database Configuration

Ensure MySQL Server is installed and running.

Synchronize Prisma with the database schema using:

```bash
npx prisma generate

npx prisma db pull

npx prisma db push
```

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

npx prisma db pull

npx prisma db push
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

```
```






# Pre Requisite
Python 3.12

# Have 1 terminal open for backend and another for frontend

# To Start the backend server:
```
cd assp-backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

# To Start the frontend server:
```
cd assp-frontend
npm install
npm run dev
```

pip freeze > requirements.txt

# To update DB
```
npx prisma generate
npx prisma db pull
npx prisma db push
```