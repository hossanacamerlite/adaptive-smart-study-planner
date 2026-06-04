from urllib import response
from google import genai
from flask import Blueprint, request, jsonify
from config import cursor, db
import requests
import os
import json

quiz_bp = Blueprint('quiz', __name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

@quiz_bp.route('/generate_quiz', methods=['POST'])
def generate_quiz():
    try:
        print(GEMINI_API_KEY)
        data = request.get_json()
        notes = data.get("notes")

        if not notes:
            return jsonify({"error": "Notes are required"}), 400

        print("Saving quiz: ", data)

        # Gemini prompt
        prompt = f"""
            You are an AI that generates quiz questions in STRICT JSON format.

            Generate exactly 5 multiple choice questions based on the notes below.

            Rules:
            - Return ONLY valid JSON (no explanation, no extra text)
            - Do NOT include markdown (no ```json)
            - Each question must have:
                - question (string)
                - options (array of 4 strings)
                - answer (must match one of the options exactly)

            Format EXACTLY like this:

            {{
                "questions": [
                {{
                    "question": "Sample question?",
                    "options": ["A", "B", "C", "D"],
                    "answer": "A"
                }}
                ]
            }}

        Notes:
        {notes}
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        print(response.text)

        response_text = response.text.strip()
        response_text = response_text.replace("```json", "").replace("```", "")

        print("Cleaned Response:", response_text)
        quiz_json = json.loads(response_text)

        session_id = data.get("session_id")
        cursor.execute("SELECT subject_id FROM studysession WHERE session_id = %s", (session_id,))
        session_data = cursor.fetchone()

        if not session_data:
            return jsonify({"error": "Invalid session_id"}), 404

        subject_id = session_data["subject_id"]

        # Make sure session_id exists
        if not session_id:
            return jsonify({"error": "session_id is required"}), 400

        query = """
        INSERT INTO quiz (session_id, subject_id, total_questions, user_id)
        VALUES (%s, %s, %s, %s)
        """

        cursor.execute(query, (session_id, subject_id, len(quiz_json['questions']), data.get("user_id")))
        db.commit()
        quiz_id = cursor.lastrowid

        # Save each question to the database
        for q in quiz_json["questions"]:
            options = q["options"]
            answer_text = q["answer"]

            correct_option = None
            for i, opt in enumerate(options):
                if opt == answer_text:
                    correct_option = ["A", "B", "C", "D"][i]
                    break

            query = """
            INSERT INTO quizquestion
            (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """

            cursor.execute(query, (
                quiz_id,
                q["question"],
                options[0],
                options[1],
                options[2],
                options[3],
                correct_option
            ))

        db.commit()

        return jsonify({
            "quiz_id": quiz_id,
            "subject_id": subject_id,
            "questions": quiz_json["questions"]
        }),200

    except Exception as e:
        print("GEMINI RESPONSE:", response.text)
        print("Error generating quiz:", str(e))
        return jsonify({
            "error": "Failed to generate quiz",
            "details": str(e)
        }), 500

