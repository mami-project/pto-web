let pageData;

function initFeature () {
    let feature = new URLSearchParams(window.location.search).get('feature');
    let config;

    fetch("json/features.json")
        .then(response => response.json())
        .then(function (data) {
            addFeaturesToNavbar(data);
        });

    fetch("json/" + feature + ".json")
        .then(response => response.json())
        .then(function (data) {
            config = data;
            drawHeader(config);
            return fetch(config['query']);
        })
        .then(response => response.json())
        .then(function (data) {
            pageData = data.groups;
            drawCharts(config);
        })
        .catch(function (e) {
            alert(e);
        });
}

function drawHeader (config) {
    const header = document.querySelector('header');

    const h1 = document.createElement('h1');
    h1.classList.add('w3-xxxlarge');
    h1.innerText = config['title'];

    const h4 = document.createElement('h4');
    h4.innerText = config['description'];

    header.appendChild(h1);
    header.appendChild(h4);
}

function drawCharts (ecnConfig) {
    for (let chartConfig of ecnConfig['charts']) {
        drawChart(chartConfig);
    }
}

function drawChart (chartConfig) {
    createContainer(chartConfig);
    drawSharesChart(chartConfig);
    drawVolumeChart(chartConfig);
}

function createContainer (chartConfig) {
    const template = document.getElementsByTagName('template')[0];
    const chartDiv = template.content.cloneNode(true);

    let h2 = chartDiv.children[0].children[0];
    let p = chartDiv.children[0].children[1];
    let div1 = chartDiv.children[0].children[2];
    let div2 = chartDiv.children[0].children[3];

    h2.innerText = chartConfig['title'];
    p.innerText = chartConfig['description'];
    div1.id = getSharesDivId(chartConfig);
    div2.id = getVolumeDivId(chartConfig);

    document.body.insertBefore(chartDiv, template);
}

function drawSharesChart (chartConfig) {
    let conditions = chartConfig['conditions'];

    c3.generate({
        bindto: '#' + getSharesDivId(chartConfig),
        padding: {
            left: 100,
            bottom: 0
        },
        data: {
            x: 'x',
            columns: getShares(conditions),
            type: 'bar',
            colors: chartConfig['colors'],
            groups: [conditions],
            onclick: showTargetList(conditions),
            order: null
        },
        axis: {
            x: {
                type: 'category',
            },
            y: {
                tick: {
                    format: d3.format('.2%')
                }
            }
        },
        grid: {
            x: {
                lines: getLines(conditions)
            },
            y: {
                show: true
            }
        },
        regions: getRegions(conditions),
        bar: {
            width: {
                ratio: 0.8
            }
        },
        legend: {
            position: 'inset'
        },
        tooltip: {
            format: {
                name: function (name) {return name.substring(name.lastIndexOf('.') + 1, name.length)},
                value: function(value, radio, id, index) {return d3.format('.2%')(value) + ' (' + Math.round(value * getVolume(conditions, getTimeline(conditions)[index])) + ')'}
            }
        }
    });
}

function drawVolumeChart (chartConfig) {
    let conditions = chartConfig['conditions'];

    c3.generate({
        bindto: '#' + getVolumeDivId(chartConfig),
        padding: {
            left: 100,
            top: 0
        },
        size: {
            height: 150
        },
        data: {
            x: 'x',
            columns: getVolumes(conditions),
            type: 'bar',
            groups: [conditions],
            colors: getVolumeColors(conditions),
            order: null
        },
        axis: {
            x: {
                type: 'category'
            },
            y: {
                tick: {
                    format: d3.format(',')
                }
            }
        },
        grid: {
            x: {
                lines: getLines(conditions)
            },
            y: {
                show: true
            }
        },
        regions: getRegions(conditions),
        bar: {
            width: {
                ratio: 0.8
            }
        },
        legend: {
            position: 'inset'
        }
    })
}

function getShares (conditions) {
    let timeline = getTimeline(conditions);
    let result = [['x'].concat(timeline)];
    for (let condition of conditions) {
        result.push([condition]);
        for (let date of timeline) {
            result[result.length - 1].push(getCount(condition, date) / getVolume(conditions, date));
        }
    }
    return result;
}

function getCount (condition, date) {
    for (let group of pageData) {
        if (condition === getConditionFromGroup(group) && date === getDateFromGroup(group)) {
            return getCountFromGroup(group);
        }
    }
    return 0;
}

function getVolumes (conditions) {
    let timeline = getTimeline(conditions);
    let result = [['x'].concat(timeline)];
    for (let condition of conditions) {
        result.push([condition]);
        for (let date of timeline) {
            result[result.length - 1].push(getCount(condition, date));
        }
    }
    return result;
}

function getVolume (conditions, date) {
    let result = 0;
    for (let group of pageData) {
        if (conditions.indexOf(getConditionFromGroup(group)) !== -1 && date === getDateFromGroup(group)) {
            result += getCountFromGroup(group);
        }
    }
    return result;
}

function getLines (conditions) {
    let timeline = getTimeline(conditions);
    let lines = [];
    for (let i = 0; i < timeline.length - 1; i++) {
        if (timeline[i].substring(0, 4) !== timeline[i + 1].substring(0, 4)) {
            lines.push({value: i + 0.5, text: timeline[i].substring(0, 4)});
        }
    }
    lines.push({value: timeline.length - 0.52, text: timeline[timeline.length - 1].substring(0, 4)});
    return lines;
}

function getRegions (conditions) {
    let timeline = getTimeline(conditions);
    let regions = [{axis: 'x'}];
    for (let i = 0; i < timeline.length - 1; i++) {
        if (timeline[i].substring(0, 4) !== timeline[i + 1].substring(0, 4)) {
            if(!regions[regions.length - 1].hasOwnProperty('end')) {
                regions[regions.length - 1]['end'] = i + 0.5;
            } else {
                regions.push({axis: 'x', start: i + 0.5});
            }
        }
    }
    return regions;
}

function getTimeline (conditions) {
    let timeline = [];
    for (let group of pageData) {
        if (conditions.indexOf(getConditionFromGroup(group)) !== -1) {
            let date = getDateFromGroup(group);
            if (timeline.indexOf(date) === -1) {
                timeline.push(getDateFromGroup(group));
            }
        }
    }
    timeline.sort();
    return timeline;
}

function getSharesDivId (chartConfig) {
    return 'shares_' + chartConfig['title'].replace(/\./g, '_');
}

function getVolumeDivId (chartConfig) {
    return 'volume_' + chartConfig['title'].replace(/\./g, '_');
}

function getVolumeColors(conditions) {
    let result = [];
    for (let condition of conditions) {
        let darkness = 128 / conditions.length * (conditions.indexOf(condition) + 1);
        result[condition] = d3.rgb(darkness, darkness, darkness);
    }
    return result;
}

function getConditionFromGroup (group) {
    return group[0];
}

function getDateFromGroup (group) {
    return group[1].substring(0, 10);
}

function getCountFromGroup (group) {
    return group[2];
}

function showTargetList (conditions) {
    return function (d) {
        let apikey = localStorage.getItem("API Key");
        if(apikey === null){
            alert("Enter an API Key!");
            return;
        }

        let startDateString = getTimeline(conditions)[d.index];
        let startDate = new Date(startDateString);
        let endDate = new Date(startDate.getTime() + (7 * 24 * 60 * 60 * 1000 - 1));
        let condition = d.name;

        let url = 'https://v3.pto.mami-project.eu/query/submit?';
        for (let group of pageData) {
            if (getDateFromGroup(group) === startDateString) {
                if(getConditionFromGroup(group) === condition) {
                    url = url + 'time_start=' + encodeURIComponent(startDate.toISOString());
                    url = url + '&time_end=' + encodeURIComponent(endDate.toISOString());
                    url = url + '&condition=' + condition;
                    console.log(url);
                }
            }
        }

        let options = {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'APIKEY ' + apikey
            }
        };

        fetch(url, options)
            .then(response => response.json())
            .then(function (data) {
                if (data['__state'] === 'complete') {
                    showTargets(data['__result'], 0);
                } else if (data['__state'] === 'pending') {
                    alert ('The query for this drill down is still pending. Please come back later.');
                } else {
                    alert ('The query failed. Please call Brian Trammell.');
                }
            })
            .catch(function (e) {
                alert(e);
            });
    }
}

function showTargets (resultBaseUrl, page) {
    fetch(resultBaseUrl + '?page=' + page)
        .then(response => response.json())
        .then(function (data) {
            document.getElementById('targetList').style.display = 'block';
            configureObsNav(resultBaseUrl, page, data);
            fillTargetList(resultBaseUrl, page, data);
        });
}

function configureObsNav(resultBaseUrl, page, data) {
    const obsNav = document.getElementById('obsNav');

    obsNav.replaceChild(obsNav.children[0].cloneNode(true), obsNav.children[0]);
    obsNav.children[0].addEventListener('click', function () {
        showTargets(resultBaseUrl, 0);
    });

    obsNav.replaceChild(obsNav.children[1].cloneNode(true), obsNav.children[1]);
    if (page > 0) {
        obsNav.children[1].disabled = false;
        obsNav.children[1].addEventListener('click', function () {
            showTargets(resultBaseUrl, page - 1);
        });
    } else {
        obsNav.children[1].disabled = true;
    }

    obsNav.children[2].innerHTML = 'Page ' + (page + 1);

    obsNav.replaceChild(obsNav.children[3].cloneNode(true), obsNav.children[3]);
    if (page < Math.floor(data['total_count'] / 1000)) {
        obsNav.children[3].disabled = false;
        obsNav.children[3].addEventListener('click', function () {
            showTargets(resultBaseUrl, page + 1);
        });
    } else {
        obsNav.children[3].disabled = true;
    }

    obsNav.replaceChild(obsNav.children[4].cloneNode(true), obsNav.children[4]);
    obsNav.children[4].addEventListener('click', function () {
        showTargets(resultBaseUrl, Math.floor(data['total_count'] / 1000));
    });
}

function fillTargetList (resultbaseUrl, page, data) {
    const tableBody = document.getElementById('obsTable').querySelector('tbody');
    tableBody.innerHTML = '';
    for (let obs of data['obs']) {
        const row = tableBody.insertRow(-1);
        row.insertCell(-1).innerText = data['obs'].indexOf(obs) + 1 + (page) * 1000;
        for (let ob of obs) {
            const cell = row.insertCell(-1);
            cell.innerText = ob;
        }
    }
}

function closeTargetList () {
    document.getElementById('targetList').style.display = 'none';
}