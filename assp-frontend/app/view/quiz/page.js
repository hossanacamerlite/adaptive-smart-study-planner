'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import user from '@/app/class/User'

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState([])
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [attempts, setAttempts] = useState({})
  const router = useRouter()

  useEffect(() => {
    // Define an internal async function
    const fetchData = async () => {
      try {
        const user_data = user.getUserData();
        const user_id = user_data.data?.user_id;
        console.log('user_id', user_id)

        if (!user_id) {
          throw new Error("User ID not found");
        }

        // 1. Fetch Quizzes for this user only
        const quizRes = await fetch(
          `http://localhost:5000/quizzes?user_id=${user_id}`
        );

        const quizData = await quizRes.json();
        console.log("Fetched quizzes:", quizData);

        const quizIds = quizData.map(q => q.quiz_id);
        const quizAttemptsRes = await fetch("http://localhost:5000/quizattempts/latest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quiz_ids: quizIds }) // quizIds from your previous logic
        })

        const quizAttemptsData = await quizAttemptsRes.json();

        const quizzes = quizData.map(quiz => {
          const lastAttempt = (Array.isArray(quizAttemptsData)
            ? quizAttemptsData
            : []
          ).find(attempt => attempt.quiz_id === quiz.quiz_id);

          return {
            "quiz_id": quiz.quiz_id,
            "session_id": quiz.session_id,
            "subject_id": quiz.subject_id,
            "subject_name": quiz.subject_name,
            "topic": quiz.topic,
            "last_attempted_time": lastAttempt ? lastAttempt.started_at : "Never Attempted",
            "score": lastAttempt ? lastAttempt.score : 0
          };
        });

        console.log('quizzes', quizzes)
        setQuizzes(quizzes);

        // 3. Convert into easy lookup
        const map = {};
        const attemptsArray = Array.isArray(quizAttemptsData) ? quizAttemptsData : (quizAttemptsData.quizattempts || []);

        attemptsArray.forEach(a => {
          map[a.quiz_id] = a;
        });

        setAttempts(map);

      } catch (error) {
        console.error("Error fetching study data:", error);
      }
    };

    fetchData();
  }, [user]);

  const startQuiz = (quizId) => {
    router.push(`/view/quiz/${quizId}`)
  }

  const grouped = quizzes.reduce((acc, quiz) => {
    if (!acc[quiz.subject_name]) {
      acc[quiz.subject_name] = []
    }
    acc[quiz.subject_name].push(quiz)
    console.log('acc', acc)
    return acc
  }, {})

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Quiz</h1>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center mt-20 text-gray-500 text-lg font-medium">
          No quiz generated yet. Complete a study session to generate your first quiz.
        </div>
      ) : (
        Object.keys(grouped).map(subject => (
          <div key={subject} className="mb-8">

            <h2 className="text-xl font-bold mb-3">{subject}</h2>

            {grouped[subject].map(q => {
              const attempt = attempts[q.quiz_id]
              const attempted = !!attempt
              const score = q?.score || 0
              const total = q.total_questions || 5

              const rawDate = q?.last_attempted_time || "Never Attempted";
              const last_attempted_time = rawDate.replace(" GMT", "");

              const percentage = attempted ? Math.round((score / total) * 100) : 0;

              return (
                <div key={q.quiz_id} className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 my-2 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-5">

                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        {q.topic || "General Topic"}
                      </h3>

                      <p className="text-sm text-gray-400 mt-1">
                        Quiz ID: {q.quiz_id}
                      </p>

                      <p className="text-sm text-gray-400">
                        Last Attempt: {last_attempted_time}
                      </p>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs uppercase text-gray-400 font-semibold mb-1">
                        Quiz Score
                      </p>

                      <p className="text-3xl font-bold text-blue-600">
                        {attempted ? `${percentage}%` : "--"}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs uppercase text-gray-400 font-semibold mb-1">
                        Stress Level
                      </p>

                      <p className="text-3xl font-bold text-red-500">
                        {attempt?.stress_level
                          ? `${attempt.stress_level}/5`
                          : "--"}
                      </p>
                    </div>

                  </div>

                  {/* AI Recommendation */}
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-5">

                    <p className="text-sm font-semibold text-purple-700 mb-1">
                      AI Study Recommendation
                    </p>

                    <p className="text-gray-700 text-sm">
                      {!attempted
                        ? "Complete the quiz to receive personalized study recommendations."
                        : "Review your performance details to strengthen weaker focus areas."}
                    </p>

                  </div>

                  {/* Button */}
                  <div className="flex justify-between items-center">

                    <button
                      onClick={() => startQuiz(q.quiz_id)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-medium transition-all"
                    >
                      {attempted ? "Re-attempt Quiz" : "Start Quiz"}
                    </button>

                    {attempted && (
                      <span className="text-xs text-gray-400 italic">
                        Adaptive AI Recommendation Active
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}