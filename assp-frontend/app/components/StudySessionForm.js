"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  createSession,
  updateSession,
} from "../services/StudySessionService";

import { fetchSubjects } from "../services/SubjectService";

export default function StudySessionForm({
  fetchSessions,
  fetchSessionsData = [],
  closeForm,
  session,
}) {
  const [subject, setSubject] = useState(session?.subject || "");
  const [subjectId, setSubjectId] = useState(session?.subject_id || "");
  const [topic, setTopic] = useState(session?.topic || "");
  const [day, setDay] = useState(session?.day_of_week || "");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [subjects, setSubjects] = useState([]);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    fetchSubject();
  }, []);

  const fetchSubject = async () => {
    try {
      const data = await fetchSubjects();

      if (data.length > 0) {
        setSubjects(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;

    const [hours, minutes] = timeStr.split(":").map(Number);

    return hours * 60 + minutes;
  };

  const normalizeTime = (time) => {
    // Already number
    if (typeof time === "number") {
      return time;
    }

    // Convert "08:00:00"
    if (typeof time === "string") {
      const clean = time.slice(0, 5);
      return timeToMinutes(clean);
    }

    return 0;
  };

  function findNearestDate(targetDay) {
    const today = new Date();

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const targetIndex = dayNames.indexOf(targetDay);

    if (targetIndex === -1) return null;

    const todayIndex = today.getDay();

    let diff = targetIndex - todayIndex;

    if (diff < 0) diff += 7;

    const nearestDate = new Date(today);

    nearestDate.setDate(today.getDate() + diff);

    const yyyy = nearestDate.getFullYear();

    const mm = String(nearestDate.getMonth() + 1).padStart(2, "0");

    const dd = String(nearestDate.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  }

  const handleSave = async () => {
    try {
      if (!subjectId || !topic || !day || !start || !end) {
        toast.error("Please fill all fields.");
        return;
      }

      const startMinutes = timeToMinutes(start);
      const endMinutes = timeToMinutes(end);

      // Prevent invalid time
      if (startMinutes >= endMinutes) {
        toast.error("End time must be after start time.");
        return;
      }

      console.log("Current sessions:", fetchSessionsData);

      // Clash checking
      const clash = (fetchSessionsData || []).some((s) => {
        // Ignore same session when editing
        if (
          session &&
          String(s.session_id) === String(session.session_id)
        ) {
          return false;
        }

        // Different day
        if (s.day_of_week !== day) {
          return false;
        }

        const existingStart = normalizeTime(s.start_time);
        const existingEnd = normalizeTime(s.end_time);

        return (
          startMinutes < existingEnd &&
          endMinutes > existingStart
        );
      });

      console.log("Clash result:", clash);

      if (clash) {
        toast.error("This study session clashes with another session!");
        return;
      }

      const newSession = {
        subject,
        subject_id: subjectId,
        topic,
        day_of_week: day,
        planned_date: findNearestDate(day),
        start_time: startMinutes,
        end_time: endMinutes,
      };

      if (session) {
        await updateSession(session.session_id, newSession);
      } else {
        await createSession(newSession);
      }

      await fetchSessions();

      closeForm();

      toast.success("Study session saved successfully!");

    } catch (err) {
      console.error("Error saving session:", err);
      toast.error("Something went wrong while saving.");
    }
  };

  return (
    <div className="z-50 bg-white p-6 rounded-xl w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">
        {session ? "Edit Study Session" : "Add Study Session"}
      </h3>

      {/* SUBJECT */}
      <label className="block text-sm font-medium mb-1">
        Add Subject Here:
      </label>

      <select
        value={subjectId}
        className="w-full border p-2 rounded mb-4 bg-white"
        onChange={(e) => {
          const selectedId = e.target.value;

          setSubjectId(selectedId);

          const selectedSubject = subjects.find(
            (s) => String(s.subject_id) === String(selectedId)
          );

          if (selectedSubject) {
            setSubject(selectedSubject.name);
          }
        }}
      >
        <option value="">-- Choose a Subject --</option>

        {subjects.map((s) => (
          <option key={s.subject_id} value={s.subject_id}>
            {s.name}
          </option>
        ))}
      </select>

      {/* TOPIC */}
      <label className="block text-sm font-medium mb-1">
        Add Topic Here:
      </label>

      <input
        value={topic}
        placeholder="e.g Algebra, Physics"
        className="w-full border p-2 rounded mb-4"
        onChange={(e) => setTopic(e.target.value)}
      />

      {/* DAY */}
      <label className="block text-sm font-medium mb-1">
        Select Day:
      </label>

      <select
        value={day}
        className="w-full border rounded-lg p-3 mb-4"
        onChange={(e) => setDay(e.target.value)}
      >
        <option value="">-- Select Day --</option>

        {days.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      {/* START */}
      <label className="block text-sm font-medium mb-1">
        Start Time:
      </label>

      <input
        type="time"
        step="60"
        value={start}
        className="w-full border p-2 rounded mb-4"
        onChange={(e) => setStart(e.target.value)}
      />

      {/* END */}
      <label className="block text-sm font-medium mb-1">
        End Time:
      </label>

      <input
        type="time"
        step="60"
        value={end}
        className="w-full border p-2 rounded mb-6"
        onChange={(e) => setEnd(e.target.value)}
      />

      {/* BUTTONS */}
      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          onClick={handleSave}
        >
          Save Study Session
        </button>

        <button
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          onClick={closeForm}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}