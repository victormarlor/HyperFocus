// C:\Users\victo\Desktop\hyperfocus\frontend\src\components\ProductiveHoursPanel.jsx

function formatSecondsToMinutes(seconds) {
  if (seconds == null) return "-";
  const s = Number(seconds);
  const minutes = Math.round(s / 60);
  return `${minutes} min`;
}

export function ProductiveHoursPanel({ hoursStats }) {
  if (!hoursStats || hoursStats.length === 0) {
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
          Productive hours
        </h2>
        <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
          No productive-hours stats loaded yet.
        </p>
      </div>
    );
  }

  const maxWork = Math.max(...hoursStats.map((h) => h.work_seconds || 0));

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
        Productive hours (last range)
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
              <th style={{ padding: "0.35rem" }}>Hour</th>
              <th style={{ padding: "0.35rem" }}>Work</th>
              <th style={{ padding: "0.35rem" }}>Interruptions</th>
              <th style={{ padding: "0.35rem" }}>Int./hour</th>
              <th style={{ padding: "0.35rem" }}>Intensity</th>
            </tr>
          </thead>
          <tbody>
            {hoursStats.map((h) => {
              const widthPercent =
                maxWork > 0 ? Math.round((h.work_seconds / maxWork) * 100) : 0;
              return (
                <tr key={h.hour}>
                  <td style={{ padding: "0.35rem" }}>
                    {String(h.hour).padStart(2, "0")}:00
                  </td>
                  <td style={{ padding: "0.35rem" }}>
                    {formatSecondsToMinutes(h.work_seconds)}
                  </td>
                  <td style={{ padding: "0.35rem" }}>{h.interruptions ?? 0}</td>
                  <td style={{ padding: "0.35rem" }}>
                    {h.interruptions_per_hour != null
                      ? h.interruptions_per_hour.toFixed(2)
                      : "-"}
                  </td>
                  <td style={{ padding: "0.35rem" }}>
                    <div
                      style={{
                        width: "100%",
                        background: "#020617",
                        borderRadius: "999px",
                        border: "1px solid #1f2933",
                        height: "0.5rem",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${widthPercent}%`,
                          height: "100%",
                          background:
                            widthPercent > 66
                              ? "#22c55e"
                              : widthPercent > 33
                              ? "#84cc16"
                              : "#4b5563",
                          transition: "width 0.2s ease-out",
                        }}
                      ></div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
