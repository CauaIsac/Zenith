console.log("update-password.js carregado ✅");

// ===============================
// 1 — OBTER TOKEN DO HASH DA URL
// ===============================
function getAccessToken() {
    const hash = window.location.hash; // exemplo: #access_token=XXX&type=recovery

    if (!hash) return null;

    const params = new URLSearchParams(hash.substring(1)); 
    return params.get("access_token");
}

const accessToken = getAccessToken();

if (!accessToken) {
    document.getElementById("errorMessage").innerText =
        "Token inválido ou expirado. Peça uma nova recuperação de senha.";
    throw new Error("Token de recuperação ausente.");
}

// ===============================
// 2 — EVENTO DO FORMULÁRIO
// ===============================
const form = document.getElementById("updatePasswordForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const novaSenha = document.getElementById("novaSenha").value.trim();
    const confirmarSenha = document.getElementById("confirmarSenha").value.trim();
    const msg = document.getElementById("errorMessage");

    // ===============================
    // 3 — VALIDAÇÃO DAS SENHAS
    // ===============================
    if (novaSenha.length < 6) {
        msg.innerText = "A senha deve ter pelo menos 6 caracteres.";
        return;
    }

    if (novaSenha !== confirmarSenha) {
        msg.innerText = "As senhas não coincidem.";
        return;
    }

    msg.innerText = ""; // limpar erros

    try {
        // ===============================
        // 4 — ATUALIZAR SENHA NO SUPABASE
        // ===============================
        const { data, error } = await supabase.auth.updateUser(
            { password: novaSenha }
        );

        if (error) {
            console.error(error);
            msg.innerText = "Erro ao atualizar senha: " + error.message;
            return;
        }

        // ===============================
        // 5 — SUCESSO: REDIRECIONAR PARA LOGIN
        // ===============================
        msg.style.color = "limegreen";
        msg.innerText = "Senha alterada com sucesso! Redirecionando...";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);

    } catch (err) {
        console.error(err);
        msg.innerText = "Erro inesperado ao tentar redefinir a senha.";
    }
});
