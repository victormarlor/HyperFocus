// C:\Users\victo\Desktop\hyperfocus\frontend\src\components\StatsTypesPanel.jsx

function formatPercent(value) {
  if (value == null) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return (num * 100).toFixed(1) + "%";
}

export function StatsTypesPanel({ typeStats }) {
  if (!typeStats) {
    return (
      <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
        No interruption type stats loaded yet.
      </p>
    );
  }

  const { counts, proportions, total_interruptions } = typeStats;

  const types = Object.keys(counts || {});

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
          marginBottom: "0.75rem",
          gap: "0.5rem",
          alignItems: "baseline",
        }}
      >
        <h2
          style={{
            fontSize: "1.05rem",
            fontWeight: 600,
          }}
        >
          Interruption types
        </h2>
        <span
          style={{
            fontSize: "0.8rem",
            color: "#9ca3af",
          }}
        >
          Total interruptions:{" "}
          <strong>{total_interruptions ?? 0}</strong>
        </span>
      </div>

      {(!types || types.length === 0) && (
        <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
          No interruptions recorded in this range.
        </p>
      )}

      {types && types.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.85rem",
          }}
        >
          <thead>
            <tr style={{ color: "#9ca3af", textAlign: "left" }}>
              <th style={{ padding: "0.4rem" }}>Type</th>
              <th style={{ padding: "0.4rem" }}>Count</th>
              <th style={{ padding: "0.4rem" }}>Proportion</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t}>
                <td style={{ padding: "0.4rem" }}>{t}</td>
                <td style={{ padding: "0.4rem" }}>{counts?.[t] ?? 0}</td>
                <td style={{ padding: "0.4rem" }}>
                  {formatPercent(proportions?.[t])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
