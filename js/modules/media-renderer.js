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

    player.innerHTML = "";
    player.appendChild(container);

    requestAnimationFrame(() => {
        container.style.opacity = "1";
    });

    if (item.type === "image") {
        renderImage(container, item, playback);
        return;
    }

    renderVideo(container, item, playback);
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
function renderImage(container, item, playback) {
    const img = document.createElement("img");

    img.src = withCacheBuster(item.src);
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";

    container.appendChild(img);

    // Las imagenes no tienen evento "ended"; por eso usan duration.
    setTimeout(() => {
        playback.next();
    }, item.duration);
}

/**
 * Renderiza un video con autoplay silencioso y sin controles.
 *
 * @param {HTMLElement} container Contenedor del slide.
 * @param {object} item Configuracion del video.
 * @param {object} playback Controlador de reproduccion de la lista.
 */
function renderVideo(container, item, playback) {
    const video = document.createElement("video");

    video.preload = "auto";
    video.src = withCacheBuster(item.src);
    video.autoplay = true;

    // Los navegadores suelen permitir autoplay solo si el video esta silenciado.
    video.muted = true;
    video.playsInline = true;
    video.controls = false;
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";

    video.addEventListener("ended", () => {
        if (playback.isSingleItem()) {
            restartVideo(video);
            return;
        }

        playback.next();
    });

    video.addEventListener("error", () => {
        console.error("Error reproduciendo video:", item.src);

        if (!playback.isSingleItem()) {
            playback.next();
        }
    });

    container.appendChild(video);
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
