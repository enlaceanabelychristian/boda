// Al añadir +01:00 al final, fijas la hora exacta de la boda de forma absoluta
const weddingDate = new Date("2026-10-31T11:30:00+01:00").getTime();

const FOTOS_BODA_ENDPOINT = "https://boda-azure-one.vercel.app/api/fotos-boda";
const carouselTrack = document.getElementById("carouselTrack");

const CLOUD_NAME = "mwbuyheu";
const UPLOAD_PRESET = "boda_invitados";

let lightboxZoom = 1;

// Memoria global para saber qué fotos hay cargadas y controlar el índice activo
let fotosCargadas = [];
let indiceFotoAmpliada = 0;

function crearLightboxFotos() {
  if (document.getElementById("photoLightbox")) return;

  const lightbox = document.createElement("div");
  lightbox.id = "photoLightbox";
  lightbox.className = "photo-lightbox";

  // Inyectamos la estructura completa incluyendo las nuevas flechas de navegación
  lightbox.innerHTML = `
    <div class="lightbox-inner">
      <button class="lightbox-close" id="lightboxClose" aria-label="Cerrar">×</button>
      
      <button class="lightbox-arrow prev" id="lightboxPrev">❮</button>
      <button class="lightbox-arrow next" id="lightboxNext">❯</button>

      <div class="lightbox-img-wrap">
        <img id="lightboxImg" class="lightbox-img" src="" alt="Foto ampliada">
      </div>

      <div class="lightbox-actions">
        <button class="lightbox-btn" id="zoomOutBtn">− Reducir</button>
        <button class="lightbox-btn" id="zoomResetBtn">Tamaño normal</button>
        <button class="lightbox-btn" id="zoomInBtn">+ Ampliar</button>
        <a class="lightbox-btn" id="lightboxDownload" target="_blank" rel="noopener" style="text-decoration:none; display:inline-flex; align-items:center;">📥 Descargar</a>
      </div>
    </div>
  `;

  document.body.appendChild(lightbox);

  // Escuchadores de eventos para la interfaz interna del Lightbox
  document.getElementById("lightboxClose").addEventListener("click", cerrarLightbox);
  
  document.getElementById("lightboxPrev").addEventListener("click", (e) => {
    e.stopPropagation();
    navegarFotoAmpliada(-1);
  });

  document.getElementById("lightboxNext").addEventListener("click", (e) => {
    e.stopPropagation();
    navegarFotoAmpliada(1);
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target.id === "photoLightbox") cerrarLightbox();
  });

  document.getElementById("zoomInBtn").addEventListener("click", () => cambiarZoom(0.25));
  document.getElementById("zoomOutBtn").addEventListener("click", () => cambiarZoom(-0.25));
  document.getElementById("zoomResetBtn").addEventListener("click", () => resetZoom());

  // Navegación adicional por teclado (Escape y Flechas Direccionales)
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("show")) return;
    if (e.key === "Escape") cerrarLightbox();
    if (e.key === "ArrowLeft") navegarFotoAmpliada(-1);
    if (e.key === "ArrowRight") navegarFotoAmpliada(1);
  });
}

function abrirLightbox(index) {
  crearLightboxFotos();

  if (fotosCargadas.length === 0) return;
  
  indiceFotoAmpliada = index;
  const src = fotosCargadas[indiceFotoAmpliada];

  const lightbox = document.getElementById("photoLightbox");
  const img = document.getElementById("lightboxImg");
  const downloadBtn = document.getElementById("lightboxDownload");

  // Ocultar flechas si en la base de datos solo existe una foto en total
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");
  if (prevBtn && nextBtn) {
    const estadoDisplay = fotosCargadas.length > 1 ? "flex" : "none";
    prevBtn.style.display = estadoDisplay;
    nextBtn.style.display = estadoDisplay;
  }

  lightboxZoom = 1;
  img.src = src;
  img.style.transform = `scale(${lightboxZoom})`;
  img.style.opacity = "1"; // Forzamos visibilidad inicial sin saltos

  if (downloadBtn) {
    downloadBtn.href = src;
    downloadBtn.download = `boda_recuerdo_${Date.now()}.jpg`;
  }

  lightbox.classList.add("show");
  document.body.style.overflow = "hidden";
}

function navegarFotoAmpliada(direccion) {
  if (fotosCargadas.length <= 1) return;

  const img = document.getElementById("lightboxImg");
  if (!img) return;

  // 1. Efecto Fundido: Ocultamos suavemente la foto activa cambiando la opacidad
  img.style.opacity = "0";

  // 2. Esperamos a que la transición termine (200ms) para cambiar la imagen
  setTimeout(() => {
    indiceFotoAmpliada += direccion;
    if (indiceFotoAmpliada >= fotosCargadas.length) indiceFotoAmpliada = 0;
    if (indiceFotoAmpliada < 0) indiceFotoAmpliada = fotosCargadas.length - 1;

    const nuevaUrl = fotosCargadas[indiceFotoAmpliada];
    img.src = nuevaUrl;
    
    const downloadBtn = document.getElementById("lightboxDownload");
    if (downloadBtn) downloadBtn.href = nuevaUrl;

    resetZoom(); // Reiniciamos el nivel de escala

    // 3. Cuando el navegador tenga lista la nueva foto, vuelve a lucir con opacidad completa
    img.onload = () => {
      img.style.opacity = "1";
    };
  }, 200); 
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

    if (!data.ok || !Array.isArray(data.fotos) || data.fotos.length === 0) {
      carouselTrack.innerHTML = `
        <div class="carousel-placeholder">
          <span>📸</span>
          <p>Aquí aparecerán las fotos que suban los invitados</p>
        </div>
      `;
      fotosCargadas = [];
      return;
    }

    // Almacenamos el listado original plano sin duplicaciones en memoria para las flechas
    fotosCargadas = data.fotos.map(foto => foto.url);

    // Duplicamos los elementos visuales únicamente para sostener el bucle infinito del CSS
    const fotosParaRenderizar = [...data.fotos, ...data.fotos];

    carouselTrack.innerHTML = fotosParaRenderizar.map((foto, index) => {
      const indiceReal = index % data.fotos.length;
      return `
        <div class="carousel-photo" data-index="${indiceReal}">
          <img src="${foto.url}" alt="Foto subida por invitados">
        </div>
      `;
    }).join("");

    // Vinculamos cada tarjeta con su índice correspondiente mapeado
    document.querySelectorAll(".carousel-photo").forEach((card) => {
      card.addEventListener("click", () => {
        const idx = parseInt(card.dataset.index, 10);
        abrirLightbox(idx);
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

/* ==========================================================================
   GESTIÓN DE MÚSICA CON AUTOPLAY SIMULADO Y MUTE CONFIGURADO
   ========================================================================== */
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
      .then(() => {
        actualizarBotonVisual(true);
      })
      .catch((err) => {
        console.log("El navegador bloqueó el audio en pantalla:", err);
      });
  }
}

function removerEscuchadoresGlobales() {
  document.removeEventListener("click", arrancarMusicaEnInteraccion);
  document.removeEventListener("touchstart", arrancarMusicaEnInteraccion);
}

window.addEventListener("load", () => {
  bgMusic.load();
  
  bgMusic.play()
    .then(() => {
      actualizarBotonVisual(true);
    })
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
      }
    } catch (error) {
      uploadMessage.textContent = "Error de conexión al subir la foto.";
      uploadMessage.className = "form-message error";
    }

    uploadBtn.disabled = false;
    uploadBtn.textContent = "Subir fotografía";
  });
}
