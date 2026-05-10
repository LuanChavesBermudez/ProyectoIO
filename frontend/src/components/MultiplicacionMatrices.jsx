import React, { useState } from "react"
import "./Estilos.css"
import { buildTree, assignPositions, collectAll, getTreeDepth } from "./treeUtils"

// Árbol, creado con SVG
function MatrizTree({ P }) {
  const SLOT = 64 //distancia entre nodos(Horizontal)
  const ROW  = 72 //distancia entre nodos(Vertical)
  const PAD  = 40 //padding

  const root = buildTree(P, 0, P.length - 1) 
  assignPositions(root)

  const maxDepth = getTreeDepth(root) //niveles del arbol
  const svgW = P.length * SLOT + PAD * 2
  const svgH = (maxDepth + 1) * ROW + 40

  const cx = node => node.x * SLOT + PAD + SLOT / 2
  const cy = node => node.depth * ROW + 36

  const { nodes, edges } = collectAll(root)

  return (
    <div className="mm-tree">
      <svg width={svgW} height={svgH}>
        {edges.map((e, i) => (
          <line key={i}
            x1={cx(e.from)} y1={cy(e.from)}
            x2={cx(e.to)}   y2={cy(e.to)}
            stroke="#c4aa00" strokeWidth="2"
          />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={cx(n)} cy={cy(n)}
              r={n.leaf ? 16 : 14}
              fill={n.leaf ? "#0c1a2e" : "#16133a"}
              stroke={n.leaf ? "#1e3a5f" : "#3b3580"}
            />
            <text
              x={cx(n)} y={cy(n) + 5}
              textAnchor="middle"
              fill={n.leaf ? "#60a5fa" : "#a78bfa"}
              fontSize="13"
              fontFamily="Space Mono, monospace"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// Tabla
function MatrizTable({ data, highlight }) {
  const n = data[0].length

  return (
    <div className="mm-table-container">
      <table className="mm-matrix">
        <thead>
          <tr>
            <th></th>
            {data[0].map((_, j) => <th key={j}>{j + 1}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <th>{i + 1}</th>
              {row.map((val, j) => {
                const isTop = highlight && i === 0 && j === n - 1
                return (
                  <td key={j} className={isTop ? "highlight" : ""}>
                    {val}
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

//Recorre la matriz M en diagonal y realiza los cálculos necesarios para determinar el menor costo
function MultiplicacionMatricesAlgoritmo(cadena) {
    cadena = cadena.replaceAll(" ", "")
    const d = cadena.split("*").map(n => parseInt(n))
    const n = d.length - 1 //longitud de la matriz

    const M = Array.from({ length: n }, () => Array(n).fill(0)) //matriz de costo optimo
    const P = Array.from({ length: n }, () => Array(n).fill(0)) //matriz posiciones

    for (let i = 1; i < n; i++) {
        for (let j = i; j < n; j++) {
            const a = j - i //valor de i
            const valores = []

            for (let k = a; k < j; k++) { //casos de k
                valores.push([
                    M[a][k] + M[k + 1][j] + (d[a] * d[j + 1] * d[k + 1]),
                    k
                ]) //los valores de indice de d son acordes a su contraparte real, se ajusta para que no haya problemas
            }

            const minimo = valores.reduce((min, actual) =>
                actual[0] < min[0] ? actual : min
            ) //obtiene el minimo valor obtenido con k

            M[a][j] = minimo[0]
            P[a][j] = minimo[1] + 1 //registra k en P, k+1 para ajustarlo al valor real, para programar se usa un valor menor
        }
    }

    return [M, P]
}

// Construye el orden de prioridad de la multiplicación de matrices
function construir_orden(P) {
    const n = P.length

    function esMultiplicacion(texto) {
        // Verifica si es multiplicacion directa
        return !texto.startsWith("(")
    }

    function unir(a, b) {
        // Agrega × cuando no hay parentesis entre matrices
        if (esMultiplicacion(a) && esMultiplicacion(b)) {
            return `${a}×${b}`
        }

        return `${a}${b}`
    }

    function construir(i, j) {
        if (i === j) {
            return `A${i + 1}`
        }

        const k = parseInt(P[i][j]) - 1 // para coincidir con inicio en 0

        const izquierda = construir(i, k)
        const derecha = construir(k + 1, j)

        return `(${unir(izquierda, derecha)})`
    }

    return construir(0, n - 1)
}

// MAIN
function MultiplicacionMatrices() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [numMatrices, setNumMatrices] = useState(2)//Numero de matrices, por defecto 2
  const [dims, setDims] = useState(Array(3).fill(""))//Numero de dimensiones, por defecto 3

  const handleSubmit = async (cadena) => { //Realiza el calculo
    if (!cadena.trim()) return

    setLoading(true)
    setError(null)
    setResultado(null)

    try {
      const [M, P] = MultiplicacionMatricesAlgoritmo(cadena)//calcula tablas M y P
      const orden = construir_orden(P)

      setResultado({
        costo_minimo: M[0][M.length - 1],
        orden_optimo: orden,
        tabla_M: M,
        tabla_P: P
      })

    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

   //cambia la cantidad de inputs para dimensiones basadas en n+1
  const handleNumChange = (n) => {
    setNumMatrices(n)
    setDims(Array(n + 1).fill(""))
  }

  const handleDimChange = (i, value) => {
    const newDims = [...dims]
    newDims[i] = value
    setDims(newDims)
  }
  //verifica la validez de las entradas
  const isValid =
    dims.length > 0 &&
    dims.every(d => d !== "" && Number(d) > 0)

  const generarCadena = () => dims.join("*")//formato necesario para el procesado

  //guarda las dimensiones
  const guardarArchivo = () => {
    const data = {
      dims: dims.map(Number)
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "matrices.json"
    a.click()

    URL.revokeObjectURL(url)
  }

  const fileInputRef = React.useRef(null)

  //carga el archivo con las dimensiones
  const cargarArchivo = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = (e) => {
    setError(null)

    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)

        if (!data.dims || !Array.isArray(data.dims)) {
          throw new Error("Formato inválido")
        }

        const n = data.dims.length - 1

        if (n < 2 || n > 10) {
          throw new Error("Cantidad de matrices inválida")
        }

        setNumMatrices(n)
        setDims(data.dims.map(String))
        setResultado(null)

      } catch (err) {
        setError("Archivo inválido")
      }
    }

    reader.readAsText(file)
  }

  return (
    <div className="mm-wrap">
      <h1 className="mm-title">Multiplicación de Matrices</h1>

      <div className="mm-format-box">
        <p className="mm-format-title">Formato de entrada</p>
        <p className="mm-format-text">
          Seleccione la cantidad de matrices a multiplicar e inserte sus dimensiones, no pueden valer 0.
        </p>
      </div>

      <div className="mm-input-row" style={{ justifyContent: "center" }}>
        <button
          className="mm-btn"
          onClick={guardarArchivo}
          disabled={!isValid || loading}
        >
          Guardar Archivo
        </button>

        <button
          className="mm-btn"
          onClick={cargarArchivo}
        >
          Cargar Archivo
        </button>
      </div>

      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="mm-input-row">

        <select
          className="mm-select"
          value={numMatrices}
          onChange={e => handleNumChange(Number(e.target.value))}
        >
          {Array.from({ length: 9 }, (_, i) => i + 2).map(n => (
            <option key={n} value={n}>{n} matrices</option>
          ))}
        </select>

        <div className="mm-dims">
          {dims.map((d, i) => (
            <input
              key={i}
              type="number"
              min="1"
              placeholder={`d${i}`}
              value={d}
              onChange={e => handleDimChange(i, e.target.value)}
              className="mm-input"
              style={{ maxWidth: "70px", textAlign: "center" }}
            />
          ))}
        </div>

        <button
          className="mm-btn"
          onClick={() => handleSubmit(generarCadena())}
          disabled={!isValid || loading}
        >
          {loading ? "Calculando..." : "Calcular →"}
        </button>

      </div>

      {error && <div className="mm-error">⚠ {error}</div>}

      {resultado && (
        <div className="mm-results">

          <p className="mm-cadena">
            Dimensiones: <span>{generarCadena()}</span>
          </p>

          <div className="mm-card">
            <p className="mm-card-title">Resultado óptimo</p>

            <div className="mm-optimal">
              <span className="mm-orden">{resultado.orden_optimo}</span>

              <span className="mm-costo-badge">
                costo mínimo: {resultado.costo_minimo}
              </span>
            </div>
          </div>

          <div className="mm-card">
            <p className="mm-card-title">Árbol</p>
            <MatrizTree P={resultado.tabla_P} />
          </div>

          <div className="mm-card">
            <p className="mm-card-title">Tabla M</p>
            <MatrizTable data={resultado.tabla_M} highlight />
          </div>

          <div className="mm-card">
            <p className="mm-card-title">Tabla P</p>
            <MatrizTable data={resultado.tabla_P} />
          </div>

        </div>
      )}
    </div>
  )
}
export default MultiplicacionMatrices