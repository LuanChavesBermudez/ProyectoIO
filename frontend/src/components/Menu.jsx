import { Link } from 'react-router-dom'

function Menu() {
    return (
        <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#1e1e2e' }}>
            <Link to="/">Inicio</Link>
            <Link to="/reemplazo-equipos">Reemplazo de Equipos</Link>
            <Link to="/arboles-b">Árboles B</Link>
            <Link to="/series-deportivas">Series Deportivas</Link>
            <Link to="/multiplicacion-matrices">Multiplicación de Matrices</Link>

        </nav>
    )
}

export default Menu