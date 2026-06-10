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

    const results = await Promise.allSettled(promises);

    return results
        .map((result, index) => ({
            item: items[index],
            status: result.status,
            reason: result.reason,
        }))
        .filter(result => result.status === "fulfilled")
        .map(result => result.item);
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
        return preloadImage(item.src);
    }

    if (item.type === "video") {
        return preloadVideo(item.src);
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
        video.src = withCacheBuster(src);
    });
}
