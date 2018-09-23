function initApiKey () {
    if (getApiKey() != null) {
        getUiQueries().then(queries => showUiQueries(queries));
        document.getElementById('apikeyOutput').innerText = getApiKey();
        document.getElementById('currentApikeyDiv').style.display = 'block';
    }
}

function setApiKey () {
    let apikey = document.getElementById('apikeyInput').value;

    if (apikey === ''){
        alert('Enter an API Key!');
        return;
    } else {
        localStorage.setItem('API Key', apikey);
    }

    getUiQueries().then(queries => showUiQueries(queries));
    document.getElementById('apikeyOutput').innerText = apikey;
    document.getElementById('currentApikeyDiv').style.display = 'block';

    initPage();
}

function clearApiKey () {
    localStorage.removeItem('API Key');

    document.getElementById('apikeyOutput').innerHTML = '';
    document.getElementById('uiQueries').innerHTML = '';
    document.getElementById('currentApikeyDiv').style.display = 'none';

    initPage();
}

function showUiQueries (queries) {
    const uiQueriesP = document.getElementById('uiQueries');
    uiQueriesP.innerHTML = '';
    console.log(queries);
    for (let query of queries) {
        uiQueriesP.innerHTML = uiQueriesP.innerHTML + query + '<br><br>';
    }
}