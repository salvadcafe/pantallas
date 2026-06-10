import { withCacheBuster } from "./cache.js";

/**
 * Precarga los recursos de la lista activa antes de iniciar la reproduccion.
 *
 * Promise.allSettled evita bloquear toda la pantalla si un archivo falla:
 * los errores individuales se toleran y el reproductor sigue con lo demas.
 *
 * @param {Array<object>} items Items de contenido activos.
 * @returns {Promise<void>}
 */
export async function preloadAssets(items) {
    const promises = items.map(item => preloadAsset(item));

    await Promise.allSettled(promises);
}

/**
 * Selecciona el metodo de precarga segun el tipo de contenido.
 *
 * @param {object} item Item de contenido.
 * @returns {Promise<void>}
 */
function preloadAsset(item) {
    if (item.type === "image") {
        return preloadImage(item.src);
    }

    if (item.type === "video") {
        return preloadVideo(item.src);
    }

    return Promise.resolve();
}

/**
 * Precarga una imagen creando un objeto Image en memoria.
 *
 * @param {string} src Ruta de la imagen.
 * @returns {Promise<void>}
 */
function preloadImage(src) {
    return new Promise(resolve => {
        const img = new Image();

        img.onload = resolve;
        img.onerror = resolve;
        img.src = withCacheBuster(src);
    });
}

/**
 * Precarga los metadatos de un video para validar que el archivo responde.
 *
 * @param {string} src Ruta del video.
 * @returns {Promise<void>}
 */
function preloadVideo(src) {
    return new Promise(resolve => {
        const video = document.createElement("video");

        video.preload = "metadata";
        video.onloadedmetadata = resolve;
        video.onerror = resolve;
        video.src = withCacheBuster(src);
    });
}
