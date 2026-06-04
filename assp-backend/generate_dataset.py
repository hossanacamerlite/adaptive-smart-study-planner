import pandas as pd
import random

data = []

for i in range(200):
    study_hours = round(random.uniform(0.5, 5), 2)
    quiz_score = random.randint(20, 100)
    stress_level = random.randint(1, 5)

    # REALISTIC LOGIC
    productivity = (
        (study_hours / 5) * 40 +
        (quiz_score / 100) * 40 +
        ((6 - stress_level) / 5) * 20
    )

    # 🔥 ADD NOISE (important for real-world)
    noise = random.uniform(-8, 8)
    productivity += noise

    # Clamp between 0–100
    productivity = max(0, min(100, productivity))

    data.append([study_hours, quiz_score, stress_level, round(productivity, 2)])

df = pd.DataFrame(data, columns=[
    "study_hours", "quiz_score", "stress_level", "productivity"
])

df.to_excel("study_data.xlsx", index=False)

print("Realistic dataset generated!")