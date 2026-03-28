import dynamic from "next/dynamic";

// ⚠️ Recharts usa APIs de browser (window, ResizeObserver).
// Cargar TODO el dashboard en cliente para evitar el error de SSR en Vercel.
const EMAEDashboard = dynamic(() => import("../components/EMAEDashboard"), {
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: "100vh",
      background: "#020617",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#64748b",
      fontFamily: "monospace",
      fontSize: 13,
      letterSpacing: "0.06em",
    }}>
      Cargando EMAE Dashboard…
    </div>
  ),
});

export default function Home() {
  return <EMAEDashboard />;
}
