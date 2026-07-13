// ==========================================================================
// 1. CONFIGURACIÓN INICIAL Y PARÁMETROS DE SERVIDORES
// ==========================================================================
const weddingDate = new Date("2026-10-31T11:30:00+01:00").getTime();
const FOTOS_BODA_ENDPOINT = "https://boda-azure-one.vercel.app/api/fotos-boda";

const CLOUD_NAME = "mwbuyheu";
const UPLOAD_PRESET = "boda_invitados";

const carouselTrack = document.getElementById("carouselTrack");

let sliderIndex = 0;
let sliderInterval = null;
let totalSlides = 0;
let lightboxZoom = 1;

// ==========================================================================
// 2. MOTOR DEL CARRUSEL PLANO (AUTOMÁTICO + MANUAL)
// ==========================================================================
function moverSlider(direccion) {
  const slides = document.querySelectorAll(".carousel-photo");
  totalSlides = slides.length;
  if (totalSlides <= 1 || !carouselTrack) return;

  if (direccion === "next") {
    sliderIndex++;
    if (sliderIndex >= totalSlides) sliderIndex = 0;
  } else if (direccion === "prev") {
    sliderIndex--;
    if (sliderIndex < 0) sliderIndex = totalSlides - 1;
  }

  carouselTrack.style.transform = `translateX(-${sliderIndex * 100}%)`;
}

function inicializarSliderAutomatico() {
  const slides = document.querySelectorAll(".carousel-photo");
  totalSlides = slides.length;

  if (sliderInterval) clearInterval(sliderInterval);
  if (totalSlides <= 1 || !carouselTrack) return;

  sliderInterval = setInterval(() => {
    moverSlider("next");
  }, 4000);
}

function configurarFlechasManuales() {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (!prevBtn || !nextBtn) return;

  const newPrev = prevBtn.cloneNode(true);
  const newNext = nextBtn.cloneNode(true);
  prevBtn.parentNode.replaceChild(newPrev, prevBtn);
  nextBtn.parentNode.replaceChild(newNext, nextBtn);

  newPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    moverSlider("prev");
    inicializarSliderAutomatico(); // Reiniciar contador
  });

  newNext.addEventListener("click", (e) => {
    e.stopPropagation();
    moverSlider("next");
    inicializarSliderAutomatico(); // Reiniciar contador
  });
}

async function cargarFotosCarruselBoda() {
  if (!carouselTrack) return;

  try {
    const response = await fetch(FOTOS_BODA_ENDPOINT + "?t=" + Date.now());
    const data = await response.json();

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (!data.ok || !Array.isArray(data.fotos) || data.fotos.length === 0) {
      carouselTrack.style.transform = "none";
      carouselTrack.innerHTML = `
        <div class="carousel-placeholder">
          <span>📸</span>
          <p>Aquí aparecerán las fotos que suban los invitados</p>
        </div>
      `;
      if (prevBtn) prevBtn.style.display = "none";
      if (nextBtn) nextBtn.style.display = "none";
      if (sliderInterval) clearInterval(sliderInterval);
      return;
    }

    if (prevBtn) prevBtn.style.display = data.fotos.length > 1 ? "flex" : "none";
    if (nextBtn) nextBtn.style.display = data.fotos.length > 1 ? "flex" : "none";

    carouselTrack.innerHTML = data.fotos.map((foto) => `
      <div class="carousel-photo" data-img="${foto.url}">
        <img src="${foto.url}" alt="Foto de boda" loading="lazy">
      </div>
    `).join("");

    document.querySelectorAll(".carousel-photo").forEach((card) => {
      card.addEventListener("click", () => {
        abrirLightbox(card.dataset.img);
      });
    });

    configurarFlechasManuales();
    inicializarSliderAutomatico();

  } catch (error) {
    console.error("Error al leer de Vercel:", error);
  }
}

// Carga pasiva inicial y refresco cada 30 segundos
cargarFotosCarruselBoda();
setInterval(cargarFotosCarruselBoda, 30000);

// ==========================================================================
// 3. ENTRADA DE DATOS: SUBIDA DIRECTA A CLOUDINARY
// ==========================================================================
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
        showMessageSubida("✅ Foto subida correctamente. ¡Gracias por compartir!", "success");
        uploadForm.reset();
        photoPreview.classList.add("hidden");
        
        sliderIndex = 0;
        await cargarFotosCarruselBoda();
      } else {
        showMessageSubida("No se ha podido subir la foto.", "error");
      }
    } catch (error) {
      showMessageSubida("Error de red al conectar con Cloudinary.", "error");
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

// ==========================================================================
// 4. SISTEMA DE VISUALIZACIÓN LIGHTBOX (ZOOM + DESCARGA)
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
        <img id="lightboxImg" class="lightbox-img" src="" alt="Ampliada">
      </div>
      <div class="lightbox-actions">
        <button class="lightbox-btn" id="zoomOutBtn">− Reducir</button>
        <button class="lightbox-btn" id="zoomResetBtn">Tamaño normal</button>
        <button class="lightbox-btn" id="zoomInBtn">+ Ampliar</button>
        <a class="lightbox-btn download-btn" id="lightboxDownload" target="_blank" rel="noopener">📥 Descargar</a>
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
  const downloadBtn = document.getElementById("lightboxDownload");

  lightboxZoom = 1;
  img.src = src;
  img.style.transform = `scale(${lightboxZoom})`;

  if (downloadBtn) {
    downloadBtn.href = src;
    downloadBtn.download = `boda_${Date.now()}.jpg`;
  }

  lightbox.classList.add("show");
  document.body.style.overflow = "hidden";

  if (sliderInterval) clearInterval(sliderInterval);
}

function cerrarLightbox() {
  const lightbox = document.getElementById("photoLightbox");
  if (!lightbox) return;

  lightbox.classList.remove("show");
  document.body.style.overflow = "";

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
// 5. CUENTA ATRÁS (COUNTDOWN)
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
// 6. FORMULARIO RSVP (JSONP)
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
      showMessage("Por favor, completa los campos requeridos.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    try {
      const response = await enviarConfirmacionJSONP(payload);
      if (!response.ok) throw new Error();

      showMessage("¡Muchas gracias! Hemos recibido tu confirmación.", "success");
      form.reset();
      toggleExtraFields();
    } catch (error) {
      showMessage("No se ha podido enviar. Inténtalo de nuevo.", "error");
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
    script.onerror = () => {
      delete window[callbackName];
      script.remove();
      reject();
    };

    document.body.appendChild(script);
  });
}

// ==========================================================================
// 7. REPRODUCTOR DE MÚSICA
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
  musicBtn.textContent = reproduciendo ? "❚❚" : "♫";
}

function arrancarMusicaEnInteraccion() {
  document.removeEventListener("click", arrancarMusicaEnInteraccion);
  document.removeEventListener("touchstart", arrancarMusicaEnInteraccion);
  if (bgMusic.paused) {
    bgMusic.play().then(() => actualizarBotonVisual(true)).catch(() => {});
  }
}

window.addEventListener("load", () => {
  bgMusic.load();
  bgMusic.play().then(() => actualizarBotonVisual(true)).catch(() => {
    document.addEventListener("click", arrancarMusicaEnInteraccion);
    document.addEventListener("touchstart", arrancarMusicaEnInteraccion, { passive: true });
  });
});

bgMusic.addEventListener("ended", () => {
  currentTrack = (currentTrack + 1) % playlist.length;
  bgMusic.src = playlist[currentTrack];
  bgMusic.load();
  bgMusic.play().then(() => actualizarBotonVisual(true));
});

if (musicBtn) {
  musicBtn.addEventListener("click", () => {
    if (bgMusic.paused) {
      bgMusic.play().then(() => actualizarBotonVisual(true));
    } else {
      bgMusic.pause();
      actualizarBotonVisual(false);
    }
  });
}
