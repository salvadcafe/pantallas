import { CONFIG_FILE } from "./constants.js";
import { loadJson } from "./http.js";

/**
 * Obtiene el codigo de pantalla desde la URL.
 *
 * Ejemplo: index.html?screen=tv1 devuelve "tv1".
 *
 * @returns {string|null} Codigo de pantalla solicitado.
 */
export function getScreenCode() {
    return new URLSearchParams(window.location.search).get("screen");
}

/**
 * Busca el archivo de configuracion asociado a un codigo de pantalla.
 *
 * @param {string} screenCode Codigo recibido por URL.
 * @returns {Promise<string|undefined>} Nombre del archivo de configuracion.
 */
export async function getScreenConfigFile(screenCode) {
    const screens = await loadJson(CONFIG_FILE);

    return screens[screenCode];
}

/**
 * Construye la ruta relativa al archivo JSON de una pantalla.
 *
 * @param {string} configFile Nombre del archivo dentro de config/.
 * @returns {string} Ruta completa al archivo de configuracion.
 */
export function getScreenConfigPath(configFile) {
    return `config/${configFile}`;
}

/**
 * Carga la configuracion completa de una pantalla.
 *
 * @param {string} configFile Nombre del archivo dentro de config/.
 * @returns {Promise<object>} Configuracion de la pantalla.
 */
export async function loadScreenConfig(configFile) {
    return loadJson(getScreenConfigPath(configFile));
}
