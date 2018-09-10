function initObsSetList () {
    let options = {
        headers: {
            'Authorization': 'APIKEY ' + getApiKey()
        }
    };

    fetch(baseUrl + '/obs', options)
        .then(response => response.json())
        .then(function (data) {
            fillQueryList(data['sets']);
        });
}

function fillQueryList (obsSetLinks) {
    const table = document.getElementById('obsSetList').getElementsByTagName('tbody')[0];

    let options = {
        headers: {
            'Authorization': 'APIKEY ' + getApiKey()
        }
    };

    for (let obsSetLink of obsSetLinks) {
        fetch(obsSetLink, options)
            .then(response => response.json())
            .then(function (data) {
                insertRow(table, data);
            });
    }
}

function insertRow (table, data) {
    const row = table.insertRow(-1);

    row.insertCell(-1).innerText = data['__link'].substring(data['__link'].lastIndexOf('/') + 1);

    row.insertCell(-1).innerText = data['description'];

    row.insertCell(-1).innerText = data['__created'];

    row.insertCell(-1).innerText = data['__modified'];

    row.insertCell(-1).innerText = data['__time_start'];

    row.insertCell(-1).innerText = data['__time_end'];

    row.insertCell(-1).innerText = data['__obs_count'];

    row.insertCell(-1).innerText = data['vantage'];

    row.insertCell(-1).innerText = data['__data'];

    row.insertCell(-1).innerText = data['__conditions'];

    row.insertCell(-1).innerText = data['_analyzer'];

    row.insertCell(-1).innerText = data['_sources'];
}