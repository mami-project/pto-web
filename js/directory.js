// const directoryQueryUrl = "http://localhost/query/7f25ad270320fd3068633cf9bac45d3b3065c72e92df5ed9795c2b3f1778a3d7/result";
const directoryQueryUrl = "https://v3.pto.mami-project.eu/query/7f25ad270320fd3068633cf9bac45d3b3065c72e92df5ed9795c2b3f1778a3d7/result";

const months = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function initTable () {
    let configuredFeatures;
    fetch("json/features.json")
        .then(response => response.json())
        .then(function (data) {
            configuredFeatures = Object.getOwnPropertyNames(data);
            addFeaturesToNavbar(data);
            return fetch(directoryQueryUrl);
        })
        .then(response => response.json())
        .then(function (data) {
            drawYearsMatrix(data['groups'], configuredFeatures);
        })
        .catch(function (e) {
            alert("There was an error getting the data!");
            console.log(e);
        });
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
    let monthIndex = months.indexOf(month);
    monthIndex++;
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