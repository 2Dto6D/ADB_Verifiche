// Funzione per caricare il CSV da GitHub e visualizzarlo
document.addEventListener("DOMContentLoaded", function () {
    const tablesToLoad = [
        { tableId: "ClashDetection", repo: "2Dto6D/ADB_Verifiche", filePath: "IM01Riepilogo/IM01_03_00_ClashDetection.csv" },
        { tableId: "Analisi", repo: "2Dto6D/ADB_Verifiche", filePath: "IM01Verifiche/IM01_03_01_Analisi.csv" }
    ];

    tablesToLoad.forEach(table => {
        loadCSVToTable(table.tableId, table.repo, table.filePath);
    });
});

function loadCSVToTable(tableId, repo, filePath) {
    const csvUrl = `https://raw.githubusercontent.com/${repo}/main/${filePath}`;

    fetch(csvUrl)
        .then(response => {
            if (!response.ok) throw new Error(`Errore nel caricamento del CSV: ${csvUrl}`);
            return response.text();
        })
        .then(data => {
            const parsedData = Papa.parse(data, { header: false }).data;
            const table = document.getElementById(tableId);

            if (!table) {
                console.error(`Tabella con ID "${tableId}" non trovata nel DOM`);
                return;
            }

            const thead = table.querySelector('thead');
            const tbody = table.querySelector('tbody');

            if (!thead || !tbody) {
                console.error(`La tabella "${tableId}" deve contenere <thead> e <tbody>`);
                return;
            }

            thead.innerHTML = '';
            tbody.innerHTML = '';

            // Creazione header
            const trHead = document.createElement('tr');
            parsedData[0].forEach(cell => {
                const th = document.createElement('th');
                th.textContent = cell;
                trHead.appendChild(th);
            });
            thead.appendChild(trHead);

            // Trova l'indice della colonna "Stato"
            const statoIndex = parsedData[0].indexOf("Stato");

            // Creazione corpo tabella
            parsedData.slice(1).forEach(row => {
                const tr = document.createElement('tr');
                row.forEach((cell, colIndex) => {
                    const td = document.createElement('td');

                    // Se la colonna è "Stato", sostituisci con il checkbox
                    if (colIndex === statoIndex) {
                        const checkbox = document.createElement("input");
                        checkbox.type = "checkbox";
                        checkbox.disabled = true; // Disabilitato per non modificare il valore
                        checkbox.checked = (cell.trim() === "1"); // Se è 1, spuntato
                        td.appendChild(checkbox);
                    } else {
                        td.textContent = cell;
                    }

                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error('Errore nel caricamento del CSV:', error));
}