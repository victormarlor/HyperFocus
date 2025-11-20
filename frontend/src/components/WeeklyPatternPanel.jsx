// C:\Users\victo\Desktop\hyperfocus\frontend\src\components\WeeklyPatternPanel.jsx

function formatSecondsToHoursMinutes(seconds) {
  if (seconds == null) return "-";
  const s = Number(seconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes || !hours) parts.push(`${minutes}m`);
  return parts.join(" ");
}

export function WeeklyPatternPanel({ weeklyStats }) {
  if (!weeklyStats || weeklyStats.length === 0) {
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
            marginBottom: "0.5rem",
          }}
        >
          Weekly pattern
        </h2>
        <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
          No weekly pattern stats loaded yet.
        </p>
      </div>
    );
  }

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
          marginBottom: "0.5rem",
        }}
      >
        Weekly pattern (work vs. interruptions)
      </h2>

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
            fontSize: "0.8rem",
          }}
        >
          <thead>
            <tr style={{ color: "#9ca3af", textAlign: "left" }}>
              <th style={{ padding: "0.35rem" }}>Day</th>
              <th style={{ padding: "0.35rem" }}>Work</th>
              <th style={{ padding: "0.35rem" }}>Time lost</th>
              <th style={{ padding: "0.35rem" }}>Effective</th>
              <th style={{ padding: "0.35rem" }}>Interruptions</th>
            </tr>
          </thead>
          <tbody>
            {weeklyStats.map((d) => (
              <tr key={d.weekday_index}>
                <td style={{ padding: "0.35rem", textTransform: "capitalize" }}>
                  {d.weekday_name}
                </td>
                <td style={{ padding: "0.35rem" }}>
                  {formatSecondsToHoursMinutes(d.work_seconds)}
                </td>
                <td style={{ padding: "0.35rem" }}>
                  {formatSecondsToHoursMinutes(d.time_lost_seconds)}
                </td>
                <td style={{ padding: "0.35rem" }}>
                  {formatSecondsToHoursMinutes(d.effective_time_seconds)}
                </td>
                <td style={{ padding: "0.35rem" }}>{d.interruptions ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
