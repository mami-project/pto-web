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

        row.insertCell(-1).innerHTML = data['obs'].indexOf(obs) + 1 + (page) * 1000;

        let obsSetIdCell = row.insertCell(-1);
        obsSetIdCell.innerHTML = '<u>' + obs[0] + '</u>';
        obsSetIdCell.addEventListener('click', function () {showMetadata(obs[0]);});

        row.insertCell(-1).innerHTML = obs[1];

        let source = getSourceFromPath(obs[3]);
        let sourceAS = getSourceASFromPath(obs[3]);
        row.insertCell(-1).innerHTML = "<a href='https://stat.ripe.net/" + source + "' target='_blank'>" + source + "</a>" + sourceAS;

        row.insertCell(-1).innerHTML = getPathFromFullPath(obs[3]);

        let target = getTargetFromPath(obs[3]);
        let targetAS = getTargetASFromPath(obs[3]);
        row.insertCell(-1).innerHTML = "<a href='https://stat.ripe.net/" + target + "' target='_blank'>" + target + "</a>" + targetAS;

        row.insertCell(-1).innerHTML = obs[5];
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
            document.getElementById('obsMetadataDiv').innerHTML = getMetadataHTML(data);//JSON.stringify(data).replace(/,/g, ',<br>');
        });
}

function getMetadataHTML (metadata) {
    let html = '';
    for (let key of Object.getOwnPropertyNames(metadata)) {
        html = html + '<b>' + key + ':</b> ' + metadata[key].toString() + '<br>';
    }
    return html;
}

function closeMetadata() {
    document.getElementById('obsMetadataModal').style.display = 'none';
}

function getSourceFromPath(path) {
    let pathElements = getTrimmedPathElements(path);
    if (pathElements[0] !== '*') {
        return pathElements[0];
    }
    return '';
}

function getSourceASFromPath(path) {
    let pathElements = getTrimmedPathElements(path);
    if (pathElements[1].startsWith('AS')) {
        return ' ' + pathElements[1];
    }
    return '';
}

function getPathFromFullPath(path) {
    let source = getSourceFromPath(path);
    let sourceAS = getSourceASFromPath(path);
    let target = getTargetFromPath(path);
    let targetAS = getTargetASFromPath(path);
    return path.replace(source, '').replace(sourceAS, '').replace(target, '').replace(targetAS, '').trim();
}

function getTargetFromPath(path) {
    let pathElements = getTrimmedPathElements(path);
    pathElements.reverse();
    if (!pathElements[0].startsWith('AS')) {
        return pathElements[0];
    }
    return pathElements[1];
}

function getTargetASFromPath(path) {
    let pathElements = getTrimmedPathElements(path);
    pathElements.reverse();
    if (pathElements[0].startsWith('AS')) {
        return ' ' + pathElements[0];
    }
    return '';
}

function getTrimmedPathElements (path) {
    let pathElements = path.split(' ');
    for (let pathElement of pathElements) {
        pathElement = pathElement.trim();
    }
    return pathElements;
}