"use client";

import { useEffect, useState } from "react";
import { fetchSessions } from "../../services/StudySessionService";

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchSessions();

        const completedSessions = data.filter(
          (session) => session.status === "completed"
        );

        console.log('completedSessions', completedSessions)

        setSessions(completedSessions);

      } catch (error) {
        console.error("Failed to load history:", error);

      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds) return "0 min";

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins > 0) {
      return `${mins} min ${secs} sec`;
    }

    return `${secs} sec`;
  };

  // GROUP SESSIONS BY SUBJECT
  const groupedSessions = sessions.reduce((acc, session) => {
    const subject = session.subject ||"Unknown Subject";

    if (!acc[subject]) {
      acc[subject] = [];
    }

    acc[subject].push(session);

    return acc;

  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* PAGE HEADER */}
      <div className="mb-10">

        <h1 className="text-4xl font-bold text-gray-800">
          Study History
        </h1>

        <p className="text-gray-500 mt-2">
          Track your completed study sessions and progress.
        </p>

      </div>

      {/* LOADING */}
      {loading ? (

        <div className="bg-white rounded-3xl shadow-sm p-8">
          <p className="text-gray-500">
            Loading study history...
          </p>
        </div>

      ) : sessions.length === 0 ? (

        /* EMPTY STATE */
        <div className="bg-white rounded-3xl shadow-sm p-10 text-center">
          <div className="text-5xl mb-4">
            📂
          </div>
          <p className="text-gray-500 text-lg">
            No completed sessions yet.
          </p>
        </div>

      ) : (

        /* SUBJECT FOLDER CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {Object.entries(groupedSessions).map(
            ([subjectName, subjectSessions]) => {

              const totalDuration = subjectSessions.reduce(
                (sum, session) =>
                  sum + (session.actual_duration || 0),
                0
              );

              return (

                <div
                  key={subjectName}
                  className="
                    bg-white
                    rounded-3xl
                    shadow-sm
                    border border-gray-100
                    p-6
                    hover:shadow-xl
                    hover:-translate-y-1
                    transition-all duration-300
                  "
                >

                  {/* HEADER */}
                  <div className="flex items-center gap-4 mb-6">

                    {/* Folder Icon */}
                    <div className="
                      w-16 h-16
                      rounded-2xl
                      bg-indigo-100
                      flex items-center justify-center
                      text-3xl
                    ">
                      📁
                    </div>

                    <div>

                      <h2 className="text-xl font-bold text-gray-800">
                        {subjectName}
                      </h2>

                      <p className="text-sm text-gray-500 mt-1">
                        {subjectSessions.length} completed sessions
                      </p>

                    </div>

                  </div>

                  {/* STATS */}
                  <div className="space-y-3 mb-6">

                    {/* Total Time */}
                    <div className="
                      flex items-center justify-between
                      bg-gray-50
                      rounded-2xl
                      px-4 py-3
                    ">

                      <span className="text-gray-500 text-sm">
                        Total Study Time
                      </span>

                      <span className="font-semibold text-gray-800">
                        {formatDuration(totalDuration)}
                      </span>

                    </div>

                    {/* Latest Activity */}
                    <div className="
                      flex items-center justify-between
                      bg-gray-50
                      rounded-2xl
                      px-4 py-3
                    ">

                      <span className="text-gray-500 text-sm">
                        Latest Activity
                      </span>

                      <span className="font-semibold text-gray-800">
                        {subjectSessions[0]?.actual_start
                          ? new Date(
                              subjectSessions[0].actual_start
                            ).toLocaleDateString()
                          : "N/A"}
                      </span>

                    </div>

                  </div>

                  {/* RECENT SESSIONS */}
                  <div>

                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      Recent Sessions
                    </p>

                    <div className="space-y-2">

                      {subjectSessions
                        .slice(0, 3)
                        .map((session) => (

                          <div
                            key={session.session_id}
                            className="
                              flex items-center justify-between
                              bg-gray-50
                              rounded-2xl
                              px-4 py-3
                            "
                          >

                            <div>

                              <p className="text-sm font-medium text-gray-700">
                                {session.topic || "No Topic"}
                              </p>

                              <p className="text-xs text-gray-400 mt-1">
                                {session.actual_start
                                  ? new Date(
                                      session.actual_start
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </p>

                            </div>

                            <span className="
                              text-xs
                              px-3 py-1
                              rounded-full
                              bg-green-100
                              text-green-700
                              font-medium
                            ">
                              Done
                            </span>

                          </div>
                        ))}

                    </div>

                  </div>

                </div>
              );
            }
          )}

        </div>
      )}
    </div>
  );
}