const CONFIG_FILE = "config/screens.json";

let currentConfig = null;
let currentIndex = 0;
let activeItems = [];
let currentConfigFile = null;

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const screenCode = getScreenCode();

        if (!screenCode) {
            showError("Debe indicar ?screen=CODIGO");
            return;
        }

        currentConfigFile = await getScreenConfigFile(screenCode);

        if (!currentConfigFile) {
            showError(`Pantalla '${screenCode}' no existe`);
            return;
        }

        await loadConfiguration();

        startConfigWatcher();

    } catch (e) {

        console.error(e);

        showError("Error inicializando");

    }

});

function getScreenCode() {

    return new URLSearchParams(
        window.location.search
    ).get("screen");

}

async function getScreenConfigFile(screenCode) {

    const screens = await loadJson(CONFIG_FILE);

    return screens[screenCode];

}

async function loadJson(url) {

    const response = await fetch(
        `${url}?v=${Date.now()}`
    );

    if (!response.ok) {
        throw new Error(url);
    }

    return await response.json();

}

async function loadConfiguration() {

    currentConfig = await loadJson(
        `config/${currentConfigFile}`
    );

    applyOrientation();

    activeItems = filterItemsBySchedule(
        currentConfig.items || []
    );

    if (activeItems.length === 0) {

        showError(
            "No hay contenido disponible para esta hora"
        );

        return;
    }

    await preloadAssets(activeItems);

    currentIndex = 0;

    showCurrentItem();

}

function applyOrientation() {

    document.body.style.margin = "0";
    document.body.style.background = "#000";
    document.body.style.overflow = "hidden";

    const player = document.getElementById("player");

    player.style.width = "100vw";
    player.style.height = "100vh";

    player.style.display = "flex";
    player.style.justifyContent = "center";
    player.style.alignItems = "center";

    player.style.transform =
        `rotate(${currentConfig.rotation || 0}deg)`;

}

function filterItemsBySchedule(items) {

    const now = getCurrentMinutes();

    return items.filter(item => {

        if (!item.startTime || !item.endTime) {
            return true;
        }

        const start = toMinutes(item.startTime);
        const end = toMinutes(item.endTime);

        return now >= start && now <= end;

    });

}

function getCurrentMinutes() {

    const now = new Date();

    return (
        now.getHours() * 60 +
        now.getMinutes()
    );

}

function toMinutes(time) {

    const [h, m] = time.split(":");

    return parseInt(h) * 60 +
           parseInt(m);

}

async function preloadAssets(items) {

    const promises = [];

    for (const item of items) {

        if (item.type === "image") {

            promises.push(
                preloadImage(item.src)
            );

        } else if (item.type === "video") {

            promises.push(
                preloadVideo(item.src)
            );

        }

    }

    await Promise.allSettled(promises);

}

function preloadImage(src) {

    return new Promise(resolve => {

        const img = new Image();

        img.onload = resolve;
        img.onerror = resolve;

        img.src =
            `${src}?v=${Date.now()}`;

    });

}

function preloadVideo(src) {

    return new Promise(resolve => {

        const video =
            document.createElement("video");

        video.preload = "metadata";

        video.onloadedmetadata = resolve;
        video.onerror = resolve;

        video.src =
            `${src}?v=${Date.now()}`;

    });

}

function showCurrentItem() {

    if (activeItems.length === 0) {
        return;
    }

    const item = activeItems[currentIndex];

    const player =
        document.getElementById("player");

    const container =
        document.createElement("div");

    container.className = "slide";

    container.style.position = "absolute";

    container.style.width = "100%";
    container.style.height = "100%";

    container.style.opacity = "0";

    container.style.transition =
        "opacity 1s ease";

    player.innerHTML = "";

    player.appendChild(container);

    requestAnimationFrame(() => {
        container.style.opacity = "1";
    });

    if (item.type === "image") {

        showImage(container, item);

    } else {

        showVideo(container, item);

    }

}

function showImage(container, item) {

    const img =
        document.createElement("img");

    img.src =
        `${item.src}?v=${Date.now()}`;

    img.style.width = "100%";
    img.style.height = "100%";

    img.style.objectFit = "cover";

    container.appendChild(img);

    const duration =
        item.duration ||
        currentConfig.slideDuration ||
        10000;

    setTimeout(() => {

        nextSlide();

    }, duration);

}

function showVideo(container, item) {

    const video =
        document.createElement("video");

    video.src =
        `${item.src}?v=${Date.now()}`;

    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;

    video.style.width = "100%";
    video.style.height = "100%";

    video.style.objectFit = "cover";

    video.addEventListener(
        "ended",
        nextSlide
    );

    video.addEventListener(
        "error",
        nextSlide
    );

    container.appendChild(video);

}

function nextSlide() {

    currentIndex++;

    if (
        currentIndex >= activeItems.length
    ) {
        currentIndex = 0;
    }

    showCurrentItem();

}

function startConfigWatcher() {

    const interval =
        (currentConfig?.refreshConfigSeconds || 60)
        * 1000;

    setInterval(async () => {

        try {

            const newConfig =
                await loadJson(
                    `config/${currentConfigFile}`
                );

            const oldHash =
                JSON.stringify(currentConfig);

            const newHash =
                JSON.stringify(newConfig);

            if (oldHash !== newHash) {

                console.log(
                    "Configuración actualizada"
                );

                currentConfig = newConfig;

                activeItems =
                    filterItemsBySchedule(
                        currentConfig.items || []
                    );

                currentIndex = 0;

                await preloadAssets(
                    activeItems
                );

            }

        } catch (e) {

            console.error(
                "Error verificando cambios",
                e
            );

        }

    }, interval);

}

function showError(message) {

    document.body.innerHTML = `
        <div style="
            background:black;
            color:white;
            width:100vw;
            height:100vh;
            display:flex;
            justify-content:center;
            align-items:center;
            font-size:40px;
            font-family:Arial;
            text-align:center;
        ">
            ${message}
        </div>
    `;

}
