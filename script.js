// DOM ELEMENTS
const dropWarning = document.getElementById("drop-warning");
const imgsAddedContainer = document.getElementById("id_imgs-added");
const addImgBtn = document.getElementById("id_addImg-btn");
const resetTierButton = document.getElementById("reset-tier-button");
const captureButton = document.getElementById("save-tier-button");
const deleteButton = document.getElementById("delete-button");
const mainTierlistContainer = document.getElementById("tierlist");
const addRowBtn = document.getElementById("id_add-row-btn");
const newTierBtn = document.getElementById("new-tier-button");
const tierlistTitle = document.getElementById("id_tierlist-title");
const tierlistSection = document.querySelector(".tierlist");
const captureArea = document.getElementById("id_capture-area");

// UTILS
let saveTimeout;
const debounceSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveTierlistState, 3000);
};

const adjustFontSize = (el) => {
    // Simplified: Just ensure it doesn't break layout, CSS will handle the rest
    // We'll remove the expensive while loop for performance
    if (el.innerText.length > 20) {
        el.style.fontSize = "0.9rem";
    } else {
        el.style.fontSize = "1.15rem";
    }
};

const compressImage = (file, maxWidth = 400) => {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
            // For non-images (like videos), we return the original DataURL or just skip
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Export as webp (more efficient) or jpeg if not supported
                resolve(canvas.toDataURL('image/webp', 0.8));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
};
const exportJsonBtn = document.getElementById("export-json-button");
const importJsonInput = document.getElementById("import-json-input");
const fullscreenBtn = document.getElementById("fullscreen-button");

// Modal Elements
const confirmModal = document.getElementById("custom-confirm-modal");
const modalMessage = document.getElementById("modal-message");
const modalConfirmBtn = document.getElementById("modal-confirm-btn");
const modalCancelBtn = document.getElementById("modal-cancel-btn");

// --- CUSTOM CONFIRMATION LOGIC ---

let currentConfirmCallback = null;

const showCustomConfirm = (message, onConfirm) => {
    modalMessage.innerText = message;
    confirmModal.style.display = "flex";
    currentConfirmCallback = onConfirm;
};

// Initialize Modal Listeners once
modalConfirmBtn.addEventListener("click", () => {
    confirmModal.style.display = "none";
    if (currentConfirmCallback) {
        currentConfirmCallback();
        currentConfirmCallback = null;
    }
});

modalCancelBtn.addEventListener("click", () => {
    confirmModal.style.display = "none";
    currentConfirmCallback = null;
});

// --- LOCAL STORAGE PERSISTENCE ---

const saveTierlistState = () => {
    const state = {
        title: tierlistTitle.innerText,
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
        if (state.title) tierlistTitle.innerText = state.title;
        mainTierlistContainer.innerHTML = ""; // Clear default rows

        state.rows.forEach(rowData => {
            const newRow = createRowElement(rowData.name, rowData.color);
            mainTierlistContainer.appendChild(newRow);

            const rowItemsDiv = newRow.querySelector(".row-items");
            rowData.items.forEach(itemData => {
                const el = createMediaElement(itemData.src, itemData.type === 'video');
                rowItemsDiv.appendChild(el);
            });
            // Apply font adjustment for loaded rows
            setTimeout(() => adjustFontSize(newRow.querySelector(".row-name")), 0);
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
        <div class="row-actions">
            <button class="btn-move-up" title="Subir"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg></button>
            <button class="btn-move-down" title="Bajar"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
            <input type="color" value="${rgbToHex(color)}" title="Color de fila">
            <button class="btn-delete-row" title="Eliminar fila"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></button>
        </div>
        <div class="row-name" contenteditable="true" spellcheck="false" style="background-color: ${color}">${name}</div>
        <div class="row-items"></div>
    `;

    // Events for the new row
    const nameDiv = row.querySelector(".row-name");

    // Auto-select text on click/focus
    nameDiv.addEventListener("focus", () => {
        adjustFontSize(nameDiv);
        setTimeout(() => {
            document.execCommand('selectAll', false, null);
        }, 0);
    });

    // Handle Enter and ESC keys + Max length
    nameDiv.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            nameDiv.blur();
            return;
        }
        if (e.key === "Escape") {
            nameDiv.blur();
            return;
        }
    });

    nameDiv.addEventListener("input", () => {
        adjustFontSize(nameDiv);
        debounceSave(); // Efficient saving
    });

    // Initial font adjustment
    setTimeout(() => adjustFontSize(nameDiv), 0);

    row.querySelector("input[type='color']").addEventListener("input", (e) => {
        nameDiv.style.backgroundColor = e.target.value;
        debounceSave();
    });

    row.querySelector(".btn-delete-row").addEventListener("click", () => {
        showCustomConfirm("¿Eliminar esta fila? Las imágenes volverán al contenedor.", () => {
            const items = row.querySelectorAll(".draggable-image");
            items.forEach(item => imgsAddedContainer.appendChild(item));
            row.remove();
            refreshSortables();
            saveTierlistState();
        });
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
    connectWith: ".row-items, #id_imgs-added, #delete-zone",
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
    $(".row-items, #id_imgs-added").sortable("refresh");
};

// Initialize
$(() => {
    // Initial sortable for existing/default containers
    $("#id_imgs-added, #delete-zone").sortable(commonSortableOptions).disableSelection();

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

// NEW TIERLIST (Hard Reset)
const resetToDefaultTierlist = () => {
    showCustomConfirm("¿Crear nueva Tierlist? Se borrarán todas las filas personalizadas y las imágenes.", () => {
        // Clear all images
        document.querySelectorAll(".draggable-image").forEach(item => item.remove());

        // Reset rows to default
        mainTierlistContainer.innerHTML = "";
        const defaults = [
            { n: "S", c: "#ff4d4d" }, { n: "A", c: "#ff9f43" },
            { n: "B", c: "#feca57" }, { n: "C", c: "#1dd1a1" }, { n: "E", c: "#54a0ff" }
        ];
        defaults.forEach(d => mainTierlistContainer.appendChild(createRowElement(d.n, d.c)));

        refreshSortables();
        saveTierlistState();
    });
};

// RESET TIERLIST (Move items back to container)
const resetTierlist = () => {
    showCustomConfirm("¿Mover todas las imágenes al contenedor inferior?", () => {
        const itemsInTiers = document.querySelectorAll(".row-items .draggable-image");
        itemsInTiers.forEach(item => imgsAddedContainer.appendChild(item));
        refreshSortables();
        saveTierlistState();
    });
};

// DELETE ALL ITEMS
const deleteAllItems = () => {
    showCustomConfirm("¿Estás seguro de que quieres eliminar todas las imágenes?", () => {
        document.querySelectorAll(".draggable-image").forEach(item => item.remove());
        refreshSortables();
        saveTierlistState();
    });
};

// ADD IMAGES FUNCTION
const addImagesToContainer = async (filesToAdd) => {
    if (!filesToAdd.length) return;

    // Show a small hint or visual feedback if you want, 
    // but for now let's just process them.

    for (const file of Array.from(filesToAdd)) {
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            try {
                // Compress images before adding them to stay within localStorage limits
                const finalSrc = await compressImage(file);
                const element = createMediaElement(finalSrc, file.type.startsWith('video/'));
                imgsAddedContainer.appendChild(element);
            } catch (err) {
                console.error("Error processing file:", err);
            }
        }
    }

    refreshSortables();
    saveTierlistState();
};

// EXPORT JSON
const exportToJson = () => {
    const state = {
        title: tierlistTitle.innerText,
        rows: [],
        unranked: []
    };

    document.querySelectorAll(".row").forEach(row => {
        const rowName = row.querySelector(".row-name").innerText;
        const rowBg = row.querySelector(".row-name").style.backgroundColor;
        const items = Array.from(row.querySelectorAll(".row-items img, .row-items video")).map(item => ({
            type: item.tagName.toLowerCase(),
            src: item.src
        }));
        state.rows.push({ name: rowName, color: rowBg, items });
    });

    state.unranked = Array.from(imgsAddedContainer.querySelectorAll(".draggable-image")).map(item => ({
        type: item.tagName.toLowerCase(),
        src: item.src
    }));

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "tierlist_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};

// IMPORT JSON
const importFromJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const state = JSON.parse(event.target.result);
            if (state.title) tierlistTitle.innerText = state.title;
            mainTierlistContainer.innerHTML = "";
            state.rows.forEach(rowData => {
                const newRow = createRowElement(rowData.name, rowData.color);
                mainTierlistContainer.appendChild(newRow);
                const rowItemsDiv = newRow.querySelector(".row-items");
                rowData.items.forEach(itemData => {
                    const el = createMediaElement(itemData.src, itemData.type === 'video');
                    rowItemsDiv.appendChild(el);
                });
                // Adjust font for imported rows
                setTimeout(() => adjustFontSize(newRow.querySelector(".row-name")), 0);
            });

            imgsAddedContainer.innerHTML = "";
            state.unranked.forEach(itemData => {
                const el = createMediaElement(itemData.src, itemData.type === 'video');
                imgsAddedContainer.appendChild(el);
            });

            refreshSortables();
            saveTierlistState();
            alert("¡Tierlist importada con éxito!");
        } catch (err) {
            console.error("Error importing JSON:", err);
            alert("Error al importar el archivo JSON.");
        }
    };
    reader.readAsText(file);
};

// SNAPSHOT CAPTURE
captureButton.addEventListener('click', () => {
    if (!captureArea) return;
    html2canvas(captureArea, {
        useCORS: true,
        backgroundColor: "#0f1113",
        scale: 2,
        onclone: (clonedDoc) => {
            const areaClone = clonedDoc.getElementById("id_capture-area");
            if (areaClone) {
                // Formatting the capture area for a wide/professional look
                areaClone.style.width = "1200px";
                areaClone.style.maxWidth = "1200px";
                areaClone.style.padding = "60px 40px 80px 40px"; // Extra bottom padding for watermark
                areaClone.style.display = "flex";
                areaClone.style.flexDirection = "column";
                areaClone.style.gap = "20px";
                areaClone.style.position = "relative";
                areaClone.style.margin = "0 auto";
            }

            // Hide UI elements
            const addRowContainer = clonedDoc.querySelector(".add-row-container");
            if (addRowContainer) addRowContainer.style.display = "none";

            // Hide the entire real header for the capture
            const realHeader = clonedDoc.querySelector(".header-container");
            if (realHeader) realHeader.style.display = "none";

            // Create a professional watermark/branding in the Corner
            const watermark = clonedDoc.createElement("div");
            watermark.style.position = "absolute";
            watermark.style.bottom = "25px";
            watermark.style.right = "40px";
            watermark.style.display = "flex";
            watermark.style.alignItems = "center";
            watermark.style.gap = "12px";
            watermark.style.opacity = "0.8";

            // Use the logo in the watermark
            const logoInWatermark = clonedDoc.createElement("img");
            logoInWatermark.src = "Tierlist Logo.png";
            logoInWatermark.style.height = "30px";
            logoInWatermark.style.filter = "drop-shadow(0 0 5px rgba(255,255,255,0.2))";

            const brandText = clonedDoc.createElement("span");
            brandText.innerText = "Hecho con Premium Tier List";
            brandText.style.color = "#94a3b8";
            brandText.style.fontSize = "0.9rem";
            brandText.style.fontWeight = "600";
            brandText.style.letterSpacing = "1px";

            watermark.appendChild(brandText);
            watermark.appendChild(logoInWatermark);
            areaClone.appendChild(watermark);

            // Hide row controls
            clonedDoc.querySelectorAll(".row-actions").forEach(el => {
                el.style.display = "none";
            });

            // Refine row name border for a cleaner look
            clonedDoc.querySelectorAll(".row-name").forEach(el => {
                el.style.borderRight = "none";
            });
        }
    }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${tierlistTitle.innerText || 'Mi-Tierlist'}.png`;
        link.click();
    }).catch(err => {
        console.error("Error al capturar:", err);
        alert("Error al guardar la imagen.");
    });
});

// FULLSCREEN TOGGLE
const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            alert(`Error al intentar activar pantalla completa: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
};

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
tierlistTitle.addEventListener("input", debounceSave);
newTierBtn.addEventListener("click", resetToDefaultTierlist);
resetTierButton.addEventListener("click", resetTierlist);
deleteButton.addEventListener("click", deleteAllItems);
addImgBtn.addEventListener('change', (e) => addImagesToContainer(e.target.files));
exportJsonBtn.addEventListener("click", exportToJson);
importJsonInput.addEventListener("change", importFromJson);
fullscreenBtn.addEventListener("click", toggleFullscreen);
