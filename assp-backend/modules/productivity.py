import pandas as pd
import pickle

# Load your model (assuming it's in the same directory)
with open("model.pkl", "rb") as f:
	model = pickle.load(f)

def predict_productivity(study_hours, quiz_score, stress_level):
	# 1. Validation: Check for None or missing values
	if any(v is None for v in [study_hours, quiz_score, stress_level]):
		return "Error: All inputs (hours, score, stress) must have values."

	# 2. Validation: Ensure inputs are numbers and within logical ranges
	try:
		study_hours = float(study_hours)
		quiz_score = float(quiz_score)
		stress_level = float(stress_level)
		
		# Example range checks:
		# Study hours shouldn't be negative, Stress level usually 1-10
		if study_hours < 0 or not (1 <= stress_level <= 10):
			return "Error: Invalid input range detected."
			
	except ValueError:
		return "Error: Inputs must be numerical values."

	# 3. Prepare data for the model
	test_data = pd.DataFrame({
		"study_hours": [study_hours],
		"quiz_score": [quiz_score],
		"stress_level": [stress_level]
	})

	# 4. Predict
	prediction = model.predict(test_data)
	
	# Return the result (rounded for readability)
	return prediction[0]