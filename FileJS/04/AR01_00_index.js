// Funzione per caricare il CSV da GitHub e visualizzarlo
document.addEventListener("DOMContentLoaded", function () {
    loadCSVIndex('2Dto6D/ADB_Verifiche', 'ADB01index/04/AR01_Verifiche.csv', 'Verifiche');
    const tablesToLoad = [
        { tableId: "Dati", repo: "2Dto6D/ADB_Verifiche", filePath: "ADB01index/04/AR01_DatiGenerali.csv" },
    ];

    tablesToLoad.forEach(table => {
        loadCSVToTable(table.tableId, table.repo, table.filePath);
    });
    const chartsConfig = [
        {
            canvasId: 'VerificheGraficoATorta',
            statsId: 'Verifichestatistics',
            repo: '2Dto6D/ADB_Verifiche',
            filePath: 'ADB01index/04/AR01_Verifiche.csv'
        }
    ];
    
    chartsConfig.forEach(config => loadPieChartCSV(config));
});

const githubRawURL = (repo, filePath) => `https://raw.githubusercontent.com/${repo}/main/${filePath}`;

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


// Funzione per caricare un CSV e generare una tabella
async function loadCSVIndex(repo, filePath, tableId) {
    const csvUrl = githubRawURL(repo, filePath);

    try {
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error('Network response was not OK');
        const data = await response.text();
        
        const parsed = Papa.parse(data, { header: false });
        const rows = parsed.data;
        
        const table = document.getElementById(tableId);
        if (!table) throw new Error(`Table with ID '${tableId}' not found.`);

        const thead = table.createTHead();
        const tbody = table.createTBody();

        // Creazione dell'intestazione
        const headerRow = thead.insertRow();
        rows[0].forEach(headerCell => {
            const th = document.createElement('th');
            th.textContent = headerCell;
            headerRow.appendChild(th);
        });

        // Creazione del corpo della tabella
        rows.slice(1).forEach(row => {
            const tr = tbody.insertRow();
            const statoCell = row[row.length - 1].trim();

            // Applica una classe basata sullo stato
            if (statoCell === '1') {
                tr.classList.add('checked-row');
            } else if (statoCell === '2') {
                tr.classList.add('yellow-row');
            } else if (statoCell === '0') {
                tr.classList.add('unchecked-row');
            }

            row.forEach((cell, index) => {
                const td = tr.insertCell();
                
                if (index === row.length - 1) { // Colonna "Stato"
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.disabled = true;

                    if (statoCell === '1') {
                        checkbox.checked = true;
                    } else if (statoCell === '2') {
                        checkbox.classList.add('yellow-checkbox');
                    } else if (statoCell === '0') {
                        checkbox.checked = false;
                    }

                    td.appendChild(checkbox);
                } else {
                    td.textContent = cell;
                }
            });
        });
    } catch (error) {
        console.error(`Error loading CSV '${filePath}':`, error);
    }
}

function loadPieChartCSV(config) {
    const csvUrl = githubRawURL(config.repo, config.filePath);
    
    fetch(csvUrl)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not OK');
            return response.text();
        })
        .then(data => {
            const parsedData = Papa.parse(data, { header: true }).data;
            createPieChart(parsedData, config);
        })
        .catch(error => console.error('Error fetching CSV file:', error));
}

function createPieChart(data, config) {
    const canvas = document.getElementById(config.canvasId);
    if (!canvas) {
        console.error(`Canvas ${config.canvasId} non trovato!`);
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error(`Impossibile ottenere il contesto del canvas ${config.canvasId}.`);
        return;
    }

    const labels = ['Verifiche Corrette', 'Verifiche Incorrette'];
    const values = [0, 0];

    data.forEach(row => {
        if (row.Stato && row.Stato.trim() === '1') {
            values[0]++;
        } else if (row.Stato && row.Stato.trim() === '0') {
            values[1]++;
        }
    });

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuzione Stato',
                data: values,
                backgroundColor: ['#28a745', '#dc3545'],
            }]
        }
    });

    displayStatistics(values[0] + values[1], values[0], values[1], config.statsId);
}

function displayStatistics(total, stato1, stato0, statsId) {
    const percentCorrect = ((stato1 / total) * 100).toFixed(2);
    const stats = `<strong>Totale elementi</strong>: ${total}<br> <strong>Verifiche corrette</strong>: ${stato1} (${percentCorrect}%)<br> <strong>Verifiche da correggere</strong>: ${stato0}`;
    const statsElement = document.getElementById(statsId);
    if (statsElement) {
        statsElement.innerHTML = stats;
    }
}