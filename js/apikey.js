function initApiKey () {
    fetch("json/features.json")
        .then(response => response.json())
        .then(function (data) {
            addFeaturesToNavbar(data);
        });

    document.getElementById("API Key").value = localStorage.getItem("API Key")
}

function setApiKey() {
    let key = document.getElementById("API Key").value;
    if (key === ""){
        localStorage.removeItem("API Key");
    } else {
        localStorage.setItem("API Key", key);
    }
}