/**
 * Filtra los contenidos que pueden mostrarse en la hora actual.
 *
 * Si un item no tiene startTime o endTime, se considera siempre activo.
 *
 * @param {Array<object>} items Lista de imagenes o videos configurados.
 * @returns {Array<object>} Items disponibles para reproducir ahora.
 */
export function filterItemsBySchedule(items) {
    const now = getCurrentMinutes();

    return items.filter(item => isItemActiveNow(item, now));
}

/**
 * Determina si un item esta dentro de su ventana horaria.
 *
 * @param {object} item Item de contenido.
 * @param {number} currentMinutes Minutos transcurridos desde medianoche.
 * @returns {boolean} true cuando el item debe estar activo.
 */
function isItemActiveNow(item, currentMinutes) {
    if (!item.startTime || !item.endTime) {
        return true;
    }

    const start = toMinutes(item.startTime);
    const end = toMinutes(item.endTime);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
        return true;
    }

    if (start <= end) {
        return currentMinutes >= start && currentMinutes <= end;
    }

    return currentMinutes >= start || currentMinutes <= end;
}

/**
 * Convierte la hora actual a minutos para simplificar comparaciones.
 *
 * @returns {number} Minutos desde las 00:00.
 */
function getCurrentMinutes() {
    const now = new Date();

    return now.getHours() * 60 + now.getMinutes();
}

/**
 * Convierte una hora en formato HH:mm a minutos desde medianoche.
 *
 * @param {string} time Hora en formato HH:mm.
 * @returns {number} Minutos desde las 00:00.
 */
function toMinutes(time) {
    const [hours, minutes] = time.split(":");

    return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
}
