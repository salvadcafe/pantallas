import { withCacheBuster } from "./cache.js";

/**
 * Prepara los recursos de la lista activa antes de iniciar la reproduccion.
 *
 * No valida los archivos por adelantado porque GitHub Pages puede tardar en
 * responder metadatos de videos o imagenes grandes. El renderizador maneja los
 * fallos reales en el momento de reproducir cada item.
 *
 * @param {Array<object>} items Items de contenido activos.
 * @returns {Promise<Array<object>>} Items cargables con URL estable.
 */
export async function preloadAssets(items) {
    return items
        .map(prepareItem)
        .filter(item => item.src && (item.type === "image" || item.type === "video"));
}

/**
 * Prepara y precarga un item individual.
 *
 * @param {object} item Item de contenido.
 * @returns {Promise<object>} Item con URL estable para reproduccion.
 */
export async function preloadItem(item) {
    return prepareItem(item);
}

/**
 * Calienta el siguiente recurso para reducir esperas durante la transicion.
 *
 * @param {object} item Item ya preparado.
 * @returns {Promise<void>}
 */
export function warmItem(item) {
    if (!item?.playbackSrc) {
        return Promise.resolve();
    }

    if (item.type === "image") {
        return warmImage(item.playbackSrc);
    }

    if (item.type === "video") {
        return warmVideo(item.playbackSrc);
    }

    return Promise.resolve();
}

/**
 * Decodifica o carga una imagen antes de que sea visible.
 *
 * @param {string} src Ruta preparada.
 * @returns {Promise<void>}
 */
function warmImage(src) {
    return new Promise(resolve => {
        const img = new Image();

        img.onload = () => {
            if (img.decode) {
                img.decode().then(resolve).catch(resolve);
                return;
            }

            resolve();
        };
        img.onerror = resolve;
        img.src = src;
    });
}

/**
 * Solicita al navegador adelantar datos del video siguiente.
 *
 * @param {string} src Ruta preparada.
 * @returns {Promise<void>}
 */
function warmVideo(src) {
    return new Promise(resolve => {
        const video = document.createElement("video");
        const timeout = setTimeout(resolve, 15000);

        function finish() {
            clearTimeout(timeout);
            resolve();
        }

        video.preload = "auto";
        video.muted = true;
        video.playsInline = true;
        video.onloadeddata = finish;
        video.oncanplay = finish;
        video.oncanplaythrough = finish;
        video.onerror = finish;
        video.src = src;
        video.load();
    });
}

/**
 * Asigna una URL anti-cache una sola vez para que precarga y reproduccion usen
 * exactamente el mismo recurso.
 *
 * @param {object} item Item original.
 * @returns {object} Item preparado.
 */
function prepareItem(item) {
    if (item.playbackSrc) {
        return item;
    }

    return {
        ...item,
        playbackSrc: withCacheBuster(item.src),
    };
}
