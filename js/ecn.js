const ecnQueryUrl = "http://localhost/query/28fb885b7822b4bfab82ed87f238e3cdb5c5cc7af793068a03268ae093c3b25f/result";
// const ecnQueryUrl = "https://v3.pto.mami-project.eu/query/28fb885b7822b4bfab82ed87f238e3cdb5c5cc7af793068a03268ae093c3b25f/result";

let aspects = [];
let conditions = [];
let timelines = [];
let groups;

function initEcn(){
    const xhr = new XMLHttpRequest();
    xhr.open("GET", ecnQueryUrl, true);
    xhr.onload = function () {
        const result = JSON.parse(xhr.responseText);
        groups = result.groups;
        initData();
        drawCharts();
    };
    xhr.onerror = function () {
        alert("There was an error getting the data!");
    };
    xhr.send();
}

function initData(){
    initAspects();
    console.log(aspects);
    initConditions();
    console.log(conditions);
    initTimelines();
    console.log(timelines);
}

function initAspects(){
    for(let group of groups){
        let aspect = getAspectFromGroup(group);

        if(aspects.indexOf(aspect) === -1){
            aspects.push(aspect);
        }
    }
}

function initConditions(){
    for(let group of groups){
        let aspect = getAspectFromGroup(group);
        let condition = getConditionFromGroup(group);

        if(!conditions.hasOwnProperty(aspect)){
            conditions[aspect] = [];
        }

        if(conditions[aspect].indexOf(condition) === -1){
            conditions[aspect].push(condition);
        }
    }
}

function initTimelines(){
    for(let group of groups){
        let aspect = getAspectFromGroup(group);
        let date = getDateFromGroup(group);

        if(!timelines.hasOwnProperty(aspect)){
            timelines[aspect] = [];
        }

        if(timelines[aspect].indexOf(date) === -1){
            timelines[aspect].push(date);
        }
    }
}

function drawCharts(){
    for(let aspect of aspects){
        createContainer(aspect);
        drawChart(aspect);
    }
}

function createContainer(aspect){
    const statisticsDiv = document.querySelector('#statisticsDiv');

    const chartDiv = document.createElement('div');
    chartDiv.classList.add('w3-row-padding');
    chartDiv.classList.add('w3-container');

    const title = document.createElement('h2');
    title.innerText = aspect;
    chartDiv.appendChild(title);

    const dataChart = document.createElement('div');
    dataChart.id = 'data' + aspects.indexOf(aspect);
    chartDiv.appendChild(dataChart);

    const volumeChart = document.createElement('div');
    volumeChart.id = 'volume' + aspects.indexOf(aspect);
    chartDiv.appendChild(volumeChart);

    statisticsDiv.appendChild(chartDiv);
}

function drawChart(aspect){
    try {
        drawDataChart(aspect);
        drawVolumeChart(aspect);
    } catch (e) {
        console.log(e);
    }
}

function drawDataChart(aspect){
    c3.generate({
        bindto: '#data' + aspects.indexOf(aspect),
        padding: {
            left: 100
        },
        data: {
            columns: getMeasurements(aspect),
            type: 'bar',
            groups:[conditions[aspect]]
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
            },
            y2: {
                show: false,
                tick: {
                    format: d3.format(',')
                }
            }
        },
        grid: {
            x: {
                show: true
            },
            y: {
                show: true
            }
        },
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
                value: function(value, radio, id, index) {return d3.format('.2%')(value) + ' (' + Math.round(value * getVolumes(aspect)[index + 1]) + ')'}
            }
        }
    });
}

function drawVolumeChart(aspect){
    c3.generate({
        bindto: '#volume' + aspects.indexOf(aspect),
        padding: {
            left: 100
        },
        size: {
            height: 150
        },
        data: {
            columns: [getVolumes(aspect)],
            type: 'bar'
        },
        axis: {
            x: {
                type: 'category',
                tick: {
                    format: function(index) {return timelines[aspect][index]},
                }
            }
        },
        grid: {
            x: {
                show: true
            },
            y: {
                show: true
            }
        },
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

function getVolume(aspect, date){
    let result = 0;
    for(let group of groups){
        let aspect2 = getAspectFromGroup(group);
        let date2 = getDateFromGroup(group);
        let count = getCountFromGroup(group);

        if(aspect === aspect2 && date === date2){
            result += count;
        }
    }
    return result;
}

function getCount(aspect, condition, date){
    for(let group of groups){
        let aspect2 = getAspectFromGroup(group);
        let condition2 = getConditionFromGroup(group);
        let date2 = getDateFromGroup(group);
        let count = getCountFromGroup(group);

        if(aspect === aspect2 && condition === condition2 && date === date2){
            return count;
        }
    }
    return 0;
}

function getAspectFromGroup(group){
    return group[0].substring(0, group[0].lastIndexOf('.'));
}

function getConditionFromGroup(group){
    return group[0].substring(group[0].lastIndexOf('.') + 1, group[0].length);
}

function getDateFromGroup(group){
    return group[1].substring(0, 10);
}

function getCountFromGroup(group){
    return group[2];
}

function getVolumes(aspect){
    let result = ['Volume'];
    for(let date of timelines[aspect]){
       result.push(getVolume(aspect, date));
    }
    return result;
}

function getMeasurements(aspect){
    let result = [];
    for(let condition of conditions[aspect]){
        result.push([condition]);
        for(let date of timelines[aspect]){
            result[result.length - 1].push(getCount(aspect, condition, date) / getVolume(aspect, date));
        }
    }
    return result;
}