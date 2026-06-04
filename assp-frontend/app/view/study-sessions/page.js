"use client";

import { useState, useEffect } from "react";
import TimeTable from "../../components/TimeTable";
import StudySessionForm from "../../components/StudySessionForm";
import Modal from "../../components/ui/modal";
import { fetchSessions } from "../../services/StudySessionService";
import StudySessionModal from "../../components/StudySessionModal";

export default function StudySessions() {
  const [sessions, setSessions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await fetchSessions();
      setSessions(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Manage Your Study Sessions Here</h1>

      <button
        className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded"
        onClick={() => setShowForm(true)}
      >
        + Add Study Session
      </button>

      <div className="h-[70vh]">
        {sessions.length === 0 ? (
          <p className="mt-6 text-gray-500">No study sessions yet.</p>
        ) : (
          <TimeTable
            sessions={sessions}
            setSelectedDate={setSelectedDate}
          />
        )}
      </div>

      {(showForm || selectedSession) && (
        <Modal>
          {selectedSession ? (
            <StudySessionModal
              session={selectedSession}
              closeForm={() => {
                setSelectedSession(null);
              }}
            />
          ) : (
            <StudySessionForm
              fetchSessions={loadSessions}
              fetchSessionsData={sessions}
              closeForm={() => setShowForm(false)}
            />
          )}
        </Modal>
      )}

    </div>
  );
}