console.log("login.js carregado ✅");

// ❌ Removido: supabaseUrl, supabaseAnonKey e supabaseClient
// ✅ Agora usamos o cliente global supabase do supabaseClient.js

// Dados do admin pré-cadastrado
const ADMIN_EMAIL = "admin@zenith.com";
const ADMIN_PASSWORD = "admin123"; // Use uma senha segura!

// Formulário
const form = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";

  const email = document.getElementById("emailLogin").value.trim();
  const password = document.getElementById("senhaLogin").value;

  try {
    // Verifica se é admin
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      window.location.href = "admin-dashboard.html";
      return;
    }

   // Login normal com Supabase
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
});

if (error) {
  showToast ("Email ou senha inválidos.");
  return;
}

// SALVAR USER_ID CORRETAMENTE
localStorage.setItem("zenith_user_id", data.user.id);

// Usuário normal logado
window.location.href = "homepage.html";

  } catch (err) {
    console.error(err);
    showToast ("Erro ao efetuar login.");
  }
});

