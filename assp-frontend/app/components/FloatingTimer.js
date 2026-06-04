"use client";

import { useEffect, useRef, useState } from "react";

export default function FloatingTimer() {
    const [seconds, setSeconds] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [sessionLabel, setSessionLabel] = useState("Study session");
    const tickRef = useRef(null);

    useEffect(() => {
        const check = () => {
            const user = JSON.parse(localStorage.getItem("user"));
            const userId = user?.data?.user_id;

            const startTime = localStorage.getItem(
                `user_${userId}_global_timer_start`
            );

            const label = localStorage.getItem(
                `user_${userId}_global_timer_label`
            );

            if (startTime) {
                const elapsed = Math.max(
                    0,
                    Math.floor((Date.now() - parseInt(startTime)) / 1000)
                );
                setSeconds(elapsed);
                setIsVisible(true);
                if (label) setSessionLabel(label);
            } else {
                setIsVisible(false);
                setSeconds(0);
            }
        };

        check();
        tickRef.current = setInterval(check, 1000);
        return () => clearInterval(tickRef.current);
    }, []);

    const formatTime = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
        const s = String(sec % 60).padStart(2, "0");
        return h > 0
            ? `${String(h).padStart(2, "0")}:${m}:${s}`
            : `${m}:${s}`;
    };

    const handleStop = () => {
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user?.data?.user_id;

        localStorage.removeItem(
            `user_${userId}_global_timer_start`
        );

        localStorage.removeItem(
            `user_${userId}_global_timer_label`
        );

        setIsVisible(false);
        setSeconds(0);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom duration-300">
            <div
                style={{
                    background: "var(--color-background-primary)",
                    border: "0.5px solid var(--color-border-secondary)",
                    borderRadius: "16px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    minWidth: "220px",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                }}
            >
                {/* Pulsing dot */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                        style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: "#3B6D11",
                        }}
                        className="animate-pulse"
                    />
                </div>

                {/* Label + time */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                        style={{
                            fontSize: "11px",
                            color: "var(--color-text-secondary)",
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {sessionLabel}
                    </p>
                    <p
                        style={{
                            fontSize: "20px",
                            fontWeight: 500,
                            color: "var(--color-text-primary)",
                            margin: 0,
                            fontVariantNumeric: "tabular-nums",
                            letterSpacing: "0.02em",
                        }}
                    >
                        {formatTime(seconds)}
                    </p>
                </div>

                {/* Stop button */}
                <button
                    onClick={handleStop}
                    aria-label="Stop timer"
                    style={{
                        flexShrink: 0,
                        width: "30px",
                        height: "30px",
                        borderRadius: "8px",
                        border: "0.5px solid var(--color-border-secondary)",
                        background: "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "var(--color-text-secondary)",
                        padding: 0,
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
                    </svg>
                </button>
            </div>
        </div>
    );
}