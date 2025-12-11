console.log("cadastro.js carregado ✅");

// Formulário
const form = document.getElementById("cadastroForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nomeCadastro").value.trim();
  const email = document.getElementById("emailCadastro").value.trim();
  const senha = document.getElementById("senhaCadastro").value;
  const confirmaSenha = document.getElementById("confirmaSenha").value;

  // Verificação da senha
  if (senha !== confirmaSenha) {
    showToast("As senhas não conferem!");
    return;
  }

  // 1️⃣ Criar usuário no Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: senha
  });

  if (error) {
    showToast("Erro ao cadastrar usuário: " + error.message, "error");
    return;
  }

  const userId = data.user?.id;

  if (!userId) {
    showToast("Erro inesperado: usuário não retornou do Supabase.", "error");
    return;
  }

  // 2️⃣ SALVAR NOME NA TABELA "users"
  const { error: insertError } = await supabase
    .from("users") // <-- CORRIGIDO
    .insert([
      {
        uid: userId,           // <-- CORRIGIDO
        display_name: nome     // <-- CORRIGIDO
      }
    ]);

  if (insertError) {
    console.error("Erro ao inserir na tabela users:", insertError);
    showToast("Usuário criado mas falhou ao salvar o nome no banco!", "error");
    return;
  }

  // Sucesso!
  showToast("Cadastro realizado com sucesso!", "success");

  // Redirecionar
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1200);
});
