

document.addEventListener('DOMContentLoaded', function () {
    const orderTableBody = document.querySelector('.order-table tbody');
    const filterDropdown = document.querySelector('.dropdown');
    const filterBtn = document.querySelector('.filter-btn');
    const tabs = document.querySelectorAll('.tab');
    const actionButtons = document.querySelector('.action-buttons');
    const searchInput = document.getElementById('searchInput'); // Search input field
    const confirmBtn = document.querySelector('.confirm-btn'); // Confirm button
    const rejectBtn = document.querySelector('.reject-btn'); // Reject button

    // Sample order data
    let orders = [
        { id: 'ord1', service: 'Car wash', customerName: 'Gani', customerId: 'cust1', amount: '30.00', orderSent: '12/2/21', orderExpected: '14/2/21', status: 'Pending' },
        { id: 'ord2', service: 'Oil change', customerName: 'Sudhan', customerId: 'cust2', amount: '50.00', orderSent: '13/2/21', orderExpected: '15/2/21', status: 'Confirmed' },
        { id: 'ord3', service: 'Tire rotation', customerName: 'Ashish', customerId: 'cust3', amount: '20.00', orderSent: '14/2/21', orderExpected: '16/2/21', status: 'Ready' },
        { id: 'ord4', service: 'Brake repair', customerName: 'Saranya', customerId: 'cust4', amount: '100.00', orderSent: '15/2/21', orderExpected: '17/2/21', status: 'Rejected' },
        { id: 'ord5', service: 'Engine Tune-up', customerName: 'Anand', customerId: 'cust5', amount: '150.00', orderSent: '18/2/21', orderExpected: '20/2/21', status: 'Pending' },
        { id: 'ord6', service: 'Windshield Replacement', customerName: 'Karthik', customerId: 'cust6', amount: '200.00', orderSent: '19/2/21', orderExpected: '21/2/21', status: 'Confirmed' },
        { id: 'ord7', service: 'Battery Replacement', customerName: 'Venkat', customerId: 'cust7', amount: '80.00', orderSent: '20/2/21', orderExpected: '22/2/21', status: 'Ready' },
        { id: 'ord8', service: 'Transmission Repair', customerName: 'Adhish', customerId: 'cust8', amount: '300.00', orderSent: '21/2/21', orderExpected: '23/2/21', status: 'Rejected' },
        { id: 'ord9', service: 'Wheel Alignment', customerName: 'Venkat', customerId: 'cust9', amount: '60.00', orderSent: '22/2/21', orderExpected: '24/2/21', status: 'Pending' },
        { id: 'ord10', service: 'AC Repair', customerName: 'Abhishek', customerId: 'cust10', amount: '120.00', orderSent: '23/2/21', orderExpected: '25/2/21', status: 'Confirmed' },
    ];

    // Render orders in the table
    function renderOrders(filteredOrders) {
        orderTableBody.innerHTML = ''; // Clear existing rows
        filteredOrders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="order-checkbox" data-order-id="${order.id}"></td>
                <td>${order.id}</td>
                <td><a href="#">${order.service}</a></td>
                <td>${order.customerName}</td>
                <td>${order.customerId}</td>
                <td>${order.amount}</td>
                <td>${order.orderSent}</td>
                <td>${order.orderExpected}</td>
                <td>${order.status}</td>
            `;
            orderTableBody.appendChild(row);
        });
    }

    // Filter orders by search term (Customer ID or Name)
    function filterOrdersBySearch(orders, searchTerm) {
        if (!searchTerm) return orders; // Return all orders if no search term
        searchTerm = searchTerm.toLowerCase();
        return orders.filter(order =>
            order.customerId.toLowerCase().includes(searchTerm) || // Match Customer ID
            order.customerName.toLowerCase().includes(searchTerm)  // Match Customer Name
        );
    }

    // Filter orders by status
    function filterOrdersByStatus(orders, status) {
        if (status === 'Open') {
            return orders.filter(order => order.status === 'Pending');
        } else if (status === 'Confirmed') {
            return orders.filter(order => order.status === 'Confirmed');
        } else if (status === 'Ready') {
            return orders.filter(order => order.status === 'Ready');
        } else if (status === 'Rejected') {
            return orders.filter(order => order.status === 'Rejected');
        }
        return orders; // Default to all orders
    }

    // Sort orders by date
    function sortOrders(orders, sortOrder) {
        return orders.sort((a, b) => {
            const dateA = new Date(
                a.orderSent.split('/')[2],
                a.orderSent.split('/')[1] - 1,
                a.orderSent.split('/')[0]
            );
            const dateB = new Date(
                b.orderSent.split('/')[2],
                b.orderSent.split('/')[1] - 1,
                b.orderSent.split('/')[0]
            );
            return sortOrder === 'Newest Order Sent' ? dateB - dateA : dateA - dateB;
        });
    }

    // Show/hide action buttons based on the active tab
    function toggleActionButtons(activeTab) {
        if (activeTab === 'Open') {
            actionButtons.style.display = 'flex'; // Show buttons
        } else {
            actionButtons.style.display = 'none'; // Hide buttons
        }
    }

    // Initialize the table with filtered and sorted data
    function initializeTable() {
        const activeTab = document.querySelector('.tab.active').textContent.trim();
        const sortOrder = filterDropdown.value;
        const searchTerm = searchInput.value.trim(); // Get search term

        let filteredOrders = filterOrdersByStatus(orders, activeTab);
        filteredOrders = filterOrdersBySearch(filteredOrders, searchTerm); // Apply search filter
        filteredOrders = sortOrders(filteredOrders, sortOrder);

        renderOrders(filteredOrders);
        toggleActionButtons(activeTab);
    }

    // Initial render of all orders
    initializeTable();

    // Tab switching functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            initializeTable();
        });
    });

    // Filter button functionality
    filterBtn.addEventListener('click', function () {
        initializeTable();
    });

    // Search input functionality
    searchInput.addEventListener('input', function () {
        initializeTable(); // Re-render table on every keystroke
    });

    // Confirm button functionality
    confirmBtn.addEventListener('click', function () {
        const checkedOrders = document.querySelectorAll('.order-checkbox:checked');
        checkedOrders.forEach(checkbox => {
            const orderId = checkbox.getAttribute('data-order-id');
            const order = orders.find(order => order.id === orderId);
            if (order) {
                order.status = 'Confirmed'; // Update status to Confirmed
            }
        });
        initializeTable(); // Re-render the table
    });

    // Reject button functionality
    rejectBtn.addEventListener('click', function () {
        const checkedOrders = document.querySelectorAll('.order-checkbox:checked');
        checkedOrders.forEach(checkbox => {
            const orderId = checkbox.getAttribute('data-order-id');
            const order = orders.find(order => order.id === orderId);
            if (order) {
                order.status = 'Rejected'; // Update status to Rejected
            }
        });
        initializeTable(); // Re-render the table
    });
});