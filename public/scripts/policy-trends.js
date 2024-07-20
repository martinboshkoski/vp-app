// public/scripts/policy-trends.js

document.addEventListener('DOMContentLoaded', function() {
    const policyTypes = [
        "Осигурување од одговорност од употреба на моторни возила (AO)",
        "Осигурување од одговорност од употреба на моторни возила (ЗК)",
        "Осигурувањето на имот од пожар и природни непогоди",
        "Други осигурувања на имот",
        "Несреќен случај - незгода",
        "Здравствено осигурување",
        "Осигурување на стока во превоз (CMR)",
        "АО за странски возила (гранично осигурувања)",
        "Осигурувањето на моторни возила (каско)",
        "Општото осигурување од одговорностт",
        "Осигурувањето на шински возила (каско)",
        "Осигурувањето на воздухоплови (каско)",
        "Осигурувањето на пловни објекти (каско)",
        "Осигурувањето од одговорност од употреба на воздухоплови",
        "Осигурувањето од одговорност од употреба на пловни објекти",
        "Осигурувањето на кредити",
        "Осигурувањето на гаранции",
        "Осигурувањето од финансиски загуби",
        "Осигурувањето на правна заштита",
        "Осигурувањето на туристичка помош",
        "Осигурувањето на живот",
        "Осигурувањето на брак или породување",
        "Осигурувањето на живот во врска со удели во инвестициони фондови",
        "Осигурувањето на тонтина (здружение на рентиери)",
        "Осигурувањето на средства за исплата"
    ];

    const policyTypeSelect = document.getElementById('policyType');
    policyTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.text = type;
        policyTypeSelect.add(option);
    });

    document.getElementById('policyType').addEventListener('change', function() {
        const policyType = this.value;
        if (policyType) {
            console.log(policyType); // Debug: log the selected policy type
            fetch(`/admin/api/policy-trends?policyType=${policyType}`)
                .then(response => response.json())
                .then(data => {
                    console.log(data); // Debug: log the received data
                    updateCharts(data);
                });
        }
    });
    

    function updateCharts(data) {
        const ctx1 = document.getElementById('policyCountChart').getContext('2d');
        const ctx2 = document.getElementById('policyAmountChart').getContext('2d');

        new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: data.months,
                datasets: [{
                    label: 'Број на полиси',
                    data: data.policyCounts,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        new Chart(ctx2, {
            type: 'line',
            data: {
                labels: data.months,
                datasets: [{
                    label: 'Полисирана премија',
                    data: data.policyAmounts,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }, {
                    label: 'Платена премија',
                    data: data.totalPaid,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
});
