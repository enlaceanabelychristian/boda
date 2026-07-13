// ==========================================================================
// 1. CONFIGURACIÓN INICIAL Y VARIABLES GLOBALES
// ==========================================================================

// Fecha objetivo de la boda (Modifica esta fecha por la real de tu gran día)
const FECHA_BODA = new Date("Sep 12, 2026 11:30:00").getTime();

// Array dinámico de fotos iniciales del slider (Simulación de base de datos)
let fotosBoda = [
  { url: "asset/fotos/iglesia.png" },
  { url: "asset/fotos/hacienda.png" },
  { url: "asset/fotos/bus.png" }
];

// Variables de control para el Slider Automático 16:9
let sliderIndex = 0;
let sliderInterval = null;

// Variable de control para el nivel de ampliación del Lightbox
let currentZoom = 1;

// Objeto de audio global para la música de fondo
const musicaBoda = new Audio("asset/musica/boda.mp3");
musicaBoda.loop = true;

// Instanciar elementos una vez cargado el DOM
document.addEventListener("DOMContentLoaded", () => {
  inicializarMenuMovil();
  inicializarCuentaAtras();
  inicializarMusica();
  inicializarFormularioRSVP();
  inicializarSubidaFotos();
  
  // Renderizar y arrancar el slider con las fotos base
  mostrarFotosEnWeb(fotosBoda);
});


// ==========================================================================
// 2. MENÚ NAVEGACIÓN MÓVIL
// ==========================================================================
function inicializarMenuMovil() {
  const menuBtn = document.getElementById("menuBtn");
  const navLinks = document.getElementById("navLinks");

  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });

  // Cerrar el menú automáticamente al hacer click en cualquier sección
  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("show");
    });
  });
}


// ==========================================================================
// 3. CUENTA ATRÁS (COUNTDOWN)
// ==========================================================================
function inicializarCuentaAtras() {
  const countdownContainer = document.getElementById("countdown");
  const elDays = document.getElementById("days");
  const elHours = document.getElementById("hours");
  const elMinutes = document.getElementById("minutes");
  const elSeconds = document.getElementById("seconds");

  if (!countdownContainer) return;

  function actualizarContador() {
    const ahora = new Date().getTime();
    const diferencia = FECHA_BODA - ahora;

    if (diferencia < 0) {
      countdownContainer.innerHTML = "<div style='grid-column: 1/-1; font-size: 24px; color: var(--dorado); font-weight: 600;'>¡Hoy es nuestro gran día! ❦</div>";
      clearInterval(intervaloContador);
      return;
    }

    // Cálculos de tiempo
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

    // Renderizado formateado con ceros a la izquierda
    if (elDays) elDays.textContent = String(dias).padStart(2, "0");
    if (elHours) elHours.textContent = String(horas).padStart(2, "0");
    if (elMinutes) elMinutes.textContent = String(minutos).padStart(2, "0");
    if (elSeconds) elSeconds.textContent = String(segundos).padStart(2, "0");
  }

  const intervaloContador = setInterval(actualizarContador, 1000);
  actualizarContador(); // Ejecución inmediata inicial
}


// ==========================================================================
// 4. CONTROLADOR DE MÚSICA DE FONDO
// ==========================================================================
function inicializarMusica() {
  const musicBtn = document.getElementById("musicBtn");
  if (!musicBtn) return;

  musicBtn.addEventListener("click", () => {
    if (musicaBoda.paused) {
      musicaBoda.play()
        .then(() => {
          musicBtn.classList.add("playing");
        })
        .catch(err => console.warn("Interacción requerida por el navegador antes de reproducir audio.", err));
    } else {
      musicaBoda.pause();
      musicBtn.classList.remove("playing");
    }
  });
}


// ==========================================================================
// 5. FORMULARIO RSVP (ASISTENCIA A GOOGLE SHEETS)
// ==========================================================================
function inicializarFormularioRSVP() {
  const rsvpForm = document.getElementById("rsvpForm");
  const asisteSelect = document.getElementById("asiste");
  const extraFields = document.getElementById("extraFields");
  const formMessage = document.getElementById("formMessage");
  const submitBtn = document.getElementById("submitBtn");

  if (!rsvpForm || !asisteSelect || !extraFields) return;

  // Mostrar u ocultar campos extras (Autobús, alergias) según respuesta
  asisteSelect.addEventListener("change", () => {
    if (asisteSelect.value === "Sí") {
      extraFields.classList.remove("hidden");
      extraFields.querySelectorAll("input, select").forEach(el => el.required = true);
    } else {
      extraFields.classList.add("hidden");
      extraFields.querySelectorAll("input, select").forEach(el => {
        el.required = false;
        el.value = ""; // Limpiar valores en caso de cambiar a 'No'
      });
    }
  });

  // Envío de datos al Web App Endpoint de Google Apps Script
  rsvpForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const endpoint = window.RSVP_ENDPOINT;
    if (!endpoint) {
      formMessage.textContent = "Error interno: Endpoint de comunicación no definido.";
      formMessage.className = "form-message error";
      return;
    }

    submitBtn.disabled = true;
    formMessage.textContent = "Procesando tu confirmación, por favor espera...";
    formMessage.className = "form-message";

    const formData = new FormData(rsvpForm);
    const dataObj = Object.fromEntries(formData.entries());

    fetch(endpoint, {
      method: "POST",
      mode: "no-cors", // Evita problemas de CORS estándar con Google Scripts
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataObj)
    })
    .then(() => {
      formMessage.textContent = "¡Muchas gracias! Tu confirmación ha sido registrada correctamente.";
      formMessage.className = "form-message success";
      rsvpForm.reset();
      extraFields.classList.add("hidden");
    })
    .catch(err => {
      console.error(err);
      formMessage.textContent = "Ha ocurrido un error al enviar. Por favor, inténtalo de nuevo.";
      formMessage.className = "form-message error";
    })
    .finally(() => {
      submitBtn.disabled = false;
    });
  });
}


// ==========================================================================
// 6. GESTIÓN DE SUBIDA DE FOTOS Y VISTA PREVIA
// ==========================================================================
function inicializarSubidaFotos() {
  const uploadForm = document.getElementById("uploadPhotoForm");
  const eventPhoto = document.getElementById("eventPhoto");
  const photoPreview = document.getElementById("photoPreview");
  const uploadBtn = document.getElementById("uploadBtn");
  const uploadMessage = document.getElementById("uploadMessage");

  if (!uploadForm || !eventPhoto || !photoPreview) return;

  // Generar vista previa instantánea en el navegador
  eventPhoto.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        photoPreview.src = event.target.result;
        photoPreview.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    }
  });

  // Simulación de subida exitosa e inserción local directa en el slider
  uploadForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    if (!eventPhoto.files[0]) return;

    uploadBtn.disabled = true;
    uploadMessage.textContent = "Subiendo imagen al álbum...";
    uploadMessage.className = "form-message";

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target.result;

      // Simulamos latencia de red de 1.5 segundos
      setTimeout(() => {
        uploadMessage.textContent = "¡Fotografía subida con éxito! Añadida al slider.";
        uploadMessage.className = "form-message success";
        
        // Insertamos la nueva foto al inicio del array y reiniciamos vista del slider
        fotosBoda.unshift({ url: base64Url });
        sliderIndex = 0;
        mostrarFotosEnWeb(fotosBoda);

        // Limpiar el formulario
        uploadForm.reset();
        photoPreview.classList.add("hidden");
        photoPreview.src = "";
        uploadBtn.disabled = false;
      }, 1500);
    };
    reader.readAsDataURL(eventPhoto.files[0]);
  });
}


// ==========================================================================
// 7. SLIDER AUTOMÁTICO 16:9 Y SISTEMA DE LIGHTBOX (CONTROLES DINÁMICOS)
// ==========================================================================

function inicializarSliderAutomatico() {
  const track = document.getElementById("carouselTrack");
  const slides = document.querySelectorAll(".carousel-photo");

  if (sliderInterval) clearInterval(sliderInterval);
  if (slides.length <= 1 || !track) return;

  sliderInterval = setInterval(() => {
    sliderIndex++;
    if (sliderIndex >= slides.length) {
      sliderIndex = 0;
    }
    // Desplazamos la pista multiplicando el índice actual por el 100% del contenedor
    track.style.transform = `translateX(-${sliderIndex * 100}%)`;
  }, 4000); // Cambio automático exacto cada 4 segundos
}

function mostrarFotosEnWeb(listaFotos) {
  const track = document.getElementById("carouselTrack");
  if (!track) return;

  if (!listaFotos || listaFotos.length === 0) {
    track.innerHTML = `
      <div class="carousel-placeholder">
        <span>📸</span>
        <p>Aquí aparecerán las fotos que suban los invitados</p>
      </div>`;
    return;
  }

  track.innerHTML = "";
  listaFotos.forEach(foto => {
    const slide = document.createElement("div");
    slide.className = "carousel-photo";
    slide.innerHTML = `<img src="${foto.url}" alt="Recuerdo de la boda Anabel y Christian" loading="lazy">`;
    
    // Evento de apertura del visualizador Lightbox
    slide.addEventListener("click", () => abrirLightbox(foto.url));
    track.appendChild(slide);
  });

  // Iniciar la lógica del temporizador automático
  inicializarSliderAutomatico();
}

// --- CREACIÓN E INYECCIÓN DINÁMICA DEL ELEMENTO LIGHTBOX EN EL HTML ---
function asegurarLightboxDOM() {
  if (document.getElementById("photoLightbox")) return;

  const lightbox = document.createElement("div");
  lightbox.className = 'photo-lightbox';
  lightbox.id = "photoLightbox";

  lightbox.innerHTML = `
    <div class="lightbox-inner">
      <button class="lightbox-close" id="closeLightboxBtn">&times;</button>
      <div class="lightbox-img-wrap">
        <img src="" alt="Visualización ampliada" class="lightbox-img" id="lightboxImg">
      </div>
      <div class="lightbox-actions">
        <button class="lightbox-btn" id="zoomInBtn">🔍+ Ampliar</button>
        <button class="lightbox-btn" id="zoomOutBtn">🔍- Reducir</button>
        <a href="" download="boda_recuerdo.png" class="lightbox-btn" id="downloadBtn">📥 Descargar</a>
      </div>
    </div>
  `;

  document.body.appendChild(lightbox);

  // Vincular los escuchadores de eventos a la interfaz generada
  document.getElementById("closeLightboxBtn").addEventListener("click", cerrarLightbox);
  document.getElementById("zoomInBtn").addEventListener("click", actionZoomIn);
  document.getElementById("zoomOutBtn").addEventListener("click", actionZoomOut);

  // Cerrar haciendo click en el fondo opaco exterior de la imagen
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) cerrarLightbox();
  });
}

function abrirLightbox(url) {
  asegurarLightboxDOM();

  const lightbox = document.getElementById("photoLightbox");
  const img = document.getElementById("lightboxImg");
  const downloadBtn = document.getElementById("downloadBtn");

  // Resetear siempre el nivel de escala Zoom al abrir una nueva foto
  currentZoom = 1;
  img.style.transform = `scale(${currentZoom})`;
  
  img.src = url;
  downloadBtn.href = url; // Vinculamos la URL para la descarga directa

  lightbox.classList.add("show");

  // Pausar temporalmente el paso automático del slider mientras se ve la imagen a detalle
  if (sliderInterval) clearInterval(sliderInterval);
}

function cerrarLightbox() {
  const lightbox = document.getElementById("photoLightbox");
  if (lightbox) {
    lightbox.classList.remove("show");
  }
  // Reanudar slider automático desde el punto donde se quedó
  inicializarSliderAutomatico();
}

function actionZoomIn() {
  const img = document.getElementById("lightboxImg");
  if (img && currentZoom < 2.5) { // Límite máximo controlado para no pixelar la imagen
    currentZoom += 0.25;
    img.style.transform = `scale(${currentZoom})`;
  }
}

function actionZoomOut() {
  const img = document.getElementById("lightboxImg");
  if (img && currentZoom > 0.75) { // Límite mínimo para evitar inversiones de escala
    currentZoom -= 0.25;
    img.style.transform = `scale(${currentZoom})`;
  }
}
