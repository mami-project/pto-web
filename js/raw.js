const compareProperty = '_owner';

function initTable () {
    fetch(baseUrl + '/raw', getReadOptions())
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
                getMetadata(0, data['campaigns'], []);
            } else {
                document.getElementById('tableDiv').innerText = 'You have no permission to read that data.';
            }
        })
        .catch(function (e) {
            console.log(e);
            document.getElementById('tableDiv').innerText = 'There was an error loading the data.';
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