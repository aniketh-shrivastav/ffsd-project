document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const signupContainer = document.getElementById('signupContainer');
    const toggleAuthButton = document.getElementById('toggleAuth');
    const userTypeSelect = document.getElementById('userType');

    const signupForms = {
        customer: document.getElementById('customerSignup'),
        seller: document.getElementById('sellerSignup'),
        'service-provider': document.getElementById('serviceProviderSignup'),
        manager: document.getElementById('managerSignup')
    };

    let isLoginView = true;

    // Toggle between login and signup views
    if (toggleAuthButton) {
        toggleAuthButton.addEventListener('click', () => {
            isLoginView = !isLoginView;
            loginForm.classList.toggle('hidden');
            signupContainer.classList.toggle('hidden');
            toggleAuthButton.textContent = isLoginView
                ? 'Need an account? Sign up'
                : 'Already have an account? Log in';
        });
    }

    // Show the appropriate signup form based on user type selection
    userTypeSelect.addEventListener('change', showSelectedForm);

    function showSelectedForm() {
        const selectedType = userTypeSelect.value;
        Object.values(signupForms).forEach(form => form.classList.add('hidden'));
        signupForms[selectedType]?.classList.remove('hidden');
    }

    showSelectedForm(); // Show initial form

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

            if (!email || !password) {
                alert('Please enter both email and password.');
                return;
            }

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    window.location.href = '/users';
                } else {
                    alert(data.message || 'Invalid credentials');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login.');
            }
        });
    }

    // Handle signup form submission
    document.querySelectorAll('.signup-form').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const userType = userTypeSelect.value;

            let userData = { role: userType };

            if (userType === 'customer') {
                userData = {
                    ...userData,
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    password: formData.get('password')
                };
            } else if (userType === 'seller') {
                userData = {
                    ...userData,
                    businessName: formData.get('businessName'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    password: formData.get('password')
                };
            } else if (userType === 'service-provider') {
                userData = {
                    ...userData,
                    workshopName: formData.get('workshopName'),
                    email: formData.get('email'),
                    password: formData.get('password')
                };
            } else if (userType === 'manager') {
                userData = {
                    ...userData,
                    name: formData.get('name'),
                    email: formData.get('email'),
                    password: formData.get('password')
                };
            }

            // Validation
            if (Object.values(userData).some(value => !value)) {
                alert('Please fill in all required fields.');
                return;
            }

            try {
                const response = await fetch('/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });

                const result = await response.json();
                alert(result.message);

                if (result.success) {
                    toggleAuthButton?.click(); // Switch to login view
                }
            } catch (error) {
                console.error('Signup error:', error);
                alert('An error occurred during registration.');
            }
        });
    });
});
