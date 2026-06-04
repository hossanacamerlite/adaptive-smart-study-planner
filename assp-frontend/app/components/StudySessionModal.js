"use client";

import { useState, useEffect } from "react";
import { startSession, endSession } from "../services/StudySessionService";

export default function StudySessionModal({ session, closeForm }) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [notes, setNotes] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [quizGenerated, setQuizGenerated] = useState(false);

  // TIMER
  useEffect(() => {
    let interval;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const newTime = prev + 1;
          localStorage.setItem(`timer_${session.session_id}`, newTime);
          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, session.session_id]);

  // LOAD SAVED TIMER
  useEffect(() => {
    const saved = localStorage.getItem(`timer_${session.session_id}`);

    if (saved) {
      setSeconds(parseInt(saved));
    }
  }, [session.session_id]);

  // LOAD QUIZ STATUS
  useEffect(() => {
    const savedQuizStatus = localStorage.getItem(
      `quiz_generated_${session.session_id}`
    );

    if (savedQuizStatus === "true") {
      setQuizGenerated(true);
    }
  }, [session.session_id]);

  // TIME FORMAT
  const minutesToTime = (minutes) => {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    return `${h}:${m}`;
  };

  const getPlannedDurationText = (plannedDuration) => {
    if (!plannedDuration || plannedDuration <= 0) return "0 minutes";

    const hours = Math.floor(plannedDuration / 60);
    const minutes = plannedDuration % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minute${minutes > 1 ? "s" : ""
        }`;
    }

    if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    }

    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  };

  const formatTime = (sec) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");

    return `${h}:${m}:${s}`;
  };

  // GENERATE QUIZ
  const handleGenerateQuiz = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/quiz/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes }),
        }
      );

      const data = await response.json();

      console.log(data);

      setQuiz(data);
      setQuizGenerated(true);

      localStorage.setItem(
        `quiz_generated_${session.session_id}`,
        "true"
      );
    } catch (error) {
      console.error("Error generating quiz:", error);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">
        📘 {session.subject}
      </h2>

      <p className="text-sm mb-4">
        Topic: {session.topic || "N/A"}
        <br />
        Time: {minutesToTime(session.start_time)} -{" "}
        {minutesToTime(session.end_time)}
        <br />
        Duration:{" "}
        {getPlannedDurationText(session.planned_duration)}
      </p>

      {/* TIMER */}
      <div className="bg-blue-50 border rounded-lg p-3 mb-4 flex items-center justify-between">
        <span className="text-blue-700 font-bold text-lg">
          ⏱ {formatTime(seconds)}
        </span>
      </div>

      {/* START STOP */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={async () => {
            setIsRunning(true);
            await startSession(session.session_id);
          }}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
        >
          Start
        </button>

        <button
          onClick={async () => {
            setIsRunning(false);

            await endSession(session.session_id, {
              time_spent: seconds,
              notes: notes,
            });

            localStorage.removeItem(
              `timer_${session.session_id}`
            );
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
        >
          Stop
        </button>
      </div>

      {/* NOTES */}
      <textarea
        placeholder="Type your notes here..."
        className="w-full h-32 border rounded p-2 mb-3"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {/* QUIZ BUTTON */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleGenerateQuiz}
          className={`px-4 py-2 rounded text-white font-medium transition
      ${quizGenerated
              ? "bg-green-600 hover:bg-green-700"
              : "bg-purple-600 hover:bg-purple-700"
            }`}
        >
          {quizGenerated ? "Generate Again" : "Generate Quiz"}
        </button>
      </div>

      {/* GENERATED QUIZ */}
      {quiz && (
        <div className="mt-4 p-3 border rounded bg-gray-50">
          <h3 className="font-bold mb-2">
            Generated Quiz:
          </h3>
          <pre className="text-sm whitespace-pre-wrap">
            {JSON.stringify(quiz, null, 2)}
          </pre>
        </div>
      )}

      {/* CLOSE */}
      <div className="mt-4">
        <button
          onClick={closeForm}
          className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}