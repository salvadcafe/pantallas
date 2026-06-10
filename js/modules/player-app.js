import {
    getScreenCode,
    getScreenConfigFile,
    loadScreenConfig,
} from "./screen-config.js";
import { applyOrientation } from "./orientation.js";
import { filterItemsBySchedule } from "./schedule.js";
import { preloadAssets } from "./preloader.js";
import { getPlayerElement, showError } from "./ui.js";
import { createPlaylistPlayer } from "./playlist-player.js";
import { startConfigWatcher } from "./config-watcher.js";

/**
 * Inicializa el reproductor de senalizacion digital.
 *
 * Responsabilidades:
 * - leer el codigo de pantalla desde la URL;
 * - cargar su configuracion;
 * - aplicar orientacion, horario y precarga;
 * - iniciar la reproduccion y la revision de cambios.
 *
 * @returns {Promise<void>}
 */
export async function startPlayer() {
    try {
        const screenCode = getScreenCode();

        if (!screenCode) {
            showError("Debe indicar ?screen=CODIGO");
            return;
        }

        const configFile = await getScreenConfigFile(screenCode);

        if (!configFile) {
            showError(`Pantalla '${screenCode}' no existe`);
            return;
        }

        const playerElement = getPlayerElement();
        const playlistPlayer = createPlaylistPlayer(playerElement);
        let currentConfig = null;

        /**
         * Aplica una configuracion nueva o recien cargada.
         *
         * @param {object} config Configuracion completa de la pantalla.
         * @returns {Promise<void>}
         */
        async function applyConfig(config) {
            currentConfig = config;

            applyOrientation(playerElement, currentConfig.rotation || 0);

            const activeItems = filterItemsBySchedule(currentConfig.items || []);

            if (activeItems.length === 0) {
                showError("No hay contenido disponible para esta hora");
                return;
            }

            await preloadAssets(activeItems);

            playlistPlayer.setItems(activeItems);
            playlistPlayer.play();
        }

        await applyConfig(await loadScreenConfig(configFile));

        // Mantiene la pantalla sincronizada con cambios en el JSON.
        startConfigWatcher({
            configFile,
            getConfig: () => currentConfig,
            onConfigChange: applyConfig,
        });
    } catch (error) {
        console.error(error);
        showError("Error inicializando");
    }
}
