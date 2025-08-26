// Funzione per caricare il CSV da GitHub e visualizzarlo
document.addEventListener("DOMContentLoaded", function () {
	const tablesToLoad = [
		{ tableId: "GeoreferenziazioneEOrientamento", repo:"2Dto6D/ADB_Verifiche", filePath:"IM02Riepilogo/03/IM02_07_Georeferenziazione.csv" }
	];
	tablesToLoad.forEach(table => {
		loadCSVToTable(table.tableId, table.repo, table.filePath);
	});

	tablesToLoad.forEach(table => {
		loadCSVToTable(table.tableId, table.repo, table.filePath);
	});
	loadCSVToTableEsito('2Dto6D/ADB_Verifiche', 'IM02Verifiche/03/IM02_07_CoordinationLatLong_Data.csv', 'LatLong');
	loadCSVToTableEsito('2Dto6D/ADB_Verifiche', 'IM02Verifiche/03/IM02_07_CoordinationElevation_Data.csv', 'Coordination');
	loadCSVToTableEsito('2Dto6D/ADB_Verifiche', 'IM02Verifiche/03/IM02_07_CoordinationNSEW_Data.csv', 'CoordinateCondivise');
	loadCSVToTableEsito('2Dto6D/ADB_Verifiche', 'IM02Verifiche/03/IM02_07_CoordinationTrueNorth_Data.csv', 'NordReale');



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

				const headerRow = document.createElement('tr');
				Object.keys(parsedData[0]).forEach(key => {
					const th = document.createElement('th');
					th.textContent = key;
					headerRow.appendChild(th);
				});
				tableHeader.appendChild(headerRow);

				parsedData.forEach(row => {
					const tr = document.createElement('tr');
					Object.values(row).forEach(cell => {
						const td = document.createElement('td');
						td.textContent = cell;
						tr.appendChild(td);
					});
					tableBody.appendChild(tr);
				});

				addComparisonRow(parsedData, tableBody, tableIdPrefix);
			} else {
				console.error(`${tableIdPrefix}Header o ${tableIdPrefix}Body non trovati nel DOM`);
			}
		})
		.catch(error => console.error('Errore durante il fetch del file CSV:', error));
}

function addComparisonRow(data, tableBody, tableIdPrefix) {
	const comparisonRow = document.createElement('tr');
	const keys = Object.keys(data[0]);
	let stato1 = 0;
	let stato0 = 0;

	keys.forEach((key, index) => {
		const td = document.createElement('td');
		if (index > 0) {
			const uniqueValues = new Set(data.map(row => row[key].trim()));
			const isUniform = uniqueValues.size === 1;
			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.checked = isUniform;
			checkbox.disabled = true;
			if (isUniform) {
				stato1++;
				td.classList.add('checked-row');
			} else {
				stato0++;
				td.classList.add('unchecked-row');
			}
			td.appendChild(checkbox);
		} else {
			td.textContent = "Esito";
		}
		comparisonRow.appendChild(td);
	});
	tableBody.appendChild(comparisonRow);
	const total = stato1 + stato0;
	displayStatisticsEsito(total, stato1, stato0, tableIdPrefix);
}

function displayStatisticsEsito(total, stato1, stato0, tableIdPrefix) {
	const percentCorrect = ((stato1 / total) * 100).toFixed(2);
	const stats = `<strong>Totale elementi </strong>: ${total}<br> <strong> Verifiche corrette </strong>: ${stato1} (${percentCorrect}%)<br> <strong>Verifiche da correggere </strong>: ${stato0}`;
	document.getElementById(tableIdPrefix + 'Statistics').innerHTML = stats;
}