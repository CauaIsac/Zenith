console.log("logout.js carregado ✅");

// ❌ Removido: const supabaseClient = supabase.createClient(...)
// ✅ Agora usamos o cliente global `supabase` do supabaseClient.js

const logoutButton = document.getElementById("logoutButton");

logoutButton.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    showToast("Erro ao deslogar: " + error.message, "error");
  } else {
    showToast("Saiu da conta com sucesso!", "info"); // alerta para confirmar
    window.location.href = "index.html";   // redireciona para login
  }
});
