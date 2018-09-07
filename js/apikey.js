function initApiKey () {
    document.getElementById("API Key").value = getApiKey();
}

function setApiKey () {
    let key = document.getElementById("API Key").value;
    if (key === ""){
        localStorage.removeItem("API Key");
    } else {
        localStorage.setItem("API Key", key);
    }
}