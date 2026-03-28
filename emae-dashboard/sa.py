import pandas as pd
import numpy as np
import json
from statsmodels.tsa.seasonal import STL
import os

def handler(request):

    try:
        # =========================
        # 📂 PATH ARCHIVO
        # =========================
        file_path = os.path.join(os.getcwd(), "data", "emae.xls")

        if not os.path.exists(file_path):
            raise Exception(f"No existe archivo: {file_path}")

        # =========================
        # 📊 LEER EXCEL
        # =========================
        df = pd.read_excel(file_path, skiprows=4)

        # =========================
        # 📅 FECHAS
        # =========================
        dates = pd.date_range(start="2004-01-01", periods=len(df), freq="MS")

        # =========================
        # 📌 COLUMNAS (desde la 3ra)
        # =========================
        series_cols = df.columns[2:]

        # =========================
        # 🔥 NOMBRES NORMALIZADOS
        # =========================
        mapping = [
            "Agricultura",
            "Pesca",
            "Minería",
            "Industria",
            "Electricidad",
            "Construcción",
            "Comercio",
            "Hoteles",
            "Transporte",
            "Finanzas",
            "Inmobiliarias",
            "Sector Público",
            "Educación",
            "Salud",
            "Otros Servicios",
            "Impuestos"
        ]

        output = {}

        # =========================
        # 🔄 LOOP SERIES
        # =========================
        for i, col in enumerate(series_cols):

            if i >= len(mapping):
                continue

            name = mapping[i]

            # =========================
            # 📊 SERIE ORIGINAL
            # =========================
            y = pd.Series(df[col].values, index=dates)

            # =========================
            # 🔥 LIMPIEZA
            # =========================
            y = pd.to_numeric(y, errors="coerce")
            y = y.replace(0, pd.NA)
            y = y.interpolate()
            y = y.dropna()

            # =========================
            # 🔥 LOG TRANSFORM (CLAVE)
            # =========================
            y_log = np.log(y)

            # =========================
            # 🔥 STL (multiplicativo via log)
            # =========================
            stl = STL(
                y_log,
                period=12,
                seasonal=13,
                trend=15,
                robust=True
            )

            res = stl.fit()

            # =========================
            # 🔥 QUITAR ESTACIONALIDAD
            # =========================
            sa_log = y_log - res.seasonal

            # volver a nivel
            sa = np.exp(sa_log)

            # =========================
            # 🔄 REINDEXAR (para frontend)
            # =========================
            sa = sa.reindex(dates)

            # =========================
            # 📦 JSON
            # =========================
            output[name] = [
                {
                    "time": d.strftime("%Y-%m-%d"),
                    "value": float(v) if pd.notna(v) else None
                }
                for d, v in sa.items()
            ]

        # =========================
        # ✅ RESPONSE
        # =========================
        return {
            "statusCode": 200,
            "body": json.dumps(output)
        }

    except Exception as e:

        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": "Error en desestacionalización STL",
                "detalle": str(e)
            })
        }
      
