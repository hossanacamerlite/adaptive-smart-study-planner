import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error

# =========================
# LOAD DATASET
# =========================

df = pd.read_csv("student_habits_performance.csv")

# =========================
# PRODUCTIVITY SCORE
# =========================

# Formula:
# Productivity Score =
# 100 * (1 - EXP(-(exam_score / (study_hours * 10))))

df['productivity_score'] = np.where(
    df['study_hours_per_day'] == 0,
    0,
    100 * (
        1 - np.exp(
            -(df['exam_score'] /
              (df['study_hours_per_day'] * 10))
        )
    )
)

# =========================
# SYNTHETIC STRESS LEVEL
# =========================

def generate_stress(row):

    hours = row['study_hours_per_day']

    if hours >= 8:
        return 5
    elif hours >= 6:
        return 4
    elif hours >= 4:
        return 3
    elif hours >= 2:
        return 2
    else:
        return 1

df['stress_level'] = df.apply(generate_stress, axis=1)

# =========================
# FEATURES (X)
# =========================

X = df[[
    'study_hours_per_day',
    'exam_score',
    'stress_level'
]]

# =========================
# TARGET (Y)
# =========================

y = df['productivity_score']

# =========================
# TRAIN TEST SPLIT
# =========================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

# =========================
# LINEAR REGRESSION MODEL
# =========================

model = LinearRegression()

model.fit(X_train, y_train)

# =========================
# PREDICTION
# =========================

predictions = model.predict(X_test)

# =========================
# EVALUATION
# =========================

r2 = r2_score(y_test, predictions)
mae = mean_absolute_error(y_test, predictions)

print("\n===== MODEL PERFORMANCE =====")
print("R² Score:", round(r2, 4))
print("MAE:", round(mae, 4))

# =========================
# REGRESSION EQUATION
# =========================

intercept = model.intercept_
coefficients = model.coef_

print("\n===== LINEAR REGRESSION EQUATION =====")

print(f"""
Y = {intercept:.4f}
    + ({coefficients[0]:.4f} × Study_Hours)
    + ({coefficients[1]:.4f} × Exam_Score)
    + ({coefficients[2]:.4f} × Stress_Level)
""")

# =========================
# SAVE MODEL
# =========================

joblib.dump(model, "productivity_model.pkl")

print("Model saved successfully.")