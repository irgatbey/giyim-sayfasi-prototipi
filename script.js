document.addEventListener("DOMContentLoaded", () => {
  console.log("EVO Script Başlatıldı...");

  // --- SCROLL LOCK HELPERS ---
  const lockScroll = () => {
    if (document.body.classList.contains("no-scroll")) return;

    // 1. O anki kaydırma pozisyonunu kaydet
    const scrollY = window.scrollY;

    // 2. Sayfayı tam o noktada dondur (CSS top özelliği ile)
    document.body.style.top = `-${scrollY}px`;
    document.body.classList.add("no-scroll");
  };

  const unlockScroll = () => {
    // 1. Dondurulmuş pozisyonu hafızadan geri çağır
    const scrollY = document.body.style.top;

    // 2. Kilidi kaldır ve stilleri temizle
    document.body.classList.remove("no-scroll");
    document.body.style.top = "";

    // 3. Kullanıcıyı kaldığı noktaya geri ışınla
    // (parseInt ile px yazısını sayıya çevirip, - işaretini düzeltiyoruz)
    window.scrollTo(0, parseInt(scrollY || "0") * -1);
  };

  // 1. Sayfayı en başa al (Refresh yapınca ortadan başlamasın)
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);

  // 2. Navbar Scroll Efekti
  const navbar = document.querySelector(".navbar");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

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
      unlockScroll();
      clearTimeout(animationTimeout);
    } else {
      body.classList.add("menu-open");
      lockScroll();
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

  const loader = document.querySelector(".loader");

  if (container && ctx) {
    // --- VİDEOLU SAYFA İÇİN (AĞIR YÜKLEME) ---
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
      const progressBar = document.querySelector(".progress-bar");
      const percentageText = document.querySelector(".loading-percentage");

      for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);
        img.onload = () => {
          images[i - 1] = img;
          loadedCount++;
          const percent = Math.round((loadedCount / frameCount) * 100);
          if (progressBar) progressBar.style.width = `${percent}%`;
          if (percentageText) percentageText.innerText = `${percent}%`;
          if (i === 1) {
            render(1);
            if (loadingText) loadingText.style.display = "none";
          }
          if (loadedCount === frameCount) {
            setTimeout(() => {
              if (loader) loader.classList.add("loaded");
              document.body.style.overflowY = "auto";
            }, 500);
          }
        };
        // Hata olursa da sayacı artır ki takılmasın
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === frameCount && loader)
            loader.classList.add("loaded");
        };
      }
    };
    preloadImages();
  } else {
    // --- NORMAL SAYFA İÇİN (HAFİF YÜKLEME) ---
    // Video yoksa bekleme yapma, sayfayı hemen aç
    window.addEventListener("load", () => {
      setTimeout(() => {
        if (loader) loader.classList.add("loaded");
        document.body.style.overflowY = "auto";
      }, 500); // Yarım saniye estetik bekleme
    });
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

  // ==========================================================
  // --- 7. PRODUCT QUICK VIEW MODAL (FIXED) ---
  // ==========================================================
  const modalBackdrop = document.querySelector(".product-modal-backdrop");
  const closeModalBtn = document.querySelector(".close-modal-btn");
  const allProductCards = document.querySelectorAll(".product-card");

  // Modal İçerik Elemanları
  const modalImg = document.getElementById("modal-img");
  const modalTitle = document.getElementById("modal-title");
  const modalPrice = document.getElementById("modal-price");
  const sizeOpts = document.querySelectorAll(".size-opt");
  const modalAddBtn = document.querySelector(".btn-modal-add");

  if (modalBackdrop && allProductCards.length > 0) {
    console.log("Modal sistemi devrede. Kart sayısı:", allProductCards.length);

    allProductCards.forEach((card) => {
      // 1. Resim kutusunu seç (Tıklama alanı)
      const imgBox = card.querySelector(".img-box");

      if (imgBox) {
        // Tıklanabilir olduğunu göster
        imgBox.style.cursor = "pointer";

        imgBox.addEventListener("click", (e) => {
          e.stopPropagation(); // Tıklamanın başka yere sıçramasını engelle
          console.log("Ürün resmine tıklandı!");

          // 2. VERİLERİ ÇEK (Daha güvenli yöntem)
          // Resim
          const imgElement = card.querySelector("img");
          // Başlık (h3)
          const titleElement = card.querySelector("h3");

          // Fiyat (Önce yeni yapıyı, bulamazsa eski yapıyı dener)
          let priceElement = card.querySelector(".price-action span");
          if (!priceElement) {
            priceElement = card.querySelector(".details span");
          }

          // 3. KONTROL ET VE MODALI DOLDUR
          if (imgElement && titleElement && priceElement) {
            modalImg.src = imgElement.src;
            modalTitle.innerText = titleElement.innerText;
            modalPrice.innerText = priceElement.innerText;

            // Modalı Aç
            modalBackdrop.classList.add("active");
            lockScroll();
          } else {
            console.error("HATA: Kart verileri eksik!", {
              img: imgElement,
              title: titleElement,
              price: priceElement,
            });
            alert("Ürün detayları yüklenemedi. Lütfen konsolu kontrol edin.");
          }
        });
      }
    });

    // --- MODAL KAPATMA İŞLEMLERİ ---
    const closeModal = () => {
      modalBackdrop.classList.remove("active");
      unlockScroll();
    };

    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

    // Siyah boşluğa tıklayınca kapat
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) closeModal();
    });

    // --- BEDEN SEÇİMİ ---
    if (sizeOpts) {
      sizeOpts.forEach((opt) => {
        opt.addEventListener("click", () => {
          sizeOpts.forEach((o) => o.classList.remove("selected"));
          opt.classList.add("selected");
        });
      });
    }
  }

  // ==========================================================
  // --- 10. ADVANCED CART SYSTEM (SEPET SİSTEMİ) ---
  // ==========================================================

  // --- Değişkenler ---
  let cart = []; // Sepet Dizisi
  const cartDrawer = document.querySelector(".cart-drawer");
  const cartOverlay = document.querySelector(".cart-overlay");
  const closeCartBtn = document.querySelector(".close-cart-btn");
  const cartItemsContainer = document.querySelector(".cart-items-container");
  const cartTotalDisplay = document.querySelector(".total-price");
  const cartCountDisplays = document.querySelectorAll(
    "#cart-count, .cart-count-display, .mobile-cart-count"
  );

  // Sepeti Aç/Kapat Fonksiyonları
  const openCart = () => {
    cartDrawer.classList.add("active");
    cartOverlay.classList.add("active");
    lockScroll();
  };

  const closeCart = () => {
    cartDrawer.classList.remove("active");
    cartOverlay.classList.remove("active");
    unlockScroll();
  };

  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCart);
  // Menüdeki "Sepet" yazısına basınca açılması için
  const navCartLink = document.getElementById("cart-count");
  if (navCartLink) navCartLink.addEventListener("click", openCart);
  const mobileCartBtn = document.querySelector(".mobile-cart-trigger");
  if (mobileCartBtn) mobileCartBtn.addEventListener("click", openCart);

  // --- Sepeti Ekrana Basma (Render) ---
  const renderCart = () => {
    // 1. İçeriği Temizle
    cartItemsContainer.innerHTML = "";

    // 2. Sepet Boşsa Mesaj Göster
    if (cart.length === 0) {
      cartItemsContainer.innerHTML =
        '<div class="empty-cart-msg">Sepetinizde ürün yok.</div>';
      cartTotalDisplay.innerText = "₺0";
      updateCartCount(0);
      return;
    }

    // 3. Ürünleri Listele
    let total = 0;
    cart.forEach((item, index) => {
      // Fiyatı sayıya çevir (₺4.500 -> 4500)
      let priceNum = parseFloat(item.price.replace(/[^\d]/g, "")); // Sadece rakamları al
      // Eğer fiyat 4500 gibi geliyorsa sorun yok, ama kuruşlu gelirse diye kontrol
      if (isNaN(priceNum)) priceNum = 0;

      total += priceNum;

      const itemEl = document.createElement("div");
      itemEl.classList.add("cart-item");
      itemEl.innerHTML = `
        <img src="${item.img}" alt="${item.title}">
        <div class="item-details">
          <h4>${item.title}</h4>
          <p>${item.price}</p>
          <span class="item-remove" data-index="${index}">Kaldır</span>
        </div>
      `;
      cartItemsContainer.appendChild(itemEl);
    });

    // 4. Toplamı ve Sayacı Güncelle
    cartTotalDisplay.innerText = "₺" + total.toLocaleString("tr-TR");
    updateCartCount(cart.length);

    // 5. Kaldır Butonlarına Event Ekle
    document.querySelectorAll(".item-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const indexToDelete = e.target.getAttribute("data-index");
        cart.splice(indexToDelete, 1); // Diziden sil
        renderCart(); // Tekrar çiz
      });
    });
  };

  const updateCartCount = (count) => {
    cartCountDisplays.forEach((el) => {
      // Eğer menüdeki ise "Sepet (X)", değilse sadece "X"
      if (el.id === "cart-count") el.innerText = `Sepet (${count})`;
      else el.innerText = count;
    });
  };

  // --- Ürün Ekleme Mantığı (Grid ve Modal İçin Ortak) ---
  const addToCartHandler = (btn, img, title, price) => {
    // 1. Buton Animasyonu (Pop Effect)
    btn.classList.add("animating");
    const originalText = btn.innerText;
    btn.innerText = "✓"; // Tik işareti

    setTimeout(() => {
      btn.classList.remove("animating");
      btn.innerText = originalText;
    }, 1000);

    // 2. Sepet Dizisine Ekle
    cart.push({ img, title, price });

    // 3. Sepeti Güncelle ve Aç
    renderCart();
    openCart();
  };

  // 1. GRID BUTONLARI İÇİN DİNLEME
  document.querySelectorAll(".btn-add-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Kart tıklamasını engelle
      const card = btn.closest(".product-card");
      const img = card.querySelector("img").src;
      const title = card.querySelector("h3").innerText;

      // Fiyat bulma (Yeni/Eski yapı uyumlu)
      let price = "₺0";
      const priceEl =
        card.querySelector(".price-action span") ||
        card.querySelector(".details span");
      if (priceEl) price = priceEl.innerText;

      addToCartHandler(btn, img, title, price);
    });
  });

  // 2. MODAL İÇİNDEKİ BUTON İÇİN DİNLEME
  const modalBtn = document.querySelector(".btn-modal-add");
  if (modalBtn) {
    modalBtn.addEventListener("click", () => {
      // 1. Ürünü sepete at ve çekmeceyi aç
      addToCartHandler(
        modalBtn,
        modalImg.src,
        modalTitle.innerText,
        modalPrice.innerText
      );

      // 2. Modalı arkada sessizce kapat (Scroll kilidini açmadan!)
      // 'active' sınıfını siliyoruz ama 'unlockScroll' çağırmıyoruz çünkü sepet zaten kilitli tutacak.
      modalBackdrop.classList.remove("active");
    });
  }
});
