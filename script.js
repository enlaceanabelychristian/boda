// Al añadir +01:00 al final, fijas la hora exacta de la boda de forma absoluta
const weddingDate = new Date("2026-10-31T11:30:00+01:00").getTime();
const FOTOS_BODA_ENDPOINT = "https://boda-azure-one.vercel.app/api/fotos-boda";
const carouselTrack = document.getElementById("carouselTrack");
let lightboxZoom = 1;

function crearLightboxFotos() {
  if (document.getElementById("photoLightbox")) return;

  const lightbox = document.createElement("div");
  lightbox.id = "photoLightbox";
  lightbox.className = "photo-lightbox";

  lightbox.innerHTML = `
    <div class="lightbox-inner">
      <button class="lightbox-close" id="lightboxClose" aria-label="Cerrar">×</button>

      <div class="lightbox-img-wrap">
        <img id="lightboxImg" class="lightbox-img" src="" alt="Foto ampliada">
      </div>

      <div class="lightbox-actions">
        <button class="lightbox-btn" id="zoomOutBtn">− Reducir</button>
        <button class="lightbox-btn" id="zoomResetBtn">Tamaño normal</button>
        <button class="lightbox-btn" id="zoomInBtn">+ Ampliar</button>
      </div>
    </div>
  `;

  document.body.appendChild(lightbox);

  document.getElementById("lightboxClose").addEventListener("click", cerrarLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target.id === "photoLightbox") cerrarLightbox();
  });

  document.getElementById("zoomInBtn").addEventListener("click", () => cambiarZoom(0.25));
  document.getElementById("zoomOutBtn").addEventListener("click", () => cambiarZoom(-0.25));
  document.getElementById("zoomResetBtn").addEventListener("click", () => resetZoom());

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarLightbox();
  });
}

function abrirLightbox(src) {
  crearLightboxFotos();

  const lightbox = document.getElementById("photoLightbox");
  const img = document.getElementById("lightboxImg");

  lightboxZoom = 1;
  img.src = src;
  img.style.transform = `scale(${lightboxZoom})`;

  lightbox.classList.add("show");
  document.body.style.overflow = "hidden";
}

function cerrarLightbox() {
  const lightbox = document.getElementById("photoLightbox");
  if (!lightbox) return;

  lightbox.classList.remove("show");
  document.body.style.overflow = "";
}

function cambiarZoom(valor) {
  const img = document.getElementById("lightboxImg");
  if (!img) return;

  lightboxZoom = Math.min(3, Math.max(0.5, lightboxZoom + valor));
  img.style.transform = `scale(${lightboxZoom})`;
}

function resetZoom() {
  const img = document.getElementById("lightboxImg");
  if (!img) return;

  lightboxZoom = 1;
  img.style.transform = `scale(${lightboxZoom})`;
}

async function cargarFotosCarruselBoda() {
  if (!carouselTrack) return;

  try {
    const response = await fetch(FOTOS_BODA_ENDPOINT + "?t=" + Date.now());
    const data = await response.json();

    console.log("Fotos recibidas:", data);

    if (!data.ok || !Array.isArray(data.fotos) || data.fotos.length === 0) {
      carouselTrack.innerHTML = `
        <div class="carousel-placeholder">
          <span>📸</span>
          <p>Aquí aparecerán las fotos que suban los invitados</p>
        </div>
      `;
      return;
    }

    const fotosDuplicadas = [...data.fotos, ...data.fotos, ...data.fotos];

    carouselTrack.innerHTML = fotosDuplicadas.map((foto) => `
      <div class="carousel-photo" data-img="${foto.url}">
        <img src="${foto.url}" alt="Foto subida por invitados">
      </div>
    `).join("");

    document.querySelectorAll(".carousel-photo").forEach((card) => {
      card.addEventListener("click", () => {
        abrirLightbox(card.dataset.img);
      });
    });

  } catch (error) {
    console.error("Error cargando fotos del carrusel:", error);
  }
}

cargarFotosCarruselBoda();
setInterval(cargarFotosCarruselBoda, 30000);

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
/* ==========================================================================
   GESTIÓN DE MÚSICA DE FONDO
   ========================================================================== */
// 1. Definimos la lista de canciones y la pista inicial
const playlist = [
  "asset/music/song.mp3?v=3",
  "asset/music/song1.mp3?v=3",
  "asset/music/song3.mp3?v=3",
  "asset/music/song4.mp3?v=3"
];
let currentTrack = 0;

// 2. Creamos el objeto de audio nativo en memoria
const bgMusic = new Audio();
bgMusic.volume = 0.5;
bgMusic.src = playlist[currentTrack];

// 3. Función clave: Intenta reproducir el audio y limpia los escuchadores globales
function simularAutoplay() {
  bgMusic.play()
    .then(() => {
      console.log("Música activada con éxito tras la interacción del usuario.");
      // Una vez que empieza a sonar, quitamos los eventos para que no se ejecute más veces
      removerEscuchadores();
      actualizarBotonVisual(true);
    })
    .catch((error) => {
      console.log("El usuario tocó la pantalla pero el navegador aún retiene el audio:", error);
    });
}

// 4. Añadimos los escuchadores de interacción (esenciales para móviles)
function activarEscuchadores() {
  document.addEventListener("click", simularAutoplay);
  document.addEventListener("touchstart", simularAutoplay, { passive: true }); // 'touchstart' es el clic de los móviles
}

function removerEscuchadores() {
  document.removeEventListener("click", simularAutoplay);
  document.removeEventListener("touchstart", simularAutoplay);
}

// 5. Al cargar la página, hacemos un intento directo por si el navegador lo permite
window.addEventListener("load", () => {
  bgMusic.load(); // Prepara el búfer del archivo multimedia
  
  bgMusic.play()
    .then(() => {
      // Si el navegador es permisivo (raro en móviles, posible en algunos PCs), suena directo
      actualizarBotonVisual(true);
    })
    .catch(() => {
      // Si el navegador lo bloquea (comportamiento normal), activamos la escucha del primer toque
      console.log("Autoplay bloqueado de serie. Esperando interacción táctil...");
      activarEscuchadores();
    });
});

// 6. Control del cambio automático de canción al terminar
bgMusic.addEventListener("ended", () => {
  currentTrack = (currentTrack + 1) % playlist.length;
  bgMusic.src = playlist[currentTrack];
  bgMusic.load();
  bgMusic.play().catch(err => console.log("Error al saltar de pista:", err));
});

// 7. Función opcional para sincronizar el estado del botón de tu web (si tienes uno)
function actualizarBotonVisual(reproduciendo) {
  const musicBtn = document.getElementById("musicBtn");
  if (!musicBtn) return;
  musicBtn.textContent = reproduciendo ? "❚❚" : "♫";
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
        
await cargarFotosCarruselBoda();
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
