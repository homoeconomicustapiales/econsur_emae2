"use client";

import { useState, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  AreaChart,
  BarChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

// ── Format helpers ────────────────────────────────────────────────────────────
function fmtDate(str) {
  if (!str) return "";
  const [y, m] = str.split("-");
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${months[+m - 1]} ${y}`;
}

function fmtValue(v, unit) {
  if (v == null) return "—";
  const abs = Math.abs(v);
  let formatted;
  if (abs >= 1000) formatted = v.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  else formatted = v.toFixed(2);
  return unit === "%" ? `${formatted}%` : formatted;
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, colorMap, unitLabel }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div style={{
      background: "#0a1628",
      border: "1px solid #1e293b",
      borderRadius: 8,
      padding: "10px 14px",
      minWidth: 180,
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    }}>
      <p style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        color: "#64748b",
        marginBottom: 8,
        letterSpacing: "0.06em",
      }}>
        {fmtDate(label)}
      </p>
      {payload
        .filter(p => p.value != null)
        .sort((a, b) => b.value - a.value)
        .map(p => (
          <div key={p.dataKey} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 4,
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: colorMap[p.dataKey] || p.stroke,
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 12,
                color: "#94a3b8",
                fontFamily: "'Syne', sans-serif",
                maxWidth: 120,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {p.dataKey}
              </span>
            </span>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              fontWeight: 500,
              color: colorMap[p.dataKey] || p.stroke,
            }}>
              {fmtValue(p.value, unitLabel)}
            </span>
          </div>
        ))}
    </div>
  );
}

// ── Custom Legend ─────────────────────────────────────────────────────────────
function CustomLegend({ series, colorMap, hiddenSeries, onToggle }) {
  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "flex-end",
      gap: "8px 14px",
      padding: "8px 16px 0",
    }}>
      {series.map(name => {
        const hidden = hiddenSeries.has(name);
        return (
          <button
            key={name}
            onClick={() => onToggle(name)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "3px 6px",
              borderRadius: 4,
              opacity: hidden ? 0.35 : 1,
              transition: "opacity 0.2s",
            }}
          >
            <span style={{
              width: 24,
              height: 2,
              background: colorMap[name],
              display: "block",
              borderRadius: 1,
            }} />
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 12,
              color: "#94a3b8",
              whiteSpace: "nowrap",
            }}>
              {name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Tick formatters ───────────────────────────────────────────────────────────
function XTick({ x, y, payload }) {
  return (
    <text
      x={x} y={y + 12}
      fill="#475569"
      textAnchor="middle"
      fontSize={10}
      fontFamily="'IBM Plex Mono', monospace"
    >
      {fmtDate(payload.value)}
    </text>
  );
}

function YTick({ x, y, payload }) {
  return (
    <text
      x={x - 8} y={y + 4}
      fill="#475569"
      textAnchor="end"
      fontSize={10}
      fontFamily="'IBM Plex Mono', monospace"
    >
      {payload.value >= 1000
        ? (payload.value / 1000).toFixed(0) + "k"
        : payload.value.toFixed(payload.value % 1 !== 0 ? 1 : 0)}
    </text>
  );
}

// ── Decide X-axis tick interval based on data length ─────────────────────────
function xInterval(len) {
  if (len <= 24)  return 2;
  if (len <= 60)  return 5;
  if (len <= 120) return 11;
  return 23;
}

// ── Main chart component ──────────────────────────────────────────────────────
export default function EMAEChart({ data, series, colorMap, chartType, unitLabel }) {
  const [hiddenSeries, setHiddenSeries] = useState(new Set());

  const toggleSeries = useCallback(name => {
    setHiddenSeries(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }, []);

  const isPercent = unitLabel === "%";
  const interval  = xInterval(data.length);

  // ── Shared props for all series types ───────────────────────────────────────
  const sharedProps = {
    data,
    margin: { top: 10, right: 24, left: 16, bottom: 10 },
  };

  // ── Shared axis / grid ───────────────────────────────────────────────────────
  const sharedAxes = (
    <>
      <CartesianGrid
        strokeDasharray="3 3"
        vertical={false}
        stroke="#1e293b"
      />
      <XAxis
        dataKey="time"
        interval={interval}
        tick={<XTick />}
        axisLine={{ stroke: "#1e293b" }}
        tickLine={false}
      />
      <YAxis
        tick={<YTick />}
        axisLine={false}
        tickLine={false}
        width={52}
      />
      {isPercent && (
        <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 2" />
      )}
      <Tooltip
        content={<CustomTooltip colorMap={colorMap} unitLabel={unitLabel} />}
        cursor={{ stroke: "#334155", strokeWidth: 1 }}
      />
    </>
  );

  // ── Series elements ──────────────────────────────────────────────────────────
  const visibleSeries = series.filter(s => !hiddenSeries.has(s));

  function buildLineSeries() {
    return series.map(name => (
      <Line
        key={name}
        type="monotone"
        dataKey={name}
        stroke={colorMap[name]}
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 4, strokeWidth: 0 }}
        hide={hiddenSeries.has(name)}
        connectNulls
        isAnimationActive={false}
      />
    ));
  }

  function buildAreaSeries() {
    return series.map(name => (
      <Area
        key={name}
        type="monotone"
        dataKey={name}
        stroke={colorMap[name]}
        strokeWidth={2}
        fill={colorMap[name] + "18"}
        dot={false}
        activeDot={{ r: 4, strokeWidth: 0 }}
        hide={hiddenSeries.has(name)}
        connectNulls
        isAnimationActive={false}
      />
    ));
  }

  function buildBarSeries() {
    return series.map(name => (
      <Bar
        key={name}
        dataKey={name}
        fill={colorMap[name]}
        hide={hiddenSeries.has(name)}
        isAnimationActive={false}
        radius={[2, 2, 0, 0]}
        maxBarSize={8}
      />
    ));
  }

  // ── Render chart by type ─────────────────────────────────────────────────────
  function renderChart() {
    if (chartType === "area") {
      return (
        <AreaChart {...sharedProps}>
          {sharedAxes}
          {buildAreaSeries()}
        </AreaChart>
      );
    }
    if (chartType === "bar") {
      return (
        <BarChart {...sharedProps} barCategoryGap="15%">
          {sharedAxes}
          {buildBarSeries()}
        </BarChart>
      );
    }
    return (
      <LineChart {...sharedProps}>
        {sharedAxes}
        {buildLineSeries()}
      </LineChart>
    );
  }

  // ── Wrapper ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", paddingBottom: 16 }}>
      {/* Legend (interactive) */}
      <CustomLegend
        series={series}
        colorMap={colorMap}
        hiddenSeries={hiddenSeries}
        onToggle={toggleSeries}
      />

      {/* Chart */}
      <div style={{ flex: 1, minHeight: 460 }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Unit badge */}
      <div style={{
        textAlign: "right",
        paddingRight: 28,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        color: "#475569",
        letterSpacing: "0.08em",
        marginTop: 4,
      }}>
        {unitLabel}
      </div>
    </div>
  );
}
