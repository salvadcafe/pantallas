import { renderItem } from "./media-renderer.js";
import { warmItem } from "./preloader.js";

/**
 * Crea un reproductor de lista con estado privado.
 *
 * El modulo conserva el indice actual y expone solo las operaciones necesarias
 * para reemplazar la lista y comenzar la reproduccion.
 *
 * @param {HTMLElement} playerElement Contenedor #player.
 * @returns {{setItems: Function, play: Function}} API publica del reproductor.
 */
export function createPlaylistPlayer(playerElement) {
    let items = [];
    let currentIndex = 0;
    let playbackVersion = 0;
    let cleanupCurrentItem = null;

    /**
     * Reemplaza la lista activa y vuelve al primer elemento.
     *
     * @param {Array<object>} nextItems Nueva lista de contenido activo.
     */
    function setItems(nextItems) {
        items = nextItems;
        currentIndex = 0;
        playbackVersion++;

        if (cleanupCurrentItem) {
            cleanupCurrentItem();
            cleanupCurrentItem = null;
        }
    }

    /**
     * Renderiza el item actual si existe contenido disponible.
     */
    function play() {
        if (items.length === 0) {
            return;
        }

        const itemVersion = playbackVersion;

        cleanupCurrentItem = renderItem(playerElement, items[currentIndex], {
            next: () => {
                if (itemVersion === playbackVersion) {
                    next();
                }
            },
            isSingleItem,
            showFallback,
        });

        warmNextItem(itemVersion);
    }

    /**
     * Avanza al siguiente item. Si llega al final, vuelve al inicio.
     */
    function next() {
        playbackVersion++;

        if (cleanupCurrentItem) {
            cleanupCurrentItem({ keepElement: true });
            cleanupCurrentItem = null;
        }

        currentIndex++;

        if (currentIndex >= items.length) {
            currentIndex = 0;
        }

        play();
    }

    /**
     * Precarga en segundo plano el siguiente elemento de la lista.
     *
     * @param {number} itemVersion Version activa al iniciar la precarga.
     */
    function warmNextItem(itemVersion) {
        if (items.length <= 1) {
            return;
        }

        const nextIndex = currentIndex + 1 >= items.length
            ? 0
            : currentIndex + 1;

        warmItem(items[nextIndex]).catch(error => {
            if (itemVersion === playbackVersion) {
                console.warn("No se pudo precargar el siguiente contenido", error);
            }
        });
    }

    /**
     * Indica si la lista tiene un unico item.
     *
     * @returns {boolean} true cuando solo hay un elemento activo.
     */
    function isSingleItem() {
        return items.length === 1;
    }

    /**
     * Muestra un mensaje visible si no hay ningun medio confiable que conservar.
     *
     * @param {string} message Mensaje de recuperacion.
     */
    function showFallback(message) {
        if (playerElement.querySelector(".slide.ready")) {
            return;
        }

        playerElement.innerHTML = `
            <div class="loading">
                ${message}
            </div>
        `;
    }

    return {
        setItems,
        play,
    };
}
