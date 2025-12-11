const menuToggle = document.getElementById("menuToggle");
const closeMenu = document.getElementById("closeMenu");
const nav = document.querySelector("header nav");

menuToggle.addEventListener("click", () => {
  nav.classList.add("active");
  document.body.classList.add("menu-open"); // esconde hambúrguer
});

closeMenu.addEventListener("click", () => {
  nav.classList.remove("active");
  document.body.classList.remove("menu-open"); // mostra de novo
});
