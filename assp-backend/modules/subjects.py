from flask import request
from config import cursor, db
from datetime import datetime, date, time, timedelta

def fetch_subjects():
	try:
		# capture filters from query params
		user_id = request.args.get("user_id")
		subject_id = request.args.get("subject_id")
		subject_ids = request.args.get("subject_ids")
		name = request.args.get("name")
		color = request.args.get("color")

		query = "SELECT * FROM subjects WHERE 1=1"
		params = []

		if user_id:
			query += " AND user_id = %s"
			params.append(user_id)

		if subject_id:
			query += " AND subject_id = %s"
			params.append(subject_id)

		if subject_ids:
			# Expecting a string like "1,2,3"
			id_list = subject_ids.split(",")
			placeholders = ", ".join(["%s"] * len(id_list))
			query += f" AND subject_id IN ({placeholders})"
			params.extend(id_list)

		if name:
			query += " AND name = %s"
			params.append(name)

		if color:
			query += " AND color = %s"
			params.append(color)

		cursor.execute(query, tuple(params))
		subjects = cursor.fetchall()

		return {
			"success": True,
			"data": subjects
		}

	except Exception as e:
		return {
			"success": False,
			"data": [],
			"error": str(e)
		}

def save_subjects():
	data = request.get_json()

	# Get fields from request [cite: 44]
	subject_id = data.get("subject_id")  # Check if we are updating
	user_id = data.get("user_id")
	name = data.get("name")
	color = data.get("color")

	if not user_id or not name:
		return {"success": False, "error": "Missing required fields", "message": "Missing required fields"}, 400

	try:
		cursor = db.cursor()

		if subject_id:
			# Update existing subject [cite: 44]
			sql_query = "UPDATE subjects SET name = %s, color = %s WHERE subject_id = %s AND user_id = %s"
			cursor.execute(sql_query, (name, color, subject_id, user_id))
			message = "Subject updated successfully"
			status_code = 200
		else:
			# Insert new subject [cite: 44]
			sql_query = "INSERT INTO subjects (user_id, name, color) VALUES (%s, %s, %s)"
			cursor.execute(sql_query, (user_id, name, color))
			message = "Subject created successfully"
			status_code = 201

		db.commit()
		return {
			"success": True,
			"message": message,
		}, status_code

	except Exception as e:
		db.rollback()
		print(f"Database Error: {e}") 
		return {"success": False, "error": str(e), "message": "Internal server error"}, 500
	finally:
		cursor.close()

def delete_subject(subject_id):
	try:
		query = "DELETE FROM subjects WHERE subject_id = %s"
		cursor.execute(query, (subject_id,))
		db.commit()

		return {
			"success": True,
			"message": "Subject deleted successfully"
		}
	
	except Exception as e:
		return {
			"success": False,
			"message": str(e)
		}
