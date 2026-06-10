import { withCacheBuster } from "./cache.js";

/**
 * Renderiza un item de contenido dentro del contenedor principal.
 *
 * @param {HTMLElement} player Contenedor #player.
 * @param {object} item Item de imagen o video.
 * @param {object} playback Controlador de reproduccion de la lista.
 */
export function renderItem(player, item, playback) {
    const container = createSlideContainer();
    let cleanup = () => {};
    let cancelled = false;

    player.appendChild(container);

    if (item.type === "image") {
        cleanup = renderImage(container, item, playback, {
            onReady: () => showReadySlide(player, container),
            onFailure: () => handleRenderFailure(player, container, playback),
            isCancelled: () => cancelled,
        });

        return (options = {}) => {
            cancelled = true;
            cleanup(options);

            if (!options.keepElement) {
                removeElement(container);
            }
        };
    }

    cleanup = renderVideo(container, item, playback, {
        onReady: () => showReadySlide(player, container),
        onFailure: () => handleRenderFailure(player, container, playback),
        isCancelled: () => cancelled,
    });

    return (options = {}) => {
        cancelled = true;
        cleanup(options);

        if (!options.keepElement) {
            removeElement(container);
        }
    };
}

/**
 * Crea un contenedor temporal para cada item.
 *
 * El cambio de opacidad permite una transicion suave cuando se reemplaza el
 * contenido anterior.
 *
 * @returns {HTMLDivElement} Contenedor del slide.
 */
function createSlideContainer() {
    const container = document.createElement("div");

    container.className = "slide";
    container.style.position = "absolute";
    container.style.inset = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.opacity = "0";
    container.style.transition = "opacity 1s ease";

    return container;
}

/**
 * Renderiza una imagen y agenda el salto al siguiente item.
 *
 * @param {HTMLElement} container Contenedor del slide.
 * @param {object} item Configuracion de la imagen.
 * @param {object} playback Controlador de reproduccion de la lista.
 */
function renderImage(container, item, playback, lifecycle) {
    const img = document.createElement("img");
    const duration = Number.isFinite(item.duration) && item.duration > 0
        ? item.duration
        : 10000;
    let timeoutId = null;

    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";

    img.addEventListener("load", () => {
        if (lifecycle.isCancelled()) {
            return;
        }

        lifecycle.onReady();

        timeoutId = setTimeout(() => {
            playback.next();
        }, duration);
    }, { once: true });

    img.addEventListener("error", () => {
        console.error("Error cargando imagen:", item.src);

        if (!lifecycle.isCancelled()) {
            lifecycle.onFailure();
        }
    }, { once: true });

    container.appendChild(img);
    img.src = getItemSource(item);

    return () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    };
}

/**
 * Renderiza un video con autoplay silencioso y sin controles.
 *
 * @param {HTMLElement} container Contenedor del slide.
 * @param {object} item Configuracion del video.
 * @param {object} playback Controlador de reproduccion de la lista.
 */
function renderVideo(container, item, playback, lifecycle) {
    const video = document.createElement("video");
    let ready = false;
    let stalledTimeoutId = null;

    video.preload = "auto";
    video.autoplay = true;

    // Los navegadores suelen permitir autoplay solo si el video esta silenciado.
    video.muted = true;
    video.playsInline = true;
    video.controls = false;
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";

    function markReady() {
        if (ready || lifecycle.isCancelled()) {
            return;
        }

        ready = true;
        clearTimeout(stalledTimeoutId);
        lifecycle.onReady();
    }

    function fail(error) {
        if (lifecycle.isCancelled()) {
            return;
        }

        clearTimeout(stalledTimeoutId);
        console.error("Error reproduciendo video:", item.src, error || "");
        lifecycle.onFailure();
    }

    video.addEventListener("loadeddata", markReady, { once: true });
    video.addEventListener("canplay", markReady, { once: true });
    video.addEventListener("playing", markReady, { once: true });

    video.addEventListener("ended", () => {
        if (playback.isSingleItem()) {
            restartVideo(video);
            return;
        }

        playback.next();
    });

    video.addEventListener("error", fail, { once: true });
    video.addEventListener("stalled", () => {
        clearTimeout(stalledTimeoutId);

        stalledTimeoutId = setTimeout(() => {
            if (!ready) {
                fail(new Error("Video detenido antes de estar listo"));
            }
        }, 8000);
    });

    container.appendChild(video);
    video.src = getItemSource(item);

    const playPromise = video.play();

    if (playPromise) {
        playPromise.catch(fail);
    }

    return (options = {}) => {
        clearTimeout(stalledTimeoutId);
        video.pause();

        if (options.keepElement) {
            return;
        }

        video.removeAttribute("src");
        video.load();
    };
}

/**
 * Reinicia un video cuando es el unico item de la lista.
 *
 * @param {HTMLVideoElement} video Video que debe repetirse.
 */
function restartVideo(video) {
    video.currentTime = 0;

    const playPromise = video.play();

    if (playPromise) {
        playPromise.catch(error => {
            console.error("Error reiniciando video:", error);
        });
    }
}

/**
 * Muestra el slide nuevo y retira el contenido anterior despues de la transicion.
 *
 * @param {HTMLElement} player Contenedor #player.
 * @param {HTMLElement} container Slide listo para mostrar.
 */
function showReadySlide(player, container) {
    const previousChildren = Array.from(player.children)
        .filter(child => child !== container);

    container.classList.add("ready");

    requestAnimationFrame(() => {
        container.style.opacity = "1";
    });

    setTimeout(() => {
        previousChildren.forEach(removeElement);
    }, 1100);
}

/**
 * Recupera la reproduccion si un medio no se puede mostrar.
 *
 * @param {HTMLElement} player Contenedor #player.
 * @param {HTMLElement} container Slide fallido.
 * @param {object} playback Controlador de reproduccion de la lista.
 */
function handleRenderFailure(player, container, playback) {
    removeElement(container);

    if (playback.isSingleItem()) {
        playback.showFallback("No se pudo cargar el contenido. Reintentando...");

        setTimeout(() => {
            playback.next();
        }, 5000);

        return;
    }

    playback.next();
}

/**
 * Quita un elemento solo si sigue conectado al DOM.
 *
 * @param {Element} element Elemento que se debe retirar.
 */
function removeElement(element) {
    if (element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

/**
 * Devuelve la URL preparada por precarga o genera una de respaldo.
 *
 * @param {object} item Item de contenido.
 * @returns {string} URL reproducible.
 */
function getItemSource(item) {
    return item.playbackSrc || withCacheBuster(item.src);
}
