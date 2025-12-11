const filterBtns = document.querySelectorAll(".filter-btn");
const cards = document.querySelectorAll(".car-card");

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    // Remove active dos outros botões
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.getAttribute("data-filter");

    cards.forEach(card => {
      if (filter === "all") {
        card.style.display = "block";
      } else {
        card.style.display = card.classList.contains(filter) ? "block" : "none";
      }
    });
  });
});