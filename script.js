// Al añadir +01:00 al final, fijas la hora exacta de la boda de forma absoluta
const weddingDate = new Date("2026-10-31T11:30:00+01:00").getTime();

function updateCountdown() {
  const countdown = document.getElementById("countdown");
  if (!countdown) return;

  const distance = weddingDate - Date.now();

  if (distance <= 0) {
    countdown.innerHTML = '<div><strong>Hoy</strong><span>celebramos el amor</span></div>';
    return;
  }

  document.getElementById("days").textContent = String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, "0");
  document.getElementById("hours").textContent = String(Math.floor((distance / (1000 * 60 * 60)) % 24)).padStart(2, "0");
  document.getElementById("minutes").textContent = String(Math.floor((distance / (1000 * 60)) % 60)).padStart(2, "0");
  document.getElementById("seconds").textContent = String(Math.floor((distance / 1000) % 60)).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => navLinks.classList.toggle("show"));
  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => navLinks.classList.remove("show"));
  });
}

const form = document.getElementById("rsvpForm");
const asisteSelect = document.getElementById("asiste");
const extraFields = document.getElementById("extraFields");
const autobusSelect = document.getElementById("autobus");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");

// Elementos de la ventana emergente modal
const calendarModal = document.getElementById("calendarModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const googleCalendarBtn = document.getElementById("googleCalendarBtn");

function toggleExtraFields() {
  const asiste = asisteSelect.value;
  if (asiste === "No") {
    extraFields.classList.add("hidden");
    autobusSelect.required = false;
  } else {
    extraFields.classList.remove("hidden");
    autobusSelect.required = asiste === "Sí";
  }
}

if (asisteSelect) {
  asisteSelect.addEventListener("change", toggleExtraFields);
  toggleExtraFields();
}

function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = "form-message " + type;
}

// Lógica de cierre del aviso emergente
if (closeModalBtn && calendarModal) {
  closeModalBtn.addEventListener("click", (e) => {
    e.preventDefault();
    calendarModal.classList.add("hidden");
  });
}
if (googleCalendarBtn && calendarModal) {
  googleCalendarBtn.addEventListener("click", () => {
    // Escondemos el aviso una vez hacen clic en agregar para no entorpecer
    calendarModal.classList.add("hidden");
  });
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const asiste = formData.get("asiste");

    const payload = {
      nombre: String(formData.get("nombre") || "").trim(),
      apellidos: String(formData.get("apellidos") || "").trim(),
      asiste: asiste,
      telefono: asiste === "Sí" ? String(formData.get("telefono") || "").trim() : "",
      alergias: asiste === "Sí" ? String(formData.get("alergias") || "").trim() : "",
      autobus: asiste === "Sí" ? String(formData.get("autobus") || "").trim() : ""
    };

    if (!payload.nombre || !payload.apellidos || !payload.asiste) {
      showMessage("Por favor, completa nombre, apellidos y asistencia.", "error");
      return;
    }

    if (payload.asiste === "Sí") {
      if (!payload.autobus) {
        showMessage("Indica si necesitas autobús.", "error");
        return;
      }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";
    showMessage("", "");

    try {
      const response = await enviarConfirmacionJSONP(payload);

      if (!response.ok) {
        throw new Error(response.error || "No se ha podido guardar la confirmación.");
      }

      showMessage("¡Muchas gracias! Hemos recibido tu confirmación.", "success");
      
      form.reset();
      toggleExtraFields();

      // DISPARADOR: Si el cliente confirma que SÍ asiste con éxito, abrimos la ventana emergente modal
      if (asiste === "Sí" && calendarModal) {
        calendarModal.classList.remove("hidden");
      }

    } catch (error) {
      showMessage("No se ha podido enviar. Inténtalo de nuevo en unos segundos.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Enviar confirmación";
    }
  });
}

function enviarConfirmacionJSONP(payload) {
  return new Promise((resolve, reject) => {
    const callbackName = "rsvpCallback_" + Date.now();

    window[callbackName] = function(response) {
      resolve(response);
      delete window[callbackName];
      script.remove();
    };

    const script = document.createElement("script");

    // Añadimos un timestamp (_t) para romper la caché del navegador
    const params = new URLSearchParams({
      callback: callbackName,
      data: JSON.stringify(payload),
      _t: Date.now() 
    });

    script.src = window.RSVP_ENDPOINT + "?" + params.toString();

    script.onerror = function() {
      delete window[callbackName];
      script.remove();
      reject(new Error("Error conectando con Google Sheets."));
    };

    document.body.appendChild(script);
  });
}

