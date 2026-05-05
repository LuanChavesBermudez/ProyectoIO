import { Link } from 'react-router-dom'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'
import "./Estilos.css"

function Menu() {
    return (
        <>
        <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#1e1e2e' }}>
            <Link to="/" data-tooltip-id="menuTooltip" data-tooltip-content={
                `Regresar al menú principal`
            }>
                Inicio
            </Link>

            <Link to="/reemplazo-equipos" data-tooltip-id="menuTooltip" data-tooltip-content={``}>
                Reemplazo de Equipos
            </Link>

            <Link to="/arboles-b" data-tooltip-id="menuTooltip" data-tooltip-content={
                `Algoritmo para encontrar la estructura óptima de un árbol binario de búsqueda\n
                según el orden lexicográfico de las llaves y sus pesos asociados`
            }>
                Árboles B
            </Link>

            <Link to="/series-deportivas" data-tooltip-id="menuTooltip" data-tooltip-content={``}>
                Series Deportivas
            </Link>

            <Link to="/multiplicacion-matrices" data-tooltip-id="menuTooltip" data-tooltip-content={``}>
                Multiplicación de Matrices
            </Link>
        </nav>

        <Tooltip
            id="menuTooltip"
            className="menuTooltip"
        />
        </>
    )
}

export default Menu