import { withCacheBuster } from "./cache.js";

/**
 * Carga un archivo JSON desde el servidor.
 *
 * La carga usa cache buster para que los cambios en configuraciones sean
 * visibles sin depender de limpiar la cache del navegador.
 *
 * @param {string} url Ruta del JSON.
 * @returns {Promise<object>} Contenido parseado del archivo JSON.
 * @throws {Error} Cuando el servidor no responde con estado exitoso.
 */
export async function loadJson(url) {
    const response = await fetch(withCacheBuster(url));

    if (!response.ok) {
        throw new Error(url);
    }

    return response.json();
}
