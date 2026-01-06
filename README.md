# Premium Tier List Maker

Una aplicación web moderna y eficiente para crear Tier Lists personalizadas. Diseñada con un enfoque en la estética, el rendimiento y la privacidad del usuario.

## 🚀 Características Principales

*   **Drag & Drop Fluido:** Sistema impulsado por **SortableJS** para una experiencia de arrastrar y soltar suave, precisa y compatible con dispositivos móviles.
*   **Persistencia de Datos:** Todo tu progreso se guarda automáticamente en tu navegador usando **IndexedDB**, permitiendo almacenar cientos de imágenes sin ralentizar la interfaz, a diferencia del almacenamiento local tradicional.
*   **Optimización Inteligente:** Las imágenes subidas se comprimen y convierten automáticamente a formato **WebP** en el navegador, reduciendo drásticamente el peso de los archivos sin perder calidad visible.
*   **Importar y Exportar:** Guarda tus proyectos completos como archivos `.json` portables. Lleva tu Tier List a otro PC o guárdala como copia de seguridad.
*   **Capturas de Pantalla HD:** Genera imágenes PNG de alta calidad de tu Tier List, listas para compartir en redes sociales, con un diseño limpio y profesional.
*   **Interfaz Premium:** Diseño moderno "Glassmorphism" con modo oscuro, animaciones fluidas y completamente responsivo.

## 🛠️ Tecnologías Utilizadas

*   **HTML5 & CSS3:** Variables CSS, Flexbox, y efectos de desenfoque nativos.
*   **JavaScript (Vanilla ES6+):** Lógica asíncrona para el manejo de imágenes y bases de datos.
*   **[SortableJS](https://sortablejs.github.io/Sortable/):** Librería líder para interacciones de arrastrar y soltar.
*   **[html2canvas](https://html2canvas.hertzen.com/):** Motor de renderizado de capturas de pantalla.

## 📦 Cómo Usar

Esta es una aplicación **Serverless** (sin servidor). Funciona enteramente en el navegador del usuario.

1.  **Abrir:** Simplemente abre el archivo `index.html` en tu navegador web favorito (Chrome, Edge, Firefox, etc.).
2.  **Cargar Imágenes:** Arrastra imágenes desde tu carpeta al panel inferior o usa el botón de "Cargar".
3.  **Editar:**
    *   Arrastra las imágenes a las filas (S, A, B, C...).
    *   Haz clic en el título "Mi Tier List" para cambiar el nombre.
    *   Haz clic en los nombres de las filas para editarlos.
    *   Usa el selector de color a la derecha de cada fila para personalizarla.
4.  **Compartir:** Usa el botón de "Cámara" para descargar la imagen final.

## 📄 Notas Técnicas

*   Las imágenes se almacenan localmente en tu navegador. Si borras la caché o "datos de sitios" del navegador, podrías perder tus Tier Lists guardadas a menos que las hayas exportado como JSON.
*   El sistema soporta la carga masiva de imágenes gracias al procesamiento por lotes (batching) y el uso de `DocumentFragment`, manteniendo la interfaz fluida durante cargas pesadas.
