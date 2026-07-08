// Al añadir +01:00 al final, fijas la hora exacta de la boda de forma absoluta
const weddingDate = new Date("2026-10-31T11:30:00+01:00").getTime();
const FOTOS_BODA_ENDPOINT = "https://boda-azure-one.vercel.app/api/fotos-boda";

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
const musicBtn = document.getElementById("musicBtn");

const playlist = [
  "asset/music/musica%20(1).mp3",
  "asset/music/musica%20(2).mp3",
  "asset/music/musica%20(3).mp3",
  "asset/music/musica%20(4).mp3"
];

let currentTrack = 0;
const bgMusic = new Audio(playlist[currentTrack]);
bgMusic.volume = 0.5;

function playTrack(index) {
  bgMusic.src = playlist[index];
  bgMusic.volume = 0.5;
  bgMusic.play().catch(() => {
    console.log("El navegador bloqueó el autoplay hasta que pulses el botón.");
  });
}

bgMusic.addEventListener("ended", () => {
  currentTrack = (currentTrack + 1) % playlist.length;
  playTrack(currentTrack);
});

window.addEventListener("load", () => {
  playTrack(currentTrack);
});

if (musicBtn) {
  musicBtn.addEventListener("click", async () => {
    if (bgMusic.paused) {
      await bgMusic.play();
      musicBtn.classList.add("playing");
      musicBtn.textContent = "❚❚";
    } else {
      bgMusic.pause();
      musicBtn.classList.remove("playing");
      musicBtn.textContent = "♫";
    }
  });
}
const CLOUD_NAME = "mwbuyheu";
const UPLOAD_PRESET = "boda_invitados";

const uploadForm = document.getElementById("uploadPhotoForm");
const eventPhoto = document.getElementById("eventPhoto");
const photoPreview = document.getElementById("photoPreview");
const uploadMessage = document.getElementById("uploadMessage");
const uploadBtn = document.getElementById("uploadBtn");

if (eventPhoto) {
  eventPhoto.addEventListener("change", () => {
    const file = eventPhoto.files[0];

    if (!file) return;

    photoPreview.src = URL.createObjectURL(file);
    photoPreview.classList.remove("hidden");
    uploadMessage.textContent = "";
    uploadMessage.className = "form-message";
  });
}

if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = eventPhoto.files[0];

    if (!file) {
      uploadMessage.textContent = "Selecciona una foto primero.";
      uploadMessage.className = "form-message error";
      return;
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Subiendo...";
    uploadMessage.textContent = "Subiendo foto, espera unos segundos...";
    uploadMessage.className = "form-message";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("public_id_prefix", "fotos-evento");
  

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.secure_url) {
        uploadMessage.textContent = "✅ Foto subida correctamente. ¡Gracias por compartir este recuerdo!";
        uploadMessage.className = "form-message success";
        uploadForm.reset();
        photoPreview.classList.add("hidden");
      } else {
        uploadMessage.textContent = "No se ha podido subir la foto.";
        uploadMessage.className = "form-message error";
        console.log(data);
      }
    } catch (error) {
      uploadMessage.textContent = "Error de conexión al subir la foto.";
      uploadMessage.className = "form-message error";
      console.error(error);
    }

    uploadBtn.disabled = false;
    uploadBtn.textContent = "Subir fotografía";
  });
}
