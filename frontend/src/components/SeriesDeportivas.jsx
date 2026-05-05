import { useState } from "react"
import "./Estilos.css"

const MAX_PROBABILITY = 1
const MIN_PROBABILITY = 0
const MAX_GAME_NUM = 11
const MIN_GAME_NUM = 1
const DEFAULT_HOME_GAME = 0.73
const DEFAULT_ROAD_GAME = 0.46
const DEFAULT_GAMES = 7

// Da formato a una tabla de probabilidades para desplegarla en HTML
// E: data - Matriz de probabilidades de que gane el equipo A
//    complemento - Indica si la tabla a desplegar requiere complemento (para equipo B)
// S: Retorna la construcción de la tabla en un elemento div
function SeriesTable({data, complemento}) {
  const size = data.length
  return (
    <div className="mm-table-container">
      <table className="mm-matrix">
        <thead>
          <tr>
            <th className="diagonal-cell">
              <span className="top-label">A</span>
              <span className="bottom-label">B</span>
            </th>
            {Array.from({length: size}).map(
              (header, i) => <th key={i}> {i} </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <th> {i} </th>
              {
                row.map(
                  (col, j) =>
                  <td key={j} className={i==j && i==size-1 ? "highlight":""}>
                    {col === "-" ? "-" : (complemento ? 1-col : col).toFixed(4)}
                  </td>
                )
              }
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Crea un array de tamaño fijo con estados booleanos aleatorios
function initFormato() {
  return Array.from({ length: MAX_GAME_NUM }).map( (item,i) => (Math.random() < 0.5) )
}

function SeriesDeportivas() {
  const [probCasa,    setProbCasa]   = useState(DEFAULT_HOME_GAME)
  const [probVisita,  setProbVisita] = useState(DEFAULT_ROAD_GAME)
  const [maxJuegos,   setMaxJuegos]  = useState(DEFAULT_GAMES)
  const [formato,     setFormato]    = useState(initFormato)

  const [error,     setError]     = useState(null)
  const [resultado, setResultado] = useState(null)

  // Actualiza array de estados asociados a botones con el nuevo valor del boton que fue activado
  const handleToggle = (event) => {
    setFormato( formato.map( (item, index) => (index == event.currentTarget.id ? !item : item) ) )
  }

  // Crea botones para indicar localía dinamicamente segun cantidad de juegos en la serie
  const initBotones = () => {
    return Array.from({ length: maxJuegos }).map((boton,index) => (
      <button
        className={"mm-btn " + (formato[index] ? "sd-btnA" : "sd-btnB")}
        id={index}
        key={index}
        onClick={handleToggle}
        value={formato[index]}
      >
        {formato[index] ? "A" : "B"}
      </button>
    ))
  }

  const botones = initBotones()

  // Convierte entradas a formato JSON y procesa petición de cálculo al backend
  const handleSubmit = async () => {
    setError(null)
    setResultado(null)
    try {
      const res = await fetch("http://localhost:8000/series-deportivas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          probCasa: probCasa,
          probVisita: probVisita,
          maxJuegos: maxJuegos,
          formato: formato
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Error en el servidor")
      }
      setResultado(await res.json())
    } catch (err) {
      setError(err.message)
    }
  }

  // Convierte entradas en archivo JSON e inicia descarga automáticamente
  const saveJSON = () => {
    const blob = new Blob([
      JSON.stringify({
        probCasa: probCasa,
        probVisita: probVisita,
        maxJuegos: maxJuegos,
        formato: formato
      })
    ])

    const date = new Date()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = "configSD_" + date.toLocaleTimeString() + ".json"
    link.click()
    URL.revokeObjectURL(url)
  }

  // Extrae entradas de un archivo JSON válido que ha sido cargado en elemento input
  const uploadJSON = (event) => {
    const file = event.target.files[0]
    try {
      if (!file.name.endsWith(".json")) {
        throw new Error("Archivo inválido: Sólo se aceptan configuraciones en formato JSON")
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        const parsedData = JSON.parse(event.target.result)
        setProbCasa(parsedData.probCasa)
        setProbVisita(parsedData.probVisita)
        setMaxJuegos(parsedData.maxJuegos)
        setFormato(parsedData.formato)
        setResultado(null)
        setError(null)
      }
      reader.readAsText(file)

    } catch (err) {
      setError(err.message)
    }
  }

  // Restringe rango de entradas numéricas de probabilidad
  const handleProbInput = (event) => {
    if (event.target.value > MAX_PROBABILITY) event.target.value = MAX_PROBABILITY
    else if (event.target.value < MIN_PROBABILITY) event.target.value = MIN_PROBABILITY
  }

  // Restringe rango de entradas numéricas para la cantidad de juegos
  const handleJuegosInput = (event) => {
    if (event.target.value > MAX_GAME_NUM) event.target.value = MAX_GAME_NUM
    else if (event.target.value < MIN_GAME_NUM) event.target.value = MIN_GAME_NUM
  }

  return (
    <div className="mm-wrap">
      <h1 className="mm-title">Series Deportivas</h1>
      
      <div className="mm-format-box">
        <p className="mm-format-title">Formato de entrada</p>
        <p className="mm-format-text">
          Ingrese las probabilidades de que el equipo A gane un juego individual en casa y de visita.
          Luego especifique la cantidad de juegos en la serie e indique con los botones cuales
          corresponden a un juego en casa del equipo A.
          Incluye un botón que le permitirá descargar un archivo JSON que guarda su especificación.
          Este archivo se puede cargar directamente en lugar del proceso manual descrito anteriormente.
        </p>
      </div>

      <div className="mm-input-row">
        <p>Probabilidad de ganar en casa</p>
        <div display='grid'>
          <input
            className="mm-input"
            type="number"
            step="0.01"
            value={probCasa}
            onInput={handleProbInput}
            onChange={e => setProbCasa(e.target.value)}
          />
          <input
            className="mm-input"
            type="range"
            min="0"
            max="1"
            step="0.0001"
            value={probCasa}
            onChange={e => setProbCasa(e.target.value)}
          />
        </div>

        <p>Probabilidad de ganar en visita</p>
        <div>
          <input
            className="mm-input"
            type="number"
            step="0.01"
            value={probVisita}
            onInput={handleProbInput}
            onChange={e => setProbVisita(e.target.value)}
          />
          <input
            className="mm-input"
            type="range"
            min="0"
            max="1"
            step="0.0001"
            value={probVisita}
            onChange={e => setProbVisita(e.target.value)}
          />
        </div>
      </div>

      <div className="mm-input-row">
        <p>Cantidad de juegos</p>
        <input
            className="mm-input"
            type="number"
            step="1"
            value={maxJuegos}
            onInput={handleJuegosInput}
            onChange={e => setMaxJuegos(e.target.value)}
            />
      </div>

      <div className="mm-input-row">
        <p>Formato de la serie</p>
        {botones}
      </div>

      <div className="mm-input-row">
        <input className="mm-input" type="file" onChange={uploadJSON}/>
        <button className="mm-btn" onClick={saveJSON}>Guardar</button>
        <button className="mm-btn" onClick={handleSubmit}>Calcular</button>
      </div>

      {error && <div className="mm-error">⚠ {error}</div>}

      {resultado && (
        <div className="mm-results">
          <div className="mm-card">
            <p className="mm-card-title">Tabla F - Probabilidades de que gane A</p>
            <SeriesTable data={resultado.tabla} complemento={false}/>
          </div>

          <div className="mm-card">
            <p className="mm-card-title">Tabla F' - Probabilidades de que gane B</p>
            <SeriesTable data={resultado.tabla} complemento={true}/>
          </div>
        </div>
      )}
    </div>
  )
}

export default SeriesDeportivas