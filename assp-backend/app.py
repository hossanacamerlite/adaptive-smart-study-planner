from datetime import datetime, timedelta, date, time
from flask import Flask, jsonify, make_response, request
from flask_cors import CORS
from config import cursor, db, init_db
from modules import studysessions as studysessions
from modules import studynotes as studynotes
from modules import subjects as subjects
from modules import quiz as quiz
#from modules import productivity as productivity
from dotenv import load_dotenv
from authlib.integrations.flask_client import OAuth
from flask import redirect, url_for, session
from datetime import datetime
import os
import json
import pickle
import pandas as pd
import joblib
from decimal import Decimal


os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
load_dotenv()
app = Flask(__name__)
init_db(app)
# Load trained model
model = joblib.load("productivity_model.pkl")

app.secret_key = os.getenv("SECRET_KEY")
app.config.update(
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_HTTPONLY=True,
)
app.register_blueprint(quiz.quiz_bp)


#CORS(app, supports_credentials=True, origins=["http://127.0.0.1:3000"])
CORS(app, supports_credentials=True, origins=[os.getenv("NEXT_PUBLIC_NEXTJS_SERVER_URL")])
print("CORS ORIGIN:", os.getenv("NEXT_PUBLIC_NEXTJS_SERVER_URL"))

oauth = OAuth(app)
os.environ['AUTHLIB_INSECURE_TRANSPORT'] = '1'

google = oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

@app.route("/auth/google")
def login_google():
    redirect_uri = url_for("google_callback", _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route("/auth/google/callback")
def google_callback():
    token = google.authorize_access_token()
    user_info = token["userinfo"]

    print("user_info", user_info)

    google_id = user_info["sub"]
    email = user_info["email"]
    name = user_info["name"]
    profile_picture = user_info["picture"]
    given_name = user_info.get("given_name", "")
    family_name = user_info.get("family_name", "")

    # check if user exists
    cursor.execute("SELECT user_id FROM user WHERE google_id=%s", (google_id,))
    user = cursor.fetchone()

    if not user:
        query = """
        INSERT INTO user (google_id, name, email, profile_picture, first_name, surname)
        VALUES (%s,%s,%s,%s,%s,%s)
        """
        cursor.execute(query, (google_id, name, email, profile_picture, given_name, family_name))
        db.commit()

        cursor.execute("SELECT user_id FROM user WHERE google_id=%s", (google_id,))
        user = cursor.fetchone()

    user_id = user['user_id']

    response = make_response(redirect(f"{os.getenv('NEXT_PUBLIC_NEXTJS_SERVER_URL')}/view/dashboard"))

    response.set_cookie(
        'session_token', 
        value=str(user_id),
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        # samesite='None',
        samesite='Lax',
        max_age=3600 * 24
    )

    print('Headers sent to browser:', response.headers)
    return response

@app.route("/")
def home():
    return {"message": "Adaptive Smart Study Planner Backend Running"}

# User Endpoints
@app.route("/users")
def get_users():
    cursor.execute("SELECT * FROM user")
    users = cursor.fetchall()
    return {"users": users}

@app.route("/users", methods=["POST"])
def add_user():
    data = request.json

    google_id = data["google_id"]
    name = data["name"]
    email = data["email"]
    profile_picture = data["profile_picture"]

    query = """
    INSERT INTO user (google_id, name, email, profile_picture)
    VALUES (%s, %s, %s, %s)
    """

    cursor.execute(query, (google_id, name, email, profile_picture))
    db.commit()

    return {"message": "User added successfully"}

# Study Session Endpoints
@app.route("/studysessions", methods=["GET"])
def get_study_sessions():
    return studysessions.get_study_sessions()

@app.route("/studysessions", methods=["POST"])
def create_study_session():
    return studysessions.create_study_session()

@app.route("/studysessions/<int:session_id>", methods=["DELETE"])
def delete_study_session_route(session_id):
    return studysessions.delete_study_session(session_id)

@app.route("/studysessions/<int:session_id>", methods=["PUT"])
def update_study_session_route(session_id):
    return studysessions.update_study_session(session_id)

@app.route("/studysessions/<int:session_id>/start", methods=["POST"])
def start_session_route(session_id):
    return studysessions.start_session(session_id)

@app.route("/studysessions/<int:session_id>/end", methods=["POST"])
def end_session_route(session_id):
    return studysessions.end_session(session_id)


# Stress Records Endpoints
@app.route("/stressrecords", methods=["GET"])
def get_stress_records():
    cursor.execute("SELECT * FROM stressrecord")
    records = cursor.fetchall()
    return {"stressrecords": records}

@app.route("/stressrecords", methods=["POST"])
def add_stress_record():
    data = request.json

    session_id = data["session_id"]
    stress_level = data["stress_level"]

    query = """
    INSERT INTO stressrecord (session_id, stress_level)
    VALUES (%s,%s)
    """

    cursor.execute(query, (session_id, stress_level))
    db.commit()

    return {"message": "Stress record added successfully"}

# Study Note Endpoints
@app.route("/studynotes", methods=["GET"])
def get_notes():
    return studynotes.get_study_notes()


@app.route("/studynotes", methods=["POST"])
def add_note():
    return studynotes.save_study_note()

# Quiz Creation Endpoint
@app.route("/quizzes", methods=["GET"])
def get_all_quizzes():
    if not db.is_connected():
        db.reconnect(attempts=3, delay=2)

    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({
            "error": "user_id parameter is required"
        }), 400

    local_cursor = db.cursor(dictionary=True)

    try:
        local_cursor.execute("""
            SELECT
                q.quiz_id,
                q.user_id,
                q.subject_id,
                s.name AS subject_name,
                ss.session_id,
                ss.topic
            FROM quiz q
            JOIN subjects s ON q.subject_id = s.subject_id
            LEFT JOIN studysession ss ON q.session_id = ss.session_id
            WHERE q.user_id = %s
            ORDER BY s.name, q.quiz_id DESC
        """, (user_id,))

        quizzes = local_cursor.fetchall()
        return jsonify(quizzes)

    finally:
        local_cursor.close()

# Generate quiz based on study session
@app.route("/quiz/<int:quiz_id>", methods=["GET"])
def get_quiz(quiz_id):

    # 1. Get quiz
    cursor.execute("""
                   SELECT q.*, s.name AS subject_name, session_id
                   FROM quiz q
                   JOIN subjects s ON q.subject_id = s.subject_id
                   WHERE q.quiz_id = %s
                   """, (quiz_id,))
    quiz = cursor.fetchone()

    if not quiz:
        return {"error": "Quiz not found"}, 404

    # 2. Get questions
    cursor.execute("SELECT * FROM quizquestion WHERE quiz_id=%s", (quiz_id,))
    questions = cursor.fetchall()

    # 3. Format questions
    formatted_questions = []

    for q in questions:
        formatted_questions.append({
            "question": q["question_text"],
            "options": [
                q["option_a"],
                q["option_b"],
                q["option_c"],
                q["option_d"]
            ],
            "answer": q["correct_option"],
        })

    return {
        "quiz_id": quiz_id,
        "subject": quiz["subject_name"],
        "questions": formatted_questions,
        "session_id": quiz["session_id"]
    }

# Quiz Attempt Endpoints
@app.route("/quizattempts/<int:user_id>/<int:quiz_id>", methods=["GET"])
def get_user_quiz_attempt(user_id, quiz_id):
    cursor.execute("""
        SELECT * FROM quizattempt
        WHERE user_id=%s AND quiz_id=%s
        ORDER BY finished_at DESC
        LIMIT 1
    """, (user_id, quiz_id))

    attempt = cursor.fetchone()

    return jsonify(attempt if attempt else {})

@app.route("/quizattemptsbyuserid/<int:user_id>", methods=["GET"])
def get_user_quiz_attempts(user_id):
    # 1. Ensure connection is active
    if not db.is_connected():
        db.reconnect(attempts=3, delay=2)
    
    # 2. Create a local cursor for this request
    local_cursor = db.cursor(dictionary=True) 
    
    try:
        # 3. Pass user_id as a TUPLE (note the comma)
        local_cursor.execute("""
            SELECT * FROM quizattempt
            WHERE user_id=%s
        """, (user_id,)) # <--- Added a comma here

        # Use fetchall() if you want all attempts, or fetchone() for just the latest
        attempts = local_cursor.fetchall()

        return jsonify(attempts if attempts else [])
    
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"error": str(e)}), 500
    
    finally:
        # 4. Always close the local cursor
        local_cursor.close()

@app.route("/quizattempts/latest", methods=["POST"])
def get_latest_quiz_attempts():
    data = request.json
    quiz_ids = data.get("quiz_ids", [])

    if not quiz_ids:
        return jsonify([])

    if not db.is_connected():
        db.reconnect(attempts=3, delay=2)
    
    local_cursor = db.cursor(dictionary=True) 
    
    try:
        # This query selects the attempt with the largest attempt_id for each quiz_id in your list
        query = f"""
    SELECT 
        qa.*,
        sl.stress_level
    FROM quizattempt qa

    LEFT JOIN stressrecord sl
    ON qa.attempt_id = sl.attempt_id

    INNER JOIN (
        SELECT MAX(attempt_id) as max_id 
        FROM quizattempt 
        WHERE quiz_id IN ({','.join(['%s'] * len(quiz_ids))})
        GROUP BY quiz_id
    ) latest 

    ON qa.attempt_id = latest.max_id
"""
        
        local_cursor.execute(query, tuple(quiz_ids))
        attempts = local_cursor.fetchall()

        return jsonify(attempts if attempts else [])
    
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"error": str(e)}), 500
    
    finally:
        local_cursor.close()

@app.route("/quizattempts", methods=["POST"])
def create_quiz_attempt():
    print("HERE FOUND")
    data = request.json

    quiz_id = data["quiz_id"]
    user_id = data["user_id"]

    started_at = datetime.now()
    finished_at = datetime.now()

    score = data["score"]
    time_taken_sec = data["time_taken_sec"]

    query = """
    INSERT INTO quizattempt
    (quiz_id, user_id, started_at, finished_at, score, time_taken_sec)
    VALUES (%s,%s,%s,%s,%s,%s)
    """

    cursor.execute(query, (
        quiz_id,
        user_id,
        started_at,
        finished_at,
        score,
        time_taken_sec
    ))

    attempt_id = cursor.lastrowid

    answers = data.get("answers", [])

    for ans in answers:
        question_id = ans.get("question_id")

        cursor.execute("""
            INSERT INTO attemptanswer (attempt_id, question_id, selected_option, is_correct)
            VALUES (%s, %s, %s, %s)
        """, (
            attempt_id,
            question_id,
            ans.get("selected_option"),
            ans.get("is_correct")
        ))

    db.commit()

    return {
        "message": "Quiz attempt recorded",
        "attempt_id": attempt_id
    }

@app.route("/dashboard/<int:user_id>", methods=["GET"])
def get_dashboard(user_id):
    selected_date = request.args.get("date", date.today().isoformat())
    # Use a local cursor for this request (closing the global cursor/db here
    # would break subsequent requests).
    if not db.is_connected():
        db.reconnect(attempts=3, delay=2)

    local_cursor = db.cursor(dictionary=True)

    try:
        def _json_safe_value(v):
            if v is None:
                return None
            if isinstance(v, (datetime, date, time)):
                return v.isoformat()
            # mysql-connector frequently returns TIME columns as timedelta
            if isinstance(v, timedelta):
                return str(v)
            if isinstance(v, Decimal):
                return float(v)
            return v

        def _json_safe_obj(obj):
            if isinstance(obj, dict):
                return {k: _json_safe_obj(_json_safe_value(v)) for k, v in obj.items()}
            if isinstance(obj, list):
                return [_json_safe_obj(x) for x in obj]
            return _json_safe_value(obj)

        # --- Today summary ---
        # Use planned study time for today's sessions
        local_cursor.execute(
            """
            SELECT COALESCE(SUM(actual_duration), 0) AS study_minutes_today
            FROM studysession
            WHERE user_id = %s
              AND planned_date = %s
              AND planned_duration IS NOT NULL
            """,
            (user_id, selected_date),
        )
        study_minutes_today = (local_cursor.fetchone() or {}).get("study_minutes_today", 0)

        local_cursor.execute(
            """
            SELECT COALESCE(COUNT(*), 0) AS quiz_attempts_today
            FROM quizattempt
            WHERE user_id = %s
                AND DATE(finished_at) = CURDATE()
            """,
            (user_id,),
        )
        quiz_attempts_today = (local_cursor.fetchone() or {}).get("quiz_attempts_today", 0)
        print("quiz_attempts_today:", quiz_attempts_today)
        print("recent quiz rows:", local_cursor.fetchall())

        # --- Last 7 days trends ---
        local_cursor.execute(
            """
            SELECT AVG(productivity_level) AS avg_productivity_7d
            FROM quizattempt
            WHERE user_id = %s
              AND finished_at IS NOT NULL
              AND finished_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              AND productivity_level IS NOT NULL
            """,
            (user_id,),
        )
        avg_productivity_7d = (local_cursor.fetchone() or {}).get("avg_productivity_7d")

        local_cursor.execute(
            """
            SELECT AVG(stress_level) AS avg_stress_7d
            FROM stressrecord
            WHERE user_id = %s
              AND recorded_at IS NOT NULL
              AND recorded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              AND stress_level IS NOT NULL
            """,
            (user_id,),
        )
        avg_stress_7d = (local_cursor.fetchone() or {}).get("avg_stress_7d")

        # --- Stress trend (past 7 days, daily average) ---
        local_cursor.execute(
            """
            SELECT
              DATE(recorded_at) AS day,
              AVG(stress_level) AS avg_stress
            FROM stressrecord
            WHERE user_id = %s
              AND recorded_at IS NOT NULL
              AND recorded_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
              AND stress_level IS NOT NULL
            GROUP BY DATE(recorded_at)
            ORDER BY day ASC
            """,
            (user_id,),
        )
        stress_rows = local_cursor.fetchall() or []
        stress_by_day = {}
        for r in stress_rows:
            day_val = r.get("day")
            # `day` may come back as date or datetime depending on connector
            day_key = day_val.isoformat() if hasattr(day_val, "isoformat") else str(day_val)
            stress_by_day[day_key] = float(r.get("avg_stress")) if r.get("avg_stress") is not None else None

        last7 = []
        today = date.today()
        for i in range(6, -1, -1):
            d = (today - timedelta(days=i)).isoformat()
            last7.append({"date": d, "avg_stress": stress_by_day.get(d)})

        # --- Sessions for today ---
        local_cursor.execute(
            """
            SELECT
            ss.session_id,
            COALESCE(s.name, ss.subject) AS subject_name,
            s.color AS subject_color,
            topic,
            planned_date,
            start_time,
            end_time,
            planned_duration,
            status,
            created_at,
            day_of_week,
            actual_start,
            actual_end,
            actual_duration,
            ss.subject_id
            FROM studysession ss
            LEFT JOIN subjects s ON ss.subject_id = s.subject_id
            WHERE ss.user_id = %s
            AND (
                planned_date = %s
                OR (
                    actual_start IS NOT NULL
                    AND DATE(actual_start) = %s
                )
            )
            ORDER BY
            COALESCE(actual_start, CONCAT(planned_date, ' ', start_time), created_at) ASC
            LIMIT 20
            """,
            (user_id, selected_date, selected_date),
        )
        today_sessions = local_cursor.fetchall() or []
        print('today_sessions', today_sessions)

        # --- Subjects list (name + color) ---
        local_cursor.execute(
            """
            SELECT subject_id, name, color
            FROM subjects
            WHERE user_id = %s
            ORDER BY name ASC
            """,
            (user_id,),
        )
        subjects_list = local_cursor.fetchall() or []

        # --- Recent activity ---
        local_cursor.execute(
            """
            SELECT
              session_id,
              subject,
              topic,
              planned_date,
              start_time,
              end_time,
              planned_duration,
              status,
              created_at,
              day_of_week,
              actual_start,
              actual_end,
              actual_duration,
              subject_id
            FROM studysession
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 5
            """,
            (user_id,),
        )
        recent_sessions = local_cursor.fetchall() or []

        local_cursor.execute(
            """
            SELECT
              qa.attempt_id,
              qa.quiz_id,
              s.name AS subject_name,
              qa.score,
              qa.time_taken_sec,
              qa.finished_at,
              qa.productivity_level
            FROM quizattempt qa
            JOIN quiz q ON qa.quiz_id = q.quiz_id
            LEFT JOIN subjects s ON q.subject_id = s.subject_id
            WHERE qa.user_id = %s
            ORDER BY qa.finished_at DESC
            LIMIT 5
            """,
            (user_id,),
        )
        recent_quiz_attempts = local_cursor.fetchall() or []

        # --- Subject breakdown (top 5 by attempts) ---
        local_cursor.execute(
            """
            SELECT
              s.subject_id,
              s.name AS subject_name,
              COUNT(*) AS attempts,
              AVG(qa.score) AS avg_score
            FROM quizattempt qa
            JOIN quiz q ON qa.quiz_id = q.quiz_id
            JOIN subjects s ON q.subject_id = s.subject_id
            WHERE qa.user_id = %s
              AND qa.score IS NOT NULL
            GROUP BY s.subject_id, s.name
            ORDER BY attempts DESC
            LIMIT 5
            """,
            (user_id,),
        )
        subject_breakdown = local_cursor.fetchall() or []

        today_query = """
            SELECT
                COALESCE(SUM(actual_duration), 0) AS total_seconds
            FROM StudySession
            WHERE user_id = %s
            AND DATE(actual_start) = CURDATE()
            AND status = 'completed'
            """

        local_cursor.execute(today_query, (user_id,))
        today_result = local_cursor.fetchone()

        study_minutes = 0

        if today_result and today_result["total_seconds"]:
            study_minutes = today_result["total_seconds"] / 60

        # --- Get latest real quiz score ---
        local_cursor.execute(
            """
            SELECT score
            FROM quizattempt
            WHERE user_id = %s
                AND score IS NOT NULL
            ORDER BY finished_at DESC
            LIMIT 1
            """,
            (user_id,)
        )

        latest_quiz_result = local_cursor.fetchone()

        latest_quiz_score = (
            float(latest_quiz_result["score"])
            if latest_quiz_result and latest_quiz_result.get("score") is not None
            else 80
        )

        productivity_score = "Medium"

        try:
            model = joblib.load("productivity_model.pkl")
            
            study_minutes = float(study_minutes or 0)
            quiz_attempts_today = int(quiz_attempts_today or 0)
            latest_quiz_score = float(latest_quiz_score or 0)

            study_hours = float(study_minutes) / 60

            # temporary values
            # sleep_hours = 7
            
            quiz_score = float(quiz_attempts_today) * 10

            productivity_score = float(
                (0.4 * study_hours) +
                (0.6 * quiz_score)
            )

            stress_level = 1

            if study_minutes > 120:
                stress_level += 1

            if quiz_attempts_today >= 5:
                stress_level += 1

            if latest_quiz_score < 60:
                stress_level += 1

            if study_minutes > 240:
                stress_level += 1

            productivity_score = (
                (0.4 * study_hours) +
                (0.6 * quiz_score)
            )


            # dynamic stress calculation
            stress_level = round(
                (
                    (study_minutes / 60) * 0.8 +
                    quiz_attempts_today * 0.5 +
                    (100 - latest_quiz_score) * 0.03
                )
            )

            # keep between 1 and 5
            stress_level = max(1, min(5, stress_level))

            input_data = pd.DataFrame([{
                "productivity_score": productivity_score,
                "stress_level": stress_level
            }])

            productivity_score = model.predict(input_data)[0]

            print("productivity_score:", productivity_score)

        except Exception as e:
            print("Dashboard prediction error:", e)

        # recommendation happens here
        recommendation = "Maintain your current study routine."

        if stress_level >= 4 and latest_quiz_score < 50:
            recommendation = (
                "High stress and low quiz performance detected. "
                "Take a break and revise weaker topics."
            )
        elif stress_level >= 4:
            recommendation = (
                "Stress levels are high. Consider shorter study sessions "
                "and proper rest."
            )
        elif latest_quiz_score < 60:
            recommendation = (
                "Quiz performance needs improvement. Focus on revision "
                "and practice quizzes."
            )
        elif productivity_score == "High":
            recommendation = (
                "Excellent progress. Continue your current study strategy."
            )

        elif productivity_score == "Medium":
            recommendation = (
                "You are doing fairly well. Maintain balanced study sessions."
            )
        else:
            recommendation = (
                "Try shorter focused study sessions to improve concentration."
            )

        return jsonify(
            {
                "user_id": user_id,
                "today": {
                    "study_minutes": float(study_minutes or 0),
                    "quiz_attempts": int(quiz_attempts_today or 0),
                },
                "last_7_days": {
                    "avg_productivity": avg_productivity_7d if avg_productivity_7d is not None else None,
                    "avg_stress": float(avg_stress_7d) if avg_stress_7d is not None else None,
                    "stress_trend_7d": last7,
                },
                "recent": {
                    "sessions": _json_safe_obj(recent_sessions),
                    "quiz_attempts": _json_safe_obj(recent_quiz_attempts),
                },
                "selected_sessions": _json_safe_obj(today_sessions),
                "subjects": _json_safe_obj(subjects_list),
                "subject_breakdown": _json_safe_obj(subject_breakdown),
                "recommendation": recommendation,
                "productivity_prediction": productivity_score
            }
        )

    except Exception as e:
        print("ERROR:", e)
        return (
            jsonify(
                {
                    "user_id": user_id,
                    "today": {"study_minutes": 0, "quiz_attempts": 0},
                    "last_7_days": {"avg_productivity": None, "avg_stress": None},
                    "recent": {"sessions": [], "quiz_attempts": []},
                    "subject_breakdown": [],
                    "error": str(e),
                }
            ),
            500,
        )
    finally:
        local_cursor.close()

@app.route("/quizattempts", methods=["GET"])
def get_quiz_attempts():
    try:
        cursor.execute("SELECT * FROM quizattempt")
        rows = cursor.fetchall()

        return jsonify({
            "quizattempts": rows
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({
            "quizattempts": []
        }), 500

# Quiz Question Endpoints
@app.route("/generate-questions", methods=["POST"])
def generate_questions():
    return quiz.generate_quiz()


# Study Recommendation Endpoints
@app.route("/recommendations", methods=["GET"])
def get_recommendations():
    cursor.execute("SELECT * FROM studyrecommendation")
    recs = cursor.fetchall()
    return {"recommendations": recs}

@app.route("/recommendations", methods=["POST"])
def add_recommendation():
    data = request.json

    user_id = data["user_id"]
    recommended_date = data["recommended_date"]
    recommended_start = data["recommended_start"]
    recommended_end = data["recommended_end"]
    predicted_focus_score = data["predicted_focus_score"]
    model_version = data["model_version"]

    query = """
    INSERT INTO studyrecommendation
    (user_id, recommended_date, recommended_start, recommended_end, predicted_focus_score, model_version)
    VALUES (%s,%s,%s,%s,%s,%s)
    """

    cursor.execute(query, (
        user_id,
        recommended_date,
        recommended_start,
        recommended_end,
        predicted_focus_score,
        model_version
    ))

    db.commit()

    return {"message": "Recommendation added"}

#@app.route("/predict", methods=["POST"])
#def predict():
#    data = request.json
#
#    study_hours = data["study_hours"]
#    quiz_score = data["quiz_score"]
#    stress_level = data["stress_level"]
#    attempt_id = data.get("attempt_id")
#
#    predicted_productivity = productivity.predict_productivity(study_hours, quiz_score, stress_level)
#    print('predicted_productivity', predicted_productivity)
#
#    #predicted_productivity = max(0, min(1, predicted_productivity))
#
#    query = """
#        UPDATE quizattempt
#        SET productivity_level = %s
#        WHERE attempt_id = %s
#    """
#
#    cursor.execute(query, (predicted_productivity, attempt_id))
#    db.commit()
#
#    return jsonify({
#        "predicted_productivity": float(predicted_productivity),
#        "success": True
#    })
#

#@app.route("/predict-productivity", methods=["POST"])
#def predict_productivity():
#    try:
#        data = request.get_json()
#
#        study_hours = float(data.get("study_hours", 0))
#        quiz_score = float(data.get("quiz_score", 0))
#        stress_level = float(data.get("stress_level", 0))
#
#        # load model
#        with open("productivity_model.pkl", "rb") as f:
#            model = pickle.load(f)
#
#        input_data = pd.DataFrame([{
#            "study_hours": study_hours,
#            "quiz_score": quiz_score,
#            "stress_level": stress_level
#        }])
#
#        prediction = model.predict(input_data)[0]
#
#        return jsonify({
#            "success": True,
#            "productivity_score": round(float(prediction), 2)
#        })
#
#    except Exception as e:
#        return jsonify({
#            "success": False,
#            "error": str(e)
#        }), 500

@app.route("/predict-productivity", methods=["POST"])
def predict_productivity():
    try:
        data = request.get_json()

        productivity_score = float(data.get("productivity_score", 0))
        stress_level = float(data.get("stress_level", 3))

        input_data = pd.DataFrame([{
            "productivity_score": productivity_score,
            "stress_level": stress_level
        }])

        prediction = model.predict(input_data)[0]

        return jsonify({
            "success": True,
            "productivity_prediction": prediction
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/subjects", methods=["GET"])
def fetch_subject():
    return subjects.fetch_subjects()


@app.route("/subjects", methods=["POST"])
def create_subject():
    return subjects.save_subjects()

@app.route("/subjects/<int:subject_id>", methods=["DELETE"])
def delete_subject(subject_id):
    return subjects.delete_subject(subject_id)

@app.route("/api/me")
def get_current_user():
    # 1. Get the user_id from the cookie we set in the callback
    user_id = request.cookies.get('session_token')

    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # 2. Fetch the user from the database
    cursor.execute("SELECT * FROM user WHERE user_id=%s", (user_id,))
    user = cursor.fetchone()

    if not user:
        return jsonify({"error": "User not found"}), 404

    # 3. Return the user data as JSON
    return jsonify({
        "user_id": user['user_id'],
        "name": user['name'],
        "email": user['email'],
        "profile_picture": user['profile_picture'],
        "first_name" : user['first_name'],
        "surname" : user['surname']
    })

@app.route('/auth/logout', methods=['POST'])
def logout():
    # 1. Create the response object
    response = make_response(jsonify({"message": "Successfully logged out"}))

    response.delete_cookie(
        'session_token',
        path='/',
        samesite='Lax'
    )

    return response

@app.route("/stressrecord", methods=["POST"])
def save_stress():
    data = request.json

    user_id = data["user_id"]
    attempt_id = data.get("attempt_id")

    if not attempt_id:
        return {"error": "attempt_id missing"}, 400

    stress_level = data["stress_level"]

    cursor.execute(
        "SELECT * FROM stressrecord WHERE attempt_id = %s",
        (attempt_id,)
    )
    existing = cursor.fetchone()

    if existing:
        return {"message": "Stress already recorded for this attempt"}, 400

    cursor.execute("""
        INSERT INTO stressrecord (user_id, attempt_id, stress_level)
        VALUES (%s, %s, %s)
    """, (user_id, attempt_id, stress_level))

    db.commit()

    return {"message": "Stress saved"}

@app.route("/user-results/<int:user_id>", methods=["GET"])
def get_user_results(user_id):
    cursor.execute("""
        SELECT quiz_id, MAX(score) as score
        FROM quizattempt
        WHERE user_id = %s
        GROUP BY quiz_id
    """, (user_id,))

    results = cursor.fetchall()

    return jsonify(results)

@app.route("/studysessions/timer/<int:session_id>", methods=["GET"])
def get_study_session_timer(session_id):
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            session_id,
            actual_start,
            actual_end,
            status
        FROM studysession
        WHERE session_id = %s
    """, (session_id,))

    session = cursor.fetchone()

    return jsonify(session)

@app.route("/studysessions/active", methods=["GET"])
def get_active_session():

    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM studysession
        WHERE status IN ('ongoing', 'in_progress')
        ORDER BY actual_start DESC
        LIMIT 1
    """)

    session = cursor.fetchone()

    return jsonify(session)

if __name__ == "__main__":
    app.run(debug=True)

