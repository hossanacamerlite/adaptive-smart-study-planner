import pickle
import pandas as pd

# 1. Load the saved model
try:
    with open("productivity_model.pkl", "rb") as f:
        model = pickle.load(f)
    print("Model loaded successfully!")
except FileNotFoundError:
    print("Error: productivity_model.pkl not found. Please run train_model.py first.")
    exit()

# 2. Define sample data for testing
# Note: Ensure the column names match those used during training
test_data = pd.DataFrame({
    "study_hours": [2],
    "quiz_score": [100],
    "stress_level": [1]
})

# 3. Make a prediction
prediction = model.predict(test_data)

# 4. Output the result
print("-" * 30)
print(f"Input Data:\n{test_data}")
print("-" * 30)
print(f"Predicted Productivity Score: {prediction[0]:.2f}")