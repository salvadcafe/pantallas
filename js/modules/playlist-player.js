import { renderItem } from "./media-renderer.js";

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

    /**
     * Reemplaza la lista activa y vuelve al primer elemento.
     *
     * @param {Array<object>} nextItems Nueva lista de contenido activo.
     */
    function setItems(nextItems) {
        items = nextItems;
        currentIndex = 0;
    }

    /**
     * Renderiza el item actual si existe contenido disponible.
     */
    function play() {
        if (items.length === 0) {
            return;
        }

        renderItem(playerElement, items[currentIndex], {
            next,
            isSingleItem,
        });
    }

    /**
     * Avanza al siguiente item. Si llega al final, vuelve al inicio.
     */
    function next() {
        currentIndex++;

        if (currentIndex >= items.length) {
            currentIndex = 0;
        }

        play();
    }

    /**
     * Indica si la lista tiene un unico item.
     *
     * @returns {boolean} true cuando solo hay un elemento activo.
     */
    function isSingleItem() {
        return items.length === 1;
    }

    return {
        setItems,
        play,
    };
}
