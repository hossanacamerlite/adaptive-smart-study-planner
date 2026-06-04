'use client';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import intereactionplugin from '@fullcalendar/interaction';
import { useEffect, useState, useRef } from 'react';
import { updateSession } from '../services/StudySessionService';
import SessionModal from './SessionModal';
import { fetchSubjects } from '../services/SubjectService';

export default function Timetable({ sessions = [], setSelectedDate }) {
	const calendarRef = useRef(null);
	const [events, setEvents] = useState([]);
	const [selectedSession, setSelectedSession] = useState(null);
	const [isOpenSession, setIsOpenSession] = useState(false);

	const [subjects, setSubjects] = useState([]);

	const fetchSubject = async (ids) => {
		const params = {
			subject_ids: ids
		}

		const data = await fetchSubjects(params);
		if (data.length > 0) {
			return data
		}
	}

	useEffect(() => {
		const minutesToTimeString = (time) => {
			// Already formatted
			if (typeof time === "string") {
				// If already HH:mm:ss
				if (time.includes(":")) {
					return time.length === 5 ? `${time}:00` : time;
				}
			}

			// Convert minutes to HH:mm:ss
			const hrs = Math.floor(time / 60)
				.toString()
				.padStart(2, "0");

			const mins = (time % 60)
				.toString()
				.padStart(2, "0");

			return `${hrs}:${mins}:00`;
		};

		const loadCalendarData = async () => {
			if (!sessions) return;

			if (sessions.length === 0) {
				setEvents([]);
				return;
			}

			console.log('sessions', sessions)

			const unique_subject_ids = [...new Set(sessions
				.map(s => s.subject_id)
			)];

			console.log('unique_subject_ids', unique_subject_ids)

			let subjectMap = {};
			if (unique_subject_ids.length > 0) {
				const data = await fetchSubject(unique_subject_ids.join(','));

				if (data) {
					console.log('data', data)
					data.forEach(sub => {
						// Store the entire object so we have access to name AND color
						subjectMap[sub.subject_id] = sub;
					});
				}
			}

			const calendarEvents = sessions
				.filter((s) => s.planned_date)
				.map((s) => {
					// Retrieve the subject details from our map
					const subjectDetails = subjectMap[s.subject_id];
					const eventColor = subjectDetails?.color || "#3b82f6";
					const subjectName = subjectDetails?.name || s.subject || "Untitled";

					return {
						id: s.session_id,
						// Display Subject Name followed by Topic
						title: s.topic ? `${subjectName} - ${s.topic}` : subjectName,
						start: `${s.planned_date}T${minutesToTimeString(s.start_time)}`,
						end: `${s.planned_date}T${minutesToTimeString(s.end_time)}`,
						backgroundColor: eventColor,
						borderColor: eventColor,
						classNames: ["px-2", "py-1", "text-xs", "cursor-pointer"],
						extendedProps: { ...s, subjectName, subjectColor: eventColor } // Add subjectName to props for easy access
					};
				});

			setEvents(calendarEvents);
		};

		loadCalendarData();
	}, [sessions]);

	const timeToMinutes = (timeStr) => {
		const [hours, minutes] = timeStr.split(":").map(Number);
		return hours * 60 + minutes;
	};

	const dayOfWeek = (dateStr) => {
		// If dateStr is already an ISO string (YYYY-MM-DD), 
		// appending the time ensures local time parsing.
		const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");

		return d.toLocaleDateString("en-US", { weekday: "long" });
	};

	const updateSessionTime = async (info) => {
		try {
			const planned_date = info.event.startStr.split("T")[0];
			const startDate = new Date(info.event.start);
			const endDate = new Date(info.event.end);
			const start_time = startDate.getHours() * 60 + startDate.getMinutes();
			const end_time = endDate.getHours() * 60 + endDate.getMinutes();
			const day_of_week = dayOfWeek(planned_date);

			await updateSession(info.event.id, {
				planned_date,
				start_time,
				end_time,
				day_of_week,
			});

			// Update FullCalendar local event state
			setEvents((prevEvents) =>
				prevEvents.map((event) =>
					String(event.id) === String(info.event.id)
						? {
							...event,
							start: info.event.startStr,
							end: info.event.endStr,
							extendedProps: {
								...event.extendedProps,
								planned_date,
								start_time,
								end_time,
								day_of_week,
							},
						}
						: event
				)
			);

			// Update modal selected session immediately
			setSelectedSession((prev) =>
				prev && String(prev.session_id) === String(info.event.id)
					? {
						...prev,
						planned_date,
						start_time,
						end_time,
						day_of_week,
					}
					: prev
			);

		} catch (err) {
			console.error("Error updating session:", err);
		}
	};

	const closeSessionModal = () => {
		setSelectedSession(null);
		setIsOpenSession(false);
	};

	return (
		<div className='h-full'>
			<FullCalendar
				ref={calendarRef}
				height={"100%"}
				plugins={[timeGridPlugin, intereactionplugin]}
				initialView="timeGridWeek"
				events={events}
				editable={true}
				eventOverlap={false}
				slotEventOverlap={false}
				selectOverlap={false}
				eventDrop={(info) => updateSessionTime(info)}
				eventResize={(info) => updateSessionTime(info)}
				displayEventTime={false}
				headerToolbar={{
					left: 'title',
					center: '',
					right: 'today prev next'
				}}
				buttonText={{
					today: 'Today'
				}}
				eventClick={(info) => {
					setSelectedSession(info.event.extendedProps);
					console.log(info.event.extendedProps)
					setIsOpenSession(true);
				}}
				dateClick={(info) => {
					if (setSelectedDate) {
						setSelectedDate(info.date);
					}
				}}
				eventAllow={(dropInfo, draggedEvent) => {
					return !events.some((event) => {
						if (event.id === draggedEvent.id) return false;

						return (
							dropInfo.start < new Date(event.end) &&
							dropInfo.end > new Date(event.start)
						);
					});
				}}
			/>
			{
				(isOpenSession && selectedSession) && (
					<SessionModal sessionId={selectedSession.session_id} session={selectedSession} closeModal={closeSessionModal} />
				)
			}
		</div>
	);
}