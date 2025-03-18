function enableEdit() {
    document.getElementById("name").disabled = false;
    document.getElementById("email").disabled = false;
    document.getElementById("phone").disabled = false;
    document.querySelector(".edit-btn").style.display = "none";
    document.querySelector(".save-btn").style.display = "inline-block";
    document.querySelector(".cancel-btn").style.display = "inline-block";
    document.querySelector(".edit-pass-btn").style.display = "inline-block";
    document.querySelector(".service-input-container").style.display = "block";
    document.querySelector(".add-service-btn").style.display = "inline-block";

    // Show delete buttons
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.style.display = "inline-block";
    });
}    

function saveChanges() {
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");
    const passwordInput = document.getElementById("password");

   
    const namePattern = /^[A-Za-z]+[A-Za-z\s]*$/; 
    if (!namePattern.test(nameInput.value.trim())) {
        alert("Name should contain at least one alphabet character. Numbers are not allowed.");
        return;
    }

 
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailInput.value)) {
        alert("Please enter a valid email address.");
        return;
    }

   
    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(phoneInput.value)) {
        alert("Phone number must be exactly 10 digits.");
        return;
    }

   
    nameInput.disabled = true;
    emailInput.disabled = true;
    phoneInput.disabled = true;
    document.getElementById("passwordField").style.display = "none";
    document.querySelector(".edit-btn").style.display = "inline-block";
    document.querySelector(".save-btn").style.display = "none";
    document.querySelector(".cancel-btn").style.display = "none";
    document.querySelector(".edit-pass-btn").style.display = "none";
    document.querySelector(".service-input-container").style.display = "none";
    document.querySelector(".add-service-btn").style.display = "none";

    // Hide delete buttons
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.style.display = "none";
    });

}


function togglePasswordField() {
    let passwordField = document.getElementById("passwordField");
    passwordField.style.display = passwordField.style.display === "none" ? "block" : "none";
}

function addService() {
    let serviceInput = document.getElementById("newService");
    if (serviceInput.value.trim() !== "") {
        let newLi = document.createElement("li");
        newLi.className = "service-item";
        newLi.innerHTML = `${serviceInput.value} <button class="delete-btn" onclick="removeService(this)">Delete</button>`;
        document.getElementById("serviceList").appendChild(newLi);
        serviceInput.value = "";
    }
}

function removeService(button) {
    button.parentElement.remove();
}

