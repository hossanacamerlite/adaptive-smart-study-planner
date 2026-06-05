'use client';

import { useEffect, useState } from "react";
import user from "@/app/class/User";
import productivityImg from "../../assets/productivity.png";
import time from "../../assets/time.png";
import checked from "../../assets/checked.png";
import heartbeat from "../../assets/heart-beat.png";


export default function Dashboard() {
	const [userInfo, setUserInfo] = useState(user.getUserData().data);
	const [dashboard, setDashboard] = useState(null);
	const [error, setError] = useState(null);
	const [selectedDate, setSelectedDate] = useState(
		new Date().toISOString().split("T")[0]
	);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			try {
				setError(null);
				const userData = user.getUserData();
				const uid = userData?.data?.user_id;
				if (!uid) return;

				const res = await fetch(
					`${process.env.NEXT_PUBLIC_FLASK_SERVER_URL}/dashboard/${uid}?date=${selectedDate}`,
					{
						credentials: "include"
					}
				);

				if (!res.ok) {
					throw new Error(`Dashboard fetch failed (${res.status})`);
				}

				const data = await res.json();
				if (!cancelled) setDashboard(data);
			} catch (e) {
				if (!cancelled) setError(e?.message || "Failed to load dashboard");
			}
		}

		load();
		return () => {
			cancelled = true;
		};
	}, [selectedDate]);

	const productivity = dashboard?.last_7_days?.avg_productivity;
	const stress = dashboard?.last_7_days?.avg_stress;
	const stressTrend = dashboard?.last_7_days?.stress_trend_7d ?? [];
	const studyMinutes = dashboard?.today?.study_minutes ?? 0;
	const quizAttempts = dashboard?.today?.quiz_attempts ?? 0;
	//const todaySessions = dashboard?.today_sessions ?? [];
	const selectedSessions = dashboard?.selected_sessions ?? [];
	const recommendation = dashboard?.recommendation || "No recommendation yet.";

	const productivityPrediction =
		dashboard?.productivity_prediction || "Unknown";
		dashboard?.productivity || "Unknown";

	const isLoading = !error && dashboard == null;
	const firstName = userInfo?.first_name || userInfo?.name || "there";

	const formatPercent = (v, digits = 2) => {
		if (v == null || !Number.isFinite(Number(v))) return "--";
		return `${Number(v).toFixed(digits)}%`;
	};

	const formatStress = (v) => {
		if (v == null || !Number.isFinite(Number(v))) return "--";
		return `${Math.round(Number(v))}/5`;
	};

	const Card = ({ children, className = "" }) => (
		<div
			className={[
				"rounded-2xl border border-gray-200/70 bg-white/80 p-4 shadow-sm backdrop-blur",
				"transition-shadow hover:shadow-md",
				className
			].join(" ")}
		>
			{children}
		</div>
	);

	const SectionHeader = ({ title, subtitle, right }) => (
		<div className="flex items-start justify-between gap-3">
			<div>
				<h2 className="text-base font-semibold text-gray-900">{title}</h2>
				{subtitle ? <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p> : null}
			</div>
			{right ? <div className="text-xs text-gray-500">{right}</div> : null}
		</div>
	);

	const StatCard = ({ iconSrc, iconBg, label, value, meta }) => (
		<Card className="p-4">
			<div className="flex items-center gap-3">
				<div className={[
					"grid h-10 w-10 place-items-center rounded-xl",
					iconBg
				].join(" ")}>
					<img src={iconSrc} alt="" className="h-5 w-5" />
				</div>
				<p className="text-sm font-medium text-gray-700">{label}</p>
			</div>
			<div className="mt-4">
				<p className="text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
				<p className="mt-1 text-xs text-gray-500">{meta}</p>
			</div>
		</Card>
	);

	const StressTrendChart = ({ data }) => {
		const width = 520;
		const height = 140;
		const padding = 18;

		const values = (data || []).map((d) => (d?.avg_stress == null ? null : Number(d.avg_stress)));
		const minY = 1;
		const maxY = 5;
		const safeValues = values.map((v) => (Number.isFinite(v) ? Math.max(minY, Math.min(maxY, v)) : null));

		const usableW = width - padding * 2;
		const usableH = height - padding * 2;
		const stepX = safeValues.length > 1 ? usableW / (safeValues.length - 1) : 0;

		const points = safeValues
			.map((v, i) => {
				const x = padding + i * stepX;
				const y = v == null ? null : padding + (1 - (v - minY) / (maxY - minY)) * usableH;
				return { x, y, v };
			})
			.filter((p) => p.y != null);

		const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
		const last = points[points.length - 1];

		return (
			<Card className="h-full">
				<SectionHeader
					title="Stress trend"
					subtitle="Past 7 days"
					right={last?.v != null ? `Latest: ${Math.round(last.v)}/5` : null}
				/>

				<svg className="mt-4 w-full" viewBox={`0 0 ${width} ${height}`}>
					<defs>
						<linearGradient id="stressLine" x1="0" y1="0" x2="1" y2="0">
							<stop offset="0%" stopColor="#7c3aed" />
							<stop offset="100%" stopColor="#ec4899" />
						</linearGradient>
					</defs>

					<line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" />
					<line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" />
					{[1, 2, 3, 4, 5].map((t) => {
						const y = padding + (1 - (t - minY) / (maxY - minY)) * usableH;
						return (
							<g key={t}>
								<line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f3f4f6" />
								<text x={padding - 6} y={y + 4} fontSize="7" fill="#6b7280" textAnchor="end">
									{t}
								</text>
							</g>
						);
					})}

					{polyline ? <polyline fill="none" stroke="url(#stressLine)" strokeWidth="2.5" points={polyline} /> : null}
					{points.map((p, idx) => (
						<circle key={idx} cx={p.x} cy={p.y} r="3" fill="#7c3aed" />
					))}
				</svg>

				<div className="mt-2 grid grid-cols-7 gap-1 text-[10px] text-gray-500">
					{(data || []).slice(0, 7).map((d, i) => (
						<div key={i} className="text-center">
							{d?.date ? String(d.date).slice(5) : "--"}
						</div>
					))}
				</div>
			</Card>
		);
	};

	const TodaySessions = ({ sessions }) => {
		const normalizeColor = (c) => {
			if (!c) return null;
			const s = String(c).trim();
			if (!s) return null;
			if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`;
			return s;
		};

		const formatTime = (v) => {
			if (!v) return null;
			// Could be "HH:MM:SS" or "0:45:00" (timedelta string); keep it simple.
			const s = String(v);
			const match = s.match(/(\d{1,2}:\d{2})(?::\d{2})?/);
			return match ? match[1] : s;
		};

		return (
			<Card className="h-full">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h2 className="text-base font-semibold text-gray-900">
							Study Schedule
						</h2>
						<p className="text-xs text-gray-500">
							{selectedDate}
						</p>
					</div>

					<div className="flex gap-2">
						<button
							onClick={() => {
								const d = new Date(selectedDate);
								d.setDate(d.getDate() - 1);
								setSelectedDate(d.toISOString().split("T")[0]);
							}}
							className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-100"
						>
							←
						</button>

						<button
							onClick={() =>
								setSelectedDate(new Date().toISOString().split("T")[0])
							}
							className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-100"
						>
							Today
						</button>

						<button
							onClick={() => {
								const d = new Date(selectedDate);
								d.setDate(d.getDate() + 1);
								setSelectedDate(d.toISOString().split("T")[0]);
							}}
							className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-100"
						>
							→
						</button>
					</div>
				</div>


				<div className="mt-3 max-h-[300px] overflow-y-auto pr-1">
					{!sessions?.length ? (
						<p className="text-sm text-gray-500">No sessions found for today.</p>
					) : (
						<>
							{isLoading ? (
								<div className="h-9 w-40 animate-pulse rounded-xl bg-gray-200/70" />
							) : (
								<div className="text-sm text-gray-600">
									<span className="font-medium text-gray-900">{selectedSessions?.length || 0}</span>{" "}
									sessions
								</div>
							)}
							<ul className="space-y-3">
								{sessions.map((s) => (
									<li
										key={s.session_id}
										className="rounded-xl border border-gray-200/70 bg-white p-3 shadow-sm"
										style={{ borderLeft: `6px solid ${normalizeColor(s.subject_color) || "#e5e7eb"}` }}
									>
										<div className="flex items-start justify-between gap-3">
											<div>
												<p className="font-medium text-gray-900">{s.subject_name || "Untitled subject"}</p>
												<p className="text-sm text-gray-600">{s.topic || "No topic"}</p>
											</div>
											<div className="text-right">
												<p className="text-sm font-medium text-gray-900">
													{formatTime(s.start_time) || "--"} - {formatTime(s.end_time) || "--"}
												</p>
												{s?.location ? <p className="text-xs text-gray-500">{s.location}</p> : null}
											</div>
										</div>
									</li>
								))}
							</ul>
						</>
					)}
				</div>
			</Card>
		);
	};

	const SubjectList = ({ subjects }) => {
		const normalizeColor = (c) => {
			if (!c) return null;
			const s = String(c).trim();
			if (!s) return null;
			// allow "ff00aa" or "#ff00aa"
			if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`;
			return s;
		};

		return (
			<Card>
				<SectionHeader title="Subjects" subtitle="Your active subjects" right={subjects?.length || 0} />

				{!subjects?.length ? (
					<p className="mt-3 text-sm text-gray-500">No subjects yet.</p>
				) : (
					<ul className="mt-3 space-y-2">
						{subjects.map((subj) => {
							const color = normalizeColor(subj.color) || "#e5e7eb";
							return (
								<li
									key={subj.subject_id}
									className="rounded-xl border border-gray-200/70 bg-white p-3 shadow-sm"
									style={{ borderLeft: `6px solid ${color}` }}
								>
									<p className="font-medium text-gray-900">{subj.name || "Untitled subject"}</p>
									<p className="text-xs text-gray-500">{subj.color || "—"}</p>
								</li>
							);
						})}
					</ul>
				)}
			</Card>
		);
	};

	return (
		<>
			<div className=" from-gray-50 to-white">
				<div className="mx-auto px-4  md:px-6">
					<div className="flex items-start">
						<div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
							<div>
								<h1 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
									Hi {firstName}
								</h1>
								<p className="text-sm text-gray-600">Here's your study overview for today.</p>
							</div>
						</div>
					</div>

					{error ? (
						<div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							{error}
						</div>
					) : null}

					<div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<StatCard
							iconSrc={productivityImg.src}
							iconBg="bg-purple-100"
							label="Predicted Productivity"
							value={isLoading ? "--" : productivityPrediction}
							meta="AI prediction"
						/>
						<StatCard
							iconSrc={time.src}
							iconBg="bg-blue-100"
							label="Study time"
							value={isLoading ? "--" : `${studyMinutes.toFixed(2)} min`}
							meta="Today"
						/>
						<StatCard
							iconSrc={heartbeat.src}
							iconBg="bg-red-100"
							label="Stress level"
							value={isLoading ? "--" : formatStress(stress)}
							meta="Avg (last 7 days)"
						/>
						<StatCard
							iconSrc={checked.src}
							iconBg="bg-green-100"
							label="Quizzes attempted"
							value={isLoading ? "--" : quizAttempts}
							meta="Today"
						/>
					</div>
					<div className=" col-span-full w-full mt-2">
						<Card className="w-full">
							<SectionHeader
								title="AI Study Recommendation"
								subtitle="Based on your productivity and stress trends"
							/>
							<div className="mt-4 rounded-xl bg-blue-50 p-4">
								<p className="mt-3 text-sm leading-relaxed text-gray-700">
									{isLoading ? "Loading recommendation..." : recommendation}
								</p>
							</div>
						</Card>
					</div>
					<div className="mt-2 grid grid-cols-1 gap-6 lg:grid-cols-3">
						<div className="lg:col-span-2">
							<StressTrendChart data={stressTrend} />
						</div>
						<div className="lg:col-span-1 space-y-6">
							<TodaySessions sessions={selectedSessions} />
							{/* If you want subjects visible here, uncomment: */}
							{/* <SubjectList subjects={subjects} /> */}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}