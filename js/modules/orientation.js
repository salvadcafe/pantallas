/**
 * Aplica el tamano y la rotacion necesarios para una pantalla.
 *
 * Las rotaciones 90 y 270 intercambian ancho/alto porque el contenido se
 * muestra en orientacion vertical usando una pantalla fisicamente horizontal.
 *
 * @param {HTMLElement} player Contenedor principal del contenido.
 * @param {number} rotation Grados de rotacion definidos en la configuracion.
 */
export function applyOrientation(player, rotation = 0) {
    document.body.style.margin = "0";
    document.body.style.background = "#000";
    document.body.style.overflow = "hidden";

    player.style.position = "fixed";
    player.style.top = "0";
    player.style.left = "0";
    player.style.display = "flex";
    player.style.justifyContent = "center";
    player.style.alignItems = "center";
    player.style.transformOrigin = "center center";

    if (rotation === 90 || rotation === 270) {
        player.style.width = "100vh";
        player.style.height = "100vw";

        // Centra el contenedor despues de intercambiar sus dimensiones.
        player.style.transform =
            `translate(calc((100vw - 100vh) / 2), calc((100vh - 100vw) / 2)) rotate(${rotation}deg)`;

        return;
    }

    player.style.width = "100vw";
    player.style.height = "100vh";
    player.style.transform = `rotate(${rotation}deg)`;
}
