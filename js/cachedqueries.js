function initQueryList () {
    fetch(baseUrl + '/query')
        .then(response => response.json())
        .then(function (data) {
            fillQueryList(data['queries']);
        });
}

function fillQueryList (queryLinks) {
    const table = document.getElementById('queryList').getElementsByTagName('tbody')[0];

    for (let queryLink of queryLinks) {
        fetch(queryLink)
            .then(response => response.json())
            .then(function (data) {
                insertRow(table, data);
            })
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

    row.insertCell(-1).innerText = data['__encoded'];

    row.insertCell(-1).innerText = data['__result'];
}