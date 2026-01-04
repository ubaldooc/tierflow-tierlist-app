// DOM ELEMENTS
const dropWarning = document.getElementById("drop-warning");
const rows = document.querySelectorAll(".row");
const rowItems = document.querySelectorAll(".row-items");
const imgsAddedContainer = document.getElementById("id_imgs-added_container");
const addImgBtn = document.getElementById("id_addImg-btn");
const resetTierButton = document.getElementById("reset-tier-button");
const captureButton = document.getElementById("save-tier-button");
const deleteButton = document.getElementById("delete-button");
const deleteZone = document.getElementById("delete-zone");
const mainTierlistContainer = document.getElementById("tierlist");

// JQUERY SORTABLE CONFIGURATION
const commonSortableOptions = {
    connectWith: ".row-items, #id_imgs-added_container, #delete-zone",
    items: "img",
    placeholder: "sortable-placeholder",
    animation: 200,
    helper: "clone",
    revert: 150,

    start: function (event, ui) {
        ui.item.startPos = ui.item.index();
        ui.placeholder.css('width', ui.item.width());
        ui.placeholder.css('height', ui.item.height());
    },

    // Deletion logic via delete-zone
    receive: function (event, ui) {
        if (this.id === 'delete-zone') {
            ui.item.remove();
            refreshSortables();
        }
    }
};

const refreshSortables = () => {
    $(".row-items, #id_imgs-added_container").sortable("refresh");
};

// Initialize Sortable
$(() => {
    $(".row-items, #id_imgs-added_container, #delete-zone").sortable(commonSortableOptions).disableSelection();
});

// RESET TIERLIST (Move items back to container)
const resetTierlist = () => {
    const itemsInTiers = document.querySelectorAll(".row-items .draggable-image");
    itemsInTiers.forEach(item => {
        imgsAddedContainer.appendChild(item);
    });
    refreshSortables();
};

// DELETE ALL ITEMS
const deleteAllItems = () => {
    if (confirm("¿Estás seguro de que quieres eliminar todas las imágenes?")) {
        const items = document.querySelectorAll(".draggable-image");
        items.forEach(item => item.remove());
        refreshSortables();
    }
};

// ADD IMAGES FUNCTION
const addImagesToContainer = (filesToAdd) => {
    if (!filesToAdd.length) return;

    const fragment = document.createDocumentFragment();
    let processed = 0;

    Array.from(filesToAdd).forEach(file => {
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                let element;
                if (file.type.startsWith('image/')) {
                    element = document.createElement('img');
                    element.src = e.target.result;
                    element.classList.add('draggable-image');
                    element.setAttribute('draggable', true);
                } else {
                    // Primitive video support (thumbnail or actual video)
                    element = document.createElement('video');
                    element.src = e.target.result;
                    element.classList.add('draggable-image');
                    element.style.objectFit = "cover";
                }

                fragment.appendChild(element);
                processed++;

                if (processed === filesToAdd.length) {
                    imgsAddedContainer.appendChild(fragment);
                    refreshSortables();
                }
            };
            reader.readAsDataURL(file);
        } else {
            processed++;
            if (processed === filesToAdd.length) refreshSortables();
        }
    });
};

// SNAPSHOT CAPTURE
captureButton.addEventListener('click', () => {
    if (!mainTierlistContainer) return;

    // Adding a temporary class for better capture styling if needed
    html2canvas(mainTierlistContainer, {
        useCORS: true,
        backgroundColor: "#0f1113", // Match our background
        scale: 2 // Higher quality
    }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'Mi-Tierlist.png';
        link.click();
    }).catch(err => {
        console.error("Error al capturar:", err);
        alert("Error al guardar la imagen.");
    });
});

// GLOBAL DRAG EVENTS (For explorer drops)
document.addEventListener('dragover', e => e.preventDefault());

document.addEventListener('drop', e => {
    // If drop is NOT on the container, show warning
    if (!imgsAddedContainer.contains(e.target)) {
        e.preventDefault();
        dropWarning.style.display = 'block';
        setTimeout(() => dropWarning.style.display = 'none', 3000);
    }
});

imgsAddedContainer.addEventListener('dragover', () => {
    imgsAddedContainer.classList.add("drop-explorer");
});

imgsAddedContainer.addEventListener('dragleave', () => {
    imgsAddedContainer.classList.remove("drop-explorer");
});

imgsAddedContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    imgsAddedContainer.classList.remove("drop-explorer");
    const files = e.dataTransfer.files;
    addImagesToContainer(files);
});

// EVENT LISTENERS
resetTierButton.addEventListener("click", resetTierlist);
deleteButton.addEventListener("click", deleteAllItems);
addImgBtn.addEventListener('change', (e) => addImagesToContainer(e.target.files));
