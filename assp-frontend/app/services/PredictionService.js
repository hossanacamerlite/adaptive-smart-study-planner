export const getPrediction = async (studyHours, quizScore, stressLevel, attemptId) => {
  try {
    const res = await fetch("http://localhost:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        study_hours: studyHours,
        quiz_score: quizScore,
        stress_level: stressLevel,
        attempt_id: attemptId
      })
    });

    const data = await res.json();

    return data.predicted_productivity;
  } catch (error) {
    console.error("Prediction error:", error);
    return null;
  }
};