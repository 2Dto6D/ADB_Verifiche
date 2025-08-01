// Funzione per caricare il CSV da GitHub e visualizzarlo
document.addEventListener("DOMContentLoaded", function () {
	const tablesToLoad = [
		{ tableId: "IntegritàEPuliziaFile", repo:"2Dto6D/ADB_Verifiche", filePath:"ST02Riepilogo/01/ST02_09_PuliziaFile.csv" },
		{ tableId: "PesoFile", repo:"2Dto6D/ADB_Verifiche", filePath:"ST02Verifiche/01/ST02_09_DimensioneFiles_Data.csv" },
		{ tableId: "VersioneFile", repo:"2Dto6D/ADB_Verifiche", filePath:"ST02Verifiche/01/ST02_09_VersioneFiles_Data.csv" },
		{ tableId: "SovrapposizioneElementi", repo:"2Dto6D/ADB_Verifiche", filePath:"ST02Verifiche/01/ST02_09_SovrapposizioniElementi_Data.csv" },
		{ tableId: "IFCMapping", repo:"2Dto6D/ADB_Verifiche", filePath:"ST02Verifiche/01/ST02_09_IFCMapping_Data.csv" },

	];

	tablesToLoad.forEach(table => {
		loadCSVToTable(table.tableId, table.repo, table.filePath);
	});
	loadCSV('LivelliInutilizzati', '2Dto6D/ADB_Verifiche', 'ST02Verifiche/01/ST02_09_LivelliInutilizzati_Data.csv');
	loadCSV('BuildingElementProxy', '2Dto6D/ADB_Verifiche', 'ST02Verifiche/01/ST02_09_BuildingElementProxy_Data.csv');
	loadCSV('ParametriCondivisi', '2Dto6D/ADB_Verifiche', 'ST02Verifiche/01/ST02_09_SharedParameters_Data.csv');
	loadCSV('CorrispondenzaIFC', '2Dto6D/ADB_Verifiche', 'ST02Verifiche/01/ST02_09_VerificaCorrispondenzaIFC_Data.csv');



	const summaryConfigs = [
		{ statsId: "LivelliInutilizzatistatistics", repo: "2Dto6D/ADB_Verifiche", filePath: "ST02Verifiche/01/ST02_09_LivelliInutilizzati_Data.csv"},
		{ statsId: "BuildingElementProxystatistics", repo: "2Dto6D/ADB_Verifiche", filePath: "ST02Verifiche/01/ST02_09_BuildingElementProxy_Data.csv"},
		{ statsId: "ParametriCondivisistatistics", repo: "2Dto6D/ADB_Verifiche", filePath: "ST02Verifiche/01/ST02_09_SharedParameters_Data.csv"},
		{ statsId: "CorrispondenzaIFCstatistics", repo: "2Dto6D/ADB_Verifiche", filePath: "ST02Verifiche/01/ST02_09_VerificaCorrispondenzaIFC_Data.csv"}
	];

	summaryConfigs.forEach(config => {
		loadCSVForStatistics(config.statsId, config.repo, config.filePath);
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
						checkbox.disabled = true;
						checkbox.checked = (cell.trim() === "1");
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

		let filteredRows = rows.slice(1).filter(row => row[statoIndex].trim() === '0');
		dataOffset[tableId] = filteredRows;

		const maxPages = 20;
		const defaultRowsPerPage = 20;
		let calculatedRowsPerPage = defaultRowsPerPage;
		if (filteredRows.length / defaultRowsPerPage > maxPages) {
			calculatedRowsPerPage = Math.ceil(filteredRows.length / maxPages);
		}
		dataOffset[tableId].rowsPerPage = calculatedRowsPerPage;

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

	const rowsPerPageLocal = dataOffset[tableId].rowsPerPage || rowsPerPage;
	const start = (page - 1) * rowsPerPageLocal;
	const end = start + rowsPerPageLocal;
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

	const rowsPerPageLocal = dataOffset[tableId].rowsPerPage || rowsPerPage;
	const totalPages = Math.ceil(dataOffset[tableId].length / rowsPerPageLocal);

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




// Statistiche
async function loadCSVForStatistics(statsId, repo, filePath) {
	const csvUrl = `https://raw.githubusercontent.com/${repo}/main/${filePath}`;
	try {
		const response = await fetch(csvUrl);
		if (!response.ok) throw new Error('Errore nel caricamento del file CSV');
		const data = await response.text();
		const rows = data.trim().split('\n').map(row => row.split(','));

		if (rows.length < 2) {
			console.warn(`Il CSV ${filePath} non contiene dati validi`);
			return;
		}

		// Trova l'indice della colonna "Stato"
		const header = rows[0];
		const statoIndex = header.indexOf("Stato");
		if (statoIndex === -1) {
			console.warn(`Colonna "Stato" non trovata in ${filePath}`);
			return;
		}

		// Converti i dati in oggetti
		const parsedData = rows.slice(1).map(row => ({ Stato: row[statoIndex] }));
		displayStatistics(parsedData, statsId);
	} catch (error) {
		console.error(`Errore nel caricamento dei dati per ${statsId}:`, error);
	}
}

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