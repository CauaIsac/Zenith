console.log("perfil.js carregado");

// =======================
// Checar se o usuário está logado
// =======================
async function verificarUsuario() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    window.location.href = "index.html";
    return;
  }

  const user = data.user;

  const { data: perfil, error: perfilError } = await supabase
    .from("users")
    .select("display_name")
    .eq("uid", user.id)
    .single();

  if (perfilError) console.error("Erro ao buscar perfil:", perfilError);

  document.getElementById("user-name").textContent =
    perfil?.display_name || "Usuário";

  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-date").textContent =
    new Date(user.created_at).toLocaleDateString();
}

verificarUsuario();


// =======================
// DOM
// =======================
const userPhoto = document.getElementById("user-photo");
const userName = document.getElementById("user-name");
const userEmail = document.getElementById("user-email");
const userDate = document.getElementById("user-date");

const profileForm = document.getElementById("profileForm");
const editName = document.getElementById("editName");
const editAvatar = document.getElementById("editAvatar");
const editSuccess = document.getElementById("edit-success");
const editError = document.getElementById("edit-error");

const logoutBtn = document.getElementById("logout-btn");


// =======================
// Carregar Perfil
// =======================
async function loadUserProfile() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return;

  const { data: perfil, error: perfilError } = await supabase
    .from("users")
    .select("display_name, avatar_url")
    .eq("uid", user.id)
    .single();

  if (perfilError) console.error("Erro ao carregar perfil:", perfilError);

  userName.textContent = perfil?.display_name || "Sem nome";
  userEmail.textContent = user.email;
  userDate.textContent = new Date(user.created_at).toLocaleDateString();

  editName.value = perfil?.display_name || "";

  // FOTO
  if (perfil?.avatar_url) {
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(perfil.avatar_url);

    userPhoto.src = urlData.publicUrl;
  } else {
    userPhoto.src = "assets/img/default-user.png";
  }
}

loadUserProfile();


// =======================
// Atualizar Perfil
// =======================
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  editSuccess.textContent = "";
  editError.textContent = "";

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    editError.textContent = "Usuário não encontrado!";
    return;
  }

  let updates = {
    display_name: editName.value.trim()
  };

  // ============================
  // UPLOAD DA FOTO — CORRETO
  // ============================
  if (editAvatar.files.length > 0) {
    const file = editAvatar.files[0];
    const ext = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${ext}`;

    // Primeiro tentamos usar update (substituir)
    let upload = await supabase.storage
      .from("avatars")
      .update(fileName, file, {
        cacheControl: "3600",
        upsert: true
      });

    // Se der erro porque o arquivo não existe, usamos upload normal
    if (upload.error) {
      upload = await supabase.storage
        .from("avatars")
        .upload(fileName, file);
    }

    if (upload.error) {
      showToast("Erro ao enviar imagem!");
      console.error(upload.error);
      return;
    }

    updates.avatar_url = fileName;
  }

  // Atualiza no Supabase
  const { error: updateError } = await supabase
    .from("users")
    .update(updates)
    .eq("uid", user.id);

  if (updateError) {
    showToast ("Erro ao atualizar perfil!");
    console.log(updateError);
    return;
  }

  showToast("Perfil atualizado com sucesso!");
  loadUserProfile();
  editAvatar.value = "";
});


// =======================
// Logout
// =======================
logoutBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  if (!error) window.location.href = "index.html";
});
