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
    button.addEventListener("click", async function () {
        const id = parseInt(this.getAttribute("data-id"));
        const name = this.getAttribute("data-name");
        const price = parseFloat(this.getAttribute("data-price"));
        const image = this.parentElement.querySelector("img")?.getAttribute("src") || "";

        try {
            const response = await fetch("/customer/cart/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id, name, price, image })
            });

            const data = await response.json();
            if (data.success) {
                alert(`${name} added to your cart!`);
            } else {
                alert(`Failed to add to cart: ${data.message}`);
            }
        } catch (error) {
            console.error("Add to cart error:", error);
            alert("Error adding to cart");
        }
    });
  })});