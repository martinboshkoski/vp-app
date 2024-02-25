const deleteClientButtonElements = document.querySelectorAll('.delete-btn')

async function deleteClient (event) {
    const buttonElement = event.target;
    const clientid = buttonElement.dataset.clientid;
    const csrfToken = buttonElement.dataset.csrf;

   const response = await fetch('/agents/clients/' + clientid + '?_csrf=' + csrfToken, {
        method: "DELETE"
    }) // sending the request, setting

    if (!response.ok) {
        alert('Something went wrong. In here is wrong!')
        return;
    }  
    buttonElement.parentELement.parentELement.remove()
}

for (const deleteClientButtonElement of deleteClientButtonElements) {
    deleteClientButtonElement.addEventListener('click', deleteClient)
}

const policyDebt = document.querySelectorAll('.debtParagraph')

const debt = []

for (let i = 0; i < policyDebt.length; i++) {
    if(policyDebt[i].dataset["debt"] > 0){
        // policyDebt[i].style.color=
        policyDebt[i].className="debt-par"
    }
}

/////

function printPage() {
    // var paymentPanel = document.getElementById("paymentPanel");
    var paymentNav = document.getElementById("paymentNav");
    var printBtn = document.getElementById("printBtn")
        paymentNav.style.display = "none";
        printBtn.style.display = "none";
    window.print();
  }