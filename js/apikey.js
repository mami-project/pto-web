const apikey = "API Key";

function initApiKey () {
    document.getElementById("API Key").value = localStorage.getItem(apikey)
}

function setApiKey() {
    let key = document.getElementById(apikey).value;
    if (key === ""){
        localStorage.removeItem(apikey);
    } else {
        localStorage.setItem(apikey, key);
    }
}