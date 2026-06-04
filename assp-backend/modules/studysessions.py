from flask import request
from config import cursor, db
from datetime import datetime, date, time, timedelta

def format_duration(seconds):
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    return f"{h:02}:{m:02}:{s:02}"

def get_study_sessions():
    try:

        # capture filters from query params
        session_id = request.args.get("session_id")
        subject_id = request.args.get("subject_id")
        print("Session ID filter:", request.args)   # debugging
        user_id = request.args.get("user_id")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        query = "SELECT * FROM StudySession WHERE 1=1"
        params = []

        if session_id:
            query += " AND session_id = %s"
            params.append(session_id)

        if user_id:
            query += " AND user_id = %s"
            params.append(user_id)

        if subject_id:
            query += " AND subject_id = %s"
            params.append(subject_id)

        if start_date:
            query += " AND planned_date >= %s"
            params.append(start_date)

        if end_date:
            query += " AND planned_date <= %s"
            params.append(end_date)

        cursor.execute(query, tuple(params))
        sessions = cursor.fetchall()

        # convert datetime objects to string
        for s in sessions:
            for key in list(s.keys()):
                value = s[key]

                if isinstance(value, timedelta):
                    total_minutes = int(value.total_seconds() // 60)
                    hours = total_minutes // 60
                    minutes = total_minutes % 60
                    s[key] = f"{hours:02d}:{minutes:02d}"  # format as HH:MM
                elif not isinstance(value, (int, float, str, type(None))):
                    s[key] = str(value)

                if key == "actual_duration" and value is not None:
                    s["actual_duration_formatted"] = format_duration(value)

        return {
            "success": True,
            "data": sessions
        }

    except Exception as e:
        return {
            "success": False,
            "data": [],
            "error": str(e)
        }

def create_study_session():

    data = request.get_json()
    print("DATA RECEIVED:", data)   # debugging

    user_id = data.get("user_id")
    subject_id = data.get("subject_id")
    #user_id = request.cookies.get("session_token") # get user_id from cookie )
    subject = data.get("subject")
    topic = data.get("topic")
    planned_date = data.get("planned_date")
    print("Parsed date:", planned_date)   # debugging
    start_time = data.get("start_time")   # already in minutes
    end_time = data.get("end_time")
    day_of_week = data.get("day_of_week")

    planned_duration = None
    if start_time is not None and end_time is not None:
        planned_duration = end_time - start_time

    # convert minutes → time
    def minutes_to_time(minutes):
        h = minutes // 60
        m = minutes % 60
        return time(h, m)
    
    if start_time is not None:
        start_time = minutes_to_time(start_time)
    
    if end_time is not None:
        end_time = minutes_to_time(end_time)

    print("Parsed times:", start_time, end_time)   # debugging

    # optional fields
    # planned_duration = data.get("planned_duration", None)
    status = data.get("status", "planned")
    
    if (not subject_id):
         return {
            "success": False,
            "message": "Subject ID is required"
        }
    
    query = "SELECT name FROM subjects WHERE subject_id = %s"
    cursor.execute(query, (subject_id,))
    result = cursor.fetchone()
    if result:
        subject = result["name"]

    query = """
    INSERT INTO StudySession
    (user_id, subject, topic, day_of_week, planned_date, start_time, end_time, planned_duration, status, subject_id)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """

    cursor.execute(query, (
        user_id,
        subject,
        topic,
        day_of_week,
        planned_date,
        start_time,
        end_time,
        planned_duration,
        status,
        subject_id
    ))

    db.commit()

    return {
        "success": True,
        "message": "Study session created successfully"
    }

def delete_study_session(sesison_id):
    try:
        query = "DELETE FROM studysession WHERE session_id = %s"
        print(sesison_id)
        cursor.execute(query, (sesison_id,))
        db.commit()

        return {
            "success": True,
            "message": "Study session deleted successfully"
        }
    
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

def update_study_session(session_id):
    try:
        data = request.get_json()
        if not data:
            return {"success": False, "error": "No data provided"}

        # 1. Setup tracking for dynamic query building
        updates = []
        params = []


        # Helper to convert minutes from midnight to a python time object
        def minutes_to_time(minutes):
            if minutes is None: return None
            h = int(minutes) // 60
            m = int(minutes) % 60
            return time(h, m)

        # 2. Process Time Fields & Recalculate Duration if needed
        # We fetch the current start/end if they aren't provided to ensure duration stays accurate
        new_start_min = data.get("start_time")
        new_end_min = data.get("end_time")

        if new_start_min is not None or new_end_min is not None:
            # Convert to time objects for the DB
            if new_start_min is not None:
                st = minutes_to_time(new_start_min)
                updates.append("start_time = %s")
                params.append(st)

            if new_end_min is not None:
                et = minutes_to_time(new_end_min)
                updates.append("end_time = %s")
                params.append(et)

            # Optional: If you want to update planned_duration automatically
            # when times change, you'd calculate it here.
            # Note: This requires both times to be present in the 'data' or
            # fetched from the DB first.
            if new_start_min is not None and new_end_min is not None:
                duration = int(new_end_min) - int(new_start_min)
                updates.append("planned_duration = %s")
                params.append(max(0, duration))

        # 3. Process Other Fields (Only if they exist in the request)
        editable_fields = ["subject", "topic", "day_of_week", "planned_date"]

        for field in editable_fields:
            if field in data:
                updates.append(f"{field} = %s")
                params.append(data[field])

        # 4. Execute Update
        if not updates:
            return {"success": False, "message": "No changes detected"}

        # Add session_id for the WHERE clause
        params.append(session_id)
        
        query = f"UPDATE StudySession SET {', '.join(updates)} WHERE session_id = %s"
        cursor.execute(query, tuple(params))
        db.commit()

        return {
            "success": True,
            "message": "Study session updated successfully",
            "updated_fields": [u.split(' =')[0] for u in updates]
        }

    except Exception as e:
        db.rollback() # Good practice to rollback on error
        return {
            "success": False,
            "error": str(e)
        }

def start_session(session_id):
    try:
        print("START route hit:", session_id)

        query = """
        UPDATE StudySession
        SET actual_start = NOW(),
            actual_end = NULL,
            actual_duration = NULL,
            status = 'in_progress'
        WHERE session_id = %s
        """

        cursor.execute(query, (session_id,))
        db.commit()

        print("Start updated successfully")

        return {
            "success": True,
            "message": "Session started"
        }

    except Exception as e:
        db.rollback()
        print("START ERROR:", str(e))
        return {
            "success": False,
            "error": str(e)
        }

def end_session(session_id):
    try:
        print("END route hit:", session_id)

        cursor.execute("""
            SELECT actual_start FROM StudySession
            WHERE session_id = %s
        """, (session_id,))

        result = cursor.fetchone()
        print("Fetched start:", result)

        if not result or not result["actual_start"]:
            return {
                "success": False,
                "error": "Session not started"
            }

        start_time = result["actual_start"]
        end_time = datetime.now()

        duration = int((end_time - start_time).total_seconds())

        print("Duration:", duration)

        query = """
        UPDATE StudySession
        SET actual_end = %s,
            actual_duration = %s,
            status = 'completed'
        WHERE session_id = %s
        """

        cursor.execute(query, (end_time, duration, session_id))
        db.commit()

        print("End updated successfully")

        return {
            "success": True,
            "message": "Session ended"
        }

    except Exception as e:
        db.rollback()
        print("END ERROR:", str(e))
        return {
            "success": False,
            "error": str(e)
        }