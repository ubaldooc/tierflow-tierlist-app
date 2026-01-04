
// AQUI ESTAN TODOS LOS ELEMENTOS DEL DOM QUE UTILIZO
const dropWarning = document.getElementById("drop-warning");
const rows = document.querySelectorAll(".row");
const rowItems = document.querySelectorAll(".row-items");
const imgsAddedContainer = document.getElementById("id_imgs-added_container");
const addImgBtn = document.getElementById("id_addImg-btn");
const resetTierButton = document.getElementById("reset-tier-button");
const saveCaptureTierlist = document.getElementById("save-capture-tierlist");
const deleteButton = document.getElementById("delete-button");
const deleteZone = document.getElementById("delete-zone");


// CONFIGURACION DE SORTABLE JQUERY
const commonSortableOptions = {
    connectWith: ".row-items, #id_imgs-added_container, #delete-zone", 
    items: "img",
    placeholder: "sortable-placeholder",
    animation: 200,
    helper:"clone",

    start: function(event, ui) {
        ui.item.startPos = ui.item.index();
    },
    update: function(event, ui) {
        if (ui.sender) {
            $(ui.sender).sortable("refreshPositions");
        }
    },
    // Desde aqui manejo la eliminación:
    receive: function(event, ui) {
        if ($(this).attr('id') === 'delete-zone') {
            ui.item.remove();
            $(rowItems).sortable("refresh");
            $(imgsAddedContainer).sortable("refresh");
        }
    },
};

// Aqui inicializo jquery sortable
rowItems.forEach(row => {
    $(row).sortable(commonSortableOptions).disableSelection();
});
$(imgsAddedContainer).sortable(commonSortableOptions).disableSelection();
$(deleteZone).sortable(commonSortableOptions).disableSelection();

// Aqui manejor el dragging de las imagenes
document.querySelectorAll("img").forEach(img => {
    img.addEventListener("dragstart", () => {
        img.classList.add("dragging");
    });

    img.addEventListener("dragend", () => {
        img.classList.remove("dragging");
    });
});


// RESET TIERLIST
const resetTierlist = (event)=> {
    const itemsInTiers = document.querySelectorAll(".draggable-image");
    itemsInTiers.forEach(item => {
        imgsAddedContainer.appendChild(item);
    });
}

// ELIMINAR TODOS LOS ITEMS DE LA TIERLIST
const deleteAllItems = (event)=> {
    const itemsInTiers = document.querySelectorAll(".draggable-image");
    itemsInTiers.forEach(item => {
        item.remove();
    });    
}

// FUNCION PARA AGREGAR LAS IMAGENES
const addImagesToContainer = (filesToAdd) => {
    const fragment = document.createDocumentFragment();
    let processedFilesCount = 0; // Contador para saber cuándo se han procesado todos los archivos

    if (filesToAdd.length === 0) {
        return;
    }

    for (let i = 0; i < filesToAdd.length; i++) {
        const file = filesToAdd[i];

        if (file.type.startsWith(`image/`)) {
            const reader = new FileReader();

            reader.readAsDataURL(file);

            reader.addEventListener("load", (e) => {
                let mediaElement;
                if (file.type.startsWith('image/')) {
                    mediaElement = document.createElement('img');
                    mediaElement.src = e.currentTarget.result;
                    mediaElement.classList.add('draggable-image'); 
                    mediaElement.setAttribute('draggable', true);
                    // mediaElement.style.maxWidth = '100%';
                    mediaElement.style.maxHeight = '100%';
                }

                    fragment.appendChild(mediaElement);
                
                processedFilesCount++;

                if (processedFilesCount === filesToAdd.length) {
                    imgsAddedContainer.appendChild(fragment);

                    // Refrescar el sortable para reconocer los nuevos elementos
                    $(imgsAddedContainer).sortable("refresh");
                    $(rowItems).sortable("refresh");

                }
            });
        } else {
            // Si el archivo no es ni imagen ni video, se cuenta como procesado pero no se añade
            console.warn(`Archivo no soportado: ${file.name} (${file.type})`);
            processedFilesCount++;
            if (processedFilesCount === filesToAdd.length) {
                imgsAddedContainer.sortable("refresh");
                rowItems.sortable("refresh");
            }
        }
    }
};


// CAPTURA DE PANTALLA DE LA TIERLIST
const captureButton = document.getElementById("save-tier-button");
const mainTierlistContainer = document.getElementById("tierlist");

captureButton.addEventListener('click', function() {    
    if (mainTierlistContainer) {
        html2canvas(mainTierlistContainer, {
            // Aqui van algunas opciones adicionales, pero solo usare useCORS por si acaso
            useCORS: true // Importante si las imágenes cargadas vienen de diferentes dominios
        })
        .then(function(canvas) {
            const imageDataURL = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = imageDataURL;
            downloadLink.download = 'Mi-tierlist.png';
            document.body.appendChild(downloadLink);

            downloadLink.click();

            document.body.removeChild(downloadLink);
        })
        .catch(error => {
            console.error("Error al capturar la tierlist:", error);
            alert("No se pudo capturar la tierlist. Asegúrate de que las imágenes estén cargadas correctamente y prueba de nuevo.");
        });
    } else {
        console.error("No se encontró el contenedor principal de la tierlist.");
        alert("No se pudo encontrar el contenedor principal de la tierlist para capturar.");
    }
});


// ADVERTENCIA AL SOLTAR EN UN LUGAR NO AUTORIZADO A TRAVEZ DEL EXPLORADOR
document.addEventListener(`dragover`, e => {
    e.preventDefault();
    imgsAddedContainer.classList.add("drop-explorer");
});

document.addEventListener(`dragleave`, e => {
    e.preventDefault();
    imgsAddedContainer.classList.remove("drop-explorer");
});

document.addEventListener(`drop`, e => {
    e.preventDefault();
    imgsAddedContainer.classList.remove("drop-explorer");

    // Muestra la advertencia y la oculta después de 3 segundos
    dropWarning.style.display = `block`;
    setTimeout(() => {
        dropWarning.style.display = `none`;
    }, 3000);
});


// CONFIGURACION PARA EL DROP DESDE EL EXPLORADOR, SOLO PARA EL CONTENEDOR PRINCIPAL DE AÑADIR IMAGENES.
imgsAddedContainer.addEventListener('dragover', (e) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
    imgsAddedContainer.classList.add("row-items-hover");
});

imgsAddedContainer.addEventListener('dragleave', (e) => {
    e.preventDefault();
    imgsAddedContainer.classList.remove("row-items-hover");
});

imgsAddedContainer.addEventListener('drop', (e) => {
    e.preventDefault(); 
    e.stopPropagation(); // Evita que el evento 'drop' se propague al 'document' (evita el dropWarning global)
    imgsAddedContainer.classList.remove("drop-explorer");
    imgsAddedContainer.classList.remove("row-items-hover");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        addImagesToContainer(files);
    }
});

// AQUI INICIALIZO LAS FUNCIONES CON LOS BOTONES DEL DOM
resetTierButton.addEventListener("click", resetTierlist);
deleteButton.addEventListener("click", deleteAllItems);
addImgBtn.addEventListener('change', (e) => {
    addImagesToContainer(addImgBtn.files);
});















































// DE AQUI PARA ABAJO ESTA EL CODIGO DE REPUESTO EN CASO DE OCUPARLO VIENE CODIGO UTIL COMO EL INDICADOR DE CARGA DE ELEMENTOS, Y AGREGAR VIDEO TAMBIEN.
// DE AQUI PARA ABAJO ESTA EL CODIGO DE REPUESTO EN CASO DE OCUPARLO VIENE CODIGO UTIL COMO EL INDICADOR DE CARGA DE ELEMENTOS, Y AGREGAR VIDEO TAMBIEN.
// DE AQUI PARA ABAJO ESTA EL CODIGO DE REPUESTO EN CASO DE OCUPARLO VIENE CODIGO UTIL COMO EL INDICADOR DE CARGA DE ELEMENTOS, Y AGREGAR VIDEO TAMBIEN.


// // INDICADOR DE CARGA DE ELEMEMENTOS CUANDO LOS ELEMENTOS SON PESADOS Y TARDAN EN CARGAR.
// // INDICADOR DE CARGA DE ELEMEMENTOS CUANDO LOS ELEMENTOS SON PESADOS Y TARDAN EN CARGAR.
// // INDICADOR DE CARGA DE ELEMEMENTOS CUANDO LOS ELEMENTOS SON PESADOS Y TARDAN EN CARGAR.
// // INDICADOR DE CARGA DE ELEMEMENTOS CUANDO LOS ELEMENTOS SON PESADOS Y TARDAN EN CARGAR.

// const tierRows = document.querySelectorAll('.row-items'); // Filas de la tierlist
// const tierlistLoadIndicator = document.querySelector(".tierlist_load-indicator");
// const tierlistLoadIndicatorProgress = document.querySelector(".tierlist_load-indicator_progress");

// tierRows.forEach(row => {
//     // Evento al arrastrar sobre una fila
//     row.addEventListener('dragover', function(event) {
//         event.preventDefault();
//         row.style.backgroundColor = '#bfeefd'; // Cambia el fondo para indicar que es una zona válida
//     });

//     // Evento al salir de una fila
//     row.addEventListener('dragleave', function() {
//         row.style.backgroundColor = ''; // Restaura el fondo
//     });

//     // Evento al soltar un archivo en una fila
//     row.addEventListener('drop', function(event) {
//         event.preventDefault();
//         row.style.backgroundColor = ''; // Restaura el fondo
//         event.stopPropagation(); // Esto evita que aparezca el mensaje de no soltar objetos que se configuró al inicio del código.

//         const files = event.dataTransfer.files;
//         if (files.length > 0) {
//             const fragment = document.createDocumentFragment();
//             let archivosProcesados = 0;

//             for (let i = 0; i < files.length; i++) {
//                 const file = files[i];

//                 // Lógica para IMÁGENES
//                 if (file.type.startsWith('image/')) {
//                     const reader = new FileReader();

//                     // Evento de progreso de lectura (para la barra de carga)
//                     reader.onprogress = e => {
//                         tierlistLoadIndicator.style.display = `block`;
//                         tierlistLoadIndicatorProgress.style.display = `block`;

//                         let carga = Math.round(e.loaded / file.size * 100);
//                         tierlistLoadIndicatorProgress.textContent = `${carga}%`;
//                         tierlistLoadIndicatorProgress.style.width = `${carga}%`;
//                     };

//                     // Evento cuando la lectura del archivo ha terminado
//                     reader.onload = function(e) {
//                         const img = document.createElement('img');
//                         img.src = e.target.result;
//                         img.style.maxWidth = '100%';
//                         img.style.maxHeight = '100%';
//                         fragment.appendChild(img);
//                         archivosProcesados++;

//                         // Cuando todos los archivos han sido leídos y añadidos al fragmento
//                         if (archivosProcesados === files.length) {
//                             row.appendChild(fragment); // Añade el fragmento al DOM
//                             $(".row-items, .imgs-added_container").sortable("refresh"); // Actualizar el sortable
//                         }
//                     };

//                     // Evento cuando la carga completa (independientemente del éxito o error)
//                     reader.onloadend = e => {
//                         tierlistLoadIndicatorProgress.textContent = `100%`;
//                         setTimeout(() => {
//                             tierlistLoadIndicator.style.display = `none`;
//                             tierlistLoadIndicatorProgress.style.display = `none`;
//                         }, 1000); // Oculta la barra después de un segundo
//                     };

//                     reader.readAsDataURL(file); // Inicia la lectura del archivo como URL de datos

//                 }
//                 // Lógica para VIDEOS
//                 else if (file.type.startsWith('video/')) {
//                     const reader = new FileReader();

//                     // Evento de progreso de lectura (para la barra de carga)
//                     reader.onprogress = e => {
//                         tierlistLoadIndicator.style.display = `block`;
//                         tierlistLoadIndicatorProgress.style.display = `block`;

//                         let carga = Math.round(e.loaded / file.size * 100);
//                         tierlistLoadIndicatorProgress.textContent = `${carga}%`;
//                         tierlistLoadIndicatorProgress.style.width = `${carga}%`;
//                     };

//                     // Evento cuando la lectura del archivo ha terminado
//                     reader.onload = function(e) {
//                         const video = document.createElement('video');
//                         video.src = e.target.result;
//                         video.controls = true;
//                         video.style.maxHeight = '90px';
//                         fragment.appendChild(video);
//                         archivosProcesados++;

//                         // Cuando todos los archivos han sido leídos y añadidos al fragmento
//                         if (archivosProcesados === files.length) {
//                             row.appendChild(fragment); // Añade el fragmento al DOM
//                             $(".row-items, .imgs-added_container").sortable("refresh"); // Actualizar el sortable
//                         }
//                     };

//                     // Evento cuando la carga completa (independientemente del éxito o error)
//                     reader.onloadend = e => {
//                         tierlistLoadIndicatorProgress.textContent = `100%`;
//                         setTimeout(() => {
//                             tierlistLoadIndicator.style.display = `none`;
//                             tierlistLoadIndicatorProgress.style.display = `none`;
//                         }, 1000); // Oculta la barra después de un segundo
//                     };

//                     reader.readAsDataURL(file); // Inicia la lectura del archivo como URL de datos
//                 }
//             }
//         }
//     });
// });



// // ESTA FUNCION PERMITA AGREGAR TAMBIEN VIDEO, LA DEJARE AQUI POR SI LA NECESITO EN UN FUTURO.
// // ESTA FUNCION PERMITA AGREGAR TAMBIEN VIDEO, LA DEJARE AQUI POR SI LA NECESITO EN UN FUTURO.
// // ESTA FUNCION PERMITA AGREGAR TAMBIEN VIDEO, LA DEJARE AQUI POR SI LA NECESITO EN UN FUTURO.
// // ESTA FUNCION PERMITA AGREGAR TAMBIEN VIDEO, LA DEJARE AQUI POR SI LA NECESITO EN UN FUTURO.
// const addImagesToContainer = (filesToAdd, targetContainer) => {
//     const fragment = document.createDocumentFragment();
//     let processedFilesCount = 0; // Contador para saber cuándo se han procesado todos los archivos

//     if (filesToAdd.length === 0) {
//         return;
//     }

//     for (let i = 0; i < filesToAdd.length; i++) {
//         const file = filesToAdd[i];

//         // Solo se procesan imágenes (y quiza videos)
//         if (file.type.startsWith(`image/`) || file.type.startsWith('video/')) {
//             const reader = new FileReader();

//             reader.readAsDataURL(file);

//             reader.addEventListener("load", (e) => {
//                 let mediaElement;
//                 if (file.type.startsWith('image/')) {
//                     mediaElement = document.createElement('img');
//                     mediaElement.src = e.currentTarget.result;
//                     mediaElement.classList.add('draggable-image'); // Añadir clase para identificar y arrastrar
//                     mediaElement.setAttribute('draggable', true);    // Hacer la imagen arrastrable
//                     mediaElement.style.maxWidth = '100%';          // Estilos para la imagen
//                     mediaElement.style.maxHeight = '100%';         // Estilos para la imagen
//                 } else if (file.type.startsWith('video/')) {
//                     mediaElement = document.createElement('video');
//                     mediaElement.src = e.currentTarget.result;
//                     mediaElement.controls = true;                  // Añadir controles de video
//                     mediaElement.style.maxHeight = '90px';         // Estilos para el video
//                     // Nota: el video también puede necesitar la clase 'draggable-image' y 'draggable' si se quiere mover con Sortable
//                 }

//                 if (mediaElement) {
//                     fragment.appendChild(mediaElement);
//                 }
                
//                 processedFilesCount++;

//                 // Cuando todos los archivos en la lista actual han sido cargados
//                 if (processedFilesCount === filesToAdd.length) {
//                     targetContainer.appendChild(fragment);
//                     // Refrescar el sortable para reconocer los nuevos elementos
//                     $(".row-items, .imgs-added_container").sortable("refresh");
//                 }
//             });
//         } else {
//             // Si el archivo no es ni imagen ni video, se cuenta como procesado pero no se añade
//             console.warn(`Archivo no soportado: ${file.name} (${file.type})`);
//             processedFilesCount++;
//             if (processedFilesCount === filesToAdd.length) {
//                 $(".row-items, .imgs-added_container").sortable("refresh");
//             }
//         }
//     }
// };

// AQUI TERMINA EL CODIGO DE REPUESTO DE UTILIDADES.




