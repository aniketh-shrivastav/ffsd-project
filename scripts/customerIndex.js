document.addEventListener("DOMContentLoaded", function () {
  // Search Filter
  const searchInput = document.getElementById("search-input");
  const parts = document.querySelectorAll(".part");

  function filterParts() {
      const searchValue = searchInput.value.toLowerCase();
      parts.forEach(part => {
          const partName = part.getAttribute("data-name").toLowerCase();
          const partCategory = part.getAttribute("data-category").toLowerCase();
          part.style.display = (partName.includes(searchValue) || partCategory.includes(searchValue)) ? "block" : "none";
      });
  }

  searchInput.addEventListener("input", filterParts);

  // Add to Cart
  const addToCartButtons = document.querySelectorAll(".add-to-cart");

  addToCartButtons.forEach(button => {
      button.addEventListener("click", function () {
          const id = parseInt(this.getAttribute("data-id"));
          const name = this.getAttribute("data-name");
          const price = parseFloat(this.getAttribute("data-price"));
          const image = this.parentElement.querySelector("img")?.getAttribute("src") || "";

          let cart = JSON.parse(localStorage.getItem("cart")) || [];

          const existingItem = cart.find(item => item.id === id);
          if (existingItem) {
              existingItem.quantity += 1;
          } else {
              cart.push({ id, name, price, image, quantity: 1 });
          }

          localStorage.setItem("cart", JSON.stringify(cart));
          alert(`${name} added to cart!`);
      });
  });
});