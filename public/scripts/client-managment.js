    // // Deleting a client
    // const deleteClientButtonElements = document.querySelectorAll('.delete-btn');

    // if (deleteClientButtonElements) {
    //     for (const deleteClientButtonElement of deleteClientButtonElements) {
    //         deleteClientButtonElement.addEventListener('click', deleteClient);
    //     }
    // }

    // async function deleteClient(event) {
    //     const buttonElement = event.target;
    //     const clientid = buttonElement.dataset.clientid;
    //     const csrfToken = buttonElement.dataset.csrf;

    //     const response = await fetch('/agents/clients/' + clientid + '?_csrf=' + csrfToken, {
    //         method: "DELETE"
    //     });

    //     if (!response.ok) {
    //         alert('Something went wrong. In here is wrong!');
    //         return;
    //     }
    //     buttonElement.closest('tr').remove(); // Adjusted to remove the row in the table
    // }

    // // Highlighting rows with debt
    // const policyDebtElements = document.querySelectorAll('.debtParagraph');

    // if (policyDebtElements) {
    //     policyDebtElements.forEach(debtElement => {
    //         if (debtElement.dataset.debt > 0) {
    //             debtElement.classList.add("debt-par");
    //         }
    //     });
    // }

    // // Show unpaid rows only
    // const showUnpaidBtn = document.getElementById('showUnpaidBtn');
    // const allRows = document.querySelectorAll('tbody tr'); // Select all rows in the tbody
    // const lastRow = document.getElementById('lastRow');

    // if (showUnpaidBtn && allRows && lastRow) {
    //     const showUnpaid = function () {
    //         lastRow.style.display = "none";

    //         allRows.forEach(row => {
    //             if (row.classList.contains('unpaid')) {
    //                 row.style.display = 'table-row';
    //             } else {
    //                 row.style.display = 'none';
    //             }
    //         });
    //     };

    //     showUnpaidBtn.addEventListener('click', showUnpaid);
    // }

    // // Printing policies by date
    // const printPoliciesByDateBtn = document.getElementById("printPoliciesByDate");

    // if (printPoliciesByDateBtn) {
    //     printPoliciesByDateBtn.addEventListener("click", function () {
    //         // Hide elements you don't want to print
    //         document.getElementById("navUnpaid").style.display = "none";
    //         document.getElementById("showUnpaidBtn").style.display = "none";
    //         document.getElementById("printPoliciesByDate").style.display = "none";
    //         document.getElementById("totalUnpaid").style.display = "none";

    //         // Print the page
    //         window.print();

    //         // Show the hidden elements after printing
    //         document.getElementById("showUnpaidBtn").style.display = "block";
    //         document.getElementById("printPoliciesByDate").style.display = "block";
    //     });
    // }

    // // Search Clients Functionality
    // function searchClients() {
    //     const input = document.getElementById('searchBar');
    //     const filter = input.value.toLowerCase();
    //     const table = document.querySelector('.clients-table');
    //     const rows = table.getElementsByTagName('tr');

    //     for (let i = 1; i < rows.length; i++) { // Start from 1 to skip the header row
    //         let match = false;
    //         const cells = rows[i].getElementsByTagName('td');
    //         for (let j = 0; j < cells.length; j++) {
    //             const cell = cells[j];
    //             if (cell) {
    //                 const txtValue = cell.textContent || cell.innerText;
    //                 if (txtValue.toLowerCase().indexOf(filter) > -1) {
    //                     match = true;
    //                     break;
    //                 }
    //             }
    //         }
    //         rows[i].style.display = match ? '' : 'none';
    //     }
    // }

    // Deleting a client
const deleteClientButtonElements = document.querySelectorAll('.delete-btn');

if (deleteClientButtonElements) {
    for (const deleteClientButtonElement of deleteClientButtonElements) {
        deleteClientButtonElement.addEventListener('click', deleteClient);
    }
}

async function deleteClient(event) {
    const buttonElement = event.target;
    const clientid = buttonElement.dataset.clientid;
    const csrfToken = buttonElement.dataset.csrf;

    const response = await fetch('/agents/clients/' + clientid + '?_csrf=' + csrfToken, {
        method: "DELETE"
    });

    if (!response.ok) {
        alert('Something went wrong. In here is wrong!');
        return;
    }
    buttonElement.closest('tr').remove(); // Adjusted to remove the row in the table
}

// Highlighting rows with debt
const policyDebtElements = document.querySelectorAll('.debtParagraph');

if (policyDebtElements) {
    policyDebtElements.forEach(debtElement => {
        if (debtElement.dataset.debt > 0) {
            debtElement.classList.add("debt-par");
        }
    });
}

// Show unpaid rows only
const showUnpaidBtn = document.getElementById('showUnpaidBtn');
const allRows = document.querySelectorAll('tbody tr'); // Select all rows in the tbody

if (showUnpaidBtn && allRows) {
    const showUnpaid = function () {
        allRows.forEach(row => {
            if (row.classList.contains('unpaid')) {
                row.style.display = 'table-row';
            } else {
                row.style.display = 'none';
            }
        });
    };

    showUnpaidBtn.addEventListener('click', showUnpaid);
}

// Printing policies by date
const printPoliciesByDateBtn = document.getElementById("printPoliciesByDate");

if (printPoliciesByDateBtn) {
    printPoliciesByDateBtn.addEventListener("click", function () {
        // Hide elements you don't want to print
        document.getElementById("navUnpaid").style.display = "none";
        document.getElementById("showUnpaidBtn").style.display = "none";
        document.getElementById("printPoliciesByDate").style.display = "none";

        // Print the page
        window.print();

        // Show the hidden elements after printing
        document.getElementById("navUnpaid").style.display = "block";
        document.getElementById("showUnpaidBtn").style.display = "block";
        document.getElementById("printPoliciesByDate").style.display = "block";
    });
}

// Search Clients Functionality
function searchClients() {
    const input = document.getElementById('searchBar');
    const filter = input.value.toLowerCase();
    const table = document.querySelector('.clients-table');
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) { // Start from 1 to skip the header row
        let match = false;
        const cells = rows[i].getElementsByTagName('td');
        for (let j = 0; j < cells.length; j++) {
            const cell = cells[j];
            if (cell) {
                const txtValue = cell.textContent || cell.innerText;
                if (txtValue.toLowerCase().indexOf(filter) > -1) {
                    match = true;
                    break;
                }
            }
        }
        rows[i].style.display = match ? '' : 'none';
    }
}

  // Get today's date in the format YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  // Set the value of the date input field to today's date
  document.getElementById('insurancePolicyDate').value = today;
  document.getElementById('allPaymentsDate').value = today;

