// Chart.js for Earnings Graph
const ctx = document.getElementById('earningsChart').getContext('2d');
let earningsChart;

// Function to get month names
function getMonthName(monthIndex) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex];
}

// Predefined earnings data for the last 12 months (consistent across filters)
const monthlyEarnings = [1200, 1500, 1800, 2000, 2200, 2500, 3000, 2800, 3200, 3500, 4000, 4200]; // Example data

// Function to generate earnings data based on the selected time range
function generateEarningsData(timeRange) {
    const currentDate = new Date();
    const labels = [];
    const data = [];
    let totalEarnings = 0;

    if (timeRange === 1) {
        // For last month, split into weeks with fluctuating earnings
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(); // Total days in the current month
        const monthName = getMonthName(currentDate.getMonth());

        // Group days into weeks
        let baseEarnings = monthlyEarnings[currentDate.getMonth()] / 4; // Base earnings for the month divided into 4 weeks
        for (let weekStart = 1; weekStart <= daysInMonth; weekStart += 7) {
            const weekEnd = Math.min(weekStart + 6, daysInMonth); // Ensure we don't go beyond the month
            labels.push(`${monthName} ${weekStart}-${weekEnd}`); // Add week label (e.g., "Oct 1-7", "Oct 8-14", etc.)

            // Simulate fluctuating earnings for the week
            if (weekStart <= 7) {
                baseEarnings += Math.floor(Math.random() * 200); // Increase in the first week
            } else if (weekStart <= 14) {
                baseEarnings -= Math.floor(Math.random() * 100); // Decrease in the second week
            } else if (weekStart <= 21) {
                baseEarnings += Math.floor(Math.random() * 150); // Increase in the third week
            } else {
                baseEarnings += Math.floor(Math.random() * 100); // Increase in the remaining weeks
            }
            totalEarnings += baseEarnings;
            data.push(baseEarnings); // Add earnings for the week
        }
    } else {
        // For last 6 months or last 1 year, use monthly data
        for (let i = 0; i < timeRange; i++) {
            const date = new Date(currentDate);
            date.setMonth(currentDate.getMonth() - i); // Go back 'i' months from the current date
            const monthName = getMonthName(date.getMonth());
            labels.unshift(monthName); // Add month name to the beginning of the array

            // Use predefined earnings data
            const monthlyEarning = monthlyEarnings[date.getMonth()];
            totalEarnings += monthlyEarning;
            data.unshift(monthlyEarning); // Add earnings to the beginning of the array
        }
    }

    // Update total earnings display
    document.getElementById('totalEarnings').textContent = `Total Earnings: ₹${totalEarnings.toLocaleString()}`;

    return { labels, data };
}

// Function to update the chart based on the selected time range
function updateChart() {
    const timeRange = parseInt(document.getElementById('timeRange').value);
    const { labels, data } = generateEarningsData(timeRange);

    // Update the chart
    earningsChart.data.labels = labels;
    earningsChart.data.datasets[0].data = data;
    earningsChart.update();
}

// Initialize the chart
function initializeChart() {
    const { labels, data } = generateEarningsData(1); // Show last month by default

    earningsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Earnings (₹)',
                data: data,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                fill: true,
                tension: 0.4, // Smooth curve
                pointRadius: 5, // Make data points visible
                pointBackgroundColor: '#007bff', // Color of data points
                borderWidth: 2 // Thicker line
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#e0e0e0'
                    },
                    title: {
                        display: true,
                        text: 'Earnings (₹)'
                    }
                },
                x: {
                    grid: {
                        color: '#e0e0e0'
                    },
                    title: {
                        display: true,
                        text: timeRange === 1 ? 'Weeks' : 'Months' // Dynamic X-axis title
                    }
                }
            }
        }
    });
}

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// View Details Functionality
function viewDetails(date, amount, status, orderId, customerId, serviceProvided) {
    alert(
        `Payout Details:
        \nDate: ${date}
        \nAmount: ${amount}
        \nStatus: ${status}
        \nOrder ID: ${orderId}
        \nCustomer ID: ${customerId}
        \nService Provided: ${serviceProvided}`
    );
}



// Add click event to payout history rows
document.querySelectorAll('.payout-history tbody tr').forEach((row, index) => {
    row.addEventListener('click', () => {
        // Remove any previously selected row's highlight
        document.querySelectorAll('.payout-history tbody tr').forEach((r) => {
            r.classList.remove('selected-row');
        });

        // Highlight the clicked row
        row.classList.add('selected-row');

        // // Highlight the corresponding data point in the graph
        // highlightDataPoint(index);
    });
});

// Initialize the chart when the page loads
window.onload = function () {
    initializeChart();
};



// Function to calculate today's earnings
function calculateTodaysEarnings() {
    // Simulate today's earnings (replace this with actual data or API call)
    const todaysEarnings = Math.floor(Math.random() * 2000) + 500; // Random value between 500 and 2500
    return todaysEarnings;
}

// Function to update today's earnings in the UI
function updateTodaysEarnings() {
    const todaysEarnings = calculateTodaysEarnings();
    document.getElementById('todaysEarnings').textContent = `₹${todaysEarnings.toLocaleString()}`;
}

// Call the function to update today's earnings when the page loads
window.onload = function () {
    initializeChart();
    updateTodaysEarnings(); // Update today's earnings
};


function viewDetails(date, amount, status, orderId, customerId, serviceProvided) {
    alert(
        `Payout Details:
        \nDate: ${date}
        \nAmount: ${amount}
        \nStatus: ${status}
        \nOrder ID: ${orderId}
        \nCustomer ID: ${customerId}
        \nService Provided: ${serviceProvided}`
    );
}

