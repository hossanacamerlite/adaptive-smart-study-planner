from flask import request
from config import cursor, db
from datetime import datetime, date, time, timedelta

def save_study_note():
    data = request.get_json()
    
    session_id = data.get("session_id")
    note_text = data.get("note_text")

    if not session_id or not note_text:
        return {"success": False, "error": "Missing required fields"}, 400

    try:
        cursor = db.cursor()
        
        # 1. Check if the session already has a note
        check_query = "SELECT 1 FROM studynote WHERE session_id = %s"
        cursor.execute(check_query, (session_id,))
        exists = cursor.fetchone()

        if exists:
            # 2. Update existing note
            sql_query = "UPDATE studynote SET note_text = %s WHERE session_id = %s"
            cursor.execute(sql_query, (note_text, session_id))
            message = "Notes updated successfully"
            status_code = 200
        else:
            # 3. Insert new note
            sql_query = "INSERT INTO studynote (session_id, note_text) VALUES (%s, %s)"
            cursor.execute(sql_query, (session_id, note_text))
            message = "Notes created successfully"
            status_code = 201
        
        db.commit()

        return {
            "success": True,
            "message": message,
            "data": {"session_id": session_id}
        }, status_code

    except Exception as e:
        db.rollback()
        print(f"Database Error: {e}") # Log the error for debugging
        return {"success": False, "error": "Internal server error"}, 500

def get_study_notes():
    try:

        # capture filters from query params
        session_id = request.args.get("session_id")
        note_id = request.args.get("note_id")

        query = "SELECT * FROM studynote WHERE 1=1"
        params = []

        if session_id:
            query += " AND session_id = %s"
            params.append(session_id)

        if note_id:
            query += " AND user_id = %s"
            params.append(note_id)

        cursor.execute(query, tuple(params))
        notes = cursor.fetchall()

        return {
            "success": True,
            "data": notes
        }

    except Exception as e:
        return {
            "success": False,
            "data": [],
            "error": str(e)
        }