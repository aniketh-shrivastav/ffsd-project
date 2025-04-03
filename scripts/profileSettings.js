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

async function saveChanges() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    
    // Collect service items from the UI
    const serviceList = document.querySelectorAll(".service-item");
    const servicesOffered = Array.from(serviceList).map(li => li.innerText.replace("Delete", "").trim());

    const data = {
        name,
        phone,
        servicesOffered
    };

    console.log("Sending data:", data); // Debugging

    try {
        const response = await fetch("/profile/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.success) {
            alert("Profile updated successfully!");
            location.reload();
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Profile update failed:", error);
        alert("Failed to update profile.");
    }
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

