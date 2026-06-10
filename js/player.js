import { startPlayer } from "./modules/player-app.js";

/**
 * Punto de entrada del reproductor.
 *
 * Espera a que el DOM exista para que los modulos internos puedan encontrar
 * el contenedor #player definido en index.html.
 */
document.addEventListener("DOMContentLoaded", () => {
    startPlayer();
});
