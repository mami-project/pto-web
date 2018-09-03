function initPage () {
    fetch("json/features.json")
        .then(response => response.json())
        .then(function (data) {
            addFeaturesToNavbar(data);
        })
        .catch(function (e) {
            alert(e);
        });
}

function addFeaturesToNavbar (config) {
    const navbar = document.querySelector('#navbar');

    for (let feature of Object.getOwnPropertyNames(config)) {
        let link = document.createElement('a');
        link.href = 'feature.html?feature=' + feature;
        link.classList.add('w3-bar-item', 'w3-button', 'w3-padding-large', 'w3-hover-white');
        link.innerText = config[feature]['linktitle'];
        navbar.appendChild(link);
    }
}