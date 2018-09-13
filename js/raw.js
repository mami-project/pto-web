const compareProperty = '_owner';

function initTable () {
    fetch(baseUrl + '/raw', getReadOptions())
        .then(response => response.json())
        .then(function (data) {
            getMetadata(0, data['campaigns'], []);
        });
}

function getMetadata (index, links, metadata) {
    if (index >= links.length) {
        processMetadata(metadata);
        return;
    }

    document.getElementById('tableDiv').innerText = 'Loading data ' + Math.round(index * 100 / links.length) + '%';

    fetch(links[index], getReadOptions())
        .then(function (response) {
            if (response.status === 200) {
                return response.json();
            }
        })
        .then(function (data) {
            if (data != null) {
                metadata.push(data['metadata']);
                getMetadata(index + 1, links, metadata);
            }
        })
        .catch();
}

function processMetadata(metadata) {
    let properties = [];
    for (let campaignMetadata of metadata) {
        for (let property of Object.getOwnPropertyNames(campaignMetadata)) {
            if (properties.indexOf(property) === -1) {
                properties.push(property);
            }
        }
    }
    metadata.sort(compareByProperty(compareProperty));
    drawTable(metadata, properties);
}

function drawTable(metadata, properties) {
    let tableDiv = document.getElementById('tableDiv');
    tableDiv.innerHTML = "<table class='pto-data-table'><thead></thead><tbody></tbody></table>";

    const thead = tableDiv.getElementsByTagName('thead')[0];
    let row = thead.insertRow(-1);
    for (let property of properties) {
        row.insertCell(-1).outerHTML = "<th>" + property + "</th>";
    }

    const tbody = tableDiv.getElementsByTagName('tbody')[0];
    for (let campaignMetadata of metadata) {
        const row = tbody.insertRow(-1);
        for (let property of properties) {
            row.insertCell(-1).innerText = campaignMetadata[property] == null ? '' : campaignMetadata[property];
        }
    }
}