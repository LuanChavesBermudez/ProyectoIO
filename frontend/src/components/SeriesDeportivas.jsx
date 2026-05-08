import { useState } from "react"
import "./Estilos.css"

const MAX_PROBABILITY = 1
const MIN_PROBABILITY = 0
const MAX_GAME_NUM = 11
const MIN_GAME_NUM = 1
const DEFAULT_HOME_GAME = 0.73
const DEFAULT_ROAD_GAME = 0.46
const DEFAULT_GAMES = 7
const USE_BACKEND = false

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
              <span className="top-label">B</span>
              <span className="bottom-label">A</span>
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
                  <td key={j} className={i==j && i==size-1 ? "highlightSD": (col.style == -1 ? "" : (col.style ? "SD-A":"SD-B"))}>
                    {col.value === "-" ? "-" : (complemento ? 1-col.value : col.value).toFixed(4)}
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

/* Crea la matriz de probabilidades de que gane el equipo A en una serie deportiva
  E:    formato - Array booleano en el que verdadero indica si el juego i+1-ésimo es en casa del equipo A
  S:    Array bidimensional que indica las probabilidades de que gane el equipo A en cada subcaso y localidad
        (-1: N/a, 0: Localia de B, 1: Localia de A) */
function CalcularSeries(maxJuegos, probCasa, probVisita, formato) {
  const probabilidades = [
      [probVisita, 1-probVisita], // False indexa (P_r, Q_h)
      [probCasa, 1-probCasa]      // True indexa  (P_h, Q_r)
    ]
    const victorias = Math.ceil((maxJuegos+1)/2)
    const tabla = Array.from({length:victorias+1}).map( // Crea matriz con dimensiones extra para casos triviales
      (row, i) => Array(victorias+1).fill({value:(i==0 ? 1 : 0), style:-1}) // La primera fila es instanciada con 1s (caso A gano la serie)
    )

    for (let fila = 0; fila < victorias; fila++) {
      // Halla num de juego inicial en fila (numerado desde 0). Aunque se puede usar un contador si el total es impar
      let juegoActual = (victorias*2 - (fila+1)) // es necesario para maxJuegos par (por el juego extra de desempate)
      for (let columna = 0; columna < victorias; columna++) {
        juegoActual--                                          // Toma en cuenta victorias restantes de B para el numero de juego
        let esLocalia = Number(formato[juegoActual%maxJuegos]) // Modulo mantiene indice en rango de maxJuegos (si este es par)
        let p = probabilidades[esLocalia][0]
        let q = probabilidades[esLocalia][1]
        tabla[fila+1][columna+1] = {value:(p * tabla[fila][columna+1].value + q * tabla[fila+1][columna].value), style:esLocalia}
      }
    }
    tabla[0][0] = {value:"-", style:-1} // Caso imposible: Ambos equipos ganan la serie
    console.log(tabla)
    return {"tabla": tabla}
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

  // Pasa parametros de entrada al backend y muestra el resultado de su respuesta
  const submitToBackend = async () => {
    try {
      const res = await fetch("http://localhost:8000/series-deportivas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          probCasa: Number(probCasa),
          probVisita: Number(probVisita),
          maxJuegos: Number(maxJuegos),
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

  // Pasa parámetros de entrada a la versión del frontend de la función de SeriesDeportivas
  const submitToFrontend = () => {
    try {
      setResultado(CalcularSeries(Number(maxJuegos), Number(probCasa), Number(probVisita), formato))
    } catch (err) {
      setError(err.message)
      console.log(err)
    }
  }

  // Convierte entradas a formato JSON y procesa petición de cálculo al backend
  const handleSubmit = () => {
    setError(null)
    setResultado(null)
    USE_BACKEND ? submitToBackend() : submitToFrontend()
  }

  // Convierte entradas en archivo JSON e inicia descarga automáticamente
  const saveJSON = () => {
    const blob = new Blob([
      JSON.stringify({
        probCasa: Number(probCasa),
        probVisita: Number(probVisita),
        maxJuegos: Number(maxJuegos),
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
        if (("probCasa" in parsedData) && ("probVisita" in parsedData) && ("maxJuegos" in parsedData) && ("formato" in parsedData)) {
          setProbCasa(Number(parsedData.probCasa))
          setProbVisita(Number(parsedData.probVisita))
          setMaxJuegos(Number(parsedData.maxJuegos))
          setFormato(parsedData.formato)
          setResultado(null)
          setError(null)
        } else {
          setResultado(null)
          setError("Formato inválido: JSON no cumple el formato de entrada requerido")
        }
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