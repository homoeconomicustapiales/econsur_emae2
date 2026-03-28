/**
 * /api/sa — Seasonal Adjustment endpoint
 *
 * This route is a thin proxy: it calls the Python STL endpoint.
 * In Vercel you can run Python via serverless functions (requirements.txt).
 * If you prefer, point this at an external microservice URL instead.
 *
 * For local development, set SA_PYTHON_URL in your .env.local:
 *   SA_PYTHON_URL=http://localhost:8000/sa
 */

export default async function handler(req, res) {
  const pyUrl = process.env.SA_PYTHON_URL;

  if (!pyUrl) {
    return res.status(503).json({
      error: "SA endpoint not configured",
      hint: "Set SA_PYTHON_URL in your environment variables",
    });
  }

  try {
    const response = await fetch(pyUrl);
    const data     = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error("SA proxy error:", e);
    return res.status(500).json({ error: "SA proxy failed", detalle: e.message });
  }
}
