/**
 * Devuelve el contenedor principal donde se renderiza todo el contenido.
 *
 * @returns {HTMLElement|null} Elemento #player definido en index.html.
 */
export function getPlayerElement() {
    return document.getElementById("player");
}

/**
 * Reemplaza la pagina por un mensaje de error a pantalla completa.
 *
 * @param {string} message Mensaje visible para el usuario.
 */
export function showError(message) {
    document.body.innerHTML = `
        <div style="
            background:black;
            color:white;
            width:100vw;
            height:100vh;
            display:flex;
            justify-content:center;
            align-items:center;
            font-size:40px;
            font-family:Arial;
            text-align:center;
        ">
            ${message}
        </div>
    `;
}
