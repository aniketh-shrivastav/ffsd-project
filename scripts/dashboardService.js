function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("active");
}

function toggleNavLinks() {
    const navLinks = document.getElementById("navLinks");
    navLinks.classList.toggle("active");
}

document.addEventListener("DOMContentLoaded", function() {
    // Service Distribution Pie Chart
    const pieCtx = document.getElementById('servicePieChart').getContext('2d');
    const servicePieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: <%- JSON.stringify(serviceDistribution.map(s => s._id)) %>,
            datasets: [{
                label: 'Service Distribution',
                data: <%- JSON.stringify(serviceDistribution.map(s => s.count)) %>,
                backgroundColor: [
                    '#1abc9c',
                    '#3498db',
                    '#9b59b6',
                    '#f1c40f',
                    '#e74c3c'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });

    // Earnings Bar Chart
    const barCtx = document.getElementById('earningsBarChart').getContext('2d');
    const earningsBarChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: <%- JSON.stringify(earningsData.map(e => `Week ${e._id}`)) %>,
            datasets: [{
                label: 'Earnings (₹)',
                data: <%- JSON.stringify(earningsData.map(e => e.total)) %>,
                backgroundColor: '#1abc9c',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Earnings (₹)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Week'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Weekly Earnings Overview'
                }
            }
        }
    });
});