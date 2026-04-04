from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from prophet import Prophet
import pandas as pd
from datetime import datetime

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
       
       