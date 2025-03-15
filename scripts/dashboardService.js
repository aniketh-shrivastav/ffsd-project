// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("active");
}

// Toggle Navbar Links on Mobile
function toggleNavLinks() {
    const navLinks = document.getElementById("navLinks");
    navLinks.classList.toggle("active");
}

// Initialize Charts
document.addEventListener("DOMContentLoaded", function () {
    // Pie Chart 
    const pieCtx = document.getElementById('servicePieChart').getContext('2d');
    const servicePieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: ['Car Wash', 'Oil Change', 'Brake Repair', 'Tire Rotation', 'AC Repair'],
            datasets: [{
                label: 'Service Distribution',
                data: [30, 25, 20, 15, 10], // Example data
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

    // Bar Chart for Current Month (Weekly Basis)
    const barCtx = document.getElementById('earningsBarChart').getContext('2d');
    const earningsBarChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], 
            datasets: [{
                label: 'Earnings',
                data: [1500, 2200, 1800, 2500], 
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
                        text: 'Earnings ($)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Weeks of the Month'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Earnings Overview (Weekly Basis)'
                }
            }
        }
    });
});