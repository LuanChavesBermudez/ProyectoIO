import { useState } from "react"
import "./MultiplicacionMatrices.css"
import { buildTree, assignPositions, collectAll, getTreeDepth } from "./treeUtils"


//Construye un arbol basado en las prioridades de las multiplicaciones
function MatrixTree({ P }) {
  const SLOT = 64
  const ROW  = 72
  const PAD  = 40

  const root     = buildTree(P, 0, P.length - 1)
  assignPositions(root)

  const maxDepth  = getTreeDepth(root)
  const svgW      = P.length * SLOT + PAD * 2
  const svgH      = (maxDepth + 1) * ROW + 40

  const cx = node => node.x * SLOT + PAD + SLOT / 2
  const cy = node => node.depth * ROW + 36

  const { nodes, edges } = collectAll(root)

  return (
    <div className="mm-tree">
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: "block" }}>
        {edges.map((e, i) => (
          <line key={i}
            x1={cx(e.from)} y1={cy(e.from)}
            x2={cx(e.to)}   y2={cy(e.to)}
            stroke="#c4aa00" strokeWidth="2"
          />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            {n.leaf
              ? <circle cx={cx(n)} cy={cy(n)} r={16} fill="#0c1a2e" stroke="#1e3a5f" strokeWidth="1.5" />
              : <circle cx={cx(n)} cy={cy(n)} r={14} fill="#16133a" stroke="#3b3580" strokeWidth="1.5" />
            }
            <text
              x={cx(n)} y={cy(n) + 5}
              textAnchor="middle"
              fill={n.leaf ? "#60a5fa" : "#a78bfa"}
              fontSize="13"
              fontFamily="Space Mono, monospace"
              fontWeight={n.leaf ? "700" : "400"}
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// Muestra las matrices M y P con sus encabezados correctos

function MatrixTable({ data, highlight }) {
  const n = data[0].length
  return (
    <div className="mm-table-container">
      <table className="mm-matrix">
        <thead>
          <tr>
            <th className="corner"></th>
            {data[0].map((_, j) => <th key={j}>{j + 1}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <th>{i + 1}</th>
              {row.map((val, j) => {
                const isZero = val === 0
                const isTop  = highlight && i === 0 && j === n - 1
                return (
                  <td key={j} className={isTop ? "highlight" : isZero ? "zero" : ""}>
                    {Number.isInteger(val) ? val : val.toFixed(0)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Cuerpo

function MultiplicacionMatrices() {
  const [cadena,    setCadena]    = useState("")
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [resultado, setResultado] = useState(null)

  const handleSubmit = async () => {
    if (!cadena.trim()) return
    setLoading(true)
    setError(null)
    setResultado(null)
    try {
      const res = await fetch("http://localhost:8000/multiplicacion-matrices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cadena: cadena.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Error en el servidor")
      }
      setResultado(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKey = e => { if (e.key === "Enter") handleSubmit() }

  return (
    <div className="mm-wrap">
      <h1 className="mm-title">Multiplicación de Matrices</h1>
      <p className="mm-subtitle">MATRIX CHAIN ORDERING — PROGRAMACIÓN DINÁMICA</p>

      <div className="mm-format-box">
        <p className="mm-format-title">Formato de entrada</p>
        <p className="mm-format-text">
          Ingresa la cadena de matrices como <code>FilasxColumnas</code> separadas por <code>*</code><br />
          Las columnas de una matriz deben coincidir con las filas de la siguiente.<br />
          Ejemplo: <code>10x30*30x5*5x60*60x10</code>
        </p>
      </div>

      <div className="mm-input-row">
        <input
          className="mm-input"
          type="text"
          placeholder="ej: 2x3*3x6*6x4"
          value={cadena}
          onChange={e => setCadena(e.target.value)}
          onKeyDown={handleKey}
        />
        <button className="mm-btn" onClick={handleSubmit} disabled={loading || !cadena.trim()}>
          {loading ? "Calculando..." : "Calcular →"}
        </button>
      </div>

      {error && <div className="mm-error">⚠ {error}</div>}

      {resultado && (
        <div className="mm-results">
          <p className="mm-cadena">Cadena: <span>{resultado.cadena}</span></p>

          <div className="mm-card">
            <p className="mm-card-title">Resultado óptimo</p>
            <div className="mm-optimal">
              <span className="mm-orden">{resultado.orden_optimo}</span>
              <span className="mm-costo-badge">costo mínimo: {resultado.costo_minimo}</span>
            </div>
          </div>

          <div className="mm-card">
            <p className="mm-card-title">Árbol de multiplicación</p>
            <MatrixTree P={resultado.tabla_P} />
          </div>

          <div className="mm-card">
            <p className="mm-card-title">Tabla M — costos mínimos</p>
            <MatrixTable data={resultado.tabla_M} highlight />
          </div>

          <div className="mm-card">
            <p className="mm-card-title">Tabla P — particiones óptimas</p>
            <MatrixTable data={resultado.tabla_P} />
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiplicacionMatrices
