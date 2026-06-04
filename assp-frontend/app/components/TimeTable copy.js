'use client';
import { deleteSession } from "../services/StudySessionService";

export default function Timetable({ sessions = [], onSelectSession }) {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const hours = [
    "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00",
    "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
    "22:00", "23:00", "00:00"
  ];

  // Convert date → day name
  const getDayName = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long" });
  };

  // Convert minutes → HH:mm
  const formatTime = (minutes) => {
    if (minutes === null || minutes === undefined) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // Get ALL sessions for a cell
  const getSessions = (day, hour) => {
    return sessions.filter((s) => {
      if (s.start_time == null) return false;

      const sessionDay =
        s.day_of_week || getDayName(s.planned_date);

      return (
        sessionDay === day &&
        formatTime(s.start_time) === hour
      );
    });
  };


  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">
        Weekly Study Schedule
      </h3>

      {/* GRID */}
      <div
        className="grid border rounded-lg overflow-hidden"
        style={{
          gridTemplateColumns: `80px repeat(${days.length}, 1fr)`
        }}>

        {/* HEADER */}
        <div
          className="border-b bg-gray-100"></div>
        {days.map((day) => (
          <div
            key={day}
            className="border-b text-center font-semibold p-2 bg-gray-100"
          >
            {day}
          </div>
        ))}

        {/* BODY */}
        {hours.map((hour) => (
          <div key={hour} className="contents">

            {/* TIME COLUMN */}
            <div className="border-t p-2 text-sm text-gray-500">
              {hour}
            </div>

            {/* DAY CELLS */}
            {days.map((day) => {
              const sessionsList = getSessions(day, hour);
              return (
                <div
                  key={day + hour}
                  className="border-t border-l p-1 min-h-[70px]"
                >

                  {sessionsList.map((session) => (
                    <div
                      key={session.session_id}
                      onClick={() => onSelectSession(session)}
                      className="bg-indigo-500 text-white text-xs rounded p-2 shadow mb-1 cursor-pointer hover:opacity-80"
                    >
                      <div className="font-semibold">
                        {session.subject?.trim() || "No Subject"}
                      </div>
                      <div className="text-[10px]">
                        {formatTime(session.start_time)} -{" "}
                        {formatTime(session.end_time) || "--"}
                      </div>

                      {session.topic && (
                        <div className="text-[10px] opacity-80">
                          {session.topic}
                        </div>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={async () => {
                          await deleteSession(session.session_id);
                          window.location.reload();
                        }}
                        className="absolute top-1 right-1 text-[10px] text-white"
                      >
                        Delete Session
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}