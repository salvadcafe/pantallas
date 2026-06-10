/**
 * Agrega un parametro variable a una URL para evitar que el navegador use una
 * version cacheada del archivo. Esto es importante en pantallas publicitarias,
 * donde los cambios de configuracion o contenido deben reflejarse rapido.
 *
 * @param {string} url Ruta del archivo a cargar.
 * @returns {string} Ruta con parametro anti-cache.
 */
export function withCacheBuster(url) {
    return `${url}?v=${Date.now()}`;
}
