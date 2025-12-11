document.addEventListener("DOMContentLoaded", () => {

  const TELEFONE_VENDEDOR = "5561993894755"; // coloque o número final aqui
  const whatsappBaseURL = `https://wa.me/${TELEFONE_VENDEDOR}?text=`;

  /* ======================================================
     FORMULÁRIOS DENTRO DOS MODAIS (Página de Detalhes)
  ====================================================== */
  const modals = document.querySelectorAll(".modal");
  const whatsappButtons = document.querySelectorAll(".whatsapp-button");

  whatsappButtons.forEach((btn, index) => {
    const modal = modals[index];
    if (!modal) return;

    const closeBtn = modal.querySelector(".close");
    const form = modal.querySelector("#whatsappForm");

    // Abrir modal
    btn.addEventListener("click", () => modal.style.display = "block");

    // Fechar modal
    closeBtn?.addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });

    // Enviar mensagem do modal
    form?.addEventListener("submit", function (e) {
      e.preventDefault();

      const nome = this.nome?.value?.trim() || "";
      let oferta = this.oferta?.value?.trim() || "";
      const perguntas = this.perguntas?.value?.trim() || "";

      let msg = `Olá, meu nome é ${nome}.`;
      if (oferta) msg += ` Gostaria de fazer uma oferta de ${oferta}.`;
      if (perguntas) msg += ` Minhas perguntas: ${perguntas}`;

      window.open(whatsappBaseURL + encodeURIComponent(msg), "_blank");

      modal.style.display = "none";
      this.reset();
    });

  });

  /* ======================================================
      FORMULÁRIO DA HOMEPAGE (Página inicial)
  ====================================================== */
  const homepageForm = document.querySelector(".contact-form");

  if (homepageForm) {
    homepageForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const nome = this.name.value.trim();
      const email = this.email.value.trim();
      const assunto = this.subject.value.trim();
      const mensagem = this.message.value.trim();

      let texto = `Olá, me chamo ${nome}.`;
      texto += `\nMeu e-mail: ${email}.`;

      if (assunto) texto += `\nAssunto: ${assunto}`;
      
      texto += `\nMensagem:\n${mensagem}`;

      window.open(whatsappBaseURL + encodeURIComponent(texto), "_blank");

      this.reset();
    });
  }


  /* ======================================================
      MÁSCARA PARA O CAMPO "oferta"
  ====================================================== */
  document.querySelectorAll('input[name="oferta"]').forEach(input => {
    
    input.addEventListener("input", (e) => {
      let value = e.target.value;

      // Remove tudo que não é número
      value = value.replace(/\D/g, "");

      // Evita valores muito pequenos
      if (value.length === 1) value = "0" + value;
      if (value.length === 2) value = "0" + value;

      // Converte para número com centavos
      const numericValue = parseFloat(value) / 100;

      // Formata no padrão BR
      e.target.value = numericValue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });
    });

  });

});
