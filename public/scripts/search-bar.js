const res = require("express/lib/response");

function searchClients() {
    let input = document.getElementById('searchBar').value;
    input = input.toLowerCase();
    
    let x = document.getElementsByClassName('client');

    for (i = 0; i < x.length; i++) {
        if (!x[i].innerHTML.toLocaleLowerCase().includes(input)) {
            x[i].style.display = 'none'
        } else {
            x[i].style.display = 'client'
        }
    }
    if (!input) {
        location.reload()
    }
}