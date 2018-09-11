function initApiKey () {
    document.getElementById('apikeyInput').value = '';
    document.getElementById('apikeyOutput').value = getApiKey();
}

function setApiKey () {
    let apikey = document.getElementById('apikeyInput').value;
    if (apikey === ''){
        alert('Enter an API Key!');
    } else {
        localStorage.setItem('API Key', apikey);
    }
    document.getElementById('apikeyOutput').value = getApiKey();

    document.body.removeChild(document.body.firstChild);
    document.body.removeChild(document.body.lastChild);
    initPage();
}

function clearApiKey() {
    localStorage.removeItem('API Key');
    document.getElementById('apikeyOutput').value = '';

    document.body.removeChild(document.body.firstChild);
    document.body.removeChild(document.body.lastChild);
    initPage();
}