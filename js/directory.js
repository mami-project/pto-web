//const months = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function initTable () {

    fetch("/static/json/config.json")
        .then(response => response.json())
        .then(function (data) {
            drawMatrix(data['directoryQuery'], Object.getOwnPropertyNames(data['pages']));
        })
        .catch(function (e) {
            alert("There was an error getting the data!");
            console.log(e);
        });
}

function drawMatrix (directoryQuery, configuredFeatures) {
    const table = document.getElementById('directoryTable');

    encodedQueryToQueryResultOrSubmit(
        directoryQuery,
        function (data) {drawMatrix2(data['groups'], configuredFeatures);},
        function () {table.outerHTML = '<p>The directory query is still pending.</p>';},
        function () {table.outerHTML = '<p>The directory query failed.</p>';},
        function () {table.outerHTML = '<p>The directory query was submitted but is still pending.</p>';},
        function () {table.outerHTML = '<p>The directory query submission failed.</p>';},
        function () {table.outerHTML = '<p>The directory query was not submitted.</p>';},
        function () {table.outerHTML = '<p>No API Key available to submit the directory query.</p>';},
        function (e) {console.log(e); table.outerHTML = '<p>An error occured while building the directory matrix.</p>';});
}

function drawMatrix2 (groups, configuredFeatures) {
    const table = document.getElementById('directoryTable');
    const thead = table.getElementsByTagName('thead')[0];
    const tbody = table.getElementsByTagName('tbody')[0];

    let features = getFeaturesWithData(groups);
    const row = thead.insertRow(-1);
    row.insertCell(-1).outerHTML = '<th>Month \\ Feature</th>';
    for (let feature of features) {
        if (isSubpageAvailable(configuredFeatures, feature)) {
            row.insertCell(-1).outerHTML = "<th style='width: 8em;'><a href='/static/charts.html?page=" + feature + "'>" + feature + "</a></th>";
        } else {
            row.insertCell(-1).outerHTML = "<th style='width: 8em;'>" + feature + "</th>";
        }
    }

    let months = getMonthsWithData(groups);
    for (let month of months) {
        const row = tbody.insertRow(-1);
        row.insertCell(-1).outerHTML = '<th>' + month + '</th>';
        for (let feature of features) {
            const cell = row.insertCell(-1);
            if (isMonthDataAvailable(groups, feature, month)) {
                drawTick(cell);
            } else {
                drawCross(cell);
            }
        }
    }
}

function getMonthsWithData (groups) {
    let result = [];
    for (let group of groups) {
        let month = getMonthFromGroup(group);
        if (result.indexOf(month) === -1) {
            result.push(month);
        }
    }
    result.sort();
    result.reverse();
    return result;
}

function isMonthDataAvailable (groups, feature, month) {
    for (let group of groups) {
        if (getFeatureFromGroup(group) === feature && getMonthFromGroup(group) === month) {
            return true;
        }
    }
    return false;
}

function getFeaturesWithData (groups) {
    let features = [];
    for (let group of groups) {
        let feature = getFeatureFromGroup(group);
        if (features.indexOf(feature) === -1){
            features.push(feature);
        }
    }
    features.sort();
    return features;
}

function isSubpageAvailable (configuredFeatures, feature) {
    return configuredFeatures.indexOf(feature) !== -1;
}

function drawTick (cell) {
    const icon = document.createElement('i');
    icon.style.fontSize = '48px';
    icon.classList.add('fa', 'fa-check-circle');
    icon.style.color = 'green';
    cell.appendChild(icon);
}

function drawCross (cell) {
    const icon = document.createElement('i');
    icon.style.fontSize = '48px';
    icon.classList.add('fa', 'fa-times-circle');
    icon.style.color = 'red';
    icon.style.opacity = '0.7';
    cell.appendChild(icon);
}

function getFeatureFromGroup (group) {
    return group[0];
}

function getMonthFromGroup (group) {
    return group[1].substring(0, 7);
}