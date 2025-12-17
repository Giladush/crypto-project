$(document).ready(() => {

    $('#nav-coins').on('click', (e) => {
        e.preventDefault();
        loadCoinsPage();
    });

    $('#nav-about').on('click', (e) => {
        e.preventDefault();
        loadAboutPage();
    });

    
    loadCoinsPage();
});
