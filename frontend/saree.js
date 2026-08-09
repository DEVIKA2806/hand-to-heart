// === Shop Page JS ===

// Toggle sidebar filters (for mobile)
document.addEventListener("DOMContentLoaded", () => {
    const filterBtn = document.createElement("button");
    filterBtn.classList.add("filter-toggle");
    filterBtn.innerText = "Toggle Filters";

    const container = document.querySelector(".container-fluid .row");
    const sidebar = container.querySelector("aside");

    // Insert filter button before sidebar
    sidebar.parentNode.insertBefore(filterBtn, sidebar);

    filterBtn.addEventListener("click", () => {
        sidebar.classList.toggle("active");
    });
});

// Simple search filter
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.querySelector(".shop-search input");
    const productCards = document.querySelectorAll(".card");

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        productCards.forEach(card => {
            const title = card.querySelector(".card-title").innerText.toLowerCase();
            if (title.includes(query)) {
                card.parentElement.style.display = "block";
            } else {
                card.parentElement.style.display = "none";
            }
        });
    });
});
