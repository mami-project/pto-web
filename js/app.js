const baseUrl = "https://observatory.mami-project.eu/";
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
    const navbar = document.getElementById('navbar');
    if (navbar != null) {
        navbar.parentNode.removeChild(navbar);
    }

    fetch(baseUrl + '/static/navbar.html')
        .then(response => response.text())
        .then(function (data) {
            let navbar = document.createElement('div');
            document.body.insertBefore(navbar, document.body.firstChild);
            navbar.outerHTML = data;
            return fetch(baseUrl + '/static/json/config.json');
        })
        .then(response => response.json())
        .then(function (data) {
            const navbar = document.body.firstChild;
            for (let page of Object.getOwnPropertyNames(data['pages'])) {
                let link = document.createElement('a');
                link.href = baseUrl + '/static/charts.html?page=' + page;
                link.classList.add('w3-bar-item', 'w3-button', 'w3-padding-large', 'w3-hover-white');
                link.innerText = data['pages'][page]['linktitle'];
                navbar.appendChild(link);
            }
            if (getApiKey()) {
                for (let link of navbar.getElementsByTagName('a')) {
                    if (link.style.display === 'none') {
                        link.style.display = 'block';
                    }
                }
            }
        });
}

function showFooter() {
    const footer = document.getElementById('footer');
    if (footer != null) {
        footer.parentNode.removeChild(footer);
    }

    fetch(baseUrl + '/static/footer.html')
        .then(response => response.text())
        .then(function (data) {
            let footer = document.createElement('footer');
            document.body.appendChild(footer);
            footer.outerHTML = data;
        });
}

function compareByProperty (property) {
    return function (a, b) {
        if (a[property] < b[property]) {
            return 1;
        }
        if (a[property] > b[property]) {
            return -1;
        }
        return 0;
    }
}

function getQuerySubmitOptions() {
    return {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'APIKEY ' + getApiKey()
        }
    };
}

function getReadOptions() {
    return {
        headers: {
            'Authorization': 'APIKEY ' + getApiKey()
        }
    };
}

function encodedQueryToQueryResultOrSubmit(query, onQueryCompleted, onQueryPending, onQueryFailed, onSubmitted, onSubmitFailed, onSubmitRejected, onNoApiKey, onError) {
    encodedQueryToQueryLinkOrSubmit(
        query,
        queryLink => queryLinkToQueryResult(queryLink, onQueryCompleted, onError, onError),
        onQueryPending,
        onQueryFailed,
        onSubmitted,
        onSubmitFailed,
        onSubmitRejected,
        onNoApiKey,
        onError
    );
}

function encodedQueryToQueryLinkOrSubmit(query, onQueryCompleted, onQueryPending, onQueryFailed, onSubmitted, onSubmitFailed, onSubmitRejected, onNoApiKey, onError) {
    encodedQueryToQueryLink(
        query,
        onQueryCompleted,
        onQueryPending,
        onQueryFailed,
        function () {askAndSubmitQuery(query, onSubmitted, onSubmitFailed, onSubmitRejected, onNoApiKey, onError);},
        onError
    );
}

function encodedQueryToQueryLink(query, onQueryCompleted, onQueryPending, onQueryFailed, onQueryUnavailable, onError) {
    fetch(retrieveBaseUrl + '?' + query)
        .then(function (response) {
            switch (response.status) {
                case 200:
                    return response.json();
                case 400:
                    return null;
                case 404:
                    return null;
                default:
                    throw new Error();
            }
        })
        .then(function (metadata) {
            if (metadata != null) {
                switch (metadata['__state']) {
                    case 'complete':
                        onQueryCompleted(metadata['__result']);
                        break;
                    case 'pending':
                        onQueryPending();
                        break;
                    case 'failed':
                        onQueryFailed();
                        break;
                    default:
                        throw new Error();
                }
            } else {
                onQueryUnavailable();
            }
        })
        .catch(e => onError(e));
}

function queryLinkToQueryResult (queryLink, onResultReceived, onUnavailable, onError) {
    fetch(queryLink)
        .then(function (response) {
            switch (response.status) {
                case 200:
                    return response.json();
                case 400:
                    return null;
                default:
                    throw new Error();
            }
        })
        .then(function (data) {
            if (data != null) {
                onResultReceived(data);
            } else {
                onUnavailable();
            }
        })
        .catch(e => onError(e));
}

function askAndSubmitQuery(query, onSubmitted, onSubmitFailed, onSubmitRejected, onNoApiKey, onError) {
    if (getApiKey() != null) {
        if (confirm('The query you are looking for is not cached at the moment. Do you want to submit it now?')) {
            submitQuery(query, onSubmitted, onSubmitFailed, onError);
        } else {
            onSubmitRejected();
        }
    } else {
        onNoApiKey();
    }
}

function submitQuery (query, onSubmitted, onSubmitFailed, onError){
    fetch(submitBaseUrl + '?' + query, getQuerySubmitOptions())
        .then(function (response) {
            if (response.status === 200) {
                onSubmitted();
            } else {
                onSubmitFailed();
            }
        })
        .catch(e => onError(e));
}
