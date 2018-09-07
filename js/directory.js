const months = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function initTable () {
    fetch("json/config.json")
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
    fetch(directoryQuery)
        .then(response => response.json())
        .then(data => drawMatrix2(data['groups'], configuredFeatures));
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
            row.insertCell(-1).outerHTML = "<th style='width: 8em;'><a href='chartpage.html?page=" + feature + "'>" + feature + "</a></th>";
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
            if (isMonthDataAvailabl2(groups, feature, month)) {
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

function isMonthDataAvailabl2 (groups, feature, month) {
    for (let group of groups) {
        if (getFeatureFromGroup(group) === feature && getMonthFromGroup(group) === month) {
            return true;
        }
    }
    return false;
}

function drawYearsMatrix (groups, configuredFeatures) {
    let table = document.querySelector("#directoryTable");
    table.innerHTML = "<col width='150'><tr><th>Feature \\ Year</th></tr>";

    let years = getYears(groups);

    drawYearHeaderRow(table, groups, configuredFeatures, years);
    for (let feature of getFeaturesWithData(groups)) {
        drawYearDataRow(table, groups, configuredFeatures, years, feature);
    }
}

function drawYearHeaderRow (table, groups, configuredFeatures, years) {
    const row = table.rows[0];
    for (let year of years) {
        const cell = drawYearHeaderCell(row, year);
        cell.addEventListener("click", function () {
            drawMonthsMatrix(groups, configuredFeatures, year);
        });
    }
}

function drawYearHeaderCell (row, year) {
    row.insertCell(-1).outerHTML = "<th id='" + year + "'>" + year + "</th>";
    const cell = document.getElementById(year);
    cell.classList.add("yearCell");
    return cell;
}

function drawYearDataRow (table, groups, configuredFeatures, years, feature) {
    const row = table.insertRow(-1);
    drawFeatureCell(row, configuredFeatures, feature);
    for (let year of years) {
        drawYearDataCell(row, groups, feature, year);
    }
}

function drawYearDataCell (row, groups, feature, year) {
    const cell = row.insertCell(-1);
    if (isYearDataAvailable(groups, feature, year)) {
        drawTick(cell);
    } else {
        drawCross(cell);
    }
}

function isYearDataAvailable (groups, feature, year) {
    for (let group of groups) {
        if (getFeatureFromGroup(group) === feature && getYearFromGroup(group) === year) {
            return true;
        }
    }
    return false;
}

function getYears (groups) {
    let years = [];
    for (let group of groups) {
        let year = getYearFromGroup(group);
        if (years.indexOf(year) === -1) {
            years.push(year);
        }
    }
    years.sort();
    years = fillYears(years);
    return years;
}

function drawMonthsMatrix (groups, configuredFeatures, year) {
    let table = document.querySelector("#directoryTable");
    table.innerHTML = "<col width='150'><tr><th id='" + year + "' class='yearCell'>" + year + "</th></tr>";
    const yearCell = document.getElementById(year);
    yearCell.addEventListener('click', function () {
        drawYearsMatrix(groups, configuredFeatures);
    });

    drawMonthHeaderRow(table);
    for (let feature of getFeaturesWithData(groups)) {
        drawMonthDataRow(table, groups, configuredFeatures, feature, year);
    }
}

function drawMonthHeaderRow (table) {
    const row = table.rows[0];
    for (let month of months) {
        drawMonthHeaderCell(row, month);
    }
}

function drawMonthHeaderCell (row, month) {
    row.insertCell(-1).outerHTML = "<th>" + month + "</th>";
}

function drawMonthDataRow (table, groups, configuredFeatures, feature, year) {
    const row = table.insertRow(-1);
    drawFeatureCell(row, configuredFeatures, feature);
    for (let month of months) {
        drawMonthDataCell(row, groups, feature, year, month)
    }
}

function drawMonthDataCell (row, groups, feature, year, month) {
    const cell = row.insertCell(-1);
    if (isMonthDataAvailable(groups, feature, year, month)) {
        drawTick(cell);
    } else {
        drawCross(cell);
    }
}

function isMonthDataAvailable (groups, feature, year, month) {
    let monthIndex = months.indexOf(month) + 1;
    if (monthIndex > 9) {
        monthIndex = year + '-' + monthIndex;
    } else {
        monthIndex = year + '-0' + monthIndex
    }

    for (let group of groups) {
        if (getFeatureFromGroup(group) === feature && getMonthFromGroup(group) === monthIndex) {
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

function drawFeatureCell (row, configuredFeatures, feature) {
    if (isSubpageAvailable(configuredFeatures, feature)) {
        row.insertCell(0).outerHTML = "<th id='" + feature + "'><a href='feature.html?feature=" + feature + "'>" + feature + "</a></th>";
    } else {
        row.insertCell(0).outerHTML = "<th id='" + feature + "'>" + feature + "</th>";
    }
}

function isSubpageAvailable (configuredFeatures, feature) {
    return configuredFeatures.indexOf(feature) !== -1;
}

function fillYears (years) {
    let start = parseInt(years[0]);
    let end = parseInt(years[years.length - 1]);
    let result = [];
    for (let year = start; year <= end; year++) {
        result[result.length] = '' + year;
    }
    return result;
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

function getYearFromGroup (group) {
    return group[1].substring(0, 4);
}

function getMonthFromGroup (group) {
    return group[1].substring(0, 7);
}