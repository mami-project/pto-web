function addFeaturesToNavbar (featuresConfig) {
    const navbar = document.querySelector('#navbar');

    for (let feature of Object.getOwnPropertyNames(featuresConfig)) {
        let link = document.createElement('a');
        link.href = 'feature.html?feature=' + feature;
        link.classList.add('w3-bar-item', 'w3-button', 'w3-padding-large', 'w3-hover-white');
        link.innerText = featuresConfig[feature]['linktitle'];
        navbar.appendChild(link);
    }
}