function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("active");
}

function toggleNavLinks() {
    const navLinks = document.getElementById("navLinks");
    navLinks.classList.toggle("active");
}
document.addEventListener('DOMContentLoaded', function() {
    const ratingModal = document.getElementById('ratingModal');
    
    // Open modal with booking data
    window.openRatingModal = function(bookingId) {
        fetch(`/bookings/${bookingId}`)
            .then(res => res.json())
            .then(booking => {
                document.getElementById('bookingId').value = booking._id;
                ratingModal.style.display = 'block';
            });
    };

    // Submit rating
    document.getElementById('ratingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const bookingId = document.getElementById('bookingId').value;
        const rating = document.getElementById('rating').value;
        const review = document.getElementById('review').value;

        fetch(`/service/submit-rating/${bookingId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, review })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Rating submitted successfully!');
                location.reload(); // Refresh to update dashboard
            } else {
                throw new Error(data.error || 'Failed to submit rating');
            }
        })
        .catch(err => {
            console.error('Error:', err);
            alert(err.message);
        });
    });

    // Close modal
    window.closeRatingModal = function() {
        ratingModal.style.display = 'none';
    };
    // Service Distribution Pie Chart
    const pieCtx = document.getElementById('servicePieChart').getContext('2d');
    const pieChart = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: <%= JSON.stringify(serviceDistribution.map(s => s._id)) %>,
        datasets: [{
          data: <%= JSON.stringify(serviceDistribution.map(s => s.count)) %>,
          backgroundColor: [
            '#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6',
            '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#d35400'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const service = <%= JSON.stringify(serviceDistribution) %>[context.dataIndex];
                return [
                  `${service._id}: ${service.count} bookings`,
                  `Earnings: ₹${service.totalEarnings.toFixed(2)}`
                ];
              }
            }
          }
        }
      }
    });
  
    // Earnings Bar Chart
    const barCtx = document.getElementById('earningsBarChart').getContext('2d');
    const earningsChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: <%= JSON.stringify(earningsData.map(e => e._id)) %>,
        datasets: [{
          label: 'Daily Earnings (₹)',
          data: <%= JSON.stringify(earningsData.map(e => e.total)) %>,
          backgroundColor: '#2ecc71',
          borderColor: '#27ae60',
          borderWidth: 1
        }, {
          label: 'Number of Services',
          data: <%= JSON.stringify(earningsData.map(e => e.count)) %>,
          backgroundColor: '#3498db',
          borderColor: '#2980b9',
          borderWidth: 1,
          type: 'line',
          yAxisID: 'y1'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Earnings (₹)'
            }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Services'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                if (context.datasetIndex === 0) {
                  const dayData = <%= JSON.stringify(earningsData) %>[context.dataIndex];
                  return `Services Completed: ${dayData.count}`;
                }
              }
            }
          }
        }
      }
    });
  });