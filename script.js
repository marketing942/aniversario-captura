/* =========================================================
   Colégio CPPEM — 1ª Edição · Aniversário do Colégio
   Formulário de inscrição → Google Sheets
   + campo condicional de indicação
   + redirect imediato para o WhatsApp na mesma aba
   ========================================================= */

/* ---------- CONFIGURAÇÕES ---------- */

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxEp3dzDtCk7t3BslRj_EqGgP9elQbdcWTyJG2Iq2I7_AxUBd7JlRV9d2k8PRRmZ6gC/exec";

const WHATSAPP_GROUP = "https://chat.whatsapp.com/Huxe6eDXGCc2HZxqy2GxlW?mode=gi_t";

/* ---------- Campo condicional de indicação ---------- */

const form = document.getElementById("lead-form");
const selIndicado = document.getElementById("indicado");
const fieldIndicador = document.getElementById("field-indicador");
const inputIndicador = document.getElementById("indicador");

function toggleIndicador() {
  const isSim = selIndicado.value === "Sim";

  fieldIndicador.classList.toggle("show", isSim);

  if (!isSim) {
    inputIndicador.value = "";
    clearError("indicador");
  }
}

if (selIndicado) {
  selIndicado.addEventListener("change", toggleIndicador);
}

/* ---------- Validação ---------- */

function fieldOf(name) {
  return form.querySelector(`[name="${name}"]`).closest(".field");
}

function setError(name, msg) {
  fieldOf(name).classList.add("invalid");
  form.querySelector(`[data-error-for="${name}"]`).textContent = msg;
}

function clearError(name) {
  fieldOf(name).classList.remove("invalid");
  form.querySelector(`[data-error-for="${name}"]`).textContent = "";
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function validate() {
  let ok = true;

  ["nome", "email", "telefone", "indicado", "indicador"].forEach(clearError);

  const nome = form.nome.value.trim();
  const email = form.email.value.trim();
  const tel = form.telefone.value.replace(/\D/g, "");
  const indicado = form.indicado.value;
  const indicador = form.indicador.value.trim();

  if (nome.length < 3) {
    setError("nome", "Informe seu nome completo.");
    ok = false;
  }

  if (!isEmail(email)) {
    setError("email", "Informe um e-mail válido.");
    ok = false;
  }

  if (tel.length < 10) {
    setError("telefone", "Informe um telefone válido com DDD.");
    ok = false;
  }

  if (!indicado) {
    setError("indicado", "Selecione uma opção.");
    ok = false;
  }

  if (indicado === "Sim" && indicador.length < 3) {
    setError("indicador", "Informe o nome completo de quem indicou.");
    ok = false;
  }

  return ok;
}

/* ---------- Máscara de telefone ---------- */

const telefoneInput = document.getElementById("telefone");

if (telefoneInput) {
  telefoneInput.addEventListener("input", () => {
    const v = telefoneInput.value.replace(/\D/g, "").slice(0, 11);
    let out = "";

    if (v.length > 0) out = "(" + v.slice(0, 2);
    if (v.length >= 2) out += ") ";
    if (v.length > 2) out += v.slice(2, 7);
    if (v.length > 7) out += "-" + v.slice(7, 11);

    telefoneInput.value = out;
  });
}

/* ---------- Envio ---------- */

if (form) {
  const btn = document.getElementById("lead-submit");
  const success = document.getElementById("form-success");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validate()) return;

    btn.disabled = true;
    btn.textContent = "ENVIANDO...";

    const indicado = form.indicado.value;

    const payload = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim(),
      indicado: indicado,
      indicador: indicado === "Sim" ? form.indicador.value.trim() : "",
    };

    try {
      await fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      /* ---------- Evento de Lead (GTM / dataLayer) ---------- */

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "Lead",
        lead_name: payload.nome,
        lead_email: payload.email,
        lead_phone: payload.telefone,
      });

      /* ---------- Sucesso + redirect imediato ---------- */

      form.querySelectorAll(".field, .note, .progress").forEach((el) => {
        el.style.display = "none";
      });

      btn.style.display = "none";

      if (success) {
        success.hidden = false;
        success.innerHTML = `
          ✅ Inscrição confirmada!<br>
          Você será redirecionado agora para o grupo do WhatsApp.
        `;
        success.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      /*
        Redireciona na mesma aba.
        Não abre nova janela.
        Não tem contagem de 3 segundos.
      */
      window.location.href = WHATSAPP_GROUP;

    } catch (err) {
      setError("telefone", "Erro ao enviar. Tente novamente.");

      btn.disabled = false;
      btn.textContent = "QUERO CONFIRMAR MINHA PRESENÇA";
    }
  });
}
