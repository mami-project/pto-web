function showTargetList (startDateString, condition) {
    let startDate = new Date(startDateString);
    let endDate = new Date(startDate.getTime() + (7 * 24 * 60 * 60 * 1000 - 1));

    let query = 'time_start=' + encodeURIComponent(startDate.toISOString());
    query = query + '&time_end=' + encodeURIComponent(endDate.toISOString());
    query = query + '&condition=' + condition;

    fetch(retrieveBaseUrl + '?' + query)
        .then(response => response.json())
        .then(function (data) {
            if(data == null) {
                submitDrillDownQuery(query);
            } else if (data['__state'] === 'complete') {
                showTargets(data['__result'], 0);
            } else if (data['__state'] === 'pending') {
                alert('The data you asked for is getting prepared currently. Please come back later.');
            } else {
                alert('The data you asked for could not be fetched. Please contact us.');
            }
        });
}

function submitDrillDownQuery (query) {
    let confirmed = confirm('The data you asked for is not prepared right now. Do you want to submit a query to prepare that data now?');
    if (!confirmed) {
        return;
    }

    let apikey = getApiKey();
    if(apikey === null){
        alert("To submit a query you need to enter an API Key. If you dont have an API Key yet, please contact us to get one.");
        return;
    }

    let options = {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'APIKEY ' + apikey
        }
    };

    fetch(submitBaseUrl + '?' + query, options)
        .then(function (response) {
           if (response.status !== 200) {
               alert('There was a problem submitting the query. Please check your Browser console and contact us.');
               console.log(response);
           }
        });
}

function showTargets (resultBaseUrl, page) {
    fetch(resultBaseUrl + '?page=' + page)
        .then(response => response.json())
        .then(function (data) {
            document.getElementById('targetList').style.display = 'unset';
            configureObsNav(resultBaseUrl, page, data);
            fillTargetList(resultBaseUrl, page, data);
        });
}

function configureObsNav(resultBaseUrl, page, data) {
    let obsNav = document.getElementById('obsNav');
    obsNav.parentElement.replaceChild(obsNav.cloneNode(true), obsNav);
    obsNav = document.getElementById('obsNav');

    obsNav.children[0].addEventListener('click', function () {
        showTargets(resultBaseUrl, 0);
    });

    if (page > 0) {
        obsNav.children[1].disabled = false;
        obsNav.children[1].addEventListener('click', function () {
            showTargets(resultBaseUrl, page - 1);
        });
    } else {
        obsNav.children[1].disabled = true;
    }

    obsNav.children[2].innerHTML = 'Page ' + (page + 1);

    if (page < Math.floor(data['total_count'] / 1000)) {
        obsNav.children[3].disabled = false;
        obsNav.children[3].addEventListener('click', function () {
            showTargets(resultBaseUrl, page + 1);
        });
    } else {
        obsNav.children[3].disabled = true;
    }

    obsNav.children[4].addEventListener('click', function () {
        showTargets(resultBaseUrl, Math.floor(data['total_count'] / 1000));
    });
}

function fillTargetList (resultbaseUrl, page, data) {
    const tableBody =  document.getElementById('obsTable').querySelector('tbody');
    tableBody.innerHTML = '';

    for (let obs of data['obs']) {
        const row = tableBody.insertRow(-1);
        row.insertCell(-1).innerText = data['obs'].indexOf(obs) + 1 + (page) * 1000;
        row.insertCell(-1).innerText = obs[0];
        row.insertCell(-1).innerText = obs[1];
        row.insertCell(-1).innerText = obs[3];
        row.insertCell(-1).innerText = obs[5];
    }

    document.querySelector('#obsTable').parentElement.scrollTop = 0;
}

function closeTargetList () {
    document.getElementById('targetList').style.display = 'none';
}