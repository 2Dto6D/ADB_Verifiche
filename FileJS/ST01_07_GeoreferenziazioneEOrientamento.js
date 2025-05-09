// Funzione per caricare il CSV da GitHub e visualizzarlo
document.addEventListener("DOMContentLoaded", function () {
    const tablesToLoad = [
        { tableId: "GeoreferenziazioneEOrientamento", repo: "2Dto6D/ADB_Verifiche", filePath: "ST01Riepilogo/ST01_07_00_Georeferenziazione.csv" },
    ];

    tablesToLoad.forEach(table => {
        loadCSVToTable(table.tableId, table.repo, table.filePath);
    });
    loadCSVToTableEsito('2Dto6D/ADB_Verifiche', 'ST01Verifiche/ST01_07_01_CoordinationReport_Data.csv', 'Coordination');
    loadCSVToTableEsito('2Dto6D/ADB_Verifiche', 'ST01Verifiche/ST01_07_02_LocationReport_Data.csv', 'LatLong');
});

// Funzione per caricare la tabella dal CSV
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

// Funzione per caricare la tabella dal CSV (Esito)
function loadCSVToTableEsito(repo, filePath, tableIdPrefix) {
    const csvUrl = `https://raw.githubusercontent.com/${repo}/main/${filePath}`;

    fetch(csvUrl)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not OK');
            return response.text();
        })
        .then(data => {
            const parsedData = Papa.parse(data, { header: true }).data;
            const tableHeader = document.getElementById(tableIdPrefix + 'Header');
            const tableBody = document.getElementById(tableIdPrefix + 'Body');

            if (tableHeader && tableBody) {
                tableHeader.innerHTML = '';
                tableBody.innerHTML = '';

                // Crea la riga dell'intestazione della tabella
                const headerRow = document.createElement('tr');
                Object.keys(parsedData[0]).forEach(key => {
                    const th = document.createElement('th');
                    th.textContent = key;
                    headerRow.appendChild(th);
                });
                tableHeader.appendChild(headerRow);

                // Crea le righe dei dati della tabella
                parsedData.forEach(row => {
                    const tr = document.createElement('tr');
                    Object.values(row).forEach(cell => {
                        const td = document.createElement('td');
                        td.textContent = cell;
                        tr.appendChild(td);
                    });
                    tableBody.appendChild(tr);
                });

                // Aggiungi la riga di confronto sotto la tabella
                addComparisonRow(parsedData, tableBody, tableIdPrefix);
            } else {
                console.error(`${tableIdPrefix}Header o ${tableIdPrefix}Body non trovati nel DOM`);
            }
        })
        .catch(error => console.error('Errore durante il fetch del file CSV:', error));
}

function addComparisonRow(data, tableBody, tableIdPrefix) {
    // Crea una nuova riga per le comparazioni
    const comparisonRow = document.createElement('tr');
    const keys = Object.keys(data[0]);

    // Contatori per il numero di checkbox selezionate (verdi) e non selezionate
    let stato1 = 0; // Checkbox selezionate (verdi)
    let stato0 = 0; // Checkbox non selezionate (rosse)

    keys.forEach((key, index) => {
        const td = document.createElement('td');

        // Se non è la prima colonna, procediamo con il controllo della checkbox
        if (index > 0) {  // Salta la prima colonna
            // Controlla se tutti i valori nella colonna sono identici
            const uniqueValues = new Set(data.map(row => row[key].trim()));
            const isUniform = uniqueValues.size === 1;

            // Crea una checkbox per mostrare il risultato della comparazione
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = isUniform;
            checkbox.disabled = true; // Disabilita la checkbox per renderla non interattiva

            // Incrementa i contatori in base allo stato della checkbox
            if (isUniform) {
                stato1++;
                td.classList.add('checked-row'); // Aggiunge una classe per stile (verde)
            } else {
                stato0++;
                td.classList.add('unchecked-row'); // Aggiunge una classe per stile (rosso)
            }

            td.appendChild(checkbox);
        } else {
            // Nella prima colonna non aggiungere il controllo della checkbox
            td.textContent = "Esito";  // Puoi scegliere di visualizzare "N/A" o lasciare vuoto
        }

        comparisonRow.appendChild(td);
    });

    // Aggiunge la riga di confronto sotto la tabella
    tableBody.appendChild(comparisonRow);

    // Chiama displayStatistics per visualizzare la percentuale di checkbox selezionate (verdi)
    const total = stato1 + stato0;
    displayStatistics(total, stato1, stato0, tableIdPrefix);
}

function displayStatistics(total, stato1, stato0, tableIdPrefix) {
    // Calcola la percentuale di checkbox selezionate
    const percentCorrect = ((stato1 / total) * 100).toFixed(2);
    // Mostra la frase con i risultati sotto la tabella
    const stats = `<strong>Totale elementi </strong>: ${total}<br> <strong> Verifiche corrette </strong>: ${stato1} (${percentCorrect}%)<br> <strong>Verifiche da correggere </strong>: ${stato0}`;
    document.getElementById(tableIdPrefix + 'Statistics').innerHTML = stats;
}