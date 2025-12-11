// toast.js
function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");

  // cria o container se não existir
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // remove depois da animação
  setTimeout(() => {
    toast.remove();
  }, 4000);
}