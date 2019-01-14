const compareProperty = '__created';

function initTable () {
    const tableDiv = document.getElementById('tableDiv');
    tableDiv.innerText = 'Loading data...';

    fetch(baseUrl + '/obs', getReadOptions())
        .then(function (response) {
            switch (response.status) {
                case 200:
                    return response.json();
                case 403:
                    return null;
                default:
                    throw new Error();
            }
        })
        .then(function (data) {
            if (data != null) {
                drawMetadataTable(data['sets']);
            } else {
                tableDiv.innerText = 'You have no permission to read that data.';
            }
        })
        .catch(function (e) {
            console.log(e);
            tableDiv.innerText = 'There was an error loading the data.';
        });
}

function drawMetadataTable(links) {
    let metadataList = [];
    let promises = [];

    for (let link of links) {
	promises.push(fetch(link, getReadOptions())
		    .then(response => response.json(),
		          error => console.log(error))
		    .then(metadataObject => { 
			    //console.log(metadataObject); 
			    metadataList.push(metadataObject); 
			    //console.log(metadataList.length); 
		    }, 
			  error => console.log(error)));
        //promises.push(fetch(link, getReadOptions()).then(response => response.json()).then(metadataObject => metadataList.push(metadataObject)).catch());
    }

    Promise.all(promises).then(function () {drawTable(metadataList)});
}

function drawTable(metadataList) {
    let properties = [];
    for (let obsMetadata of metadataList) {
        for (let property of Object.getOwnPropertyNames(obsMetadata)) {
            if (properties.indexOf(property) === -1) {
                properties.push(property);
            }
        }
    }
    metadataList.sort(compareByProperty(compareProperty));

    let tableDiv = document.getElementById('tableDiv');
    tableDiv.innerHTML = "<table class='pto-data-table'><thead></thead><tbody></tbody></table>";

    const thead = tableDiv.getElementsByTagName('thead')[0];
    let row = thead.insertRow(-1);
    for (let property of properties) {
        row.insertCell(-1).outerHTML = "<th>" + property + "</th>";
    }

    const tbody = tableDiv.getElementsByTagName('tbody')[0];
    for (let metadataObject of metadataList) {
        const row = tbody.insertRow(-1);
        for (let property of properties) {
            row.insertCell(-1).innerText = metadataObject[property] == null ? '' : metadataObject[property];
        }
    }
}
