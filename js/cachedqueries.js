function initQueryList () {
    fetch(baseUrl + '/query')
        .then(response => response.json())
        .then(function (data) {
            fillQueryList(data['queries']);
        });
}

function fillQueryList (queryLinks) {
    const table = document.getElementById('cachedQueryList').getElementsByTagName('tbody')[0];

    for (let queryLink of queryLinks) {
        fetch(queryLink)
            .then(response => response.json())
            .then(function (data) {
                insertRow(table, data);
            });
    }
}

function insertRow (table, data) {
    const row = table.insertRow(-1);

    row.insertCell(-1).innerText = data['__state'];

    row.insertCell(-1).innerText = data['__created'];

    row.insertCell(-1).innerText = data['__completed'];

    row.insertCell(-1).innerText = data['__executed'];

    row.insertCell(-1).innerText = data['__modified'];

    row.insertCell(-1).innerText = data['__row_count'];

    const encoded = row.insertCell(-1);
    encoded.innerText = data['__encoded'];
    encoded.style.textAlign = 'left';

    const result = row.insertCell(-1);
    result.innerText = data['__result'];
    result.style.textAlign = 'left';
}