import { Routes, Route } from 'react-router-dom'
import Menu from './components/Menu'
import Principal from './components/Principal'
import ReemplazoEquipos from './components/ReemplazoEquipos'
import ArbolesB from './components/ArbolesB'
import SeriesDeportivas from './components/SeriesDeportivas'
import MultiplicacionMatrices from './components/MultiplicacionMatrices'

function App() {
  return (
    <div>
      <Menu />
      <Routes>
        <Route path="/" element={<Principal />} />
        <Route path="/reemplazo-equipos" element={<ReemplazoEquipos />} />
        <Route path="/arboles-b" element={<ArbolesB />} />
        <Route path="/series-deportivas" element={<SeriesDeportivas />} />
        <Route path="/multiplicacion-matrices" element={<MultiplicacionMatrices />} />
      </Routes>
    </div>
  )
}

export default App
