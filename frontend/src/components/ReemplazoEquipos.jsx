/**
 * ReemplazoEquipos.jsx
 *
 * Resuelve el problema de reemplazo de equipos usando programacion dinamica.
 *
 * El usuario da el costo inicial del equipo, el plazo del proyecto (1 a 30),
 * la vida util del equipo (1 a 10), y por cada anno de uso el precio de reventa
 * y el costo de mantenimiento.
 *
 * El algoritmo calcula:
 *   T_k = costo neto de tener el equipo exactamente k annos
 *       = precio_compra + sum(mantenimientos 1..k) - precio_venta_k
 *
 * Luego resuelve con DP:
 *   G(t) = min sobre k=1..vidaUtil de { T_k + G(t+k) }
 *   G(n) = 0  (al final del proyecto no hay mas costos)
 *
 * Estructura del archivo:
 *   1. calcularTi()       - calcula los costos netos T_k
 *   2. calcularDP()       - resuelve G(t) y reconstruye el plan optimo
 *   3. ReemplazoEquipos() - componente React con UI, estado y handlers
 */
 
import { useState } from "react"
import "./Estilos.css"
 
// Estilos para las etiquetas de decision en la tabla G(t)
// Recibe "COMPRAR" o "ESPERAR" y devuelve el objeto de estilos inline
const pillStyle = (type) => {
  const map = {
    COMPRAR: { background: "#1f0a0a", color: "#f87171", border: "1px solid #7f1d1d" },
    ESPERAR: { background: "#0a1f0e", color: "#4ade80", border: "1px solid #166534" },
  }
  const s = map[type] || map.ESPERAR
  return {
    ...s,
    display: "inline-block", padding: "2px 10px",
    borderRadius: 99, fontSize: 11, fontWeight: 700,
    fontFamily: "'Space Mono', monospace"
  }
}
 
/**
 * calcularTi - calcula el costo neto T_k de tener el equipo k annos
 *
 * Formula:
 *   T_k = precio_compra + (mant_1 + mant_2 + ... + mant_k) - precio_venta_k
 *
 * @param {Array} datos  - array de { mantenimiento, precioVenta } por anno de vida
 * @param {number} precio - precio de compra del equipo nuevo
 * @returns {Array} Ti donde Ti[k-1] = costo neto de usar el equipo k annos
 */
function calcularTi(datos, precio) {
  // Verificacion basica para evitar errores si llega algo raro
  if (!datos || datos.length === 0 || isNaN(precio) || precio <= 0) return []
 
  const Ti = []
  let mantAcum = 0
  for (const d of datos) {
    const mant = isNaN(d.mantenimiento) ? 0 : d.mantenimiento
    const venta = isNaN(d.precioVenta) ? 0 : d.precioVenta
    mantAcum += mant
    Ti.push(precio + mantAcum - venta)
  }
  return Ti
}
 
/**
 * calcularDP - resuelve el problema de reemplazo con programacion dinamica
 *
 * Estado: G(t) = costo minimo total desde el anno t hasta el final del proyecto
 *
 * Recurrencia:
 *   G(t) = min_{k=1..vidaUtil} { T_k + G(t+k) }   para t < nPlan
 *   G(nPlan) = 0
 *
 * Para reconstruir el plan guardo en rep[t] el anno donde conviene vender
 * el equipo comprado en t, luego sigo la cadena 0 -> rep[0] -> rep[rep[0]]...
 *
 * @param {Array}  datos    - array de { anno, mantenimiento, precioVenta }
 * @param {number} precio   - precio de compra
 * @param {number} vidaUtil - maximo de annos que se puede usar el equipo (1-10)
 * @param {number} nPlan    - horizonte de planificacion en annos (1-30)
 * @returns {{ Ti, G, plan, costoTotal }}
 */
function calcularDP(datos, precio, vidaUtil, nPlan) {
  // Si los datos estan vacios o son invalidos no hacemos nada
  if (!datos || datos.length === 0) return null
  if (isNaN(precio) || precio <= 0) return null
  if (isNaN(vidaUtil) || vidaUtil < 1) return null
  if (isNaN(nPlan) || nPlan < 1) return null
 
  const Ti  = calcularTi(datos, precio)
  if (!Ti || Ti.length === 0) return null
 
  const INF = 1e15
 
  // G[t] = costo minimo desde el anno t en adelante
  const G   = new Array(nPlan + 1).fill(INF)
  // rep[t] = en que anno se vende el equipo comprado en t
  const rep = new Array(nPlan + 1).fill(-1)
 
  // Condicion de frontera: al llegar al fin del proyecto el costo es 0
  G[nPlan] = 0
 
  // Lleno hacia atras desde t = nPlan-1 hasta t = 0
  for (let t = nPlan - 1; t >= 0; t--) {
    for (let k = 1; k <= vidaUtil; k++) {
      if (t + k <= nPlan && k - 1 < Ti.length) {
        const costo = Ti[k - 1] + G[t + k]
        if (costo < G[t]) {
          G[t]   = costo
          rep[t] = t + k
        }
      }
    }
  }
 
  // Si G[0] sigue siendo INF, algo salio mal (no hay solucion posible)
  if (G[0] >= INF) return null
 
  // Reconstruyo el plan optimo siguiendo los punteros rep[]
  const plan = []
  let t = 0
  let seguridad = 0  // contador para evitar bucle infinito por datos corruptos
 
  while (t < nPlan && seguridad < nPlan + 5) {
    seguridad++
    const sig = rep[t]
 
    // Si el puntero es invalido, algo fallo
    if (sig === -1 || sig <= t || sig > nPlan) break
 
    const k = sig - t
    if (k < 1 || k - 1 >= Ti.length || k - 1 >= datos.length) break
 
    plan.push({
      compraEn:    t,
      vendeEn:     sig,
      anosUso:     k,
      Ti:          Ti[k - 1],
      precioVenta: datos[k - 1].precioVenta ?? 0,
      Gt:          G[t]
    })
    t = sig
  }
 
  return { Ti, G, plan, costoTotal: G[0] }
}
 
// Limites segun la especificacion del proyecto
const LIMITE_PLAN_MIN  = 1
const LIMITE_PLAN_MAX  = 30
const LIMITE_VIDA_MIN  = 1
const LIMITE_VIDA_MAX  = 10
 
/**
 * ReemplazoEquipos - componente principal de la aplicacion
 *
 * Maneja el estado del formulario, la tabla de datos, la carga/guardado
 * de archivos JSON y la llamada al algoritmo DP.
 */
export default function ReemplazoEquipos() {
 
  // Estado de los campos del formulario
  const [anos,      setAnos]      = useState("")   // horizonte de planificacion
  const [vidaUtil,  setVidaUtil]  = useState("")   // vida util maxima del equipo
  const [precio,    setPrecio]    = useState("")   // precio de compra del equipo
  const [datos,     setDatos]     = useState([])   // tabla con mantenimiento y precio de venta
  const [resultado, setResultado] = useState(null) // resultado del algoritmo DP
  const [error,     setError]     = useState(null) // mensaje de error para mostrar al usuario
 
  /**
   * generarCampos - valida los inputs principales y genera la tabla editable
   * Las filas de la tabla son iguales a la vida util ingresada
   */
  const generarCampos = () => {
    setError(null)
 
    const n    = parseInt(anos)
    const vida = parseInt(vidaUtil)
    const p    = parseFloat(precio)
 
    // Validaciones con los limites de la especificacion
    if (isNaN(n) || n < LIMITE_PLAN_MIN || n > LIMITE_PLAN_MAX) {
      setError(`El plazo del proyecto debe estar entre ${LIMITE_PLAN_MIN} y ${LIMITE_PLAN_MAX} annos.`)
      return
    }
    if (isNaN(p) || p <= 0) {
      setError("Ingresa un precio de compra valido (mayor a 0).")
      return
    }
    if (isNaN(vida) || vida < LIMITE_VIDA_MIN || vida > LIMITE_VIDA_MAX) {
      setError(`La vida util debe estar entre ${LIMITE_VIDA_MIN} y ${LIMITE_VIDA_MAX} annos.`)
      return
    }
    if (vida > n) {
      setError("La vida util no puede ser mayor que el plazo del proyecto.")
      return
    }
 
    // Valores de mantenimiento por defecto (aumentan con los annos de uso)
    const defMant = [305, 530, 800, 1100, 1400, 1700, 2100, 2500, 3000, 3600]
 
    setDatos(Array.from({ length: vida }, (_, i) => ({
      ano:           i + 1,
      mantenimiento: defMant[i] ?? (i + 1) * 200,
      // Precio de venta por defecto: depreciacion del 30% por anno
      precioVenta:   Math.round(p * Math.pow(0.7, i + 1))
    })))
    setResultado(null)
  }
 
  /**
   * actualizarDato - actualiza un campo de una fila de la tabla sin mutar el estado
   * Convierte el valor a numero y se asegura de que no sea negativo
   */
  const actualizarDato = (i, campo, val) => {
    const num = parseFloat(val)
    const nuevos = [...datos]
    // Si el valor no es un numero valido lo dejamos en 0
    nuevos[i] = { ...nuevos[i], [campo]: isNaN(num) ? 0 : Math.max(0, num) }
    setDatos(nuevos)
  }
 
  /**
   * calcular - corre el algoritmo DP con los datos actuales
   * Valida que haya datos y que los parametros sean correctos antes de calcular
   */
  const calcular = () => {
    setError(null)
 
    if (datos.length === 0) {
      setError("Primero genera los campos con los parametros del problema.")
      return
    }
 
    const vida = parseInt(vidaUtil)
    const n    = parseInt(anos)
    const p    = parseFloat(precio)
 
    if (isNaN(vida) || isNaN(n) || isNaN(p) || p <= 0) {
      setError("Hay un problema con los parametros ingresados. Revisa los campos.")
      return
    }
 
    // Verifico que ningun precio de venta sea negativo
    const hayVentaNegativa = datos.some(d => d.precioVenta < 0)
    if (hayVentaNegativa) {
      setError("El precio de venta no puede ser negativo.")
      return
    }
 
    const res = calcularDP(datos, p, vida, n)
    if (!res) {
      setError("No se pudo calcular el plan optimo. Revisa que los datos sean validos.")
      return
    }
 
    setResultado(res)
  }
 
  // Limpia la tabla y los resultados pero conserva los parametros generales
  const reiniciar = () => {
    setDatos([])
    setResultado(null)
    setError(null)
  }
 
  /**
   * guardarArchivo - exporta la configuracion actual como archivo JSON descargable
   * Guarda: anos, precio, vidaUtil y la tabla de datos
   */
  const guardarArchivo = () => {
    if (datos.length === 0) {
      setError("No hay datos para guardar. Genera los campos primero.")
      return
    }
 
    try {
      const config = {
        anos:     parseInt(anos)    || 0,
        precio:   parseFloat(precio) || 0,
        vidaUtil: parseInt(vidaUtil) || 0,
        datos
      }
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href = url
      a.download = "configReemplazo.json"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError("No se pudo guardar el archivo. Intenta de nuevo.")
    }
  }
 
  /**
   * cargarArchivo - carga una configuracion desde un archivo JSON
   * Valida que el JSON tenga los campos necesarios antes de actualizar el estado
   */
  const cargarArchivo = () => {
    const upload = document.createElement("input")
    upload.type   = "file"
    upload.accept = "application/json"
 
    upload.onchange = (e) => {
      const archivo = e.target.files[0]
      if (!archivo) return
 
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const config = JSON.parse(ev.target.result)
 
          // Verifico que el JSON tenga los campos basicos
          if (!config.anos || !config.precio || !Array.isArray(config.datos)) {
            setError("El JSON no tiene el formato correcto. Necesita: anos, precio y datos.")
            return
          }
 
          // Verifico que los valores esten dentro de los limites
          const n    = parseInt(config.anos)
          const vida = parseInt(config.vidaUtil)
          const p    = parseFloat(config.precio)
 
          if (isNaN(n) || n < LIMITE_PLAN_MIN || n > LIMITE_PLAN_MAX) {
            setError(`El archivo tiene un plazo invalido. Debe ser entre ${LIMITE_PLAN_MIN} y ${LIMITE_PLAN_MAX}.`)
            return
          }
          if (isNaN(vida) || vida < LIMITE_VIDA_MIN || vida > LIMITE_VIDA_MAX) {
            setError(`El archivo tiene una vida util invalida. Debe ser entre ${LIMITE_VIDA_MIN} y ${LIMITE_VIDA_MAX}.`)
            return
          }
          if (isNaN(p) || p <= 0) {
            setError("El archivo tiene un precio de compra invalido.")
            return
          }
          if (config.datos.length === 0) {
            setError("El archivo no contiene datos de mantenimiento y precio de venta.")
            return
          }
 
          setError(null)
          setAnos(String(config.anos))
          setPrecio(String(config.precio))
          setVidaUtil(String(config.vidaUtil ?? 0))
          setDatos(config.datos)
          setResultado(null)
        } catch {
          setError("No se pudo leer el archivo. Verifica que sea un JSON valido.")
        }
      }
      reader.readAsText(archivo)
    }
    upload.click()
  }
 
  const n    = parseInt(anos)    || 0
  const vida = parseInt(vidaUtil) || 0
 
  // Ejemplo de como debe verse el archivo JSON para que el usuario lo entienda
  const jsonEjemplo = `{
  "anos": 8,
  "precio": 9999,
  "vidaUtil": 4,
  "datos": [
    { "ano": 1, "mantenimiento": 305,  "precioVenta": 7125 },
    { "ano": 2, "mantenimiento": 530,  "precioVenta": 5000 },
    { "ano": 3, "mantenimiento": 800,  "precioVenta": 3700 },
    { "ano": 4, "mantenimiento": 1100, "precioVenta": 3310 }
  ]
}`
 
  return (
    <div className="mm-wrap">
      <h1 className="mm-title">Reemplazo de Equipos</h1>
      <p className="mm-subtitle">EQUIPMENT REPLACEMENT — PROGRAMACION DINAMICA</p>
 
      {/* Seccion explicativa del algoritmo y formato del JSON */}
      <div className="mm-format-box">
        <p className="mm-format-title">Como funciona?</p>
        <p className="mm-format-text">
          Ingresa por cada anno de vida del equipo el <code>costo de mantenimiento</code> y
          el <code>precio de reventa</code> si lo vendieras al final de ese anno.<br />
          El algoritmo calcula el costo neto <code>T_k</code> de cada periodo
          y encuentra el plan de reemplazos que minimiza el gasto total.<br /><br />
          <code>T_k = precio_compra + mantenimientos(1..k) - precio_venta_k</code><br /><br />
          Puedes <code>cargar</code> o <code>guardar</code> la configuracion en JSON:
        </p>
        <pre style={{
          fontFamily: "'Space Mono', monospace", fontSize: "0.72rem", color: "#6b7280",
          background: "#0a0914", border: "1px solid #1e1b4b", borderRadius: 6,
          padding: "0.75rem", marginTop: "0.75rem", overflowX: "auto", lineHeight: 1.7
        }}>{jsonEjemplo}</pre>
      </div>
 
      {/* Botones para cargar y guardar archivos JSON */}
      <div className="mm-input-row" style={{ marginBottom: "1rem" }}>
        <button className="mm-btn" onClick={cargarArchivo}>Cargar JSON</button>
        {datos.length > 0 && (
          <button className="mm-btn" style={{ background: "#1e3a5f" }} onClick={guardarArchivo}>Guardar JSON</button>
        )}
      </div>
 
      {/* Campos principales del problema */}
      <div className="mm-input-row" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
        <input className="mm-input" type="number"
          min={LIMITE_PLAN_MIN} max={LIMITE_PLAN_MAX}
          placeholder={`Plazo del proyecto (${LIMITE_PLAN_MIN}-${LIMITE_PLAN_MAX} annos)`}
          value={anos}
          onChange={e => { setAnos(e.target.value); setDatos([]); setResultado(null) }} />
        <input className="mm-input" type="number" min="0"
          placeholder="Costo inicial del equipo ($)"
          value={precio}
          onChange={e => setPrecio(e.target.value)} />
        <input className="mm-input" type="number"
          min={LIMITE_VIDA_MIN} max={LIMITE_VIDA_MAX}
          placeholder={`Vida util (${LIMITE_VIDA_MIN}-${LIMITE_VIDA_MAX} annos)`}
          value={vidaUtil}
          onChange={e => setVidaUtil(e.target.value)} />
        <button className="mm-btn" onClick={generarCampos}>Generar campos</button>
      </div>
 
      {/* Mensaje de error visible al usuario */}
      {error && <div className="mm-error">{error}</div>}
 
      {/* Tabla editable con los datos por anno de vida del equipo */}
      {datos.length > 0 && (
        <div className="mm-results">
          <div className="mm-card">
            <p className="mm-card-title">Datos por anno de vida del equipo</p>
            <p className="mm-format-text" style={{ marginBottom: "1rem" }}>
              <code>Precio de reventa</code>: lo que obtienes si vendes el equipo al final de ese anno de uso.
              El T_k se calcula automaticamente.
            </p>
            <div className="mm-table-container">
              <table className="mm-matrix">
                <thead>
                  <tr>
                    <th>anno de vida</th>
                    <th>Mantenimiento ($)</th>
                    <th>Precio de reventa ($)</th>
                    {/* T_k se recalcula en tiempo real mientras el usuario edita */}
                    <th>T_k calculado ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.map((d, i) => {
                    // Calculo T_k en tiempo real para que el usuario vea el impacto de sus cambios
                    let mantAcum = 0
                    for (let j = 0; j <= i; j++) {
                      mantAcum += isNaN(datos[j].mantenimiento) ? 0 : datos[j].mantenimiento
                    }
                    const p  = parseFloat(precio)
                    const pv = isNaN(d.precioVenta) ? 0 : d.precioVenta
                    const Tk = isNaN(p) ? 0 : (p + mantAcum - pv)
 
                    return (
                      <tr key={i}>
                        <th style={{ color: "#4b4888" }}>anno {d.ano}</th>
                        <td>
                          <input className="mm-input"
                            style={{ padding: "4px 8px", fontSize: "0.78rem", width: 110 }}
                            type="number" min="0"
                            value={d.mantenimiento}
                            onChange={e => actualizarDato(i, "mantenimiento", e.target.value)} />
                        </td>
                        <td>
                          <input className="mm-input"
                            style={{ padding: "4px 8px", fontSize: "0.78rem", width: 110 }}
                            type="number" min="0"
                            value={d.precioVenta}
                            onChange={e => actualizarDato(i, "precioVenta", e.target.value)} />
                        </td>
                        <td className="highlight">${Math.round(Tk).toLocaleString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
 
            {/* Botones de accion de la tabla */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button className="mm-btn" onClick={calcular}>Calcular optimo</button>
              <button className="mm-btn" style={{ background: "#1e1b4b" }} onClick={reiniciar}>Reiniciar</button>
              <button className="mm-btn" style={{ background: "#1e3a5f" }} onClick={guardarArchivo}>Guardar JSON</button>
            </div>
          </div>
 
          {/* Seccion de resultados, solo aparece despues de calcular */}
          {resultado && <>
 
            {/* Tarjetas con el resumen del resultado */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
              {[
                ["$" + Math.round(resultado.costoTotal).toLocaleString(), "Costo total minimo"],
                [resultado.plan.length,                                   "Equipos comprados"],
                [resultado.plan.map(p => `${p.compraEn}->${p.vendeEn}`).join("  "), "Plan de annos"],
              ].map(([v, l]) => (
                <div key={l} className="mm-card" style={{ textAlign: "center" }}>
                  <p className="mm-card-title">{l}</p>
                  <span className="mm-orden" style={{ fontSize: String(v).length > 8 ? "1rem" : "1.4rem" }}>{v}</span>
                </div>
              ))}
            </div>
 
            {/* Timeline visual: cada bloque es un equipo con sus datos de uso */}
            <div className="mm-card">
              <p className="mm-card-title">Plan optimo de reemplazo</p>
              <p className="mm-format-text" style={{ marginBottom: "1rem" }}>
                Cada bloque representa un equipo: cuando se compra, cuantos annos se usa y cuando se vende.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {resultado.plan.map((p, i) => (
                  <div key={i} style={{
                    flex: "1 1 0", minWidth: 120,
                    borderRadius: 8, border: "1px solid #7f1d1d",
                    background: "#1f0a0a", padding: "12px 10px", textAlign: "center"
                  }}>
                    <div style={{ fontSize: 10, color: "#4b4888", marginBottom: 4, fontFamily: "'Space Mono', monospace" }}>
                      Equipo #{i + 1}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#f87171", fontFamily: "'Space Mono', monospace" }}>
                      anno {p.compraEn} a anno {p.vendeEn}
                    </div>
                    <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4, fontFamily: "'Space Mono', monospace" }}>
                      {p.anosUso} anno{p.anosUso > 1 ? "s" : ""} de uso
                    </div>
                    <div style={{ fontSize: 10, color: "#4ade80", marginTop: 2, fontFamily: "'Space Mono', monospace" }}>
                      T_{p.anosUso} = ${Math.round(p.Ti).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2, fontFamily: "'Space Mono', monospace" }}>
                      Vende en ${(p.precioVenta ?? 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
 
            {/* Tabla con los costos netos T_k para cada periodo de uso */}
            <div className="mm-card">
              <p className="mm-card-title">Costos netos T_k por periodo de uso</p>
              <p className="mm-format-text" style={{ marginBottom: "0.75rem" }}>
                <code>T_k = precio_compra + mantenimientos(1..k) - precio_venta_k</code>
              </p>
              <div className="mm-table-container">
                <table className="mm-matrix">
                  <thead>
                    <tr>
                      <th>k (annos de uso)</th>
                      <th>Mant. acumulado ($)</th>
                      <th>Precio de reventa ($)</th>
                      <th>T_k ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.Ti.map((tk, i) => {
                      let mantAcum = 0
                      for (let j = 0; j <= i; j++) {
                        mantAcum += isNaN(datos[j]?.mantenimiento) ? 0 : datos[j].mantenimiento
                      }
                      const pv = isNaN(datos[i]?.precioVenta) ? 0 : datos[i].precioVenta
                      return (
                        <tr key={i}>
                          <td>{i + 1} anno{i > 0 ? "s" : ""}</td>
                          <td>${mantAcum.toLocaleString()}</td>
                          <td>${pv.toLocaleString()}</td>
                          <td className="highlight">${Math.round(tk).toLocaleString()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
 
            {/* Tabla completa de G(t) para todos los annos del proyecto */}
            <div className="mm-card">
              <p className="mm-card-title">Tabla G(t) — costo minimo desde cada anno</p>
              <p className="mm-format-text" style={{ marginBottom: "0.75rem" }}>
                <code>G(t)</code> = costo minimo total desde el anno t hasta el anno {n}.
                Los annos resaltados son donde se compra un equipo nuevo.
              </p>
              <div className="mm-table-container">
                <table className="mm-matrix">
                  <thead>
                    <tr>
                      <th>anno t</th>
                      <th>G(t) ($)</th>
                      <th>Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: n + 1 }, (_, t) => {
                      // Reviso si en este anno se compra un equipo segun el plan optimo
                      const compraAqui = resultado.plan.find(p => p.compraEn === t)
                      const esOptimo   = compraAqui !== undefined
 
                      return (
                        <tr key={t}>
                          <td className={esOptimo ? "highlight" : ""}>t = {t}</td>
                          <td className={esOptimo ? "highlight" : ""}>
                            ${Math.round(resultado.G[t] ?? 0).toLocaleString()}
                          </td>
                          <td style={{ textAlign: "left" }}>
                            {t === n
                              ? <span style={pillStyle("ESPERAR")}>FIN</span>
                              : esOptimo
                                ? <span style={pillStyle("COMPRAR")}>
                                    COMPRAR - usar {compraAqui.anosUso} anno{compraAqui.anosUso > 1 ? "s" : ""}
                                  </span>
                                : <span style={{ ...pillStyle("ESPERAR"), color: "#6b7280", background: "#111", border: "1px solid #222" }}>
                                    -
                                  </span>
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
 
          </>}
        </div>
      )}
    </div>
  )
}