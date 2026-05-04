from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from prophet import Prophet
import pandas as pd
from datetime import datetime
import re
import numpy as np
import string

app =FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
class InflacionRequest(BaseModel):
    annos: int
    tasa_base: float

class MatrizRequest(BaseModel):
    cadena: str

class SeriesRequest(BaseModel):
    probCasa: float
    probVisita: float
    maxJuegos: int
    formato: list

@app.get("/")
def root():
    return {"mensaje": "Backend funcionando!"}

@app.post("/predecir-inflacion")
def predecir_inflacion(data:InflacionRequest):
    annoHoy = datetime.now().year
    historiuco = []
    for i in range (9):
       anno = annoHoy -10 + i
       tasa = data.tasa_base + (i * 0.5)  # Simulación de aumento de la tasa
       historiuco.append({"ds": f"{anno}-01-01", "y": tasa})
    df = pd.DataFrame(historiuco)
    modelo = Prophet()
    modelo.fit(df)
    futuro = modelo.make_future_dataframe(periods=data.annos, freq='YE')
    prediccion = modelo.predict(futuro)
    resultado = prediccion[['ds', 'yhat']].tail(data.annos).copy()
    resultado["anno"] = resultado['ds'].dt.year
    resultado["tasa_inflacion"] = resultado["yhat"].round(2)
    return {"prediccciones":  resultado[["anno", "tasa_inflacion"]].to_dict(orient="records")}
       

##Recorre la matriz M en diagonal y realiza los cálculos necesarios para determinar el menor costo
def MultiplicacionMatrices(cadena):
    cadena = cadena.replace(" ", "")
    numeros = re.sub(r'(\d+)\*\1', r'\1', cadena) 
    d = [int(n) for n in re.findall(r'\d+', numeros)]#obtiene las dimensiones
    n = len(d) - 1 #longitud de la matriz
    M = np.zeros((n, n))
    P = np.zeros((n, n))
    for i in range(1, n):
        for j in range(i, n):
            a = j - i #valor de i
            valores = []
            for k in range(a, j): #casos de k
                valores.append([M[a][k] + M[k+1][j] + (d[a] * d[j+1] * d[k+1]), k])#los valores de indice de d son acordes a su contraparte real, se ajusta para que no haya problemas
            minimo = min(valores, key=lambda x: x[0]) #obtiene el minimo valor obtenido con k
            M[a][j] = minimo[0]
            P[a][j] = minimo[1] + 1 #registra k en P, k+1 para ajustarlo al valor real, para programar se usa un valor menor
    return [M, P]

#Construye el orden de prioridad de la multiplicacion de matrices
def construir_orden(P):
    n = len(P)
    letras = list(string.ascii_uppercase)

    def construir(i, j):
        if i == j:
            return letras[i]
        k = int(P[i][j]) - 1 #para coincidir con inicio en 0
        izquierda = construir(i, k)
        derecha = construir(k + 1, j)
        return f"({izquierda}{derecha})"

    return construir(0, n - 1)


@app.post("/multiplicacion-matrices")
def multiplicacion_matrices(data: MatrizRequest):
    M, P = MultiplicacionMatrices(data.cadena)
    orden = construir_orden(P)
    return {
        "cadena": data.cadena,
        "costo_minimo": int(M[0][len(M) - 1]),
        "orden_optimo": orden,
        "tabla_M": M.tolist(),
        "tabla_P": P.tolist()
    }

# Crea la matriz de probabilidades de que gane el equipo A en una serie deportiva
# E:    formato - Array booleano en el que verdadero indica si el juego i+1-ésimo es en casa del equipo A
# S:    Array bidimensional que indica las probabilidades de que gane el equipo A en cada subcaso
def SeriesDeportivas(maxJuegos, probabilidadCasaA, probabilidadVisitaA, formato):
    probabilidades = [
        (probabilidadVisitaA, 1 - probabilidadVisitaA), # False indexa (P_r, Q_h)
        (probabilidadCasaA, 1 - probabilidadCasaA)      # True indexa  (P_h, Q_r)
    ]
    victorias = int(np.ceil((maxJuegos+1)/2))
    tabla = np.zeros((victorias+1, victorias+1))
    for i in range(victorias): # Casos triviales: A gano el partido 
        tabla[0][i+1] = 1

    for fila in range(victorias):
        for columna in range(victorias):
            # Calcula juego actual en base a victorias restantes y trunca indice en un rango valido
            juegoActual = formato[(victorias*2 - fila - columna)%maxJuegos]
            p = probabilidades[juegoActual][0]
            q = probabilidades[juegoActual][1]
            tabla[fila+1][columna+1] = round(
                p * tabla[fila][columna+1] + q * tabla[fila+1][columna],4
            )
            juegoActual -= 1
        maxJuegos -= 1
    tabla = tabla.tolist()
    tabla[0][0] = "-" # Caso imposible: Ambos equipos ganan la serie
    return tabla

@app.post("/series-deportivas")
def series_deportivas(data: SeriesRequest):
    tabla = SeriesDeportivas(data.maxJuegos, data.probCasa, data.probVisita, data.formato)
    return {
        "tabla": tabla
    }
