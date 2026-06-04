'use client'

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Quiz from "../../../components/Quiz";
import userInstance from "@/app/class/User";
import { fetchSessions } from "@/app/services/StudySessionService";

export default function QuizPlayer() {
    const { quiz_id } = useParams();
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [subject, setSubject] = useState("");
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selected, setSelected] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [user, setUser] = useState(null);
    const [showStressModal, setShowStressModal] = useState(false);
    const [stressLevel, setStressLevel] = useState(3);
    const [attemptId, setAttemptId] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [showPredictionModal, setShowPredictionModal] = useState(false);
    const [isSubmittingStress, setIsSubmittingStress] = useState(false);

    // NEW: State for Submission Confirmation Modal
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [finalCalculatedScore, setFinalCalculatedScore] = useState(0);

    const DEMO_MODE = true;

    useEffect(() => {
        fetch(`http://localhost:5000/quiz/${quiz_id}`)
            .then((res) => res.json())
            .then((data) => {
                setQuestions(data.questions);
                setSubject(data.subject);
                setStartTime(Date.now());
            })
            .catch(err => console.error(err));
    }, [quiz_id]);

    useEffect(() => {
        const userData = userInstance.getUserData();
        if (userData.login) {
            setUser(userData.data);
        } else {
            userInstance.redirectToDashboard();
        }
    }, []);

    useEffect(() => {
        if (answers[current]) {
            const letter = answers[current].selected_option;
            setSelected(letter.charCodeAt(0) - 65);
        } else {
            setSelected(null);
        }
    }, [current, answers]);

    const userId = user?.user_id || 1;

    const handleAnswer = (selectedIndex) => {
        setSelected(selectedIndex);
        const currentQuestion = questions[current];
        const selectedLetter = String.fromCharCode(65 + selectedIndex);
        const isCorrect = selectedLetter === currentQuestion.answer;
        const updated = [...answers];
        updated[current] = {
            question_id: currentQuestion.question_id,
            selected_option: selectedLetter,
            is_correct: isCorrect ? 1 : 0
        };
        setAnswers(updated);
    };

    const handleNext = async () => {
        const currentQuestion = questions[current];
        const selectedLetter = String.fromCharCode(65 + selected);

        let newScore = score;
        if (selectedLetter === currentQuestion.answer) {
            newScore += 1;
            setScore(newScore);
        }

        if (current < questions.length - 1) {
            setCurrent(current + 1);
        } else {
            // Instead of auto-submitting, save the tentative score and prompt confirmation
            setFinalCalculatedScore(newScore);
            setShowSubmitConfirm(true);
        }
    };

    // New cleanly separated action handler for final execution
    const submitQuiz = () => {
        setShowSubmitConfirm(false);
        setShowResult(true);

        const endTime = Date.now();
        const timeTaken = Math.floor((endTime - startTime) / 1000);

        // FIX: Filter out any skipped or unattempted question slots to prevent JSON payload corruption
        const validAnswers = answers.filter(ans => ans !== undefined && ans !== null);

        fetch("http://localhost:5000/quizattempts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                quiz_id: parseInt(quiz_id),
                user_id: userId,
                started_at: new Date().toISOString(),
                finished_at: new Date().toISOString(),
                score: finalCalculatedScore,
                time_taken_sec: timeTaken,
                answers: validAnswers // Sent clean, non-sparse array here
            }),
        })
            .then(res => {
                if (!res.ok) throw new Error("Server responded with an error status");
                return res.json();
            })
            .then(data => {
                setAttemptId(data.attempt_id);
            })
            .catch(err => console.error("Error saving quiz attempt:", err));
    };

    const handleBack = () => {
        if (current > 0) {
            setCurrent(current - 1);
        }
    };

    const predictProductivity = async (quizId, stressLevel) => {
        try {
            const res = await fetch(`http://localhost:5000/quiz/${quizId}`);
            const quizIdRes = await res.json();
            if (!quizIdRes) return;

            const session_id = quizIdRes.session_id;
            const session_data = await fetchSessions({ session_id });

            let study_hours = DEMO_MODE ? 3 : (
                session_data?.length > 0 && !isNaN(parseFloat(session_data[0].planned_duration))
                    ? parseFloat(session_data[0].planned_duration) / 60
                    : 1
            );

            const exam_score = (score / questions.length) * 100;
            const productivity_score = (0.4 * study_hours) + (0.6 * exam_score);

            const response = await fetch("http://localhost:5000/predict-productivity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productivity_score, stress_level: stressLevel })
            });

            const data = await response.json();
            setPrediction(data.productivity_prediction);
        } catch (err) {
            console.error("Error predicting productivity:", err);
        }
    };

    const handleSaveStress = async () => {
        if (isSubmittingStress) return;
        setIsSubmittingStress(true);
        try {
            const res = await fetch("http://localhost:5000/stressrecord", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user?.user_id || 1,
                    attempt_id: attemptId,
                    stress_level: stressLevel,
                })
            });
            if (!res.ok) {
                const err = await res.json();
                alert(err.message || "Stress already submitted.");
                return;
            }
            await predictProductivity(quiz_id, stressLevel);
            setShowStressModal(false);
            setShowPredictionModal(true);
        } catch (err) {
            console.error("Error saving stress log:", err);
        } finally {
            setIsSubmittingStress(false);
        }
    };

    const getProductivityInfo = (level) => {
        if (level === "Low") return { color: "#E24B4A", bg: "#FCEBEB" };
        if (level === "Medium") return { color: "#BA7517", bg: "#FAEEDA" };
        return { color: "#3B6D11", bg: "#EAF3DE" };
    };

    if (!questions || questions.length === 0) {
        return (
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: "60vh", fontFamily: "'DM Sans', sans-serif",
                color: "#888", fontSize: 15
            }}>
                Loading quiz...
            </div>
        );
    }

    // ── Results screen ──
    if (showResult) {
        const pct = Math.round((score / questions.length) * 100);
        return (
            <div style={{
                maxWidth: 800, margin: "2rem auto", padding: "0 1.5rem",
                fontFamily: "'DM Sans', sans-serif"
            }}>
                {/* Score header */}
                <div style={{
                    textAlign: "center", background: "#fff",
                    border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 16,
                    padding: "2rem", marginBottom: "1.5rem"
                }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: "50%",
                        background: "#E6F1FB", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        margin: "0 auto 1rem", fontSize: 28
                    }}>
                        🎉
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 0.5rem", color: "#1a1a1a" }}>
                        Quiz Complete
                    </h1>
                    <p style={{ color: "#888", fontSize: 14, margin: "0 0 1.25rem" }}>
                        {subject}
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
                        <div>
                            <div style={{ fontSize: 32, fontWeight: 600, color: "#185FA5" }}>
                                {score}/{questions.length}
                            </div>
                            <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Score</div>
                        </div>
                        <div style={{ width: 1, background: "#eee" }} />
                        <div>
                            <div style={{ fontSize: 32, fontWeight: 600, color: pct >= 70 ? "#3B6D11" : "#E24B4A" }}>
                                {pct}%
                            </div>
                            <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Accuracy</div>
                        </div>
                    </div>
                </div>

                {/* Review */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: "1.5rem" }}>
                    {questions.map((q, index) => {
                        const userAnswer = answers[index];
                        const userLetter = userAnswer?.selected_option;
                        const correctLetter = q.answer;
                        const isCorrect = userLetter === correctLetter;

                        return (
                            <div key={index} style={{
                                background: "#fff",
                                border: `0.5px solid ${isCorrect ? "rgba(63,109,17,0.25)" : "rgba(226,74,74,0.25)"}`,
                                borderLeft: `3px solid ${isCorrect ? "#639922" : "#E24B4A"}`,
                                borderRadius: 10, padding: "1rem 1.25rem"
                            }}>
                                <p style={{ fontWeight: 500, fontSize: 14, color: "#1a1a1a", margin: "0 0 0.6rem" }}>
                                    {index + 1}. {q.question}
                                </p>
                                <p style={{ fontSize: 13, color: isCorrect ? "#3B6D11" : "#E24B4A", margin: "0 0 0.25rem" }}>
                                    {isCorrect ? "✓" : "✗"} Your answer: {userLetter || 'None'}. {userLetter ? q.options[userLetter?.charCodeAt(0) - 65] : ''}
                                </p>
                                {!isCorrect && (
                                    <p style={{ fontSize: 13, color: "#185FA5", margin: 0 }}>
                                        ✓ Correct: {correctLetter}. {q.options[correctLetter.charCodeAt(0) - 65]}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        onClick={() => setShowStressModal(true)}
                        style={{
                            flex: 1, padding: "12px 0", background: "#185FA5",
                            color: "#fff", border: "none", borderRadius: 8,
                            fontSize: 14, fontWeight: 500, cursor: "pointer"
                        }}
                    >
                        Continue →
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            flex: 1, padding: "12px 0", background: "#f7f7f6",
                            color: "#555", border: "0.5px solid #ddd",
                            borderRadius: 8, fontSize: 14, cursor: "pointer"
                        }}
                    >
                        Re-attempt
                    </button>
                </div>

                {/* MODALS RENDERED INSIDE RESULTS SCREEN (Crucial Fix) */}
                {showStressModal && renderStressModal()}
                {showPredictionModal && prediction !== null && renderPredictionModal()}
            </div>
        );
    }

    // Helper Functions to cleanly keep your Modal code dry and multi-view friendly
    function renderStressModal() {
        return (
            <div style={{ position: "fixed", inset: 0, background: "rgba(15,20,30,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 150, backdropFilter: "blur(4px)" }}>
                <div style={{ background: "#fff", borderRadius: 16, padding: "2rem", width: 340, textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
                    <div style={{ fontSize: 32, marginBottom: "0.75rem" }}>🧠</div>
                    <h2 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 0.4rem", color: "#1a1a1a" }}>How stressed are you?</h2>
                    <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 1.5rem" }}>This helps us gauge your productivity level.</p>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        {["😌", "🙂", "😐", "😟", "😰"].map((emoji, i) => (
                            <span key={i} style={{ fontSize: 20, opacity: stressLevel == i + 1 ? 1 : 0.3, transition: "opacity 0.15s" }}>{emoji}</span>
                        ))}
                    </div>
                    <input type="range" min="1" max="5" value={stressLevel} onChange={(e) => setStressLevel(parseInt(e.target.value))} style={{ width: "100%", marginBottom: "0.5rem" }} />
                    <p style={{ fontSize: 13, color: "#888", marginBottom: "1.5rem" }}>Level {stressLevel} / 5</p>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setShowStressModal(false)} style={{ flex: 1, padding: "10px 0", background: "#f7f7f6", border: "0.5px solid #ddd", borderRadius: 8, fontSize: 14, cursor: "pointer", color: "#555" }}>Cancel</button>
                        <button onClick={handleSaveStress} disabled={isSubmittingStress} style={{ flex: 1, padding: "10px 0", background: "#185FA5", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", color: "#fff" }}>Submit</button>
                    </div>
                </div>
            </div>
        );
    }

    function renderPredictionModal() {
        return (
            <div style={{ position: "fixed", inset: 0, background: "rgba(15,20,30,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 150, backdropFilter: "blur(4px)" }}>
                <div style={{ background: "#fff", borderRadius: 16, padding: "2rem", width: 340, textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
                    <div style={{ fontSize: 32, marginBottom: "0.75rem" }}>📊</div>
                    <h2 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 0.4rem", color: "#1a1a1a" }}>Study Productivity</h2>
                    <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 1.5rem" }}>Based on your score and stress level</p>
                    <div style={{ display: "inline-block", background: getProductivityInfo(prediction).bg, color: getProductivityInfo(prediction).color, borderRadius: 99, padding: "8px 24px", fontSize: 22, fontWeight: 600, marginBottom: "1.5rem" }}>{prediction}</div>
                    <button onClick={() => window.location.href = "/view/quiz"} style={{ width: "100%", padding: "12px 0", background: "#185FA5", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", color: "#fff" }}>Back to Quiz List</button>
                </div>
            </div>
        );
    }

    // ── Quiz in progress layout ──
    return (
        <div style={{
            width: "100%",
            minHeight: "100vh",
            padding: "2.5rem",
            boxSizing: "border-box",
            fontFamily: "'DM Sans', sans-serif",
            background: "#fcfcfc"
        }}>
            {/* Top Title Bar */}
            <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 0.25rem 0" }}>
                    {subject || "Untitled Module"}
                </h1>
                <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
                    Testing & Validation Progress Log
                </p>
            </div>

            <div style={{ display: "flex", gap: "2.5rem", width: "100%", alignItems: "flex-start" }}>
                {/* LEFT SIDE: Quiz Box */}
                <div style={{
                    flex: "1",
                    background: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.06)",
                    borderRadius: "16px",
                    padding: "2rem",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
                }}>
                    <Quiz
                        question={questions[current]?.question}
                        options={questions[current]?.options}
                        onAnswer={handleAnswer}
                        selected={selected}
                        onNext={handleNext}
                        onBack={handleBack}
                        current={current}
                        total={questions.length}
                        subject={subject}
                    />
                </div>

                {/* RIGHT SIDE: Navigation Box */}
                <div style={{
                    width: "320px",
                    minWidth: "320px",
                    background: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.06)",
                    borderRadius: "16px",
                    padding: "1.5rem",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                    position: "sticky",
                    top: "2.5rem"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                        <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.6px", color: "#999", fontWeight: 700 }}>Progress</span>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#185FA5" }}>{current + 1} / {questions.length}</span>
                    </div>
                    <div style={{ width: "100%", height: "5px", background: "#f0f0f0", borderRadius: "3px", marginBottom: "1.5rem", overflow: "hidden" }}>
                        <div style={{ width: `${((current + 1) / questions.length) * 100}%`, height: "100%", background: "#185FA5", transition: "width 0.25s ease" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
                        {questions.map((_, index) => {
                            const isCurrent = index === current;
                            const isAnswered = answers[index] !== undefined;
                            let badgeBg = "#f4f5f6"; let badgeColor = "#555"; let borderStyle = "1px solid transparent";
                            if (isCurrent) { badgeBg = "#185FA5"; badgeColor = "#fff"; }
                            else if (isAnswered) { badgeBg = "#E6F1FB"; badgeColor = "#185FA5"; borderStyle = "1px solid rgba(24, 95, 165, 0.2)"; }
                            return (
                                <button key={index} onClick={() => setCurrent(index)} style={{ aspectRatio: "1/1", borderRadius: "10px", display: "flex", alignItems: "center", justifyCenter: "center", fontSize: "13px", fontWeight: isCurrent || isAnswered ? "600" : "500", background: badgeBg, color: badgeColor, border: borderStyle, cursor: "pointer", transition: "all 0.15s ease" }}>
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal rendered during runtime quiz view */}
            {showSubmitConfirm && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(15,20,30,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
                    <div style={{ background: "#fff", borderRadius: 16, padding: "2.25rem 2rem", width: 380, textAlign: "center", boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}>
                        <div style={{ fontSize: 40, marginBottom: "0.5rem" }}>📝</div>
                        <h2 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 0.6rem", color: "#1a1a1a" }}>Are you ready to submit?</h2>
                        <p style={{ fontSize: 14, color: "#666", lineHeight: "1.5", margin: "0 0 2rem" }}>Once submitted, you <strong style={{ color: "#E24B4A" }}>cannot change</strong> your answers.</p>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={() => setShowSubmitConfirm(false)} style={{ flex: 1, padding: "12px 0", background: "#f7f7f6", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, fontWeight: "500", cursor: "pointer", color: "#555" }}>Cancel</button>
                            <button onClick={submitQuiz} style={{ flex: 1, padding: "12px 0", background: "#185FA5", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#fff" }}>Submit Quiz</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}