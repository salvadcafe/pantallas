import { withCacheBuster } from "./cache.js";

/**
 * Precarga los recursos de la lista activa antes de iniciar la reproduccion.
 *
 * Promise.allSettled evita bloquear toda la pantalla si un archivo falla:
 * los errores individuales se toleran y el reproductor sigue con lo demas.
 *
 * @param {Array<object>} items Items de contenido activos.
 * @returns {Promise<Array<object>>} Items cargables con URL estable.
 */
export async function preloadAssets(items) {
    const promises = items.map(item => preloadItem(item));

    const results = await Promise.allSettled(promises);

    return results
        .filter(result => result.status === "fulfilled")
        .map(result => result.value);
}

/**
 * Prepara y precarga un item individual.
 *
 * @param {object} item Item de contenido.
 * @returns {Promise<object>} Item con URL estable para reproduccion.
 */
export async function preloadItem(item) {
    const preparedItem = prepareItem(item);

    await preloadAsset(preparedItem);

    return preparedItem;
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
 * Selecciona el metodo de precarga segun el tipo de contenido.
 *
 * @param {object} item Item de contenido.
 * @returns {Promise<void>}
 */
function preloadAsset(item) {
    if (!item.src) {
        return Promise.reject(new Error("Item sin ruta de contenido"));
    }

    if (item.type === "image") {
        return preloadImage(item.playbackSrc);
    }

    if (item.type === "video") {
        return preloadVideo(item.playbackSrc);
    }

    return Promise.reject(new Error(`Tipo de contenido no soportado: ${item.type}`));
}

/**
 * Precarga una imagen creando un objeto Image en memoria.
 *
 * @param {string} src Ruta de la imagen.
 * @returns {Promise<void>}
 */
function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const timeout = setTimeout(() => {
            reject(new Error(`Tiempo agotado cargando imagen: ${src}`));
        }, 15000);

        img.onload = () => {
            clearTimeout(timeout);
            resolve();
        };
        img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error(`Error cargando imagen: ${src}`));
        };
        img.src = src;
    });
}

/**
 * Precarga los metadatos de un video para validar que el archivo responde.
 *
 * @param {string} src Ruta del video.
 * @returns {Promise<void>}
 */
function preloadVideo(src) {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        const timeout = setTimeout(() => {
            reject(new Error(`Tiempo agotado cargando video: ${src}`));
        }, 20000);

        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;
        video.onloadedmetadata = () => {
            clearTimeout(timeout);
            resolve();
        };
        video.onerror = () => {
            clearTimeout(timeout);
            reject(new Error(`Error cargando video: ${src}`));
        };
        video.src = src;
    });
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
