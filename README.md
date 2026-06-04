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