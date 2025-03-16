document.addEventListener("DOMContentLoaded", function () {
  loadCart();
});

function loadCart() {
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let cartContainer = document.getElementById("cart-container");
let totalPrice = 0;

cartContainer.innerHTML = "";
if (cart.length === 0) {
cartContainer.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
document.getElementById("total-section").style.display = "none";
return;
}

document.getElementById("total-section").style.display = "block";

cart.forEach((item, index) => {
let cartItem = document.createElement("div");
cartItem.classList.add("cart-item");
cartItem.innerHTML = `
  <img src="${item.image}" alt="${item.name}">
 <p>${item.name} - ₹${item.price}</p>

  <div>
      <button class="quantity-btn" data-index="${index}" data-action="decrease">−</button>
      <span class="quantity" id="qty-${index}">${item.quantity}</span>
      <button class="quantity-btn" data-index="${index}" data-action="increase">+</button>
  </div>
  <button class="remove" data-index="${index}">Remove</button>
`;
cartContainer.appendChild(cartItem);
totalPrice += item.price * item.quantity;
});

document.getElementById("total-price").textContent = totalPrice.toFixed(2);

// Quantity button handlers
document.querySelectorAll(".quantity-btn").forEach(button => {
button.addEventListener("click", function () {
  let index = parseInt(this.getAttribute("data-index"));
  let action = this.getAttribute("data-action");

  if (action === "increase") {
      cart[index].quantity += 1;
  } else if (action === "decrease" && cart[index].quantity > 1) {
      cart[index].quantity -= 1;
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
});
});

// Remove button handlers
document.querySelectorAll(".remove").forEach(button => {
button.addEventListener("click", function () {
  let index = this.getAttribute("data-index");
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
});
});
}

document.getElementById("checkout-btn").addEventListener("click", function () {
  document.getElementById("payment-selection").style.display = "block";
  loadPaymentMethods();
});

function loadPaymentMethods() {
  let savedPayments = JSON.parse(localStorage.getItem("paymentMethods")) || [];
  let paymentDiv = document.getElementById("saved-payments");
  paymentDiv.innerHTML = "";
  
  savedPayments.forEach((payment, index) => {
      paymentDiv.innerHTML += `<label><input type='radio' name='payment-method' value='${index}'> ${payment}</label>`;
  });
}

document.getElementById("confirm-payment").addEventListener("click", function () {
  let selectedMethod = document.querySelector("input[name='payment-method']:checked");
  if (!selectedMethod) {
      alert("Please select a payment method.");
      return;
  }
  
  let paymentText = selectedMethod.value === "cod" ? "Cash on Delivery" : 
      JSON.parse(localStorage.getItem("paymentMethods"))[selectedMethod.value];

  localStorage.setItem("selectedPaymentMethod", paymentText);
  document.getElementById("checkout-section").style.display = "block";
});

document.getElementById("book-service").addEventListener("click", function () {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart.length === 0) {
      alert("Your cart is empty. Add items before booking a service.");
      return;
  }

  let selectedPaymentMethod = localStorage.getItem("selectedPaymentMethod") || "Not Selected";
  localStorage.setItem("cartBackup", JSON.stringify(cart));
  localStorage.setItem("paymentBackup", selectedPaymentMethod);
  window.location.href = "service.html";
});
document.getElementById("place-order").addEventListener("click", function () {
let cart = JSON.parse(localStorage.getItem("cart")) || [];
if (cart.length === 0) {
alert("Your cart is empty. Add items before placing an order.");
return;
}

let selectedPaymentMethod = localStorage.getItem("selectedPaymentMethod") || "Not Selected";

let deliveryDate = new Date();
deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 3) + 5); // Arrives in 5-7 days

let upcomingOrders = JSON.parse(localStorage.getItem("upcomingOrders")) || [];
upcomingOrders.push({ cart, paymentMethod: selectedPaymentMethod, arrival: deliveryDate.toDateString() });

localStorage.setItem("upcomingOrders", JSON.stringify(upcomingOrders));

alert("Order placed successfully! Estimated arrival: " + deliveryDate.toDateString());

localStorage.removeItem("cart"); // Clear cart after placing order
window.location.href = "history";
});