// ==========================================
// PRAGYANAI PDF MERGER
// ==========================================

// CHANGE THIS AFTER RENDER DEPLOYMENT
const API_URL = "https://sage-bubblegum-d810a6.netlify.app/#";


// ==========================================
// ELEMENTS
// ==========================================

const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const dropZone = document.getElementById("dropZone");

const fileList = document.getElementById("fileList");
const fileCount = document.getElementById("fileCount");

const clearBtn = document.getElementById("clearBtn");
const mergeBtn = document.getElementById("mergeBtn");

const successMessage =
    document.getElementById("successMessage");

const successText =
    document.getElementById("successText");

const mergedFileArea =
    document.getElementById("mergedFileArea");

const viewMergedBtn =
    document.getElementById("viewMergedBtn");

const downloadBtn =
    document.getElementById("downloadBtn");


// ==========================================
// FILE STORAGE
// ==========================================

let selectedFiles = [];
let mergedPDFUrl = null;


// ==========================================
// CHOOSE FILES
// ==========================================

browseBtn.addEventListener("click", () => {
    fileInput.click();
});


fileInput.addEventListener("change", (event) => {
    addFiles(event.target.files);
});


// ==========================================
// DRAG & DROP
// ==========================================

dropZone.addEventListener("dragover", (event) => {

    event.preventDefault();

    dropZone.classList.add("dragover");

});


dropZone.addEventListener("dragleave", () => {

    dropZone.classList.remove("dragover");

});


dropZone.addEventListener("drop", (event) => {

    event.preventDefault();

    dropZone.classList.remove("dragover");

    addFiles(event.dataTransfer.files);

});


// ==========================================
// ADD FILES
// ==========================================

function addFiles(files) {

    let addedCount = 0;

    for (const file of files) {

        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        const allowedTypes = [
            "pdf",
            "jpg",
            "jpeg",
            "png"
        ];


        // Check file type

        if (!allowedTypes.includes(extension)) {

            showMessage(
                `${file.name} is not supported.`,
                false
            );

            continue;
        }


        // Check duplicate

        const duplicate = selectedFiles.some(
            existingFile =>
                existingFile.name === file.name &&
                existingFile.size === file.size
        );


        if (duplicate) {

            showMessage(
                `${file.name} is already added.`,
                false
            );

            continue;
        }


        selectedFiles.push(file);

        addedCount++;
    }


    renderFiles();


    if (addedCount > 0) {

        showMessage(
            `${addedCount} file${addedCount > 1 ? "s" : ""} added successfully.`,
            true
        );
    }
}


// ==========================================
// DISPLAY FILES
// ==========================================

function renderFiles() {

    fileList.innerHTML = "";

    fileCount.textContent =
        selectedFiles.length;

    mergeBtn.disabled =
        selectedFiles.length === 0;


    selectedFiles.forEach((file, index) => {

        const item =
            document.createElement("div");


        item.className = "file-item";

        item.draggable = true;

        item.dataset.index = index;


        const fileURL =
            URL.createObjectURL(file);


        const icon =
            file.type === "application/pdf"
                ? "📄"
                : "🖼️";


        item.innerHTML = `

            <div class="file-icon">
                ${icon}
            </div>

            <div class="file-info">

                <div class="file-name">
                    ${escapeHtml(file.name)}
                </div>

                <div class="file-size">
                    ${formatSize(file.size)}
                </div>

            </div>

            <div class="file-buttons">

                <button
                    class="view-file"
                    type="button"
                >
                    👁 View
                </button>

                <button
                    class="remove-file"
                    type="button"
                >
                    🗑 Remove
                </button>

            </div>
        `;


        // ==================================
        // VIEW FILE
        // ==================================

        const viewButton =
            item.querySelector(".view-file");


        viewButton.addEventListener("click", () => {

            window.open(
                fileURL,
                "_blank"
            );

        });


        // ==================================
        // REMOVE FILE
        // ==================================

        const removeButton =
            item.querySelector(".remove-file");


        removeButton.addEventListener(
            "click",
            () => {

                URL.revokeObjectURL(fileURL);

                selectedFiles.splice(
                    index,
                    1
                );

                renderFiles();

                showMessage(
                    "File removed successfully.",
                    true
                );

            }
        );


        // ==================================
        // DRAG START
        // ==================================

        item.addEventListener(
            "dragstart",
            () => {

                item.classList.add("dragging");

            }
        );


        // ==================================
        // DRAG END
        // ==================================

        item.addEventListener(
            "dragend",
            () => {

                item.classList.remove("dragging");

            }
        );


        // ==================================
        // DRAG OVER
        // ==================================

        item.addEventListener(
            "dragover",
            (event) => {

                event.preventDefault();

            }
        );


        // ==================================
        // DROP / REORDER
        // ==================================

        item.addEventListener(
            "drop",
            (event) => {

                event.preventDefault();


                const dragging =
                    document.querySelector(
                        ".dragging"
                    );


                if (
                    !dragging ||
                    dragging === item
                ) {

                    return;
                }


                const fromIndex =
                    Number(
                        dragging.dataset.index
                    );


                const toIndex =
                    Number(
                        item.dataset.index
                    );


                const movedFile =
                    selectedFiles.splice(
                        fromIndex,
                        1
                    )[0];


                selectedFiles.splice(
                    toIndex,
                    0,
                    movedFile
                );


                renderFiles();

            }
        );


        fileList.appendChild(item);

    });
}


// ==========================================
// CLEAR ALL
// ==========================================

clearBtn.addEventListener("click", () => {

    selectedFiles = [];

    fileInput.value = "";

    renderFiles();


    mergedFileArea.classList.remove(
        "show"
    );


    if (mergedPDFUrl) {

        URL.revokeObjectURL(
            mergedPDFUrl
        );

        mergedPDFUrl = null;
    }


    showMessage(
        "All files cleared.",
        true
    );

});


// ==========================================
// MERGE FILES
// ==========================================

mergeBtn.addEventListener(
    "click",
    async () => {

        if (selectedFiles.length === 0) {

            showMessage(
                "Please add files first.",
                false
            );

            return;
        }


        const formData =
            new FormData();


        selectedFiles.forEach(file => {

            formData.append(
                "files",
                file
            );

        });


        // Loading state

        mergeBtn.disabled = true;


        mergeBtn.innerHTML = `
            <span>Merging...</span>
            <span>⏳</span>
        `;


        try {

            const response =
                await fetch(
                    `${API_URL}/merge`,
                    {
                        method: "POST",
                        body: formData
                    }
                );


            if (!response.ok) {

                let message =
                    "Unable to merge files.";


                try {

                    const error =
                        await response.json();

                    message =
                        error.detail ||
                        message;

                } catch {

                    // Ignore JSON error
                }


                throw new Error(message);
            }


            // Get PDF

            const blob =
                await response.blob();


            // Remove previous URL

            if (mergedPDFUrl) {

                URL.revokeObjectURL(
                    mergedPDFUrl
                );
            }


            // Create new URL

            mergedPDFUrl =
                URL.createObjectURL(blob);


            // Show merged area

            mergedFileArea.classList.add(
                "show"
            );


            // ==================================
            // VIEW MERGED PDF
            // ==================================

            viewMergedBtn.onclick = () => {

                window.open(
                    mergedPDFUrl,
                    "_blank"
                );

            };


            // ==================================
            // DOWNLOAD MERGED PDF
            // ==================================

            downloadBtn.onclick = () => {

                const link =
                    document.createElement("a");


                link.href =
                    mergedPDFUrl;


                link.download =
                    "PragyanAI_Merged.pdf";


                document.body.appendChild(link);

                link.click();

                link.remove();

            };


            showMessage(
                "Files merged successfully!",
                true
            );

        } catch (error) {

            console.error(error);


            showMessage(
                "Error: " + error.message,
                false
            );

        } finally {

            mergeBtn.disabled =
                selectedFiles.length === 0;


            mergeBtn.innerHTML = `
                <span>Merge Files</span>
                <span>→</span>
            `;

        }

    }
);


// ==========================================
// SUCCESS / ERROR MESSAGE
// ==========================================

function showMessage(
    message,
    success = true
) {

    successMessage.classList.add(
        "show"
    );


    successText.textContent =
        message;


    if (success) {

        successMessage.style.background =
            "#ecfdf5";

        successMessage.style.borderColor =
            "#bbf7d0";

        successMessage.style.color =
            "#15803d";

    } else {

        successMessage.style.background =
            "#fef2f2";

        successMessage.style.borderColor =
            "#fecaca";

        successMessage.style.color =
            "#dc2626";
    }


    clearTimeout(
        window.messageTimer
    );


    window.messageTimer =
        setTimeout(() => {

            successMessage.classList.remove(
                "show"
            );

        }, 3500);

}


// ==========================================
// FILE SIZE
// ==========================================

function formatSize(bytes) {

    if (bytes < 1024) {

        return `${bytes} B`;
    }


    if (bytes < 1024 * 1024) {

        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }


    return `${(
        bytes / (1024 * 1024)
    ).toFixed(1)} MB`;
}


// ==========================================
// SECURITY
// ==========================================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ==========================================
// INITIALIZE
// ==========================================

renderFiles();
