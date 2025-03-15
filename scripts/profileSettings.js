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
    document.getElementById("name").disabled = true;
    document.getElementById("email").disabled = true;
    document.getElementById("phone").disabled = true;
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

function cancelEdit() {
    location.reload();
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