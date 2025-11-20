// C:\Users\victo\Desktop\hyperfocus\frontend\src\App.jsx
import { useState } from "react";
import { API_BASE_URL } from "./config";
import { SummaryCards } from "./components/SummaryCards";
import { SessionsPanel } from "./components/SessionsPanel";
import { InterruptionsPanel } from "./components/InterruptionsPanel";
import { StatsTypesPanel } from "./components/StatsTypesPanel";
import { ProductiveHoursPanel } from "./components/ProductiveHoursPanel";
import { WeeklyPatternPanel } from "./components/WeeklyPatternPanel";
import { PeakDistractionPanel } from "./components/PeakDistractionPanel";

function App() {
  const [userId, setUserId] = useState("");
  const [range, setRange] = useState("7d");
  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [interruptions, setInterruptions] = useState([]);
  const [typeStats, setTypeStats] = useState(null);
  const [hoursStats, setHoursStats] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [peakStats, setPeakStats] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const trimmedUserId = userId.trim();

  const fetchSummary = async () => {
    if (!trimmedUserId) return;
    setLoadingSummary(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/users/${trimmedUserId}/stats/summary?range=${range}`
      );
      if (!res.ok) {
        throw new Error(`Summary failed with status ${res.status}`);
      }
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
      setGlobalError("Failed to load summary.");
    } finally {
      setLoadingSummary(false);
    }
  };
  const handleUseDemoData = async () => {
    setGlobalError("");
    setSummary(null);
    setSessions([]);
    setInterruptions([]);
    setTypeStats(null);
    setHoursStats(null);
    setWeeklyStats(null);
    setPeakStats(null);
    setSelectedSessionId(null);

    try {
      // 1) Crear usuario demo con email único
      const demoEmail = `demo+${Date.now()}@example.com`;

      const userRes = await fetch(`${API_BASE_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Demo User",
          email: demoEmail,
        }),
      });

      if (!userRes.ok) {
        throw new Error(`Demo user creation failed with status ${userRes.status}`);
      }

      const user = await userRes.json();
      const demoUserId = user.id;
      setUserId(String(demoUserId));

      // 2) Crear una sesión para ese usuario
      const sessionRes = await fetch(`${API_BASE_URL}/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: demoUserId }),
      });

      if (!sessionRes.ok) {
        throw new Error(
          `Demo session creation failed with status ${sessionRes.status}`
        );
      }

      const session = await sessionRes.json();
      const demoSessionId = session.id;

      // 3) Crear algunas interrupciones de ejemplo
      const now = new Date();
      const mkIso = (offsetMinutes) =>
        new Date(now.getTime() + offsetMinutes * 60000).toISOString();

      const interruptionsPayloads = [
        {
          type: "phone",
          description: "Checked WhatsApp messages",
          start_time: mkIso(-25),
          end_time: mkIso(-23),
        },
        {
          type: "self",
          description: "Opened Twitter for a quick scroll",
          start_time: mkIso(-18),
          end_time: mkIso(-15),
        },
        {
          type: "noise",
          description: "Street noise outside",
          start_time: mkIso(-10),
          end_time: mkIso(-9),
        },
      ];

      for (const intr of interruptionsPayloads) {
        const res = await fetch(`${API_BASE_URL}/interruptions/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: demoUserId,
            session_id: demoSessionId,
            type: intr.type,
            description: intr.description,
            start_time: intr.start_time,
            end_time: intr.end_time,
          }),
        });

        if (!res.ok) {
          console.error(
            `Failed to create demo interruption (${intr.type}) status=${res.status}`
          );
        }
      }

      // 4) Cargar dashboard normalmente con ese usuario demo
      await handleFetchAll();
    } catch (err) {
      console.error(err);
      setGlobalError(
        "Failed to create demo data. Check backend/API is running."
      );
    }
  };

  const fetchSessions = async () => {
    if (!trimmedUserId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/sessions/user/${trimmedUserId}`
      );
      if (!res.ok) {
        throw new Error(`Sessions failed with status ${res.status}`);
      }
      const data = await res.json();
      setSessions(data);
      if (selectedSessionId && !data.some((s) => s.id === selectedSessionId)) {
        setSelectedSessionId(null);
        setInterruptions([]);
      }
    } catch (err) {
      console.error(err);
      setGlobalError("Failed to load sessions.");
    }
  };

  const fetchInterruptions = async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/interruptions/session/${sessionId}`
      );
      if (!res.ok) {
        throw new Error(`Interruptions failed with status ${res.status}`);
      }
      const data = await res.json();
      setInterruptions(data);
    } catch (err) {
      console.error(err);
      setGlobalError("Failed to load interruptions.");
    }
  };

  const fetchInterruptionTypeStats = async () => {
    if (!trimmedUserId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/users/${trimmedUserId}/stats/interruption-types?range=${range}`
      );
      if (!res.ok) {
        throw new Error(`Interruption types failed with status ${res.status}`);
      }
      const data = await res.json();
      setTypeStats(data);
    } catch (err) {
      console.error(err);
      setGlobalError("Failed to load interruption type stats.");
    }
  };
  const fetchProductiveHoursStats = async () => {
    if (!trimmedUserId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/users/${trimmedUserId}/stats/productive-hours?range=${range}`
      );
      if (!res.ok) {
        throw new Error(`Productive hours failed with status ${res.status}`);
      }
      const data = await res.json();

      // Aseguramos que hoursStats SIEMPRE sea un array
      const normalized =
        Array.isArray(data) ? data : Array.isArray(data.hours) ? data.hours : [];

      setHoursStats(normalized);
    } catch (err) {
      console.error(err);
      setGlobalError("Failed to load productive-hours stats.");
    }
  };


  const fetchWeeklyPatternStats = async () => {
    if (!trimmedUserId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/users/${trimmedUserId}/stats/weekly-pattern?range=${range}`
      );
      if (!res.ok) {
        throw new Error(`Weekly pattern failed with status ${res.status}`);
      }
      const data = await res.json();

      // Aseguramos que weeklyStats SIEMPRE sea un array
      const normalized =
        Array.isArray(data) ? data : Array.isArray(data.weekly) ? data.weekly : [];

      setWeeklyStats(normalized);
    } catch (err) {
      console.error(err);
      setGlobalError("Failed to load weekly pattern stats.");
    }
  };


  const fetchPeakDistractionStats = async () => {
    if (!trimmedUserId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/users/${trimmedUserId}/stats/peak-distraction-time?range=${range}`
      );
      if (!res.ok) {
        throw new Error(
          `Peak distraction time failed with status ${res.status}`
        );
      }
      const data = await res.json();
      setPeakStats(data);
    } catch (err) {
      console.error(err);
      setGlobalError("Failed to load peak distraction time.");
    }
  };

  const handleFetchAll = async () => {
    setGlobalError("");
    setSummary(null);
    setSessions([]);
    setInterruptions([]);
    setTypeStats(null);
    setHoursStats(null);
    setWeeklyStats(null);
    setPeakStats(null);
    setSelectedSessionId(null);

    if (!trimmedUserId) {
      setGlobalError("Please enter a user ID first.");
      return;
    }

    await Promise.all([
      fetchSummary(),
      fetchSessions(),
      fetchInterruptionTypeStats(),
      fetchProductiveHoursStats(),
      fetchWeeklyPatternStats(),
      fetchPeakDistractionStats(),
    ]);
  };

  const handleSelectSession = async (sessionId) => {
    setSelectedSessionId(sessionId);
    setInterruptions([]);
    await fetchInterruptions(sessionId);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1300px",
          background: "#020617",
          borderRadius: "1rem",
          padding: "1.75rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          border: "1px solid #1e293b",
        }}
      >
        <header style={{ marginBottom: "1.25rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: "700",
              marginBottom: "0.25rem",
            }}
          >
            HyperFocus Dashboard
          </h1>
          <p
            style={{
              marginBottom: "0.75rem",
              color: "#9ca3af",
              fontSize: "0.95rem",
            }}
          >
            Enter a <strong>user ID</strong> to view sessions, interruptions and
            productivity stats.
          </p>

                    <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              type="number"
              placeholder="User ID (e.g. 1)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{
                flex: "1 1 160px",
                minWidth: "0",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #334155",
                background: "#020617",
                color: "#e5e7eb",
                outline: "none",
              }}
            />

            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #334155",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "0.85rem",
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>

            <button
              onClick={handleFetchAll}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "#22c55e",
                color: "#020617",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {loadingSummary ? "Loading..." : "Load data"}
            </button>

            <button
              onClick={handleUseDemoData}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #4b5563",
                background: "#111827",
                color: "#e5e7eb",
                fontWeight: "500",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontSize: "0.85rem",
              }}
            >
              Use demo data
            </button>
          </div>



          {globalError && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                background: "#450a0a",
                color: "#fecaca",
                fontSize: "0.9rem",
              }}
            >
              {globalError}
            </div>
          )}
        </header>

        <main
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1.2fr)",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                }}
              >
                Summary overview
              </h2>
              <SummaryCards summary={summary} />
            </div>

            <SessionsPanel
              userId={trimmedUserId}
              sessions={sessions}
              onSessionsChange={async () => {
                await fetchSessions();
                await fetchSummary();
                await fetchInterruptionTypeStats();
                await fetchProductiveHoursStats();
                await fetchWeeklyPatternStats();
                await fetchPeakDistractionStats();
              }}
              selectedSessionId={selectedSessionId}
              onSelectSession={handleSelectSession}
              setGlobalError={setGlobalError}
            />
          </div>

          <InterruptionsPanel
            userId={trimmedUserId}
            sessionId={selectedSessionId}
            interruptions={interruptions}
            onInterruptionsChange={async () => {
              await fetchInterruptions(selectedSessionId);
              await fetchSummary();
              await fetchInterruptionTypeStats();
              await fetchProductiveHoursStats();
              await fetchWeeklyPatternStats();
              await fetchPeakDistractionStats();
            }}
            setGlobalError={setGlobalError}
          />
        </main>

        <section
          style={{
            marginTop: "0.5rem",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              padding: "1rem",
              borderRadius: "0.75rem",
              background: "#020617",
              border: "1px solid #1f2933",
              maxHeight: "260px",
              overflow: "auto",
            }}
          >
            <h2
              style={{
                fontSize: "1.0rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
              }}
            >
              Raw summary response (debug)
            </h2>
            {!summary && !loadingSummary && !globalError && (
              <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                No data loaded yet. Enter a user ID and click{" "}
                <strong>Load data</strong>.
              </p>
            )}
            {summary && (
              <pre
                style={{
                  fontSize: "0.8rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {JSON.stringify(summary, null, 2)}
              </pre>
            )}
          </div>

          <StatsTypesPanel typeStats={typeStats} />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
            gap: "1rem",
            marginTop: "0.5rem",
          }}
        >
          <ProductiveHoursPanel hoursStats={hoursStats} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <PeakDistractionPanel peakStats={peakStats} />
            <WeeklyPatternPanel weeklyStats={weeklyStats} />
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
