import { useState } from "react";
import "./Estilos.css";

function ArbolesB() {
  // Variables de entrada / salida
  const [llaves, setLlaves] = useState("");
  const [pesos, setPesos] = useState("");
  const [advertencia, setAdvertencia] = useState("");
  const [resultado, setResultado] = useState(null);
  const [dirty, setDirty] = useState(false);

  const validarEntrada = () => {
    // Convierte los strings de entrada a listas
    const listaLlaves = llaves.split(",");
    const listaPesos = pesos.split(",");

    // Valida que coincidan las cantidades
    if (listaLlaves.length !== listaPesos.length) {
      setAdvertencia("La cantidad de llaves y pesos debe coincidir.");
      return null;
    }

    // Peso total para sacar frecuencias, lista de pares para asociar llave:frecuencia
    let pesoTotal = 0;
    const pares = [];

    // Para cada llave ingresada
    for (let i = 0; i < listaLlaves.length; i++) {
      // Valida que no haya valores vacíos
      if (listaLlaves[i] === "" || listaPesos[i] === "") {
        setAdvertencia("Debe ingresar datos validos en los campos de llaves y pesos.")
        return null;
      }

      // Convierte el peso ingresado a un valor real
      const pesoNum = Number(listaPesos[i].trim());

      // Valida que sea un numero valido mayor a 0
      if (isNaN(pesoNum) || pesoNum <= 0) {
        setAdvertencia("Los pesos deben ser números mayores a 0.");
        return null;
      }

      // Suma su peso al peso total
      pesoTotal += pesoNum;

      // Crea par ordenado llave:peso
      pares.push({
        llave: listaLlaves[i].trim(),
        peso: pesoNum
      });

    }
    setAdvertencia("");

    return {
      pares: pares,
      pesoTotal: pesoTotal
    };
  };

  // Asigna frecuencia a los pares
  const asignarFrecuencias = (pares, pesoTotal) => {
    // Para cada par ordenado
    for (let i = 0; i < pares.length; i++) {
      // frecuencia es un ratio entre su peso y el peso total de las llaves
      pares[i].frecuencia = pares[i].peso / pesoTotal;
    }
    return pares;
  };

  // Crea matriz de tamaño n dinamicamente
  const crearMatriz = (len) => {
    const matriz = [];
    for (let i = 0; i < len; i++) {
      const fila = [];

      for (let j = 0; j < len; j++) {
        fila.push(0);
      }
      matriz.push(fila);
    }
    return matriz;
  };

  //A[i][k-1] + A[k+1][j] + (pi + ... + pj) <-- suma de las frecuencias en la formula
  const sumaFrecuencias = (pares, inicio, fin) => {
    let suma = 0;
    for (let i = inicio; i <= fin; i++) {
      suma += pares[i].frecuencia;
    }
    return suma;
  };


  const abbOptimos = (pares) => {
    const len = pares.length;

    const A = crearMatriz(len);                   //Matriz A es la que guarda los costos
    const R = crearMatriz(len);                   //Matriz R guarda los K ganadores
    const memoFrecuencias = crearMatriz(len);     //Memoización de sumas de frecuencias pi hasta pj

    for (let j = 0; j < len; j++) {               //Calcula de columna en columna
      for (let i = j; i >= 0; i--) {              //i = j equivale a A[i][i], la primer celda que contempla costos de llaves
        let costoMin = Infinity;

        for (let k = i; k <= j; k++) {                            //Calcula todos los k desde k = i a k = j
          const formulaIzq = (k - 1 < 0) ? 0 : A[i][k - 1];       //Validacion para indice columna fuera de la matriz
          const formulaDer = (k + 1 >= len) ? 0 : A[k + 1][j];    //Validacion para indice fila fuera de la matriz

          let totalFrecuencias = memoFrecuencias[i][j];           //Busca suma de frecuencias precalculada
          if (totalFrecuencias == 0) {                            //Si no se ha calculado, lo calcula y lo guarda
            totalFrecuencias = sumaFrecuencias(pares, i, j);
            memoFrecuencias[i][j] = totalFrecuencias;
          }

          const costoDeK = formulaIzq + formulaDer + totalFrecuencias;    //A[i][k-1] + A[k+1][j] + pi + ... + pj

          if (costoDeK < costoMin) {
            costoMin = costoDeK;      //Actualiza el costo minimo posible
            R[i][j] = k + 1;          //Coloca el K usado en la tabla de rutas (+1 para que sea legible)
          }
        }
        A[i][j] = costoMin;
      }
    }
    return {
      TablaA: A,
      TablaR: R
    };
  };

  class Nodo {
    llave = null;
    hijoIzq = null;
    hijoDer = null;

    constructor(llave) {
      this.llave = llave;
    }
  };

  const reconstruirArbol = (R, pares, indiceInicio, indiceFin) => {
    if (indiceInicio > indiceFin) {     // si i > j, ya llegó a una hoja
      return null;
    }

    const indiceRaiz = R[indiceInicio][indiceFin] - 1;        //Saca el k ganador de la tabla R, resta 1 para acomodarlo a la lista de pares
    const raiz = new Nodo(pares[indiceRaiz].llave);

    raiz.hijoIzq = reconstruirArbol(R, pares, indiceInicio, indiceRaiz - 1);  //subarbol de i hasta indiceRaiz - 1
    raiz.hijoDer = reconstruirArbol(R, pares, indiceRaiz + 1, indiceFin);     //subarbol desde indiceRaiz + 1 hasta j

    return raiz;
  };

  const guardarArchivo = () => {
    // Obtiene los strings de input
    const datos = {
      llaves: llaves,
      pesos: pesos
    };

    const json = JSON.stringify(datos, null, 2);                  // Lo convierte a documento de texto con formato json
    const blob = new Blob([json], { type: "application/json" });  // Le genera un blob
    const url = URL.createObjectURL(blob);                        // Le asigna un URL para accederlo
    const archivo = document.createElement("a");                  // Crea un html para poder interactuar con el blob

    archivo.href = url;                                           // Apunta el html al blob
    archivo.download = "configABB.json";                          // Indica que el componente html es para descargar y le asigna nombre
    archivo.click();                                              // Descarga

    URL.revokeObjectURL(url);                                     // Libera el url
  };

  const cargarArchivo = (e) => {
    // Abre ventana de upload
    const upload = document.createElement("input");
    upload.type = "file";
    upload.accept = "application/json";

    // Cuando se cierra la ventana
    upload.onchange = (e) => {
      const archivo = e.target.files[0];

      // Si no se elegio archivo, retorna
      if (!archivo) {
        return;
      }

      // Abre un lector de archivos
      const reader = new FileReader();

      // Define como se van a procesar los datos
      reader.onload = (e) => {
        // Lo carga como JSON
        const datos = JSON.parse(e.target.result);

        // Si no tiene formato correcto, retorna
        if (!("llaves" in datos) || !("pesos") in datos) {
          setAdvertencia("El archivo seleccionado es invalido.");
          return;
        }

        // Carga los strings a los campos de input
        setLlaves(datos.llaves);
        setPesos(datos.pesos);
      };
      // Procesa los datos
      reader.readAsText(archivo);
    };
    upload.click();
    setDirty(true);
    setResultado(null);
  };

  const main = () => {
    // valida que las entradas sean validas
    const entradas = validarEntrada();
    if (entradas === null) {
      return;
    }

    // extrae los pares ordenados y el peso total de las llaves
    const pares = entradas.pares;
    const pesoTotal = entradas.pesoTotal;

    // modifica los pares, les añade su frecuencia con respecto al peso total
    asignarFrecuencias(pares, pesoTotal);

    // ordena los pares lexicograficamente
    const paresOrdenados = [...pares].sort((a, b) => a.llave.localeCompare(b.llave));

    // Calcula tablas A y R
    const tablas = abbOptimos(paresOrdenados);
    const A = tablas.TablaA;
    const R = tablas.TablaR;

    // Reconstruye el arbol
    const raiz = reconstruirArbol(R, paresOrdenados, 0, paresOrdenados.length - 1);

    const resultados = {
      TablaA: A,
      TablaR: R,
      Arbol: raiz
    };

    setDirty(false);
    setResultado(resultados);
    console.log(resultados.Arbol);
  };

  return (
    <div className="mm-wrap">
      <h1 className="mm-title">Árboles Binarios Óptimos</h1>
      <p className="mm-subtitle">Árboles Binarios Óptimos — PROGRAMACIÓN DINÁMICA</p>

      <div className="mm-format-box">
        <p className="mm-format-title">Formato de entrada</p>
        <p className="mm-format-text">
          Inserte los datos separados por comas.<br />
          Las cantidad de llaves debe coincidir con la cantidad de pesos.<br />
        </p>
      </div>

      <div className="mm-input-row">
        <input
          className="mm-input"
          type="text"
          placeholder="Ej: Lennon, Harrison, Starr"
          value={llaves}
          onChange={(e) => {
            setLlaves(e.target.value);
            setDirty(true)
          }}
          required
        />
        <input
          className="mm-input"
          type="text"
          placeholder="Ej: 100, 20.5, 48"
          value={pesos}
          onChange={(e) => {
            setPesos(e.target.value)
            setDirty(true)
          }}
          required
        />
        <button className="mm-btn" onClick={main} disabled={!llaves.trim() || !pesos.trim()}>Calcular →</button>
      </div>

      <div className="mm-input-row" style={{ justifyContent: "center" }}>
        <button className="mm-btn" onClick={guardarArchivo} disabled={!resultado || dirty}>Guardar Archivo</button>
        <button className="mm-btn" onClick={cargarArchivo}>Cargar Archivo</button>
      </div>

      {advertencia && <div className="mm-error">⚠ {advertencia}</div>}

      {resultado && (
        <div className="mm-results">
          <div className="mm-card">
            <p className="mm-card-title">Tabla A — costos mínimos</p>
            <MostrarMatriz data={resultado.TablaA} />
          </div>

          <div className="mm-card">
            <p className="mm-card-title">Tabla R — estructura óptima del árbol</p>
            <MostrarMatriz data={resultado.TablaR} integersOnly />
          </div>
        </div>
      )}
    </div>
  )
}

// Funcion para desplegar la matriz creada por Brandon
// Modificada sin las cosas que no se ocupan para arboles
function MostrarMatriz({ data,  integersOnly }) {
  return (
    <div className="mm-table-container">
      <table className="mm-matrix">

        {/* Crea el header de la tabla */}
        <thead>
          <tr>
            {/* La primera celda es la esquina, se le asigna la clase para los styles */}
            <th className="corner"></th>

            {/* Al resto de filas se les asigna el numero de indice de columna + 1 */}
            {data[0].map((_, indiceColumna) => (
              <th key={indiceColumna}>{indiceColumna + 1}</th>
            ))}
          </tr>
        </thead>
        

        {/* Crea el cuerpo de la tabla */}
        <tbody>
          
          {/* Por cada fila de la matriz, crea una fila de la tabla */}
          {data.map((datosFila, indiceFila) => (
            <tr key={indiceFila}>

              {/* Crea una celda header para cada fila */}
              <th>{indiceFila + 1}</th>

              {/* Por cada dato de la matriz crea una celda y revisa si es cero para asignarle clase para los styles */}
              {datosFila.map((valorCelda, indiceColumna) => {
                const isZero = valorCelda === 0

                return (
                  <td key={indiceColumna} className = {isZero ? "zero" : ""}>
                    {integersOnly ? valorCelda.toFixed(0) : valorCelda.toFixed(4)}
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

export default ArbolesB