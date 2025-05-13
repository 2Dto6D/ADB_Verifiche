// Funzione per caricare il CSV da GitHub e visualizzarlo
document.addEventListener("DOMContentLoaded", function () {
    const tablesToLoad = [
        { tableId: "VerificaInformativa", repo: "2Dto6D/ADB_Verifiche", filePath: "AR01Riepilogo/AR01_10_00_VerificaInformativa.csv" },
        { tableId: "ProjectInfo", repo: "2Dto6D/ADB_Verifiche", filePath: "AR01Verifiche/AR01_10_00_ProjectInfo.csv" },
        { tableId: "IFCEntity", repo: "2Dto6D/ADB_Verifiche", filePath: "AR01Verifiche/AR01_10_00_IFCEntity.csv" },
        { tableId: "AssegnazioneMateriali", repo: "2Dto6D/ADB_Verifiche", filePath: "AR01Verifiche/AR01_10_00_AssegnazioneMateriali.csv" }
    ];

    tablesToLoad.forEach(table => {
        loadCSVToTable(table.tableId, table.repo, table.filePath);
    });
    loadCSV('FaseErrata', '2Dto6D/ADB_Verifiche', 'AR01Verifiche/AR01_10_00_FaseErrata_Data.csv');
    loadCSV('ValorizzazioneIFC', '2Dto6D/ADB_Verifiche', 'AR01Verifiche/AR01_10_00_ValorizzazioneIFCSaveAs_Data.csv');
    loadHistogramFromCSV({
        csvUrl: 'https://raw.githubusercontent.com/2Dto6D/ADB_Verifiche/main/AR01Verifiche/AR01_10_00_FaseErrata_Data.csv',
        chartId: 'FaseErrataAsBarChart',
        statsId: 'FaseErratastatistics',
        title: 'Istogramma delle Categorie'
    });
    loadHistogramFromCSV({
        csvUrl: 'https://raw.githubusercontent.com/2Dto6D/ADB_Verifiche/main/AR01Verifiche/AR01_10_00_ValorizzazioneIFCSaveAs_Data.csv',
        chartId: 'ValorizzazioneIFCAsBarChart',
        statsId: 'ValorizzazioneIFCstatistics',
        title: 'Istogramma delle Categorie'
    });
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

//  Istogramma
// Funzione generica per caricare dati CSV e creare un istogramma
function loadHistogramFromCSV({ csvUrl, chartId, statsId, title }) {
    fetch(csvUrl)
        .then(response => response.ok ? response.text() : Promise.reject('Errore nel caricamento del CSV'))
        .then(data => {
            const parsedData = Papa.parse(data, { header: true }).data;

            // Raggruppa i dati per categoria e stato
            const categories = {};
            parsedData.forEach(row => {
                const category = row.Categoria?.trim() || 'Altro';
                const stato = row.Stato?.trim() === '1' ? 'checked' : 'unchecked';

                if (!categories[category]) {
                    categories[category] = { checked: 0, unchecked: 0 };
                }
                categories[category][stato]++;
            });

            // Prepara i dati per Chart.js
            const labels = Object.keys(categories);
            const checkedData = labels.map(label => categories[label].checked);
            const uncheckedData = labels.map(label => categories[label].unchecked);

            // Crea il grafico a barre
            const ctx = document.getElementById(chartId);
            if (!ctx) {
                console.error(`Canvas con ID ${chartId} non trovato`);
                return;
            }

            new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Elementi Corretti',
                            data: checkedData,
                            backgroundColor: '#28a745',
                        },
                        {
                            label: 'Elementi Incorretti',
                            data: uncheckedData,
                            backgroundColor: '#dc3545',
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: title
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Categorie'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Numero di Elementi'
                            },
                            beginAtZero: true
                        }
                    }
                }
            });
            // Mostra riepilogo statistico
            displayStatistics(parsedData, statsId);
        })
        .catch(error => console.error('Errore:', error));
}

// Funzione per mostrare il riepilogo statistico sotto l'istogramma
function displayStatistics(data, statsId) {
    const statsContainer = document.getElementById(statsId);
    if (!statsContainer) {
        console.error(`Elemento con ID ${statsId} non trovato`);
        return;
    }

    const total = data.length;
    const correct = data.filter(row => row.Stato?.trim() === '1').length;
    const incorrect = total - correct;
    const correctPercentage = total > 0 ? ((correct / total) * 100).toFixed(2) : 0;

    statsContainer.innerHTML = `
        <p><strong>Totale verifiche:</strong> ${total}</p>
        <p><strong>Verifiche corrette:</strong> ${correct} (${correctPercentage}%)</p>
        <p><strong>Verifiche incorrette:</strong> ${incorrect}</p>
    `;
}