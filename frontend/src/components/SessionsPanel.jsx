// C:\Users\victo\Desktop\hyperfocus\frontend\src\components\SessionsPanel.jsx
import { API_BASE_URL } from "../config";

function formatDateTime(dtString) {
  if (!dtString) return "—";
  const d = new Date(dtString);
  return d.toLocaleString();
}

export function SessionsPanel({
  userId,
  sessions,
  onSessionsChange,
  selectedSessionId,
  onSelectSession,
  setGlobalError,
}) {
  const hasUser = !!userId;

  const handleStartSession = async () => {
    if (!hasUser) {
      setGlobalError("Please enter a user ID before starting a session.");
      return;
    }
    try {
      setGlobalError("");
      const res = await fetch(`${API_BASE_URL}/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: Number(userId) }),
      });
      if (!res.ok) {
        throw new Error(`Failed to start session (status ${res.status})`);
      }
      await onSessionsChange(); // recargar lista de sesiones
    } catch (err) {
      console.error(err);
      setGlobalError("Could not start session. Check backend logs.");
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      setGlobalError("");
      const res = await fetch(
        `${API_BASE_URL}/sessions/${sessionId}/end`,
        { method: "POST" }
      );
      if (!res.ok) {
        throw new Error(`Failed to end session (status ${res.status})`);
      }
      await onSessionsChange();
    } catch (err) {
      console.error(err);
      setGlobalError("Could not end session. Check backend logs.");
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.75rem",
          marginBottom: "0.75rem",
          alignItems: "center",
        }}
      >
        <h2
          style={{
            fontSize: "1.05rem",
            fontWeight: 600,
          }}
        >
          Sessions
        </h2>
        <button
          onClick={handleStartSession}
          disabled={!hasUser}
          style={{
            padding: "0.35rem 0.8rem",
            borderRadius: "0.5rem",
            border: "none",
            background: hasUser ? "#22c55e" : "#4b5563",
            color: "#020617",
            fontWeight: 600,
            cursor: hasUser ? "pointer" : "default",
            fontSize: "0.85rem",
          }}
        >
          Start new session
        </button>
      </div>

      {(!sessions || sessions.length === 0) && (
        <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
          No sessions found for this user yet.
        </p>
      )}

      {sessions && sessions.length > 0 && (
        <div
          style={{
            maxHeight: "260px",
            overflow: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.85rem",
            }}
          >
            <thead>
              <tr style={{ color: "#9ca3af", textAlign: "left" }}>
                <th style={{ padding: "0.4rem" }}>ID</th>
                <th style={{ padding: "0.4rem" }}>Start</th>
                <th style={{ padding: "0.4rem" }}>End</th>
                <th style={{ padding: "0.4rem" }}>Status</th>
                <th style={{ padding: "0.4rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const isActive = !s.end_time;
                const isSelected = selectedSessionId === s.id;
                return (
                  <tr
                    key={s.id}
                    style={{
                      backgroundColor: isSelected ? "#111827" : "transparent",
                    }}
                    onClick={() => onSelectSession(s.id)}
                  >
                    <td style={{ padding: "0.4rem" }}>{s.id}</td>
                    <td style={{ padding: "0.4rem" }}>
                      {formatDateTime(s.start_time)}
                    </td>
                    <td style={{ padding: "0.4rem" }}>
                      {formatDateTime(s.end_time)}
                    </td>
                    <td style={{ padding: "0.4rem" }}>
                      {isActive ? "Active" : "Finished"}
                    </td>
                    <td style={{ padding: "0.4rem" }}>
                      {isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEndSession(s.id);
                          }}
                          style={{
                            padding: "0.25rem 0.6rem",
                            borderRadius: "0.4rem",
                            border: "none",
                            background: "#f97316",
                            color: "#020617",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                          }}
                        >
                          End
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
