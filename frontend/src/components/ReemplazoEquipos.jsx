import { useState } from "react"

const S = {
  root: { fontFamily: "'DM Mono', monospace", padding: "2rem", maxWidth: 860, margin: "0 auto" },
  h1: { fontSize: 20, fontWeight: 600, letterSpacing: "-0.03em", marginBottom: 4, color: "#0f0f0f" },
  sub: { fontSize: 13, color: "#888", marginBottom: 28 },
  label: { fontSize: 12, color: "#666", display: "block", marginBottom: 4, fontWeight: 500 },
  input: {
    width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #e0e0e0",
    borderRadius: 6, background: "#fafafa", color: "#111", outline: "none",
    fontFamily: "'DM Mono', monospace", boxSizing: "border-box"
  },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 },
  btn: {
    padding: "9px 22px", fontSize: 13, fontWeight: 600, borderRadius: 6,
    border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace"
  },
  btnP: { background: "#111", color: "#fff" },
  btnS: { background: "#f0f0f0", color: "#333", marginLeft: 10 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: { padding: "8px 10px", background: "#f5f5f5", borderBottom: "1px solid #e0e0e0", textAlign: "left", fontWeight: 600, color: "#444" },
  td: { padding: "7px 10px", borderBottom: "1px solid #f0f0f0", color: "#333" },
  tdG: { padding: "7px 10px", borderBottom: "1px solid #f0f0f0", color: "#16a34a", fontWeight: 700, background: "rgba(22,163,74,0.05)" },
  metric: { background: "#f9f9f9", border: "1px solid #ebebeb", borderRadius: 8, padding: "14px 16px" },
  metricVal: { fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 2 },
  metricLbl: { fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em" },
  divider: { border: "none", borderTop: "1px solid #ebebeb", margin: "24px 0" },
  secTitle: { fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 },
}

const pillStyle = (type) => {
  const map = {
    MANTENER:    { bg: "#dcfce7", color: "#15803d" },
    REEMPLAZAR:  { bg: "#fee2e2", color: "#b91c1c" },
    OBLIGATORIO: { bg: "#fef3c7", color: "#92400e" },
  }
  const { bg, color } = map[type] || map.MANTENER
  return { display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: bg, color }
}

function calcularDP(datos, precio, vidaUtil) {
  const n   = datos.length
  const INF = 1e15
  const dp  = Array.from({ length: n + 1 }, () => new Array(n + 2).fill(INF))
  const dec = Array.from({ length: n },     () => new Array(n + 2).fill(""))

  // Frontera: al final del horizonte recuperamos el valor residual de la bici que tengamos
  for (let edad = 0; edad <= n + 1; edad++) {
    const resid = datos[Math.min(edad - 1, n - 1)]?.valorResidual ?? 0
    dp[n][edad] = -resid
  }

  for (let t = n - 1; t >= 0; t--) {
    for (let edad = 1; edad <= n; edad++) {
      const obligado = vidaUtil > 0 && edad >= vidaUtil
      const mant     = datos[t].mantenimiento
      const resid    = datos[Math.min(edad - 1, n - 1)].valorResidual
      const maintSig = t + 1 < n ? datos[t + 1].mantenimiento : 0

      // Opcion MANTENER
      if (!obligado && dp[t + 1][edad + 1] < INF) {
        const c = mant + dp[t + 1][edad + 1]
        if (c < dp[t][edad]) { dp[t][edad] = c; dec[t][edad] = "MANTENER" }
      }

      // Opcion REEMPLAZAR
      const c = precio - resid + maintSig + dp[t + 1][1]
      if (c < dp[t][edad]) {
        dp[t][edad] = c
        dec[t][edad] = obligado ? "OBLIGATORIO" : "REEMPLAZAR"
      }
    }
  }

  // Reconstruir plan optimo
  const plan = []
  let edadAct = 1
  for (let t = 0; t < n; t++) {
    const d     = dec[t][edadAct]
    const resid = datos[Math.min(edadAct - 1, n - 1)].valorResidual
    plan.push({ t, edad: edadAct, decision: d, mant: datos[t].mantenimiento, resid, dpVal: dp[t][edadAct] })
    edadAct = d !== "MANTENER" ? 1 : edadAct + 1
  }

  const residFinal = datos[Math.min(edadAct - 1, n - 1)]?.valorResidual ?? 0
  const compras    = plan.filter(p => p.decision !== "MANTENER").length
  return { dp, plan, costoTotal: dp[0][1], compras, residFinal }
}

export default function ReemplazoEquipos() {
  const [años,      setAños]      = useState("")
  const [vidaUtil,  setVidaUtil]  = useState("")
  const [precio,    setPrecio]    = useState("")
  const [datos,     setDatos]     = useState([])
  const [resultado, setResultado] = useState(null)

  const generarCampos = () => {
    const n = parseInt(años)
    if (!n || n < 1) return
    const defMant = [80, 120, 180, 260, 360, 480, 630, 800, 1000, 1200]
    const p       = parseFloat(precio) || 1000
    setDatos(Array.from({ length: n }, (_, i) => ({
      año: i + 1,
      mantenimiento: defMant[i] ?? (i + 1) * 80,
      valorResidual: Math.round(p * Math.pow(0.8, i + 1))
    })))
    setResultado(null)
  }

  const actualizarDato = (i, campo, val) => {
    const nuevos = [...datos]; nuevos[i][campo] = Number(val); setDatos(nuevos)
  }

  const calcular = () => {
    if (!precio || datos.length === 0) return
    setResultado(calcularDP(datos, parseFloat(precio), parseInt(vidaUtil) || 0))
  }

  const decLabel = (d) => {
    if (d === "MANTENER")    return <span style={pillStyle("MANTENER")}>MANTENER</span>
    if (d === "OBLIGATORIO") return <span style={pillStyle("OBLIGATORIO")}>REEMPLAZAR *</span>
    return                          <span style={pillStyle("REEMPLAZAR")}>REEMPLAZAR</span>
  }

  const n = parseInt(años) || 0

  return (
    <div style={S.root}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      <h1 style={S.h1}>Reemplazo de Equipos</h1>
      <p style={S.sub}>Bicicleta repartidor · Programación dinámica</p>

      {/* Parametros */}
      <div style={S.grid3}>
        <div>
          <label style={S.label}>Años de planificación</label>
          <input style={S.input} type="number" min="1" max="10" value={años}
            onChange={e => { setAños(e.target.value); setDatos([]); setResultado(null) }} />
        </div>
        <div>
          <label style={S.label}>Precio de compra ($)</label>
          <input style={S.input} type="number" min="0" value={precio}
            onChange={e => setPrecio(e.target.value)} />
        </div>
        <div>
          <label style={S.label}>Vida útil máx. (años, 0 = sin límite)</label>
          <input style={S.input} type="number" min="0" value={vidaUtil} placeholder="0"
            onChange={e => setVidaUtil(e.target.value)} />
        </div>
      </div>
      <button style={{ ...S.btn, ...S.btnP }} onClick={generarCampos}>Generar campos →</button>

      {/* Tabla de datos */}
      {datos.length > 0 && <>
        <hr style={S.divider} />
        <p style={S.secTitle}>Datos por año de vida</p>
        <p style={{ fontSize: 12, color: "#777", marginBottom: 12 }}>
          El valor residual es lo que obtenés si vendés la bici al final de ese año de uso.
        </p>
        <div style={{ overflowX: "auto", marginBottom: 16 }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Año de vida</th>
                <th style={S.th}>Mantenimiento ($)</th>
                <th style={S.th}>Valor residual ($)</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((d, i) => (
                <tr key={i}>
                  <td style={{ ...S.td, color: "#bbb", fontWeight: 600 }}>Año {d.año}</td>
                  <td style={S.td}>
                    <input style={{ ...S.input, width: 110 }} type="number" value={d.mantenimiento}
                      onChange={e => actualizarDato(i, "mantenimiento", e.target.value)} />
                  </td>
                  <td style={S.td}>
                    <input style={{ ...S.input, width: 110 }} type="number" value={d.valorResidual}
                      onChange={e => actualizarDato(i, "valorResidual", e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button style={{ ...S.btn, ...S.btnP }} onClick={calcular}>Calcular óptimo ↗</button>
        <button style={{ ...S.btn, ...S.btnS }} onClick={() => { setDatos([]); setResultado(null) }}>Reiniciar</button>
      </>}

      {/* Resultados */}
      {resultado && <>
        <hr style={S.divider} />

        {/* Metricas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            ["$" + Math.round(resultado.costoTotal).toLocaleString(), "Costo neto total"],
            [resultado.compras + 1,                                   "Bicicletas compradas"],
            ["$" + Math.round(resultado.residFinal).toLocaleString(), "Valor residual final"],
          ].map(([v, l]) => (
            <div key={l} style={S.metric}>
              <div style={S.metricVal}>{v}</div>
              <div style={S.metricLbl}>{l}</div>
            </div>
          ))}
        </div>

        {/* Timeline visual */}
        <p style={S.secTitle}>Plan óptimo de reemplazo</p>
        <div style={{ display: "flex", gap: 6, marginBottom: 24, alignItems: "stretch", flexWrap: "wrap" }}>
          {resultado.plan.map((row, i) => {
            const isReplace = row.decision !== "MANTENER"
            const isObl     = row.decision === "OBLIGATORIO"
            const bg        = isObl ? "#fefce8" : isReplace ? "#fef2f2" : "#f0fdf4"
            const border    = isObl ? "#fde047" : isReplace ? "#fca5a5" : "#86efac"
            const textC     = isObl ? "#713f12" : isReplace ? "#991b1b" : "#166534"
            return (
              <div key={i} style={{
                flex: "1 1 0", minWidth: 64, borderRadius: 8,
                border: `1.5px solid ${border}`, background: bg,
                padding: "10px 6px", textAlign: "center"
              }}>
                <div style={{ fontSize: 10, color: "#bbb", marginBottom: 4 }}>Año {row.t + 1}</div>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{isReplace ? "🔄" : "✓"}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: textC, lineHeight: 1.3 }}>
                  {isObl ? "REEMPLAZAR*" : row.decision}
                </div>
                <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>
                  {isReplace ? `Vende $${row.resid}` : `Mant. $${row.mant}`}
                </div>
              </div>
            )
          })}
        </div>

        {/* Tabla detalle */}
        <p style={S.secTitle}>Detalle del plan</p>
        <div style={{ overflowX: "auto", marginBottom: 24 }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Año</th>
                <th style={S.th}>Edad bici</th>
                <th style={S.th}>Mant. ($)</th>
                <th style={S.th}>Val. residual ($)</th>
                <th style={S.th}>dp[t][edad] ($)</th>
                <th style={S.th}>Decisión</th>
              </tr>
            </thead>
            <tbody>
              {resultado.plan.map((row, i) => (
                <tr key={i}>
                  <td style={S.td}>t={row.t + 1}</td>
                  <td style={S.td}>{row.edad}</td>
                  <td style={S.td}>${row.mant}</td>
                  <td style={S.td}>${row.resid}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>${Math.round(row.dpVal).toLocaleString()}</td>
                  <td style={S.td}>{decLabel(row.decision)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabla DP completa */}
        <p style={S.secTitle}>Tabla dp[t][edad] — todos los estados</p>
        <p style={{ fontSize: 11, color: "#ccc", marginBottom: 10 }}>
          Verde = camino óptimo · "—" = estado inalcanzable
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Año \ Edad</th>
                {Array.from({ length: n + 1 }, (_, e) => (
                  <th key={e} style={S.th}>Edad {e}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: n + 1 }, (_, t) => (
                <tr key={t}>
                  <td style={{ ...S.td, fontWeight: 600, color: "#bbb" }}>t={t}</td>
                  {Array.from({ length: n + 1 }, (_, edad) => {
                    const val   = resultado.dp[t]?.[edad]
                    const isInf = val === undefined || Math.abs(val) >= 1e14
                    const isOpt = t < n && resultado.plan[t]?.edad === edad
                    return (
                      <td key={edad} style={isOpt ? S.tdG : S.td}>
                        {isInf ? "—" : `$${Math.round(val).toLocaleString()}`}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: "#ddd", marginTop: 10 }}>
          * REEMPLAZAR (obligatorio) = bici alcanzó la vida útil máxima.
        </p>
      </>}
    </div>
  )
}
