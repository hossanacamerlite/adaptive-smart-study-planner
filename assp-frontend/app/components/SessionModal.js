"use client";

import React, { useEffect, useRef, useState } from 'react';
import { deleteSession } from "../services/StudySessionService";
import TextEditor from './TextEditor';
import { saveStudyNote } from "../services/StudyNoteService";

const SessionModal = ({ sessionId, session, closeModal }) => {
	const elapsedBeforePauseRef = useRef(0);
	const [sessionData, setSessionData] = useState(null);
	const [note, setNote] = useState('');
	const [isRunning, setIsRunning] = useState(false);
	const [seconds, setSeconds] = useState(0);
	const [quizGenerated, setQuizGenerated] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [showPopup, setShowPopup] = useState(false);
	const [popupMessage, setPopupMessage] = useState("");

	// Track the local tick interval separately from the server sync interval
	const tickRef = useRef(null);
	const syncRef = useRef(null);
	const startTimeRef = useRef(null);

	useEffect(() => {
		if (session) {
			setSessionData(session);
		}
	}, [session, sessionId]);

	// Sync with server on mount and periodically, but tick locally every second
	useEffect(() => {
		const syncWithServer = async () => {
			try {
				const response = await fetch(
					`http://localhost:5000/studysessions/timer/${sessionId}`
				);
				const data = await response.json();

				const isActive = data.actual_start &&
					["ongoing", "in_progress"].includes(data.status?.toLowerCase());

				if (isActive) {
					const start = new Date(
						String(data.actual_start).replace(" ", "T")
					).getTime();

					if (!isNaN(start)) {
						startTimeRef.current = start;
						setSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
						setIsRunning(true);
					}
				} else {
					startTimeRef.current = null;
					setIsRunning(false);
				}
			} catch (error) {
				console.error("Timer sync error:", error);
			}
		};

		syncWithServer();

		// Sync with server every 10s (not every 1s — avoids stale resets)
		syncRef.current = setInterval(syncWithServer, 10000);

		return () => {
			clearInterval(syncRef.current);
			clearInterval(tickRef.current);
		};
	}, [sessionId]);

	// Local tick: increment seconds every second when running
	useEffect(() => {
		clearInterval(tickRef.current);

		if (isRunning) {
			tickRef.current = setInterval(() => {
				if (startTimeRef.current) {
					setSeconds(Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000)));
				}
			}, 1000);
		}

		return () => clearInterval(tickRef.current);
	}, [isRunning]);

	useEffect(() => {
		const savedQuizStatus = localStorage.getItem(`quiz_generated_${sessionId}`);
		if (savedQuizStatus === "true") {
			setQuizGenerated(true);
		}
	}, [sessionId]);

	const formatTime = (sec) => {
		const h = String(Math.floor(sec / 3600)).padStart(2, "0");
		const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
		const s = String(sec % 60).padStart(2, "0");
		return `${h}:${m}:${s}`;
	};

	const handleStart = async () => {
		try {
			await fetch(
				`http://localhost:5000/studysessions/${sessionId}/start`,
				{ method: "POST" }
			);

			startTimeRef.current =
				Date.now() - elapsedBeforePauseRef.current * 1000;

			setIsRunning(true);

		} catch (error) {
			console.error("Start error:", error);
		}
	};

	const handleStop = async () => {
		try {
			const res = await fetch(
				`http://localhost:5000/studysessions/${sessionId}/end`,
				{ method: "POST" }
			);

			elapsedBeforePauseRef.current = seconds;

			startTimeRef.current = null;
			setIsRunning(false);

		} catch (error) {
			console.error("Stop error:", error);
		}
	};
	const handleGenerateQuiz = async () => {
		try {
			const user = JSON.parse(localStorage.getItem("user"));
			const userId = user?.data?.user_id;
			setIsGenerating(true);
			await saveStudyNote(note);

			let plainTextNotes = "";
			if (typeof note === "object" && note !== null) {
				// Check common rich-text object attributes depending on your framework
				plainTextNotes = note.text || note.html || note.target?.value || JSON.stringify(note);
			} else {
				plainTextNotes = String(note);
			}

			// 2. Stop execution if it's still broken or empty
			if (!plainTextNotes.trim() || plainTextNotes === "[object Object]") {
				alert("The notes content is empty or unreadable. Please type some text first!");
				setIsGenerating(false);
				return;
			}

			const response = await fetch("http://localhost:5000/generate-questions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					notes: plainTextNotes,
					session_id: session.session_id,
					user_id: userId
				}),
			});

			const data = await response.json();
			console.log("QUIZ RESPONSE:", data);
			const ok = response.ok;
			console.log("RESPONSE OK?", ok);
			if (!response.ok) {
				setPopupMessage("Failed to generate quiz");
				setShowPopup(true);
				setTimeout(() => setShowPopup(false), 2500);
				setIsGenerating(false);
				return;
			}


			setQuizGenerated(true);
			localStorage.setItem(
				`user_${userId}_quiz_generated_${sessionId}`,
				"true"
			);

			localStorage.setItem("quiz_id", String(data.quiz_id));

			setPopupMessage("Notes saved & quiz generated successfully!");
			setShowPopup(true);

			setTimeout(() => {
				setShowPopup(false);
				window.location.href = "/view/quiz";
			}, 2000);

			setIsGenerating(false);
		} catch (error) {
			setIsGenerating(false);
			console.error("Error generating quiz:", error);
			setPopupMessage("Failed to generate quiz");
			setShowPopup(true);
			setTimeout(() => setShowPopup(false), 2500);
		}
	};

	const handleSave = async () => {
		const saveRes = await saveStudyNote(note);
		if (saveRes.success) {
			alert(saveRes.message);
		}
	};

	const handleDelete = async () => {
		const deleteRes = await deleteSession(sessionId);
		if (deleteRes.success) {
			closeModal();
			window.location.reload();
		}
	};

	const statusColors = {
		planned: "bg-blue-100 text-blue-800",
		in_progress: "bg-yellow-100 text-yellow-800",
		completed: "bg-green-100 text-green-800",
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 lg:p-10"
			onClick={closeModal}
		>
			{isGenerating && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
					<div className="bg-white px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
						<div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
						<h2 className="text-lg font-bold text-slate-800">Generating Quiz...</h2>
						<p className="text-sm text-slate-500">Please wait a moment</p>
					</div>
				</div>
			)}

			{showPopup && (
				<div className="fixed top-6 right-6 z-[200] animate-in fade-in slide-in-from-top duration-300">
					<div
						className={`text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 ${popupMessage.toLowerCase().includes("failed")
							? "bg-red-500"
							: "bg-emerald-600"
							}`}
					>
						<div className="text-xl">
							{popupMessage.toLowerCase().includes("failed") ? "✕" : "✓"}
						</div>
						<div>
							<h3 className="font-bold text-sm">
								{popupMessage.toLowerCase().includes("failed") ? "Error" : "Success"}
							</h3>
							<p className={`text-sm ${popupMessage.toLowerCase().includes("failed")
								? "text-red-100"
								: "text-emerald-100"
								}`}>
								{popupMessage}
							</p>
						</div>
					</div>
				</div>
			)}

			{sessionData && (
				<div
					className="bg-slate-50 w-full h-full rounded-2xl shadow-2xl flex overflow-hidden border border-slate-200"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Sidebar */}
					<div className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 shrink-0">
						<div className="flex items-center justify-between">
							<h1 className="text-xl font-bold text-slate-800 leading-tight">
								<span className="text-blue-600">{sessionData.topic}</span>
							</h1>
							<button
								onClick={closeModal}
								className="absolute top-12 right-12 p-2 rounded-full transition-colors group"
							>
								✕
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subject</label>
								<div className="mt-1 py-2 rounded-lg text-sm font-bold flex gap-2 items-center">
									<div
										className="w-4 h-4"
										style={{ backgroundColor: sessionData.subjectColor || "#cbd5e1" }}
									></div>
									{sessionData.subjectName}
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-4">
								<div>
									<label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Time</label>
									<p className="text-sm font-semibold text-slate-700 mt-1">{sessionData.start_time}</p>
								</div>
								<div>
									<label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">End Time</label>
									<p className="text-sm font-semibold text-slate-700 mt-1">{sessionData.end_time}</p>
								</div>
							</div>

							<div className="flex items-center gap-4">
								<label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Status:</label>
								<span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest ${statusColors[sessionData.status?.toLowerCase()] || "bg-slate-100"}`}>
									{sessionData.status}
								</span>
							</div>

							<div className="mt-auto pt-6 border-t border-slate-100">
								<button
									className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl transition-all active:scale-95 border border-red-200"
									onClick={handleDelete}
								>
									Delete Session
								</button>
							</div>
						</div>
					</div>

					{/* Main content */}
					<div className="flex-1 flex flex-col p-8 pt-12 overflow-hidden">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-bold text-slate-800">Notes</h2>
							<div className="flex gap-3">
								<button
									onClick={handleGenerateQuiz}
									className={`flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 ${quizGenerated
										? "bg-green-600 hover:bg-green-700 text-white"
										: "bg-blue-600 hover:bg-blue-700 text-white"
										}`}
								>
									<span className="leading-none">
										{quizGenerated ? "Quiz Generated" : "Generate Quiz"}
									</span>
								</button>
								<button
									className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-all active:scale-95"
									onClick={handleSave}
								>
									Save Notes
								</button>
							</div>
						</div>

						{/* Timer */}
						<div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
							<div className="text-blue-700 font-bold text-lg">⏱ {formatTime(seconds)}</div>
							<div className="flex gap-2">
								<button
									onClick={handleStart}
									className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg"
								>
									Start
								</button>
								<button
									onClick={handleStop}
									className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg"
								>
									Stop
								</button>
							</div>
						</div>

						<div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
							<TextEditor sessionId={sessionId} onChange={setNote} />
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default SessionModal;