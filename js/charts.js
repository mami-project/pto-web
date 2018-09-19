function initChartPage () {
    let page = new URLSearchParams(window.location.search).get('page');

    fetch('json/config.json')
        .then(response => response.json())
        .then(data => fetch('json/' + data['pages'][page]['pageConfig']))
        .then(response => response.json())
        .then(data => drawPage(data))
        .catch(e => console.log(e));
}

function drawPage (pageConfig) {
    drawHeader(pageConfig);
    drawContainers(pageConfig);
    drawCharts(pageConfig);
}

function drawHeader (pageConfig) {
    const header = document.querySelector('header');

    const h1 = document.createElement('h1');
    h1.classList.add('w3-xxxlarge');
    h1.innerText = pageConfig['title'];
    header.appendChild(h1);

    const h4 = document.createElement('h4');
    h4.innerText = pageConfig['description'];
    header.appendChild(h4);
}

function drawContainers (pageConfig) {
    const chartsDiv = document.getElementById('chartsDiv');

    for (let chartConfig of pageConfig['charts']) {
        const chartDiv = document.createElement('div');
        chartDiv.classList.add('chart-div');

        const title = document.createElement('h2');
        title.innerText = chartConfig['title'];
        chartDiv.appendChild(title);

        const description = document.createElement('h4');
        description.innerText = chartConfig['description'];
        chartDiv.appendChild(description);

        const conditionDescriptions = document.createElement('p');
        for (let condition of chartConfig['conditions']) {
            conditionDescriptions.innerHTML = conditionDescriptions.innerHTML + condition + ": " + chartConfig['descriptions'][condition] + "<br>";
        }
        chartDiv.appendChild(conditionDescriptions);

        const sharesDiv = document.createElement('div');
        chartDiv.appendChild(sharesDiv);

        const volumeDiv = document.createElement('div');
        chartDiv.appendChild(volumeDiv);

        chartsDiv.appendChild(chartDiv);
    }
    // show footer after all containers
    document.getElementsByTagName('footer')[0].style.display = 'block';
}

function drawCharts (pageConfig) {
    drawChart(pageConfig['charts'], 0)
}

function drawChart (chartConfigs, index) {
    if (chartConfigs.length <= index) {
        return;
    }

    const chartsDiv = document.getElementById('chartsDiv');
    const chartDiv = chartsDiv.children[index];
    const sharesDiv = chartDiv.children[3];
    const volumeDiv = chartDiv.children[4];

    encodedQueryToQueryResultOrSubmit(
        chartConfigs[index]['query'],
        function (data) {
            drawC3Chart(sharesDiv, volumeDiv, chartConfigs, index, data);
        },
        function () {
            sharesDiv.innerText = 'The query behind this chart is still pending.';
            drawChart(chartConfigs, index + 1);
        },
        function () {
            sharesDiv.innerText = 'The query behind this chart failed.';
            drawChart(chartConfigs, index + 1);
        },
        function () {
            sharesDiv.innerText = 'The query behind this chart was submitted but is still pending.';
            drawChart(chartConfigs, index + 1);
        },
        function () {
            sharesDiv.innerText = 'The query submission failed. Make sure you have permission.';
            drawChart(chartConfigs, index + 1);
        },
        function () {
            sharesDiv.innerText = 'The query was not submitted.';
            drawChart(chartConfigs, index + 1);
        },
        function () {
            sharesDiv.innerText = 'No API Key available to submit a query.';
            drawChart(chartConfigs, index + 1);
        },
        function (e) {
            console.log(e);
            sharesDiv.innerText = 'An error occured whil building this chart.';
            drawChart(chartConfigs, index + 1);
        });
}

function drawC3Chart(sharesDiv, volumeDiv, chartConfigs, index, chartData) {
    let chartConfig = chartConfigs[index];
    let conditions = chartConfig['conditions'];
    let groups = chartData['groups'];
    let timeline = getTimeline(groups);

    c3.generate({
        bindto: sharesDiv,
        padding: {
            top: 35,
            left: 80
        },
        size: {
            height: 350
        },
        data: {
            x: 'x',
            columns: getShares(timeline, groups, conditions),
            type: 'bar',
            groups: [conditions],
            colors: chartConfig['colors'],
            onclick: d => showObsList(timeline[d.index], d.name),
            order: null
        },
        axis: {
            x: {
                type: 'category',
                tick: {
                    format: function () {return ''}
                },
                height: 15
            },
            y: {
                tick: {
                    outer: false,
                    format: d3.format('.2%')
                },
                padding: {
                    top: 10
                }
            }
        },
        grid: {
            x: {
                lines: getLines(timeline)
            },
            y: {
                show: true
            }
        },
        regions: getRegions(timeline),
        bar: {
            width: {
                ratio: 0.7
            }
        },
        legend: {
            position: 'inset',
            inset: {
                anchor: 'top-left',
                x: -80,
                y: -35,
                step: 1
            }
        },
        tooltip: {
            format: {
                title: x => timeline[x],
                name: name => name.substring(name.lastIndexOf('.') + 1, name.length),
                value: function(value, ratio, id, index) {return d3.format('.2%')(value) + ' (' + getCount(groups, id, timeline[index]) + ')'}
            }
        }
    });

    c3.generate({
        bindto: volumeDiv,
        padding: {
            top: 0,
            left: 80
        },
        size: {
            height: 200
        },
        data: {
            x: 'x',
            columns: getVolumes(timeline, groups, conditions),
            type: 'bar',
            groups: [conditions],
            colors: getVolumeColors(conditions),
            onclick: d => showObsList(timeline[d.index], d.name),
            order: null
        },
        axis: {
            x: {
                type: 'category',
                tick: {
                    multiline: false,
                    rotate: -60
                }
            },
            y: {
                tick: {
                    outer: false,
                    format: d3.format(',')
                },
                padding: {
                    top: 10
                }
            }
        },
        grid: {
            x: {
                lines: getLines(timeline)
            },
            y: {
                show: true
            }
        },
        regions: getRegions(timeline),
        bar: {
            width: {
                ratio: 0.7
            }
        },
        legend: {
            position: 'inset'
        },
        tooltip: {
            show: false
        }
    });
    drawChart(chartConfigs, index + 1);
}

function getTimeline (groups) {
    let timeline = [];
    for (let group of groups) {
        let date = getDateFromGroup(group);
        if (timeline.indexOf(date) === -1) {
            timeline.push(getDateFromGroup(group));
        }
    }
    timeline.sort();
    return timeline;
}

function getShares (timeline, groups, conditions) {
    let result = [['x'].concat(timeline)];
    for (let condition of conditions) {
        result.push([condition]);
        for (let date of timeline) {
            result[result.length - 1].push(getCount(groups, condition, date) / getVolume(groups, conditions, date));
        }
    }
    return result;
}

function getVolumes (timeline, groups, conditions) {
    let result = [['x'].concat(timeline)];
    for (let condition of conditions) {
        result.push([condition]);
        for (let date of timeline) {
            result[result.length - 1].push(getCount(groups, condition, date));
        }
    }
    return result;
}

function getLines (timeline) {
    let lines = [];
    for (let i = 0; i < timeline.length - 1; i++) {
        if (timeline[i].substring(0, 4) !== timeline[i + 1].substring(0, 4)) {
            lines.push({value: i + 0.5});
        }
    }
    return lines;
}

function getRegions (timeline) {
    let regions = [{axis: 'x', opacity: 0.3}];
    for (let i = 0; i < timeline.length - 1; i++) {
        if (timeline[i].substring(0, 4) !== timeline[i + 1].substring(0, 4)) {
            if(!regions[regions.length - 1].hasOwnProperty('end')) {
                regions[regions.length - 1]['end'] = i + 0.5;
            } else {
                regions.push({axis: 'x', start: i + 0.5, opacity: 0.3});
            }
        }
    }
    return regions;
}

function getCount (groups, condition, date) {
    for (let group of groups) {
        if (condition === getConditionFromGroup(group) && date === getDateFromGroup(group)) {
            return getCountFromGroup(group);
        }
    }
    return 0;
}

function getVolume (groups, conditions, date) {
    let result = 0;
    for (let group of groups) {
        if (conditions.indexOf(getConditionFromGroup(group)) !== -1 && date === getDateFromGroup(group)) {
            result += getCountFromGroup(group);
        }
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

function getVolumeColors(conditions) {
    let result = [];
    for (let condition of conditions) {
        let darkness = 64 + 64 / conditions.length * (conditions.indexOf(condition) + 1);
        result[condition] = d3.rgb(darkness, darkness, darkness);
    }
    return result;
}