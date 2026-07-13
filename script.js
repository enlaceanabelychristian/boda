// Al añadir +01:00 al final, fijas la hora exacta de la boda de forma absoluta
const weddingDate = new Date("2026-10-31T11:30:00+01:00").getTime();
const FOTOS_BODA_ENDPOINT = "https://boda-azure-one.vercel.app/api/fotos-boda";
const carouselTrack = document.getElementById("carouselTrack");
let lightboxZoom = 1;

// VARIABLES DEL SLIDER AUTOMÁTICO 16:9
let sliderIndex = 0;
let sliderInterval = null;

// ==========================================================================
// GESTIÓN DEL SLIDER AUTOMÁTICO 16:9
// ==========================================================================

function inicializarSliderAutomatico() {
  const slides = document.querySelectorAll(".carousel-photo");

  // Limpiamos intervalos previos para evitar aceleraciones erráticas
  if (sliderInterval) clearInterval(sliderInterval);
  if (slides.length <= 1 || !carouselTrack) return;

  sliderInterval = setInterval(() => {
    sliderIndex++;
    if (sliderIndex >= slides.length) {
      sliderIndex = 0;
    }
    // Desplaza la pista un bloque entero (100% del contenedor)
    carouselTrack.style.transform = `translateX(-${sliderIndex * 100}%)`;
  }, 4000); // Cambia de foto automáticamente cada 4 segundos
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
      if (sliderInterval) clearInterval(sliderInterval);
      return;
    }

    // ELIMINADO EL TRUCO DE DUPLICAR FOTOS: Ahora van directas y limpias una a una
    carouselTrack.innerHTML = data.fotos.map((foto) => `
      <div class="carousel-photo" data-img="${foto.url}">
        <img src="${foto.url}" alt="Foto subida por invitados" loading="lazy">
      </div>
    `).join("");

    // Añadir eventos para abrir el Lightbox
    document.querySelectorAll(".carousel-photo").forEach((card) => {
      card.addEventListener("click", () => {
        abrirLightbox(card.dataset.img);
      });
    });

    // Encendemos el motor del temporizador automático
    inicializarSliderAutomatico();

  } catch (error) {
    console.error("Error cargando fotos del carrusel:", error);
  }
}

// Inicialización de la carga y refresco de seguridad en background cada 30 segundos
cargarFotosCarruselBoda();
setInterval(cargarFotosCarruselBoda, 30000);


// ==========================================================================
// SISTEMA DE LIGHTBOX (VISUALIZADOR INTERACTIVO)
// ==========================================================================

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

  // Pausar slider mientras se mira la foto detalladamente
  if (sliderInterval) clearInterval(sliderInterval);
}

function cerrarLightbox() {
  const lightbox = document.getElementById("photoLightbox");
  if (!lightbox) return;

  lightbox.classList.remove("show");
  document.body.style.overflow = "";

  // Reanudar paso automático al cerrar visor
  inicializarSliderAutomatico();
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


// ==========================================================================
// CUENTA ATRÁS (COUNTDOWN)
// ==========================================================================

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


// ==========================================================================
// MENÚ DE NAVEGACIÓN MÓVIL
// ==========================================================================

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => navLinks.classList.toggle("show"));
  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => navLinks.classList.remove("show"));
  });
}


// ==========================================================================
// FORMULARIO RSVP (ASISTENCIA A GOOGLE SHEETS)
// ==========================================================================

const form = document.getElementById("rsvpForm");
const asisteSelect = document.getElementById("asiste");
const extraFields = document.getElementById("extraFields");
const autobusSelect = document.getElementById("autobus");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");

function toggleExtraFields() {
  if (!asisteSelect || !extraFields || !autobusSelect) return;
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
  if (!formMessage) return;
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
      telefono: asiste === "Sí" ? String(formData.get("telefono") || "").trim() : "",
      alergias: asiste === "Sí" ? String(formData.get("alergias") || "").trim() : "",
      autobus: asiste === "Sí" ? String(formData.get("autobus") || "").trim() : ""
    };

    if (!payload.nombre || !payload.apellidos || !payload.asiste) {
      showMessage("Por favor, completa nombre, apellidos y asistencia.", "error");
      return;
    }

    if (payload.asiste === "Sí" && !payload.autobus) {
      showMessage("Indica si necesitas autobús.", "error");
      return;
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


// ==========================================================================
// REPRODUCTOR DE MÚSICA CON CONTROL DE PISTAS
// ==========================================================================

const musicBtn = document.getElementById("musicBtn");
const playlist = [
  "asset/music/song.mp3?v=3",
  "asset/music/song1.mp3?v=3",
  "asset/music/song3.mp3?v=3",
  "asset/music/song4.mp3?v=3"
];
let currentTrack = 0;

const bgMusic = new Audio();
bgMusic.volume = 0.5;
bgMusic.src = playlist[currentTrack];

function actualizarBotonVisual(reproduciendo) {
  if (!musicBtn) return;
  if (reproduciendo) {
    musicBtn.classList.add("playing");
    musicBtn.textContent = "❚❚"; 
  } else {
    musicBtn.classList.remove("playing");
    musicBtn.textContent = "♫";   
  }
}

function arrancarMusicaEnInteraccion() {
  removerEscuchadoresGlobales();
  if (bgMusic.paused) {
    bgMusic.play()
      .then(() => actualizarBotonVisual(true))
      .catch((err) => console.log("El navegador bloqueó el audio:", err));
  }
}

function removerEscuchadoresGlobales() {
  document.removeEventListener("click", arrancarMusicaEnInteraccion);
  document.removeEventListener("touchstart", arrancarMusicaEnInteraccion);
}

window.addEventListener("load", () => {
  bgMusic.load();
  bgMusic.play()
    .then(() => actualizarBotonVisual(true))
    .catch(() => {
      document.addEventListener("click", arrancarMusicaEnInteraccion);
      document.addEventListener("touchstart", arrancarMusicaEnInteraccion, { passive: true });
    });
});

bgMusic.addEventListener("ended", () => {
  currentTrack = (currentTrack + 1) % playlist.length;
  bgMusic.src = playlist[currentTrack];
  bgMusic.load();
  bgMusic.play()
    .then(() => actualizarBotonVisual(true))
    .catch(err => console.log("Error al saltar de pista:", err));
});

if (musicBtn) {
  const controlarMusicaManual = (e) => {
    e.preventDefault();
    e.stopPropagation(); 
    removerEscuchadoresGlobales(); 

    if (bgMusic.paused) {
      bgMusic.play()
        .then(() => actualizarBotonVisual(true))
        .catch(err => console.error("Error al dar Play manual:", err));
    } else {
      bgMusic.pause();
      actualizarBotonVisual(false);
    }
  };

  musicBtn.addEventListener("click", controlarMusicaManual);
  musicBtn.addEventListener("touchstart", controlarMusicaManual, { passive: false });
}


// ==========================================================================
// SUBIDA DE FOTOS A CLOUDINARY
// ==========================================================================

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
    if (uploadMessage) {
      uploadMessage.textContent = "";
      uploadMessage.className = "form-message";
    }
  });
}

if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = eventPhoto.files[0];

    if (!file) {
      showMessageSubida("Selecciona una foto primero.", "error");
      return;
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Subiendo...";
    showMessageSubida("Subiendo foto, espera unos segundos...", "");

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
        showMessageSubida("✅ Foto subida correctamente. ¡Gracias por compartir este recuerdo!", "success");
        uploadForm.reset();
        photoPreview.classList.add("hidden");
        
        // Reiniciamos índice y refrescamos el carrusel de inmediato al subir nueva foto
        sliderIndex = 0;
        await cargarFotosCarruselBoda();
      } else {
        showMessageSubida("No se ha podido subir la foto.", "error");
      }
    } catch (error) {
      showMessageSubida("Error de conexión al subir la foto.", "error");
      console.error(error);
    }

    uploadBtn.disabled = false;
    uploadBtn.textContent = "Subir fotografía";
  });
}

function showMessageSubida(text, type) {
  if (!uploadMessage) return;
  uploadMessage.textContent = text;
  uploadMessage.className = "form-message " + type;
}
