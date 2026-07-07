const weddingDate = new Date("2026-10-31T11:30:00").getTime();

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
const adultosInput = document.getElementById("adultos");
const ninosInput = document.getElementById("ninos");
const autobusSelect = document.getElementById("autobus");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");

function toggleExtraFields() {
  const asiste = asisteSelect.value;
  if (asiste === "No") {
    extraFields.classList.add("hidden");
    adultosInput.required = false;
    ninosInput.required = false;
    autobusSelect.required = false;
  } else {
    extraFields.classList.remove("hidden");
    adultosInput.required = asiste === "Sí";
    ninosInput.required = asiste === "Sí";
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

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const asiste = formData.get("asiste");

    const payload = {
      nombre: String(formData.get("nombre") || "").trim(),
      apellidos: String(formData.get("apellidos") || "").trim(),
      asiste: asiste,
      // Si asiste, guarda el teléfono; si no, lo deja vacío
      telefono: asiste === "Sí" ? String(formData.get("telefono") || "").trim() : "",
      acompanante: asiste === "Sí" ? String(formData.get("acompanante") || "").trim() : "",
      adultos: asiste === "Sí" ? String(formData.get("adultos") || "").trim() : "",
      ninos: asiste === "Sí" ? String(formData.get("ninos") || "").trim() : "",
      alergias: asiste === "Sí" ? String(formData.get("alergias") || "").trim() : "",
      autobus: asiste === "Sí" ? String(formData.get("autobus") || "").trim() : ""
    };

    if (!payload.nombre || !payload.apellidos || !payload.asiste) {
      showMessage("Por favor, completa nombre, apellidos y asistencia.", "error");
      return;
    }

    if (payload.asiste === "Sí") {
      if (!payload.adultos || Number(payload.adultos) < 1) {
        showMessage("Indica al menos 1 adulto.", "error");
        return;
      }
      if (payload.ninos === "" || Number(payload.ninos) < 0) {
        showMessage("Indica el número de niños, aunque sea 0.", "error");
        return;
      }
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

    const params = new URLSearchParams({
      callback: callbackName,
      data: JSON.stringify(payload)
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
