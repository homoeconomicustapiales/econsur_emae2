# EMAE Dashboard — Next.js + Recharts

Dashboard interactivo del Estimador Mensual de Actividad Económica (EMAE) de Argentina.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | **Next.js 14** (Pages Router) |
| Gráficos | **Recharts 2** |
| Deploy | **Vercel** |
| Data | Excel via `xlsx` + API Routes |

---

## Estructura del proyecto

```
├── components/
│   ├── EMAEChart.jsx          # Gráfico Recharts (cliente)
│   ├── EMAEDashboard.jsx      # Dashboard principal + estado
│   ├── EMAEDashboard.module.css
├── pages/
│   ├── _app.js
│   ├── index.js               # Página principal
│   └── api/
│       ├── data.js            # API → lee emae.xls
│       └── sa.js              # API proxy → Python STL
├── public/
│   └── data/
│       ├── emae.xls           # ← colocar aquí
│       └── emae_gral.xls      # ← colocar aquí
├── styles/
│   └── globals.css
├── sa.py                      # Servidor Python STL (opcional)
├── next.config.js
├── vercel.json
└── package.json
```

---

## Setup local

```bash
npm install
npm run dev
# → http://localhost:3000
```

### Archivos de datos

Colocar los Excel en `public/data/`:
```
public/data/emae.xls
public/data/emae_gral.xls
```

---

## Deploy en Vercel

1. Push a GitHub
2. Importar repositorio en [vercel.com](https://vercel.com)
3. Framework detectado automáticamente como **Next.js**
4. Variables de entorno opcionales:
   - `SA_PYTHON_URL` — URL de tu microservicio Python STL

```bash
vercel --prod
```

---

## Desestacionalización STL (Python)

El archivo `sa.py` contiene el handler Python. Para usarlo en Vercel:

**Opción A**: Deploy separado en Railway / Render / Fly.io y apuntar `SA_PYTHON_URL` en las env vars de Vercel.

**Opción B**: Vercel Python Runtime — renombrar a `pages/api/sa.py` y ajustar headers.

---

## Funcionalidades del gráfico

- **Líneas suaves** — `type="monotone"` en Recharts
- **Tooltip personalizado** — muestra fecha, valor y color por serie
- **Leyenda interactiva** — click para ocultar/mostrar líneas
- **Modos**: Nivel / YoY % / MoM % / Desestacionalizado / Base 100
- **Tipos de gráfico**: Línea / Área / Barras
- **Filtro por fecha**
- **Responsivo** — `<ResponsiveContainer>` adapta al contenedor
- **SSR-safe** — cargado con `dynamic({ ssr: false })`

---

*Fuente: EconSur Consultora en base a MECON e INDEC*
