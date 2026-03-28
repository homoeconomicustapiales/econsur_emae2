import XLSX from "xlsx";

export default async function handler(req, res) {
  try {
    const baseUrl = `https://${req.headers.host}`;

    async function fetchExcel(url) {
      const response = await fetch(url);
      const buffer  = await response.arrayBuffer();
      return XLSX.read(buffer, { type: "buffer" });
    }

    const wb1 = await fetchExcel(`${baseUrl}/data/emae.xls`);
    const wb2 = await fetchExcel(`${baseUrl}/data/emae_gral.xls`);

    function generateDates(n) {
      const dates = [];
      let year = 2004, month = 0;
      for (let i = 0; i < n; i++) {
        const d = new Date(year, month, 1);
        dates.push(d.toISOString().split("T")[0]);
        month++;
        if (month > 11) { month = 0; year++; }
      }
      return dates;
    }

    // ── Sectorial ────────────────────────────────────────────────────────────
    const sheet1   = wb1.Sheets[wb1.SheetNames[0]];
    const rows1    = XLSX.utils.sheet_to_json(sheet1, { header: 1 });
    const dataRows1 = rows1.slice(4);
    const dates1   = generateDates(dataRows1.length);

    const sectorNames = [
      "Agricultura","Pesca","Minería","Industria","Electricidad",
      "Construcción","Comercio","Hoteles","Transporte","Finanzas",
      "Inmobiliarias","Sector Público","Educación","Salud",
      "Otros Servicios","Impuestos",
    ];

    const sectorData = {};
    sectorNames.forEach((name, i) => {
      const col = 2 + i;
      sectorData[name] = dataRows1
        .map((row, idx) => ({ time: dates1[idx], value: Number(row[col]) }))
        .filter(d => !isNaN(d.value));
    });

    // ── General ──────────────────────────────────────────────────────────────
    const sheet2    = wb2.Sheets[wb2.SheetNames[0]];
    const rows2     = XLSX.utils.sheet_to_json(sheet2, { header: 1 });
    const dataRows2 = rows2.slice(4);
    const dates2    = generateDates(dataRows2.length);

    const gralNames = [
      "EMAE Original",
      "EMAE Desestacionalizado",
      "EMAE Tendencia-Ciclo",
    ];

    const gralData = {};
    gralNames.forEach((name, i) => {
      const col = 2 + i * 2;
      gralData[name] = dataRows2
        .map((row, idx) => ({ time: dates2[idx], value: Number(row[col]) }))
        .filter(d => !isNaN(d.value));
    });

    const allSeries = { ...sectorData, ...gralData };

    return res.status(200).json({
      seriesNames: Object.keys(allSeries),
      data: allSeries,
    });

  } catch (error) {
    console.error("ERROR /api/data:", error);
    return res.status(500).json({ error: "Error procesando EMAE", detalle: error.message });
  }
}
