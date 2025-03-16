function toggleMenu() {
  document.getElementById("mobileMenu").classList.toggle("show");
}

const serviceProviders = {
  "District A": ["Provider A1", "Provider A2"],
  "District B": ["Provider B1", "Provider B2"],
  "District C": ["Provider C1", "Provider C2"]
};

document.getElementById("district").addEventListener("change", function() {
  let district = this.value;
  let providerSelect = document.getElementById("service-provider");
  providerSelect.innerHTML = '<option value="">Select Service Provider</option>';
  if (district && serviceProviders[district]) {
      serviceProviders[district].forEach(provider => {
          let option = document.createElement("option");
          option.value = provider;
          option.textContent = provider;
          providerSelect.appendChild(option);
      });
      providerSelect.disabled = false;
  } else {
      providerSelect.disabled = true;
  }
});

document.getElementById("booking-form").addEventListener("submit", function(event) {
event.preventDefault();

let selectedServices = Array.from(document.getElementById("service").selectedOptions).map(option => option.value);
let date = document.getElementById("date").value;
let district = document.getElementById("district").value;
let provider = document.getElementById("service-provider").value;
let phone = document.getElementById("phone").value;

// Phone number validation
const phoneRegex = /^\d{10}$/;
if (!phoneRegex.test(phone)) {
alert("Please enter a valid 10-digit phone number.");
return;
}

if (!district || !provider) {
alert("Please select a district and a service provider.");
return;
}

let upcomingServices = JSON.parse(localStorage.getItem("upcomingServices")) || [];

selectedServices.forEach(service => {
upcomingServices.push({
  service: service,
  date: date,
  district: district,
  provider: provider,
  phone: phone // storing phone number
});
});

localStorage.setItem("upcomingServices", JSON.stringify(upcomingServices));

alert("Services booked successfully!");
window.location.href = "history";
});