# Pantallas

Aplicacion HTML para publicar contenido en pantallas de senalizacion digital.

## Como funciona

La pagina se abre indicando el codigo de pantalla en la URL:

```text
index.html?screen=tv1
index.html?screen=tv2
```

El archivo `config/screens.json` relaciona cada codigo con un archivo de
configuracion especifico. Cada configuracion define la rotacion de la pantalla,
el intervalo de actualizacion y la lista de imagenes o videos que se deben
reproducir.

## Estructura principal

- `index.html`: estructura base de la pagina y contenedor `#player`.
- `js/player.js`: punto de entrada del reproductor.
- `js/modules/`: modulos separados por responsabilidad.
- `config/screens.json`: mapa de codigos de pantalla.
- `config/screen-*.json`: configuraciones individuales de cada pantalla.
- `assets/images/`: imagenes disponibles para reproducir.
- `assets/videos/`: videos disponibles para reproducir.

## Configuracion de una pantalla

Ejemplo:

```json
{
    "name": "Pantalla Izquierda",
    "rotation": 90,
    "refreshConfigSeconds": 60,
    "items": [
        {
            "type": "video",
            "src": "assets/videos/video.mp4"
        }
    ]
}
```

Campos:

- `name`: nombre descriptivo de la pantalla.
- `rotation`: rotacion del contenido en grados. Puede ser `0`, `90`, `180` o `270`.
- `refreshConfigSeconds`: segundos entre revisiones de cambios en la configuracion.
- `items`: lista de contenidos a reproducir.

Cada item puede ser:

- `type`: `image` o `video`.
- `src`: ruta del archivo.
- `duration`: duracion en milisegundos, usada para imagenes.
- `startTime`: hora inicial opcional en formato `HH:mm`.
- `endTime`: hora final opcional en formato `HH:mm`.

## Notas tecnicas

La aplicacion usa modulos ES (`type="module"`) y carga configuraciones con
`fetch`, por lo que debe servirse desde un servidor HTTP. Abrir el archivo HTML
directamente con `file://` puede impedir que el navegador cargue los JSON.

Los archivos JSON no tienen comentarios porque el formato JSON estandar no los
permite.
