import { useState } from "react";
import "./MultiplicacionMatrices.css"

function ArbolesB() {
  const [llaves, setLlaves] = useState("");
  const [pesos, setPesos] = useState("");
  const [advertencia, setAdvertencia] = useState("");
  const [resultado, setResultado] = useState(null);
  const [dirty, setDirty] = useState(false);

  const validarEntrada = () => {
    const listaLlaves = llaves.split(",");
    const listaPesos = pesos.split(",");

    if (listaLlaves.length !== listaPesos.length) {
      setAdvertencia("La cantidad de llaves y pesos debe coincidir.");
      return null;
    }

    let pesoTotal = 0;
    const pares = [];

    for (let i = 0; i < listaLlaves.length; i++) {
      if (listaLlaves[i] === "" || listaPesos[i] === "") {
        setAdvertencia("Debe ingresar datos validos en los campos de llaves y pesos.")
        return null;
      }

      const pesoNum = Number(listaPesos[i].trim());

      if (isNaN(pesoNum) || pesoNum <= 0) {
        setAdvertencia("Los pesos deben ser números mayores a 0.");
        return null;
      }

      pesoTotal += pesoNum;

      pares.push({
        llave: listaLlaves[i].trim(),
        peso: pesoNum
      });

    }
    setAdvertencia("");

    return [pares, pesoTotal];
  };

  const asignarFrecuencias = (pares, pesoTotal) => {
    for (let i = 0; i < pares.length; i++) {
      pares[i].frecuencia = pares[i].peso / pesoTotal;
    }
    return pares;
  };

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
    return [A, R];
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
    const datos = {
      llaves: llaves,
      pesos: pesos
    };

    const json = JSON.stringify(datos, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const archivo = document.createElement("a");

    archivo.href = url;
    archivo.download = "configABB.json";
    archivo.click();

    URL.revokeObjectURL(url);
  };

  const cargarArchivo = (e) => {
    const upload = document.createElement("input");
    upload.type = "file";
    upload.accept = "application/json";

    upload.onchange = (e) => {
      const archivo = e.target.files[0];

      if (!archivo) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const datos = JSON.parse(e.target.result);
        if (!("llaves" in datos) || !("pesos") in datos) {
          setAdvertencia("El archivo seleccionado es invalido.");
          return;
        }

        setLlaves(datos.llaves);
        setPesos(datos.pesos);
      };
      reader.readAsText(archivo);
    };
    upload.click();
  };

  const main = () => {
    const entradas = validarEntrada();
    if (entradas === null) {
      return
    }
    const [pares, pesoTotal] = entradas;
    asignarFrecuencias(pares, pesoTotal);

    const paresOrdenados = [...pares].sort((a, b) => a.llave.localeCompare(b.llave));
    const [A, R] = abbOptimos(paresOrdenados);
    const raiz = reconstruirArbol(R, paresOrdenados, 0, paresOrdenados.length - 1);

    const resultados = {
      TablaA: A,
      TablaR: R,
      Arbol: raiz
    }

    setDirty(false);
    setResultado(resultados);
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