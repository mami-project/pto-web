function initApiKey () {
    if (getApiKey() != null) {
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

    document.getElementById('apikeyOutput').innerText = apikey;
    document.getElementById('currentApikeyDiv').style.display = 'block';

    initPage();
}

function clearApiKey () {
    localStorage.removeItem('API Key');

    document.getElementById('apikeyOutput').innerHTML = '';
    document.getElementById('currentApikeyDiv').style.display = 'none';

    initPage();
}