// Funzione per caricare il CSV da GitHub e visualizzarlo
document.addEventListener('DOMContentLoaded', () => {
    const tablesToLoad = [
        { tableId: "VerificaLOINGeometrico", repo: "2Dto6D/ADB_Verifiche", filePath: "ST04Riepilogo/00/ST04_11_VerificaLOINGeometrico.csv" }
    ];

    tablesToLoad.forEach(table => {
        loadCSVToTable(table.tableId, table.repo, table.filePath);
    });
    loadCSV('ElementiLOIN', '2Dto6D/ADB_Verifiche', 'ST04Verifiche/00/ST04_11_ElementiLOIN.csv');
    const chartsConfig = [
        {
            canvasId: 'ElementiLOINGraficoATorta',
            statsId: 'ElementiLOINstatistics',
            repo: '2Dto6D/ADB_Verifiche',
            filePath: 'ST04Verifiche/00/ST04_11_ElementiLOIN.csv'
        }
    ];
    
    chartsConfig.forEach(config => loadPieChartCSV(config));
});

const githubRawURL = (repo, filePath) => `https://raw.githubusercontent.com/${repo}/main/${filePath}`;


//LOIN Geometrico
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

// Costanti e Variabili
const rowsPerPage = 20; 
let currentPage = {}; 
let dataOffset = {}; 

async function loadCSV(tableId, repo, filePath) {
    const csvUrl = githubRawURL(repo, filePath);
    try {
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error('Network response was not OK');
        const data = await response.text();
        console.log(`Caricato CSV per ${tableId}`);
        const rows = data.trim().split('\n').map(row => row.split(','));
        const tableHeader = document.getElementById(`${tableId}Header`);
        const tableBody = document.getElementById(`${tableId}Body`);
        
        const statoIndex = rows[0].length - 1;
        const allVerified = rows.slice(1).every(row => row[statoIndex].trim() === '1');

        if (allVerified) {
            document.querySelector(`.${tableId}`).innerHTML = '<h3><strong>Le verifiche sono corrette!</strong></h3>';
            return;
        }

        dataOffset[tableId] = rows.slice(1).filter(row => row[statoIndex].trim() === '0');

        const headerRow = document.createElement('tr');
        rows[0].forEach(headerCell => {
            const th = document.createElement('th');
            th.textContent = headerCell;
            headerRow.appendChild(th);
        });
        tableHeader.innerHTML = '';
        tableHeader.appendChild(headerRow);

        currentPage[tableId] = 1;
        displayPage(tableId, currentPage[tableId]);
        createPaginationButtons(tableId);
    } catch (error) {
        console.error(`Error loading CSV (${tableId}):`, error);
    }
}

function displayPage(tableId, page) {
    const tableBody = document.getElementById(`${tableId}Body`);
    tableBody.innerHTML = '';
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = dataOffset[tableId].slice(start, end);

    pageData.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach((cell, index) => {
            const td = document.createElement('td');
            if (index === row.length - 1) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.disabled = true;
                checkbox.checked = cell.trim() === '1';
                td.appendChild(checkbox);
            } else {
                td.textContent = cell;
            }
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

function createPaginationButtons(tableId) {
    const tableContainer = document.querySelector(`.${tableId}`);
    
    if (!tableContainer) {
        console.error(`Contenitore per ${tableId} non trovato nel DOM`);
        return;
    }

    let paginationContainer = document.querySelector(`.pagination-${tableId}`);
    if (paginationContainer) paginationContainer.remove();

    paginationContainer = document.createElement('div');
    paginationContainer.className = `pagination-${tableId}`;
    const totalPages = Math.ceil(dataOffset[tableId].length / rowsPerPage);

    console.log(`Creando paginazione per ${tableId} con ${totalPages} pagine`);

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.addEventListener('click', () => {
            currentPage[tableId] = i;
            displayPage(tableId, currentPage[tableId]);
        });
        paginationContainer.appendChild(button);
    }
    tableContainer.appendChild(paginationContainer);
}

// Grafico a Torta
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