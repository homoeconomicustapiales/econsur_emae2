import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import styles from "./EMAEDashboard.module.css";

// ── Dynamic import prevents SSR issues with Recharts ──────────────────────────
const EMAEChart = dynamic(() => import("./EMAEChart"), { ssr: false });

// ── Palette ───────────────────────────────────────────────────────────────────
export const COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444",
  "#a855f7", "#14b8a6", "#06b6d4", "#f97316",
  "#84cc16", "#e879f9", "#fb7185", "#34d399",
  "#60a5fa", "#fbbf24", "#c084fc", "#f87171",
  "#2dd4bf", "#38bdf8", "#a3e635",
];

// ── Transforms ────────────────────────────────────────────────────────────────
function applyTransform(data, mode) {
  if (!data || data.length === 0) return [];

  if (mode === "yoy") {
    return data
      .map((d, i) => {
        if (i < 12) return null;
        const prev = data[i - 12];
        if (!prev || !prev.value || prev.value === 0) return null;
        return { ...d, value: ((d.value / prev.value) - 1) * 100 };
      })
      .filter(Boolean);
  }

  if (mode === "mom") {
    return data
      .map((d, i) => {
        if (i === 0) return null;
        const prev = data[i - 1];
        if (!prev || !prev.value || prev.value === 0) return null;
        return { ...d, value: ((d.value / prev.value) - 1) * 100 };
      })
      .filter(Boolean);
  }

  if (mode === "base100") {
    const base = data[0]?.value;
    if (!base) return data;
    return data.map(d => ({ ...d, value: (d.value / base) * 100 }));
  }

  return data;
}

function filterByDate(data, start, end) {
  return data.filter(
    d => (!start || d.time >= start) && (!end || d.time <= end)
  );
}

// ── Merge all series into Recharts format ─────────────────────────────────────
function buildChartData(rawData, selected, mode, start, end, saData) {
  if (!rawData || selected.length === 0) return [];

  const timeMap = {};

  selected.forEach(name => {
    const source = mode === "sa" && saData[name] ? saData[name] : rawData[name];
    if (!source) return;

    let series = filterByDate(source, start, end);
    if (mode !== "sa") series = applyTransform(series, mode);

    series.forEach(d => {
      if (!timeMap[d.time]) timeMap[d.time] = { time: d.time };
      timeMap[d.time][name] = d.value != null ? +d.value.toFixed(3) : null;
    });
  });

  return Object.values(timeMap).sort((a, b) => a.time.localeCompare(b.time));
}

// ── Mode labels ───────────────────────────────────────────────────────────────
const MODE_OPTIONS = [
  { value: "level",  label: "Nivel" },
  { value: "yoy",    label: "Var. Interanual (%)" },
  { value: "mom",    label: "Var. Mensual (%)" },
  { value: "sa",     label: "Desestacionalizado (STL)" },
  { value: "base100",label: "Índice Base 100" },
];

const TYPE_OPTIONS = [
  { value: "line", label: "Línea" },
  { value: "area", label: "Área" },
  { value: "bar",  label: "Barras" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function EMAEDashboard() {
  const [rawData, setRawData]       = useState(null);
  const [saData, setSaData]         = useState({});
  const [seriesNames, setSeriesNames] = useState([]);
  const [selected, setSelected]     = useState([]);
  const [mode, setMode]             = useState("level");
  const [chartType, setChartType]   = useState("line");
  const [startDate, setStartDate]   = useState("");
  const [endDate, setEndDate]       = useState("");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res  = await fetch("/api/data");
        const json = await res.json();
        setRawData(json.data);
        setSeriesNames(json.seriesNames || []);
      } catch (e) {
        setError("No se pudo cargar la data. Verifica que el servidor esté activo.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadSA() {
      try {
        const res  = await fetch("/api/sa");
        const json = await res.json();
        setSaData(json);
      } catch {
        /* SA is optional */
      }
    }
    loadSA();
  }, []);

  // ── Toggle series ───────────────────────────────────────────────────────────
  const toggleSeries = useCallback(name => {
    setSelected(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  }, []);

  // ── Chart data ──────────────────────────────────────────────────────────────
  const chartData = rawData
    ? buildChartData(rawData, selected, mode, startDate, endDate, saData)
    : [];

  // ── Color map ───────────────────────────────────────────────────────────────
  const colorMap = Object.fromEntries(
    selected.map((name, i) => [name, COLORS[i % COLORS.length]])
  );

  // ── Unit label ──────────────────────────────────────────────────────────────
  const unitLabel = {
    level:  "Índice",
    yoy:    "%",
    mom:    "%",
    sa:     "Índice (SA)",
    base100:"Base 100",
  }[mode] || "";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={styles.layout}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <span className={styles.badge}>AR · MENSUAL</span>
            <h1 className={styles.title}>EMAE Argentina</h1>
            <p className={styles.subtitle}>
              Estimador Mensual de Actividad Económica — Dashboard Macro
            </p>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Series</span>
              <span className={styles.statValue}>{seriesNames.length}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Seleccionadas</span>
              <span className={styles.statValue}>{selected.length}</span>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* ── Series buttons ── */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}>SECTORES</p>
          <div className={styles.seriesBtns}>
            {seriesNames.map(name => (
              <button
                key={name}
                className={`${styles.seriesBtn} ${selected.includes(name) ? styles.active : ""}`}
                style={selected.includes(name) ? { "--dot": colorMap[name] } : {}}
                onClick={() => toggleSeries(name)}
              >
                {selected.includes(name) && (
                  <span className={styles.dot} style={{ background: colorMap[name] }} />
                )}
                {name}
              </button>
            ))}
          </div>
        </section>

        {/* ── Controls ── */}
        <section className={styles.controls}>
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>MODO</label>
            <select
              className={styles.select}
              value={mode}
              onChange={e => setMode(e.target.value)}
            >
              {MODE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>TIPO</label>
            <select
              className={styles.select}
              value={chartType}
              onChange={e => setChartType(e.target.value)}
            >
              {TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>DESDE</label>
            <input
              type="date"
              className={styles.dateInput}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>HASTA</label>
            <input
              type="date"
              className={styles.dateInput}
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>

          {selected.length > 0 && (
            <button
              className={styles.clearBtn}
              onClick={() => setSelected([])}
            >
              Limpiar
            </button>
          )}
        </section>

        {/* ── Chart ── */}
        <section className={styles.chartWrap}>
          {loading && (
            <div className={styles.placeholder}>
              <div className={styles.spinner} />
              <span>Cargando datos EMAE…</span>
            </div>
          )}

          {error && (
            <div className={styles.placeholder}>
              <span className={styles.errorIcon}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && selected.length === 0 && (
            <div className={styles.placeholder}>
              <span className={styles.hint}>
                Seleccioná uno o más sectores arriba para visualizar
              </span>
            </div>
          )}

          {!loading && !error && selected.length > 0 && chartData.length > 0 && (
            <EMAEChart
              data={chartData}
              series={selected}
              colorMap={colorMap}
              chartType={chartType}
              unitLabel={unitLabel}
            />
          )}
        </section>

        {/* ── Source ── */}
        <footer className={styles.source}>
          <em>Fuente: EconSur Consultora en base a MECON e INDEC</em>
        </footer>
      </main>
    </div>
  );
}
