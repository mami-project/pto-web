// const directoryQueryUrl = "http://localhost/query/7f25ad270320fd3068633cf9bac45d3b3065c72e92df5ed9795c2b3f1778a3d7/result";
const directoryQueryUrl = "https://v3.pto.mami-project.eu/query/7f25ad270320fd3068633cf9bac45d3b3065c72e92df5ed9795c2b3f1778a3d7/result";

const featureIndex = 0;
const timeIndex = 1;
const months = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let groups;
let features;
let years;
let expandedYears = new Set();
let featureSubPages;

function initTable () {
    fetch("json/features.json")
        .then(response => response.json())
        .then(function (data) {
            featureSubPages = Object.getOwnPropertyNames(data);
            return fetch(directoryQueryUrl);
        })
        .then(response => response.json())
        .then(function (data) {
            groups = data.groups;
            initData();
            drawMatrix();
        })
        .catch(function (e) {
            alert("There was an error getting the data!");
            console.log(e);
        });
}

function initData () {
    initFeatures();
    initYears();
}

function initFeatures () {
    features = new Set(groups.map(x => x[featureIndex]));
}

function initYears () {
    years = new Set();
    const yearsWithData = new Set(groups.map(x => Number(x[timeIndex].substr(0,4))));
    for (let year = Math.min(...yearsWithData); year <= Math.max(...yearsWithData); year++) {
        years.add(year);
    }
}

function drawMatrix () {
    let table = document.querySelector("#directoryTable");
    table.innerHTML = "<col width='150'><tr><th>Feature \\ Year</th></tr>";
    drawTimeRow(table);
    for (let feature of features) {
        drawFeatureRow(table, feature);
    }
}

function drawTimeRow (table) {
    for (let year of years) {
        drawYearCell(table, year);
        document.getElementById(year).addEventListener("click", function () {
            toggleYearExpansion(year);
        });
        if (expandedYears.has(year)) {
            for (let month of months) {
                drawMonthCell(table, month);
            }
        }
    }
}

function drawYearCell (table, year) {
    table.rows[0].insertCell(-1).outerHTML = "<th id='" + year + "'>" + year + "</th>";
    const cell = document.getElementById(year);
    if (expandedYears.has(year)) {
        cell.classList.add("expandedYearCell");
    } else {
        cell.classList.add("yearCell");
    }
}

function drawMonthCell (table, month) {
    table.rows[0].insertCell(-1).innerText = month;
}

function drawFeatureRow (table, feature) {
    const row = table.insertRow(-1);
    drawFeatureCell(row, feature);
    for (let year of years) {
        drawTimelineCell(row, feature, year);
        if (expandedYears.has(year)) {
            for (let month of months) {
                drawTimelineCell(row, feature, year, month);
            }
        }
    }
}

function drawFeatureCell (row, feature) {
    if (featureSubPages.indexOf(feature) !== -1) {
        row.insertCell(0).outerHTML = "<th id='" + feature + "'><a href='feature.html?feature=" + feature + "'>" + feature + "</a></th>";
    } else {
        row.insertCell(0).outerHTML = "<th id='" + feature + "'>" + feature + "</th>";
    }
}

function drawTimelineCell (row, feature, year, month) {
    const cell = row.insertCell(-1);
    if (isDataAvailable(feature, year, month)) {
        cell.style.backgroundColor = "green";
    } else {
        cell.style.backgroundColor = "red";
    }
}

function isDataAvailable (feature, year, month) {
    for (let group of groups) {
        if (month === undefined) {
            if (group[featureIndex] === feature && group[timeIndex].startsWith(year + "-")) {
                return true;
            }
        } else {
            let monthNumber = months.indexOf(month) + 1;
            let monthIndicator = "0" + monthNumber;
            if (monthIndicator.length === 3) {
                monthIndicator = monthIndicator.substr(1, 2);
            }
            if (group[featureIndex] === feature && group[timeIndex].startsWith(year + "-" + monthIndicator + "-")) {
                return true;
            }
        }
    }
    return false;
}

function toggleYearExpansion (year) {
    if (expandedYears.has(year)) {
        expandedYears.delete(year);
    } else {
        expandedYears = new Set();
        expandedYears.add(year);
    }
    drawMatrix();
}