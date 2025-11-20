// C:\Users\victo\Desktop\hyperfocus\frontend\src\components\InterruptionsPanel.jsx
import { useState } from "react";
import { API_BASE_URL } from "../config";

function formatDateTime(dtString) {
    if (!dtString) return "—";
    const d = new Date(dtString);
    return d.toLocaleString();
}

const interruptionTypes = [
    "family",
    "phone",
    "noise",
    "self",
    "urgent_task",
    "unknown",
];

export function InterruptionsPanel({
    userId,
    sessionId,
    interruptions,
    onInterruptionsChange,
    setGlobalError,
}) {
    const [type, setType] = useState("phone");
    const [description, setDescription] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const canUseForm = !!userId && !!sessionId;

    const handleCreateInterruption = async (e) => {
        e.preventDefault();
        setGlobalError("");

        if (!canUseForm) {
            setGlobalError("Select a session before adding interruptions.");
            return;
        }
        if (!start || !end) {
            setGlobalError("Please provide both start and end datetime.");
            return;
        }

        const startIso = new Date(start).toISOString();
        const endIso = new Date(end).toISOString();

        try {
            setSubmitting(true);

            const res = await fetch(`${API_BASE_URL}/interruptions/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: Number(userId),
                    session_id: sessionId,
                    type,
                    description,
                    start_time: startIso,
                    end_time: endIso,
                }),
            });

            if (!res.ok) {
                throw new Error(`Failed to create interruption (status ${res.status})`);
            }

            setDescription("");
            setStart("");
            setEnd("");
            await onInterruptionsChange();

        } catch (err) {
            console.error(err);
            setGlobalError(
                "Could not create interruption. Check data and backend logs."
            );

        } finally {
            setSubmitting(false);
        }

    };

    return (
        <div
            style={{
                background: "#020617",
                borderRadius: "0.75rem",
                border: "1px solid #1f2933",
                padding: "1rem",
            }}
        >
            <h2
                style={{
                    fontSize: "1.05rem",
                    fontWeight: 600,
                    marginBottom: "0.75rem",
                }}
            >
                Interruptions {sessionId ? `(session ${sessionId})` : ""}
            </h2>

            {!sessionId && (
                <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                    Select a session from the left to view and log interruptions.
                </p>
            )}

            {sessionId && (
                <>
                    <form
                        onSubmit={handleCreateInterruption}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "0.75rem",
                            marginBottom: "1rem",
                            alignItems: "flex-end",
                        }}
                    >
                        <div>
                            <label
                                style={{ display: "block", fontSize: "0.8rem", marginBottom: 4 }}
                            >
                                Type
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.4rem 0.6rem",
                                    borderRadius: "0.5rem",
                                    border: "1px solid #334155",
                                    background: "#020617",
                                    color: "#e5e7eb",
                                }}
                            >
                                {interruptionTypes.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                style={{ display: "block", fontSize: "0.8rem", marginBottom: 4 }}
                            >
                                Description
                            </label>
                            <input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. Checked WhatsApp"
                                style={{
                                    width: "100%",
                                    padding: "0.4rem 0.6rem",
                                    borderRadius: "0.5rem",
                                    border: "1px solid #334155",
                                    background: "#020617",
                                    color: "#e5e7eb",
                                }}
                            />
                        </div>

                        <div>
                            <label
                                style={{ display: "block", fontSize: "0.8rem", marginBottom: 4 }}
                            >
                                Start
                            </label>
                            <input
                                type="datetime-local"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.4rem 0.6rem",
                                    borderRadius: "0.5rem",
                                    border: "1px solid #334155",
                                    background: "#020617",
                                    color: "#e5e7eb",
                                }}
                            />
                        </div>

                        <div>
                            <label
                                style={{ display: "block", fontSize: "0.8rem", marginBottom: 4 }}
                            >
                                End
                            </label>
                            <input
                                type="datetime-local"
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.4rem 0.6rem",
                                    borderRadius: "0.5rem",
                                    border: "1px solid #334155",
                                    background: "#020617",
                                    color: "#e5e7eb",
                                }}
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={!canUseForm || submitting}
                                style={{
                                    marginTop: "1.1rem",
                                    padding: "0.45rem 0.9rem",
                                    borderRadius: "0.5rem",
                                    border: "none",
                                    background: canUseForm ? "#22c55e" : "#4b5563",
                                    color: "#020617",
                                    fontWeight: 600,
                                    cursor: canUseForm ? "pointer" : "default",
                                    fontSize: "0.85rem",
                                    width: "100%",
                                }}
                            >
                                {submitting ? "Saving..." : "Add interruption"}
                            </button>
                        </div>
                    </form>

                    <div
                        style={{
                            maxHeight: "220px",
                            overflow: "auto",
                        }}
                    >
                        {(!interruptions || interruptions.length === 0) && (
                            <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                                No interruptions logged for this session yet.
                            </p>
                        )}
                        {interruptions && interruptions.length > 0 && (
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: "0.8rem",
                                }}
                            >
                                <thead>
                                    <tr style={{ color: "#9ca3af", textAlign: "left" }}>
                                        <th style={{ padding: "0.35rem" }}>ID</th>
                                        <th style={{ padding: "0.35rem" }}>Type</th>
                                        <th style={{ padding: "0.35rem" }}>Description</th>
                                        <th style={{ padding: "0.35rem" }}>Start</th>
                                        <th style={{ padding: "0.35rem" }}>End</th>
                                        <th style={{ padding: "0.35rem" }}>Duration (s)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {interruptions.map((i) => (
                                        <tr key={i.id}>
                                            <td style={{ padding: "0.35rem" }}>{i.id}</td>
                                            <td style={{ padding: "0.35rem" }}>{i.type}</td>
                                            <td style={{ padding: "0.35rem" }}>{i.description}</td>
                                            <td style={{ padding: "0.35rem" }}>
                                                {formatDateTime(i.start_time)}
                                            </td>
                                            <td style={{ padding: "0.35rem" }}>
                                                {formatDateTime(i.end_time)}
                                            </td>
                                            <td style={{ padding: "0.35rem" }}>{i.duration}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
