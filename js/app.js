const baseUrl = "https://v3.pto.mami-project.eu";
const retrieveBaseUrl = baseUrl + "/query/retrieve";
const submitBaseUrl = baseUrl + "/query/submit";

function getApiKey () {
    return localStorage.getItem("API Key");
}

function initPage() {
    showNavbar();
    showFooter();
}

function showNavbar() {
    fetch('navbar.html')
        .then(response => response.text())
        .then(function (data) {
            let navbar = document.createElement('div');
            document.body.insertBefore(navbar, document.body.firstChild);
            navbar.outerHTML = data;
            return fetch('json/config.json');
        })
        .then(response => response.json())
        .then(function (data) {
            const navbar = document.body.firstChild;
            for (let page of Object.getOwnPropertyNames(data['pages'])) {
                let link = document.createElement('a');
                link.href = 'charts.html?page=' + page;
                link.classList.add('w3-bar-item', 'w3-button', 'w3-padding-large', 'w3-hover-white');
                link.innerText = data['pages'][page]['linktitle'];
                navbar.appendChild(link);
            }
        });
}

function showFooter() {
    fetch('footer.html')
        .then(response => response.text())
        .then(function (data) {
            let footer = document.createElement('footer');
            document.body.appendChild(footer);
            footer.outerHTML = data;
        });

}