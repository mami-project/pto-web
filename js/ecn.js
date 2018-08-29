let ecnData;

function initEcn () {
    let ecnConfig;

    fetch("json/ecncharts.json")
        .then(response => response.json())
        .then(function (data) {
            // console.log(data);
            ecnConfig = data;
            return fetch(ecnConfig['query']);
        })
        .then(response => response.json())
        .then(function (data) {
            // console.log(data);
            ecnData = data.groups;
            drawCharts(ecnConfig);
        })
        .catch(function (e) {
            alert(e);
        });
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

    let aspect = chartConfig['aspect'];

    h2.innerText = aspect;
    p.innerText = chartConfig.description;
    div1.id = getSharesDivId(aspect);
    div2.id = getVolumeDivId(aspect);

    document.body.insertBefore(chartDiv, template);
}

function drawSharesChart (chartConfig) {
    let conditions = chartConfig['conditions'];

    c3.generate({
        bindto: '#' + getSharesDivId(chartConfig['aspect']),
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
            onclick: dataBarClicked,
            order: null
        },
        axis: {
            x: {
                type: 'category',
                tick: {
                    format: function() {return ''}
                }
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
        bindto: '#' + getVolumeDivId(chartConfig['aspect']),
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
            colors: {
                Volume: '#111111'
            }
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

function dataBarClicked () {
    alert('Here they are!');
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
    console.log(result);
    return result;
}

function getCount (condition, date) {
    for (let group of ecnData) {
        if (condition === getConditionFromGroup(group) && date === getDateFromGroup(group)) {
            return getCountFromGroup(group);
        }
    }
    return 0;
}

function getVolumes (conditions) {
    let timeline = getTimeline(conditions);
    let result = [['x'].concat(timeline), ['Volume']];
    for (let date of timeline) {
        result[1].push(getVolume(conditions, date));
    }
    return result;
}

function getVolume (conditions, date) {
    let result = 0;
    for (let group of ecnData) {
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
    for (let group of ecnData) {
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

function getConditionFromGroup (group) {
    return group[0];
}

function getDateFromGroup (group) {
    return group[1].substring(0, 10);
}

function getCountFromGroup (group) {
    return group[2];
}

function getSharesDivId (aspect) {
    let id = 'shares';
    for (let part of aspect.split('.')) {
        id = id + '_' + part;
    }
    return id;
}

function getVolumeDivId (aspect) {
    let id = 'volume';
    for (let part of aspect.split('.')) {
        id = id + '_' + part;
    }
    return id;
}