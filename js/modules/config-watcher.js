import { DEFAULT_REFRESH_SECONDS } from "./constants.js";
import { loadScreenConfig } from "./screen-config.js";

/**
 * Revisa periodicamente si la configuracion de la pantalla cambio.
 *
 * Cuando detecta cambios, delega la aplicacion de la nueva configuracion al
 * callback recibido. Devuelve el id del intervalo por si en el futuro se desea
 * detenerlo con clearInterval.
 *
 * @param {object} params Parametros del observador.
 * @param {string} params.configFile Archivo de configuracion de la pantalla.
 * @param {Function} params.getConfig Funcion que devuelve la configuracion actual.
 * @param {Function} params.onConfigChange Funcion llamada cuando hay cambios.
 * @returns {number} Identificador del intervalo creado.
 */
export function startConfigWatcher({ configFile, getConfig, onConfigChange }) {
    const interval =
        ((getConfig()?.refreshConfigSeconds) || DEFAULT_REFRESH_SECONDS) * 1000;

    return setInterval(async () => {
        try {
            const newConfig = await loadScreenConfig(configFile);
            const oldHash = JSON.stringify(getConfig());
            const newHash = JSON.stringify(newConfig);

            // Comparacion simple y suficiente para archivos JSON pequenos.
            if (oldHash !== newHash) {
                console.log("Configuración actualizada");
                await onConfigChange(newConfig);
            }
        } catch (error) {
            console.error("Error verificando cambios", error);
        }
    }, interval);
}
