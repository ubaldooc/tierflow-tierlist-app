// DOM ELEMENTS
const dropWarning = document.getElementById("drop-warning");
const imgsAddedContainer = document.getElementById("id_imgs-added_container");
const addImgBtn = document.getElementById("id_addImg-btn");
const resetTierButton = document.getElementById("reset-tier-button");
const captureButton = document.getElementById("save-tier-button");
const deleteButton = document.getElementById("delete-button");
const deleteZone = document.getElementById("delete-zone");
const mainTierlistContainer = document.getElementById("tierlist");
const addRowBtn = document.getElementById("id_add-row-btn");

// --- LOCAL STORAGE PERSISTENCE ---

const saveTierlistState = () => {
    const state = {
        rows: [],
        unranked: []
    };

    // Save items in rows, row names and COLORS
    document.querySelectorAll(".row").forEach(row => {
        const rowName = row.querySelector(".row-name").innerText;
        const rowBg = row.querySelector(".row-name").style.backgroundColor;
        const items = Array.from(row.querySelectorAll(".row-items img, .row-items video")).map(item => ({
            type: item.tagName.toLowerCase(),
            src: item.src
        }));
        state.rows.push({ name: rowName, color: rowBg, items });
    });

    // Save unranked items
    state.unranked = Array.from(imgsAddedContainer.querySelectorAll(".draggable-image")).map(item => ({
        type: item.tagName.toLowerCase(),
        src: item.src
    }));

    localStorage.setItem("tierlist_premium_state", JSON.stringify(state));
};

const loadTierlistState = () => {
    const savedState = localStorage.getItem("tierlist_premium_state");
    if (!savedState) return;

    try {
        const state = JSON.parse(savedState);
        mainTierlistContainer.innerHTML = ""; // Clear default rows

        state.rows.forEach(rowData => {
            const newRow = createRowElement(rowData.name, rowData.color);
            mainTierlistContainer.appendChild(newRow);

            const rowItemsDiv = newRow.querySelector(".row-items");
            rowData.items.forEach(itemData => {
                const el = createMediaElement(itemData.src, itemData.type === 'video');
                rowItemsDiv.appendChild(el);
            });
        });

        // Load unranked
        imgsAddedContainer.innerHTML = "";
        state.unranked.forEach(itemData => {
            const el = createMediaElement(itemData.src, itemData.type === 'video');
            imgsAddedContainer.appendChild(el);
        });

        refreshSortables();
    } catch (e) {
        console.error("Error loading state:", e);
    }
};

const createMediaElement = (src, isVideo) => {
    const element = document.createElement(isVideo ? 'video' : 'img');
    element.src = src;
    element.classList.add('draggable-image');
    if (!isVideo) {
        element.setAttribute('draggable', true);
    } else {
        element.style.objectFit = "cover";
    }
    return element;
};

// --- DYNAMIC ROW LOGIC ---

const createRowElement = (name = "NEW", color = "#333") => {
    const row = document.createElement("div");
    row.className = "row";

    row.innerHTML = `
        <div class="row-name" contenteditable="true" spellcheck="false" style="background-color: ${color}">${name}</div>
        <div class="row-items"></div>
        <div class="row-actions">
            <button class="btn-move-up" title="Subir"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg></button>
            <button class="btn-move-down" title="Bajar"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
            <input type="color" value="${rgbToHex(color)}" title="Color de fila">
            <button class="btn-delete-row" title="Eliminar fila"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></button>
        </div>
    `;

    // Events for the new row
    const nameDiv = row.querySelector(".row-name");
    nameDiv.addEventListener("input", saveTierlistState);

    row.querySelector("input[type='color']").addEventListener("input", (e) => {
        nameDiv.style.backgroundColor = e.target.value;
        saveTierlistState();
    });

    row.querySelector(".btn-delete-row").addEventListener("click", () => {
        if (confirm("¿Eliminar esta fila? Las imágenes volverán al contenedor.")) {
            const items = row.querySelectorAll(".draggable-image");
            items.forEach(item => imgsAddedContainer.appendChild(item));
            row.remove();
            refreshSortables();
            saveTierlistState();
        }
    });

    row.querySelector(".btn-move-up").addEventListener("click", () => {
        const prev = row.previousElementSibling;
        if (prev) {
            row.parentNode.insertBefore(row, prev);
            saveTierlistState();
        }
    });

    row.querySelector(".btn-move-down").addEventListener("click", () => {
        const next = row.nextElementSibling;
        if (next) {
            row.parentNode.insertBefore(next, row);
            saveTierlistState();
        }
    });

    // Re-init sortable for the new row
    $(row.querySelector(".row-items")).sortable(commonSortableOptions).disableSelection();

    return row;
};

// Helper to convert rgb to hex for color input
function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith("#")) return rgb || "#333333";
    const vals = rgb.match(/\d+/g);
    if (!vals) return "#333333";
    return "#" + vals.map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}

// --- JQUERY SORTABLE CONFIGURATION ---

const commonSortableOptions = {
    connectWith: ".row-items, #id_imgs-added_container, #delete-zone",
    items: ".draggable-image",
    placeholder: "sortable-placeholder",
    animation: 200,
    helper: "clone",
    revert: 150,

    start: function (event, ui) {
        ui.placeholder.css('width', ui.item.width());
        ui.placeholder.css('height', ui.item.height());
    },

    stop: function () {
        saveTierlistState();
    },

    receive: function (event, ui) {
        if (this.id === 'delete-zone') {
            ui.item.remove();
        }
        refreshSortables();
        saveTierlistState();
    }
};

const refreshSortables = () => {
    $(".row-items, #id_imgs-added_container").sortable("refresh");
};

// Initialize
$(() => {
    // Initial sortable for existing/default containers
    $("#id_imgs-added_container, #delete-zone").sortable(commonSortableOptions).disableSelection();

    // Load saved data OR create defaults if empty
    const saved = localStorage.getItem("tierlist_premium_state");
    if (saved) {
        loadTierlistState();
    } else {
        // Create default rows if nothing is saved
        const defaults = [
            { n: "S", c: "#ff4d4d" }, { n: "A", c: "#ff9f43" },
            { n: "B", c: "#feca57" }, { n: "C", c: "#1dd1a1" }, { n: "E", c: "#54a0ff" }
        ];
        defaults.forEach(d => mainTierlistContainer.appendChild(createRowElement(d.n, d.c)));
    }
});

// ADD ROW BUTTON
addRowBtn.addEventListener("click", () => {
    mainTierlistContainer.appendChild(createRowElement("NUEVO", "#333"));
    saveTierlistState();
});

// RESET TIERLIST (Move items back to container)
const resetTierlist = () => {
    const itemsInTiers = document.querySelectorAll(".row-items .draggable-image");
    itemsInTiers.forEach(item => imgsAddedContainer.appendChild(item));
    refreshSortables();
    saveTierlistState();
};

// DELETE ALL ITEMS
const deleteAllItems = () => {
    if (confirm("¿Estás seguro de que quieres eliminar todas las imágenes?")) {
        document.querySelectorAll(".draggable-image").forEach(item => item.remove());
        refreshSortables();
        saveTierlistState();
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
                const element = createMediaElement(e.target.result, file.type.startsWith('video/'));
                fragment.appendChild(element);
                processed++;
                if (processed === filesToAdd.length) {
                    imgsAddedContainer.appendChild(fragment);
                    refreshSortables();
                    saveTierlistState();
                }
            };
            reader.readAsDataURL(file);
        } else {
            processed++;
            if (processed === filesToAdd.length) {
                refreshSortables();
                saveTierlistState();
            }
        }
    });
};

// SNAPSHOT CAPTURE
captureButton.addEventListener('click', () => {
    if (!mainTierlistContainer) return;
    html2canvas(mainTierlistContainer, {
        useCORS: true,
        backgroundColor: "#0f1113",
        scale: 2
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

// GLOBAL DRAG EVENTS
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
    if (!imgsAddedContainer.contains(e.target)) {
        e.preventDefault();
        dropWarning.style.display = 'block';
        setTimeout(() => dropWarning.style.display = 'none', 3000);
    }
});

imgsAddedContainer.addEventListener('dragover', () => imgsAddedContainer.classList.add("drop-explorer"));
imgsAddedContainer.addEventListener('dragleave', () => imgsAddedContainer.classList.remove("drop-explorer"));
imgsAddedContainer.addEventListener('drop', (e) => {
    e.preventDefault(); e.stopPropagation();
    imgsAddedContainer.classList.remove("drop-explorer");
    addImagesToContainer(e.dataTransfer.files);
});

// EVENT LISTENERS
resetTierButton.addEventListener("click", resetTierlist);
deleteButton.addEventListener("click", deleteAllItems);
addImgBtn.addEventListener('change', (e) => addImagesToContainer(e.target.files));
