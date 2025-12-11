console.log("authCheck.js carregado ✅");

// Agora o Supabase é importado do arquivo global supabaseClient.js
// ❌ Removido: const supabaseUrl, const supabaseKey e const supabase = createClient(...)

document.addEventListener("DOMContentLoaded", () => {
  const userIcon = document.getElementById("user-icon");

  if (!userIcon) {
    console.warn("⚠️ Elemento #user-icon não encontrado no DOM.");
    return;
  }

  userIcon.addEventListener("click", async (e) => {
    e.preventDefault();

    // Espera a sessão carregar do Supabase
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Erro ao obter usuário:", error.message);
      window.location.href = "index.html";
      return;
    }

    if (data.user) {
      console.log("Usuário logado:", data.user.email);
      window.location.href = "perfil.html";
    } else {
      console.log("Nenhum usuário logado");
      window.location.href = "index.html";
    }
  });
});