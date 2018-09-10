function initRawList () {
    let options = {
        headers: {
            'Authorization': 'APIKEY ' + getApiKey()
        }
    };

    fetch(baseUrl + '/raw', options)
        .then(response => response.json())
        .then(function (data) {
            fillQueryList(data['campaigns']);
        });
}

function fillQueryList (campaigns) {
    const table = document.getElementById('obsSetList').getElementsByTagName('tbody')[0];

    let options = {
        headers: {
            'Authorization': 'APIKEY ' + getApiKey()
        }
    };

    for (let campaign of campaigns) {
        fetch(campaign, options)
            .then(function (response) {
                if (response.status === 200){
                    return response.json();
                } else {
                    return [];
                }
            })
            .then(function (data) {
                insertRow(table, data, campaign);
            });
    }
}

function insertRow (table, data, campaign) {
    const row = table.insertRow(-1);

    if (data['metadata'] === undefined){
        data ['metadata'] = [];
    }

    row.insertCell(-1).innerText = campaign.substring(campaign.lastIndexOf('/') + 1);

    row.insertCell(-1).innerText = data['metadata']['description'];

    row.insertCell(-1).innerText = data['metadata']['_owner'];
}