function showObsList (startDateString, condition) {
    document.getElementById('targetListTitle').innerText =  "Observations of '" + condition + "'";

    let startDate = new Date(startDateString);
    let endDate = new Date(startDate.getTime() + (7 * 24 * 60 * 60 * 1000 - 1));

    let query = 'time_start=' + encodeURIComponent(startDate.toISOString());
    query = query + '&time_end=' + encodeURIComponent(endDate.toISOString());
    query = query + '&condition=' + condition;

    encodedQueryToQueryLinkOrSubmit(query,
        function (queryLink) {showObs(queryLink, 0);},
        function () {alert('The query for this drill down is still pending. Please come back later.');},
        function () {alert('The query for this drill down failed. Please contact us.');},
        function () {},
        function () {alert('The query submission failed. Make sure you have permissions.');},
        function () {},
        function () {alert('You do not have an API Key registered to submit queries.');},
        function (e) {console.log(e); alert('The data you asked for could not be fetched. Please contact us.');});
}

function showObs (resultBaseUrl, page) {
    fetch(resultBaseUrl + '?page=' + page)
        .then(response => response.json())
        .then(function (data) {
            document.getElementById('obsListModal').style.display = 'unset';
            configureObsNav(resultBaseUrl, page, data);
            fillObsList(resultBaseUrl, page, data);
        });
}

function configureObsNav(resultBaseUrl, page, data) {
    let obsNav = document.getElementById('obsNav');
    obsNav.parentElement.replaceChild(obsNav.cloneNode(true), obsNav);
    obsNav = document.getElementById('obsNav');

    obsNav.children[0].addEventListener('click', function () {
        showObs(resultBaseUrl, 0);
    });

    if (page > 0) {
        obsNav.children[1].disabled = false;
        obsNav.children[1].addEventListener('click', function () {
            showObs(resultBaseUrl, page - 1);
        });
    } else {
        obsNav.children[1].disabled = true;
    }

    obsNav.children[2].innerHTML = 'Page ' + (page + 1);

    if (page < Math.floor(data['total_count'] / 1000)) {
        obsNav.children[3].disabled = false;
        obsNav.children[3].addEventListener('click', function () {
            showObs(resultBaseUrl, page + 1);
        });
    } else {
        obsNav.children[3].disabled = true;
    }

    obsNav.children[4].addEventListener('click', function () {
        showObs(resultBaseUrl, Math.floor(data['total_count'] / 1000));
    });
}

function fillObsList (resultbaseUrl, page, data) {
    const tableBody =  document.getElementById('obsTable').querySelector('tbody');
    tableBody.innerHTML = '';

    for (let obs of data['obs']) {
        const row = tableBody.insertRow(-1);

        row.insertCell(-1).innerText = data['obs'].indexOf(obs) + 1 + (page) * 1000;

        let obsSetIdCell = row.insertCell(-1);
        obsSetIdCell.innerHTML = '<u>' + obs[0] + '</u>';
        obsSetIdCell.addEventListener('click', function () {
            showMetadata(obs[0]);
        });


        row.insertCell(-1).innerText = obs[1];

        let pathElements = obs[3].split(' ');
        row.insertCell(-1).innerHTML = "<a href='https://stat.ripe.net/" + pathElements[0] + "' target='_blank'>" + pathElements[0] + "</a>" + " " + pathElements[1];

        let path = '';
        for (let i = 2; i < pathElements.length - 1; i++) {
            path = path + '' + pathElements[i];
        }
        path.trim();
        row.insertCell(-1).innerHTML = path;

        let target = pathElements[pathElements.length - 1];
        row.insertCell(-1).innerHTML = "<a href='https://stat.ripe.net/" + target + "' target='_blank'>" + target + "</a>";

        row.insertCell(-1).innerText = obs[5];
    }

    document.getElementById('obsTable').parentElement.scrollTop = 0;
}

function closeTargetList () {
    document.getElementById('obsListModal').style.display = 'none';
}

function showMetadata(obsSetId) {
    fetch(baseUrl + '/obs/' + obsSetId, getReadOptions())
        .then(function (response) {
            if (response.status === 200) {
                return response.json();
            }
        })
        .then(function (data) {
            document.getElementById('obsMetadataModal').style.display = 'unset';
            document.getElementById('obsMetadataDiv').innerHTML = JSON.stringify(data).replace(/,/g, ',<br>');
        });
}

function closeMetadata() {
    document.getElementById('obsMetadataModal').style.display = 'none';
}