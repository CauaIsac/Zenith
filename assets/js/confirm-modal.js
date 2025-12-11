// --- CONFIRM ESTILIZADO teste ---
function showConfirm(message) {
  return new Promise(resolve => {
    // container
    const confirmBox = document.createElement("div");
    confirmBox.className = "custom-confirm";

    // conteúdo
    confirmBox.innerHTML = `
      <div class="confirm-content">
        <p>${message}</p>
        <div class="confirm-actions">
          <button class="btn-confirm">Sim</button>
          <button class="btn-cancel">Não</button>
        </div>
      </div>
    `;

    document.body.appendChild(confirmBox);

    // listeners
    confirmBox.querySelector(".btn-confirm").addEventListener("click", () => {
      confirmBox.remove();
      resolve(true);
    });
    confirmBox.querySelector(".btn-cancel").addEventListener("click", () => {
      confirmBox.remove();
      resolve(false);
    });
  });
}