import { useState } from "react";

function ArbolesB() {
  const [llaves, setLlaves] = useState("");
  const [pesos, setPesos] = useState("");
  const [advertencia, setAdvertencia] = useState("");
  const [resultado, setResultado] = useState(null);

  const validarEntrada = () => {
    const listaLlaves = llaves.split(",");
    const listaPesos = pesos.split(",");


    if (listaLlaves.length !== listaPesos.length) {
      setAdvertencia("La cantidad de llaves y pesos debe coincidir.");
      return;
    }

    let pesoTotal = 0;
    const pares = [];

    for (let i = 0; i < listaLlaves.length; i++) {
      const pesoNum = Number(listaPesos[i].trim());

      if (isNaN(pesoNum) || pesoNum <= 0) {
        setAdvertencia("Los pesos deben ser números mayores a 0.");
        return;
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
  }

  const crearMatriz = (len) => {
    const matriz = [];
    for (let i = 0; i < len; i++) {
      const fila = [];

      for (let j = 0; j < len; j++) {
        fila.push(0);
      }
      matriz.push(row);
    }
  }

  const sumaFrecuencias = (pares, inicio, fin) => {
    let suma = 0;
    for (let i = inicio; i <= fin; i++) {
      suma += pares[i].frecuencia;
    }
    return suma;
  }


  const abbOptimos = (pares) => {
    const len = pares.length;

    const A = crearMatriz(len);                   //Matriz A es la que guarda los costos
    const R = crearMatriz(len);                   //Matriz R guarda los K ganadores
    const memoFrecuencias = crearMatriz[len];     //Memoización de sumas de frecuencias pi hasta pj

    for (let j = 0; j < len; j++) {               //Calcula de columna en columna
      for (let i = j; i >= 0; i--) {              //i = j equivale a A[i][i], la primer celda que contempla costos de llaves
        let costoMin = Infinity;

        for (let k = i; k <= j; k++) {                          //Calcula todos los k desde k = i a k = j
          let formulaIzq = (k - 1 < 0) ? 0 : A[i][k - 1];       //Validacion para indice columna fuera de la matriz
          let formulaDer = (k + 1 >= len) ? 0 : A[k + 1][j];   //Validacion para indice fila fuera de la matriz

          let totalFrecuencias = memoFrecuencias[i][j];         //Busca suma de frecuencias precalculada
          if (totalFrecuencias == 0) {                          //Si no se ha calculado, lo calcula y lo guarda
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
  }

  const main = () => {
    const [pares, pesoTotal] = validarEntrada();
    asignarFrecuencias(pares, pesoTotal);

    const paresOrdenados = [...pares].sort((a, b) => a.llave.localeCompare(b.llave));
    const [A, R] = abbOptimos(paresOrdenados);
  }

  return (
    <div>
      <h1>Árboles Binarios Óptimos</h1>
      
      <label>Inserte los datos separados por comas</label>

      <div>
        <label>Llaves</label>
        <input
          type="text"
          value={llaves}
          onChange={(e) => setLlaves(e.target.value)}
          placeholder="Ej: Lennon, Harrison, Starr"
          required
        />

        <label>Pesos</label>
        <input
          type="text"
          value={pesos}
          onChange={(e) => setPesos(e.target.value)}
          placeholder="Ej: 100, 20.5, 48"
          required
        />
        <button onClick={main}>Calcular</button>
        <p>{ advertencia }</p>
      </div>
    </div>
  )
}

export default ArbolesB