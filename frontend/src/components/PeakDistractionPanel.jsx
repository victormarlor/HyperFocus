// C:\Users\victo\Desktop\hyperfocus\frontend\src\components\PeakDistractionPanel.jsx

export function PeakDistractionPanel({ peakStats }) {
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
        Peak distraction time
      </h2>

      {!peakStats || peakStats.total_interruptions === 0 ? (
        <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
          Not enough interruptions in this range to determine a peak hour.
        </p>
      ) : (
        <div style={{ fontSize: "0.9rem" }}>
          <p style={{ marginBottom: "0.35rem" }}>
            Most distracted at{" "}
            <strong>
              {String(peakStats.peak_hour).padStart(2, "0")}:00
            </strong>
          </p>
          <p style={{ marginBottom: "0.1rem" }}>
            Interruptions in that hour:{" "}
            <strong>{peakStats.peak_interruptions}</strong>
          </p>
          <p style={{ color: "#9ca3af" }}>
            Total interruptions in range:{" "}
            <strong>{peakStats.total_interruptions}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
