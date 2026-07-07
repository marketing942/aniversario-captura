/* =========================================================
   Colégio CPPEM — 1ª Edição · Aniversário do Colégio
   Formulário de inscrição → Google Sheets (Apps Script)
   + campo condicional de indicação
   + redirect automático para o WhatsApp
   ========================================================= */

/* ⚠️ CONFIGURE ANTES DE PUBLICAR ------------------------------------------
   1) SHEET_URL   → URL do Web App do Google Apps Script (termina em /exec)
   2) WHATSAPP_NUM → número de atendimento, só dígitos, com DDI 55
-------------------------------------------------------------------------- */
const SHEET_URL      = "https://script.google.com/macros/s/AKfycbxdFplWVSfhTjvyIA7HIWb645xRjGNhBVhTdTf5UMjo0lSpW_A_jCuys0qB4uImKXPQ/exec";
const WHATSAPP_GROUP = "https://chat.whatsapp.com/Huxe6eDXGCc2HZxqy2GxlW?mode=gi_t"; // grupo do evento
const REDIRECT_SEG   = 3; // segundos antes de abrir o grupo

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
if (selIndicado) selIndicado.addEventListener("change", toggleIndicador);

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

  if (nome.length < 3) { setError("nome", "Informe seu nome completo."); ok = false; }
  if (!isEmail(email)) { setError("email", "Informe um e-mail válido."); ok = false; }
  if (tel.length < 10) { setError("telefone", "Informe um telefone válido com DDD."); ok = false; }
  if (!indicado) { setError("indicado", "Selecione uma opção."); ok = false; }
  if (indicado === "Sim" && indicador.length < 3) {
    setError("indicador", "Informe o nome completo de quem indicou.");
    ok = false;
  }

  return ok;
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
        mode: "no-cors", // Apps Script não envia cabeçalhos CORS; resposta é opaca
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Evento de Lead do Pixel X
      if (window.pixel_x_app && typeof window.pixel_x_app.send_event === "function") {
        try {
          await window.pixel_x_app.send_event({
            event_name: "Lead",
            lead_name: payload.nome,
            lead_email: payload.email,
            lead_phone: payload.telefone,
          });
        } catch (_) {
          /* não bloqueia o fluxo de sucesso/redirect */
        }
      }

      // Estado de sucesso: oculta o formulário e mostra a confirmação
      form.querySelectorAll(".field, .note").forEach((el) => (el.style.display = "none"));
      btn.style.display = "none";
      success.hidden = false;
      success.scrollIntoView({ behavior: "smooth", block: "center" });

      // Contagem regressiva → redireciona para o WhatsApp (mesma aba = sem bloqueio de popup)
      const countEl = document.getElementById("countdown");
      let seg = REDIRECT_SEG;
      if (countEl) countEl.textContent = seg;
      const timer = setInterval(() => {
        seg--;
        if (countEl) countEl.textContent = Math.max(seg, 0);
        if (seg <= 0) {
          clearInterval(timer);
          window.location.href = WHATSAPP_GROUP;
        }
      }, 1000);
    } catch (err) {
      setError("telefone", "Erro ao enviar. Tente novamente.");
      btn.disabled = false;
      btn.textContent = "QUERO CONFIRMAR MINHA PRESENÇA";
    }
  });
}
