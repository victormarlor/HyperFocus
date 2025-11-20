// C:\Users\victo\Desktop\hyperfocus\frontend\src\components\SummaryCards.jsx

function formatSeconds(seconds) {
  if (seconds == null) return "-";

  const s = Number(seconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);

  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes || !hours) parts.push(`${minutes}m`);
  return parts.join(" ");
}

const cardStyle = {
  background: "#020617",
  borderRadius: "0.75rem",
  padding: "0.9rem 1rem",
  border: "1px solid #1f2933",
  minWidth: "0",
};

const labelStyle = {
  fontSize: "0.8rem",
  color: "#9ca3af",
  marginBottom: "0.1rem",
};

const valueStyle = {
  fontSize: "1.1rem",
  fontWeight: 600,
  color: "#e5e7eb",
};

export function SummaryCards({ summary }) {
  if (!summary) {
    return (
      <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
        No summary loaded yet. Enter a user ID and click{" "}
        <strong>Fetch summary</strong>.
      </p>
    );
  }

  const {
    total_sessions,
    total_interruptions,
    total_time_worked_seconds,
    total_time_lost_seconds,
    effective_time_seconds,
    interruptions_per_hour,
    average_interruption_duration_seconds,
  } = summary;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "0.9rem",
      }}
    >
      <div style={cardStyle}>
        <div style={labelStyle}>Total sessions</div>
        <div style={valueStyle}>{total_sessions ?? 0}</div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Total interruptions</div>
        <div style={valueStyle}>{total_interruptions ?? 0}</div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Time worked</div>
        <div style={valueStyle}>{formatSeconds(total_time_worked_seconds)}</div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Time lost</div>
        <div style={valueStyle}>{formatSeconds(total_time_lost_seconds)}</div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Effective focus time</div>
        <div style={valueStyle}>{formatSeconds(effective_time_seconds)}</div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Interruptions / hour</div>
        <div style={valueStyle}>
          {interruptions_per_hour != null
            ? interruptions_per_hour.toFixed(2)
            : "-"}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Avg interruption duration</div>
        <div style={valueStyle}>
          {formatSeconds(average_interruption_duration_seconds)}
        </div>
      </div>
    </div>
  );
}
