document.addEventListener("DOMContentLoaded", () => {
  console.log("EVO Script Başlatıldı...");

  // ==========================================================
  // --- 0. DEĞİŞKENLER (VIDEO ICIN) ---
  // ==========================================================
  const frameCount = 57;
  const images = [];
  let currentFrameIndex = 1;
  let isPlaying = false;

  const currentFrame = (index) => `./images/frame_${index}.jpg`;

  // Video Elementleri
  const container = document.querySelector(".video-scroll-container");
  const canvas = document.querySelector("#video-canvas");
  const loadingText = document.getElementById("loading-text");
  const textOverlay = document.querySelector(".video-overlay-text");

  // Canvas Context (Sadece element varsa)
  let ctx;
  if (container && canvas) {
    ctx = canvas.getContext("2d");
  }

  // ==========================================================
  // --- 1. GENEL ETKİLEŞİMLER ---
  // ==========================================================

  // Cursor
  const cursor = document.querySelector(".cursor");
  const follower = document.querySelector(".cursor-follower");
  if (window.innerWidth > 768 && cursor && follower) {
    document.addEventListener("mousemove", (e) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
      setTimeout(() => {
        follower.style.left = e.clientX + "px";
        follower.style.top = e.clientY + "px";
      }, 50);
    });
    document
      .querySelectorAll("a, .hamburger-menu, .product-card, .btn-primary")
      .forEach((el) => {
        el.addEventListener("mouseenter", () =>
          follower.classList.add("cursor-active")
        );
        el.addEventListener("mouseleave", () =>
          follower.classList.remove("cursor-active")
        );
      });
  }

  // Menu
  const hamburger = document.querySelector(".hamburger-menu");
  const backdrop = document.querySelector(".menu-backdrop");
  const body = document.body;
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  let animationTimeout;

  function toggleMenu() {
    if (body.classList.contains("menu-open")) {
      body.classList.remove("menu-open");
      body.classList.remove("animation-done");
      body.style.overflow = "";
      clearTimeout(animationTimeout);
    } else {
      body.classList.add("menu-open");
      body.style.overflow = "hidden";
      animationTimeout = setTimeout(() => {
        if (body.classList.contains("menu-open"))
          body.classList.add("animation-done");
      }, 800);
    }
  }
  if (hamburger) hamburger.addEventListener("click", toggleMenu);
  if (backdrop)
    backdrop.addEventListener("click", () => {
      if (body.classList.contains("menu-open")) toggleMenu();
    });
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (body.classList.contains("menu-open")) toggleMenu();
    });
  });

  // Scroll Reveal
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("active");
      });
    },
    { threshold: 0.1 }
  );
  document
    .querySelectorAll(".reveal-scroll")
    .forEach((el) => observer.observe(el));

  // Smooth Scroll
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });

  // ==========================================================
  // --- 2. VIDEO PLAYER (AUTO LOOP) ---
  // ==========================================================

  if (container && ctx) {
    // Sığdırma
    function drawImageContain(ctx, img) {
      const cw = ctx.canvas.width;
      const ch = ctx.canvas.height;
      const imgRatio = img.width / img.height;
      const canvasRatio = cw / ch;
      let rw, rh, sx, sy;

      if (canvasRatio > imgRatio) {
        rh = ch;
        rw = img.width * (ch / img.height);
        sx = (cw - rw) / 2;
        sy = 0;
      } else {
        rw = cw;
        rh = img.height * (cw / img.width);
        sx = 0;
        sy = (ch - rh) / 2;
      }

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, sx, sy, rw, rh);
    }

    const render = (index) => {
      if (images[index - 1] && images[index - 1].complete) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawImageContain(ctx, images[index - 1]);
      }
    };

    // Animation Loop
    let lastTime = 0;
    const fps = 24;
    const interval = 1000 / fps;

    function playSequence(timestamp) {
      if (!isPlaying) return;
      if (timestamp - lastTime >= interval) {
        lastTime = timestamp;
        currentFrameIndex++;
        if (currentFrameIndex > frameCount) currentFrameIndex = 1;
        render(currentFrameIndex);
      }
      requestAnimationFrame(playSequence);
    }

    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!isPlaying) {
              isPlaying = true;
              requestAnimationFrame(playSequence);
              if (textOverlay) textOverlay.style.opacity = 1;
            }
          } else {
            isPlaying = false;
          }
        });
      },
      { threshold: 0.5 }
    );
    videoObserver.observe(container);

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (images.length > 0) render(currentFrameIndex);
    };
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const preloadImages = () => {
      let loadedCount = 0;
      const loader = document.querySelector(".loader");
      const progressBar = document.querySelector(".progress-bar");
      const percentageText = document.querySelector(".loading-percentage");

      for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);

        img.onload = () => {
          images[i - 1] = img;
          loadedCount++;

          // Yüzde Hesaplama
          const percent = Math.round((loadedCount / frameCount) * 100);

          // UI Güncelleme
          if (progressBar) progressBar.style.width = `${percent}%`;
          if (percentageText) percentageText.innerText = `${percent}%`;

          // İlk kare yüklendiğinde render al (bekletme yapmamak için)
          if (i === 1) {
            render(1);
            if (loadingText) loadingText.style.display = "none";
          }

          // Hepsi yüklendiğinde
          if (loadedCount === frameCount) {
            setTimeout(() => {
              if (loader) loader.classList.add("loaded");
              // Sayfa gövdesi scroll'u aç
              document.body.style.overflowY = "auto";
            }, 500); // %100 olduktan sonra yarım saniye bekle
          }
        };

        img.onerror = () => {
          console.error(`Görsel yüklenemedi: frame_${i}.jpg`);
          // Hata olsa bile sayacı artır ki loader takılı kalmasın
          loadedCount++;
          if (loadedCount === frameCount) {
            if (loader) loader.classList.add("loaded");
          }
        };
      }
    };
    preloadImages();
  }

  // ==========================================================
  // --- 3. DRAGGABLE GALLERY ---
  // ==========================================================

  const slider = document.querySelector(".drag-track-container");
  const track = document.querySelector(".drag-track");
  let isDown = false,
    startX,
    currentTranslate = 0,
    prevTranslate = 0;

  if (slider && track) {
    slider.addEventListener("mousedown", (e) => {
      isDown = true;
      slider.style.cursor = "grabbing";
      startX = e.pageX - slider.offsetLeft;
    });

    slider.addEventListener("mouseleave", () => {
      isDown = false;
      slider.style.cursor = "grab";
    });
    slider.addEventListener("mouseup", () => {
      isDown = false;
      slider.style.cursor = "grab";
      prevTranslate = currentTranslate;
    });

    slider.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 1.5;
      currentTranslate = prevTranslate + walk;

      if (currentTranslate > 0) currentTranslate = 0;
      const maxScroll = -(track.offsetWidth - slider.offsetWidth + 100);
      if (currentTranslate < maxScroll) currentTranslate = maxScroll;

      track.style.transform = `translateX(${currentTranslate}px)`;
    });

    // Touch Events
    slider.addEventListener(
      "touchstart",
      (e) => {
        isDown = true;
        startX = e.touches[0].pageX - slider.offsetLeft;
      },
      { passive: true }
    );

    slider.addEventListener("touchend", () => {
      isDown = false;
      prevTranslate = currentTranslate;
    });

    slider.addEventListener(
      "touchmove",
      (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.5;
        currentTranslate = prevTranslate + walk;
        if (currentTranslate > 0) currentTranslate = 0;
        const maxScroll = -(track.offsetWidth - slider.offsetWidth + 50);
        if (currentTranslate < maxScroll) currentTranslate = maxScroll;
        track.style.transform = `translateX(${currentTranslate}px)`;
      },
      { passive: true }
    );
  }

  // ==========================================================
  // --- 4. SEPET İŞLEMLERİ (CART ACTION) ---
  // ==========================================================
  const cartCountEl = document.getElementById("cart-count");
  const addButtons = document.querySelectorAll(".btn-add-cart");
  let cartCount = 0;

  if (cartCountEl && addButtons) {
    addButtons.forEach((btn) => {
      btn.addEventListener("click", function (e) {
        // Butona art arda basılmasını engelle (spam koruması)
        if (this.classList.contains("added")) return;

        // 1. Sepeti Artır
        cartCount++;
        cartCountEl.innerText = `Sepet (${cartCount})`;

        // 2. Buton Görsel Değişimi
        const originalText = this.innerText;
        this.innerText = "EKLENDİ";
        this.classList.add("added");

        // 3. 1.5 Saniye Sonra Eski Haline Dön
        setTimeout(() => {
          this.innerText = originalText;
          this.classList.remove("added");
        }, 1500);
      });

      // Cursor efekti için (opsiyonel, mevcut kod yapısına uygun)
      btn.addEventListener("mouseenter", () => {
        if (follower) follower.classList.add("cursor-active");
      });
      btn.addEventListener("mouseleave", () => {
        if (follower) follower.classList.remove("cursor-active");
      });
    });
  }

  // ==========================================================
  // --- 5. NEWSLETTER FORM HANDLER ---
  // ==========================================================
  const newsletterForm = document.getElementById("newsletter-form");

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault(); // Sayfa yenilenmesini engelle

      const btn = newsletterForm.querySelector(".btn-submit");
      const input = newsletterForm.querySelector("input");
      const msg = newsletterForm.querySelector(".form-message");

      // Buton animasyonu
      const originalText = btn.innerText;
      btn.innerText = "BEKLE...";

      // Simüle edilmiş sunucu isteği (1.5 saniye)
      setTimeout(() => {
        btn.innerText = originalText;
        input.value = ""; // Input'u temizle
        msg.innerText = "LİSTEYE EKLENDİNİZ. TEŞEKKÜRLER.";
        msg.classList.add("visible");

        // 3 saniye sonra mesajı gizle
        setTimeout(() => {
          msg.classList.remove("visible");
        }, 3000);
      }, 1500);
    });
  }

  // ==========================================================
  // --- 6. SIDEBAR GÖRSEL ÖNİZLEME (HOVER EFFECT) ---
  // ==========================================================
  const sidebarMenu = document.querySelector(".sidebar-menu");
  const sidebarPreviewImg = document.querySelector(
    ".sidebar-image-preview img"
  );
  const menuLinks = document.querySelectorAll(".sidebar-link");

  if (sidebarMenu && sidebarPreviewImg && menuLinks) {
    menuLinks.forEach((link) => {
      link.addEventListener("mouseenter", function () {
        const imgSrc = this.getAttribute("data-img");
        if (imgSrc) {
          sidebarPreviewImg.src = imgSrc;
          sidebarMenu.classList.add("has-preview");
        }
      });

      // Opsiyonel: Mouse menüden (linklerden) tamamen çıkarsa görseli gizle
      // Ama menü içinde başka linke geçerken görselin kaybolmaması için
      // bu event'i sadece tüm linklerin kapsayıcısına verebiliriz.
    });

    const linksContainer = document.querySelector(".sidebar-links");
    if (linksContainer) {
      linksContainer.addEventListener("mouseleave", () => {
        sidebarMenu.classList.remove("has-preview");
      });
    }
  }
});
