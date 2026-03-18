/* ============================================
   LEBAS FASHION — Client Panel Logic
   ============================================ */

(function() {
  'use strict';

  // ============================================
  // STATE
  // ============================================
  const dataCache = {
    categories: null,
    subcategories: null,
    genderTypes: null,
    products: null,
    siteContent: null,
    set: function(key, data) { this[key] = data; },
    get: function(key) { return this[key]; },
    getAsArray: function(key) {
      const data = this[key];
      if (!data) return [];
      return Object.entries(data).map(([id, val]) => ({ id, ...val }));
    }
  };
  const state = {
    currentView: 'home', // home | subcategories | genders | products
    selectedCategory: null,
    selectedSubcategory: null,
    selectedGender: null,
    lazyObserver: null
  };

  // ============================================
  // DOM REFERENCES
  // ============================================
  const DOM = {
    // Loader
    pageLoader: document.getElementById('pageLoader'),
    // Navbar
    navbar: document.getElementById('navbar'),
    navLinks: document.getElementById('navLinks'),
    navHamburger: document.getElementById('navHamburger'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    // Hero
    heroSlider: document.getElementById('heroSlider'),
    heroDots: document.getElementById('heroDots'),
    heroTitle: document.getElementById('heroTitle'),
    heroSubtitle: document.getElementById('heroSubtitle'),
    // Categories
    categoriesGrid: document.getElementById('categoriesGrid'),
    // Browse
    browseSection: document.getElementById('browseSection'),
    breadcrumb: document.getElementById('breadcrumb'),
    subcategoryView: document.getElementById('subcategoryView'),
    subcategoryTitle: document.getElementById('subcategoryTitle'),
    subcategoryGrid: document.getElementById('subcategoryGrid'),
    genderView: document.getElementById('genderView'),
    genderTitle: document.getElementById('genderTitle'),
    genderGrid: document.getElementById('genderGrid'),
    productsView: document.getElementById('productsView'),
    productsTitle: document.getElementById('productsTitle'),
    productsFilterBar: document.getElementById('productsFilterBar'),
    productsGrid: document.getElementById('productsGrid'),
    productsEmpty: document.getElementById('productsEmpty'),
    // Featured
    featuredSlider: document.getElementById('featuredSlider'),
    sliderPrev: document.getElementById('sliderPrev'),
    sliderNext: document.getElementById('sliderNext'),
    // Gallery
    expandGallery: document.getElementById('expandGallery'),
    // Content
    aboutText: document.getElementById('aboutText'),
    philosophyText: document.getElementById('philosophyText'),
    premiumText: document.getElementById('premiumText'),
    // Contact
    contactPhone: document.getElementById('contactPhone'),
    contactEmail: document.getElementById('contactEmail'),
    contactAddress: document.getElementById('contactAddress'),
    // Modal
    productModal: document.getElementById('productModal'),
    modalClose: document.getElementById('modalClose'),
    modalMainImage: document.getElementById('modalMainImage'),
    modalThumbnails: document.getElementById('modalThumbnails'),
    modalProductName: document.getElementById('modalProductName'),
    modalProductPrice: document.getElementById('modalProductPrice'),
    modalProductDesc: document.getElementById('modalProductDesc'),
    modalSizes: document.getElementById('modalSizes'),
    modalSizeChartBtn: document.getElementById('modalSizeChartBtn'),
    modalSizeChartContainer: document.getElementById('modalSizeChartContainer'),
    modalSizeChartImg: document.getElementById('modalSizeChartImg'),
    modalWhatsappBtn: document.getElementById('modalWhatsappBtn'),
    // WhatsApp
    whatsappFloat: document.getElementById('whatsappFloat'),
    // Back to top
    backToTop: document.getElementById('backToTop'),
    // Footer
    footerYear: document.getElementById('footerYear')
  };

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    setupNavbar();
    setupSearch();
    setupModal();
    setupSliderControls();
    setupBackToTop();
    setupFooter();
    setupContactForm();
    setupChatbot();
    listenToFirebase();

    // Hide loader after data starts loading
    setTimeout(() => {
      if (DOM.pageLoader) {
        DOM.pageLoader.classList.add('hidden');
        setTimeout(() => DOM.pageLoader.remove(), 500);
      }
    }, 1500);
  }

  // ============================================
  // NAVBAR
  // ============================================
  function setupNavbar() {
    // Scroll effect
    window.addEventListener('scroll', () => {
      DOM.navbar.classList.toggle('scrolled', window.scrollY > 60);
      DOM.backToTop.classList.toggle('visible', window.scrollY > 400);
    });

    // Hamburger toggle
    DOM.navHamburger.addEventListener('click', () => {
      DOM.navHamburger.classList.toggle('open');
      DOM.navLinks.classList.toggle('open');
    });

    // Nav link clicks
    DOM.navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        // Close mobile menu
        DOM.navHamburger.classList.remove('open');
        DOM.navLinks.classList.remove('open');

        // Show home sections, hide browse
        showHomeView();
      });
    });
  }

  function showHomeView() {
    state.currentView = 'home';
    state.selectedCategory = null;
    state.selectedSubcategory = null;
    state.selectedGender = null;
    DOM.browseSection.style.display = 'none';
    document.getElementById('categories').style.display = '';
    document.getElementById('featured').style.display = '';
    document.getElementById('gallerySection').style.display = '';
    document.getElementById('brand').style.display = '';
    document.getElementById('contact').style.display = '';
  }

  function showBrowseView() {
    DOM.browseSection.style.display = '';
    // Hide other sections
    document.getElementById('categories').style.display = 'none';
    document.getElementById('featured').style.display = 'none';
    document.getElementById('gallerySection').style.display = 'none';
    document.getElementById('brand').style.display = 'none';
    document.getElementById('contact').style.display = 'none';
    DOM.browseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ============================================
  // FIREBASE LISTENERS
  // ============================================
  function listenToFirebase() {
    // Categories
    db.ref('categories').on('value', snap => {
      dataCache.set('categories', snap.val());
      renderCategories();
    });

    // Subcategories
    db.ref('subcategories').on('value', snap => {
      dataCache.set('subcategories', snap.val());
      if (state.currentView === 'subcategories') renderSubcategories();
    });

    // Gender Types
    db.ref('genderTypes').on('value', snap => {
      dataCache.set('genderTypes', snap.val());
      if (state.currentView === 'genders') renderGenders();
    });

    // Products
    db.ref('products').on('value', snap => {
      dataCache.set('products', snap.val());
      renderFeatured();
      renderGallery();
      if (state.currentView === 'products') renderProducts();
    });

    // Site Content
    db.ref('siteContent').on('value', snap => {
      const content = snap.val();
      dataCache.set('siteContent', content);
      if (content) {
        renderHero(content.hero);
        renderSiteContent(content);
        renderContact(content.contact);
        applyTheme(content.theme);
      }
    });
  }

  let heroSlideIndex = 0;
  let heroSlideTimer = null;

  function renderHero(hero) {
    if (!hero) return;
    if (hero.title) DOM.heroTitle.textContent = hero.title;
    if (hero.subtitle) DOM.heroSubtitle.textContent = hero.subtitle;

    // Build slides from images array (or single image for backwards compat)
    let images = [];
    if (hero.images && Array.isArray(hero.images)) {
      images = hero.images.filter(img => img);
    } else if (hero.image) {
      images = [hero.image];
    }

    if (images.length === 0) return;

    DOM.heroSlider.innerHTML = '';
    DOM.heroDots.innerHTML = '';

    images.forEach((img, i) => {
      const slide = document.createElement('div');
      slide.className = 'hero-slide' + (i === 0 ? ' active' : '');
      slide.style.backgroundImage = `url('${img}')`;
      DOM.heroSlider.appendChild(slide);

      const dot = document.createElement('div');
      dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => goToHeroSlide(i));
      DOM.heroDots.appendChild(dot);
    });

    // Only show dots if more than 1 image
    DOM.heroDots.style.display = images.length > 1 ? 'flex' : 'none';

    // Auto-slide
    if (heroSlideTimer) clearInterval(heroSlideTimer);
    if (images.length > 1) {
      heroSlideTimer = setInterval(() => {
        goToHeroSlide((heroSlideIndex + 1) % images.length);
      }, 5000);
    }
  }

  function goToHeroSlide(index) {
    const slides = DOM.heroSlider.querySelectorAll('.hero-slide');
    const dots = DOM.heroDots.querySelectorAll('.hero-dot');
    if (slides.length === 0) return;

    slides[heroSlideIndex].classList.remove('active');
    dots[heroSlideIndex].classList.remove('active');
    heroSlideIndex = index;
    slides[heroSlideIndex].classList.add('active');
    dots[heroSlideIndex].classList.add('active');
  }

  // ============================================
  // RENDER: SITE CONTENT
  // ============================================
  function renderSiteContent(content) {
    if (content.about && content.about.text) {
      DOM.aboutText.textContent = content.about.text;
    }
    if (content.philosophy && content.philosophy.text) {
      DOM.philosophyText.textContent = content.philosophy.text;
    }
    if (content.premium && content.premium.text) {
      DOM.premiumText.textContent = content.premium.text;
    }
  }

  function renderContact(contact) {
    if (!contact) return;
    if (contact.phone) {
      DOM.contactPhone.textContent = contact.phone;
      // Update WhatsApp links
      const waNumber = contact.phone.replace(/[^0-9+]/g, '');
      DOM.whatsappFloat.href = `https://wa.me/${waNumber}`;
    }
    if (contact.email) DOM.contactEmail.textContent = contact.email;
    if (contact.address) DOM.contactAddress.textContent = contact.address;
  }

  // ============================================
  // RENDER: CATEGORIES
  // ============================================
  function renderCategories() {
    const cats = dataCache.getAsArray('categories');
    cats.sort((a, b) => (a.order || 0) - (b.order || 0));

    const products = dataCache.getAsArray('products');

    DOM.categoriesGrid.innerHTML = '';

    if (cats.length === 0) {
      DOM.categoriesGrid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <p>Collections coming soon...</p>
        </div>`;
      return;
    }

    cats.forEach(cat => {
      const count = products.filter(p => p.categoryId === cat.id).length;
      const card = createElement('div', 'category-card reveal');
      card.innerHTML = `
        <div class="card-image" style="background-image:url('${escapeHtml(cat.image || '')}')"></div>
        <div class="card-content">
          <h3 class="card-title">${escapeHtml(cat.name)}</h3>
          <span class="card-count">${count} Collection${count !== 1 ? 's' : ''}</span>
        </div>
      `;
      card.addEventListener('click', () => navigateToCategory(cat));
      DOM.categoriesGrid.appendChild(card);
    });

    initScrollReveal();
    refreshLazyLoad();
  }

  // ============================================
  // NAVIGATION FLOW
  // ============================================
  function navigateToCategory(cat) {
    state.currentView = 'subcategories';
    state.selectedCategory = cat;
    state.selectedSubcategory = null;
    state.selectedGender = null;
    showBrowseView();
    renderBreadcrumb();
    renderSubcategories();
  }

  function navigateToSubcategory(sub) {
    state.currentView = 'genders';
    state.selectedSubcategory = sub;
    state.selectedGender = null;
    renderBreadcrumb();
    renderGenders();
  }

  function navigateToGender(gender) {
    state.currentView = 'products';
    state.selectedGender = gender;
    renderBreadcrumb();
    renderProducts();
  }

  // ============================================
  // BREADCRUMB
  // ============================================
  function renderBreadcrumb() {
    DOM.breadcrumb.innerHTML = '';

    // Home
    const homeLink = createElement('a', '', 'Home');
    homeLink.href = '#';
    homeLink.addEventListener('click', (e) => { e.preventDefault(); showHomeView(); });
    DOM.breadcrumb.appendChild(homeLink);

    if (state.selectedCategory) {
      DOM.breadcrumb.appendChild(createElement('span', 'sep', '›'));
      if (state.currentView === 'subcategories') {
        DOM.breadcrumb.appendChild(createElement('span', 'current', state.selectedCategory.name));
      } else {
        const catLink = createElement('a', '', state.selectedCategory.name);
        catLink.href = '#';
        catLink.addEventListener('click', (e) => {
          e.preventDefault();
          navigateToCategory(state.selectedCategory);
        });
        DOM.breadcrumb.appendChild(catLink);
      }
    }

    if (state.selectedSubcategory) {
      DOM.breadcrumb.appendChild(createElement('span', 'sep', '›'));
      if (state.currentView === 'genders') {
        DOM.breadcrumb.appendChild(createElement('span', 'current', state.selectedSubcategory.name));
      } else {
        const subLink = createElement('a', '', state.selectedSubcategory.name);
        subLink.href = '#';
        subLink.addEventListener('click', (e) => {
          e.preventDefault();
          navigateToSubcategory(state.selectedSubcategory);
        });
        DOM.breadcrumb.appendChild(subLink);
      }
    }

    if (state.selectedGender) {
      DOM.breadcrumb.appendChild(createElement('span', 'sep', '›'));
      DOM.breadcrumb.appendChild(createElement('span', 'current', state.selectedGender.name));
    }
  }

  // ============================================
  // RENDER: SUBCATEGORIES
  // ============================================
  function renderSubcategories() {
    DOM.subcategoryView.style.display = '';
    DOM.genderView.style.display = 'none';
    DOM.productsView.style.display = 'none';

    const cat = state.selectedCategory;
    DOM.subcategoryTitle.textContent = cat.name;

    const allSubs = dataCache.getAsArray('subcategories');
    const subs = allSubs.filter(s => s.categoryId === cat.id);

    DOM.subcategoryGrid.innerHTML = '';

    if (subs.length === 0) {
      DOM.subcategoryGrid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
            </svg>
          </div>
          <p>No subcategories available yet.</p>
        </div>`;
      return;
    }

    subs.forEach(sub => {
      const card = createElement('div', 'subcategory-card');
      card.innerHTML = `
        ${sub.image ? `<img class="sub-image" src="${escapeHtml(sub.image)}" alt="${escapeHtml(sub.name)}">` : ''}
        <div class="sub-name">${escapeHtml(sub.name)}</div>
      `;
      card.addEventListener('click', () => navigateToSubcategory(sub));
      DOM.subcategoryGrid.appendChild(card);
    });
  }

  // ============================================
  // RENDER: GENDERS
  // ============================================
  function renderGenders() {
    DOM.subcategoryView.style.display = 'none';
    DOM.genderView.style.display = '';
    DOM.productsView.style.display = 'none';

    const sub = state.selectedSubcategory;
    DOM.genderTitle.textContent = sub.name;

    const allGenders = dataCache.getAsArray('genderTypes');
    const genders = allGenders.filter(g => g.subcategoryId === sub.id);

    DOM.genderGrid.innerHTML = '';

    if (genders.length === 0) {
      // No gender layer → show products directly
      state.currentView = 'products';
      state.selectedGender = null;
      renderBreadcrumb();
      renderProducts();
      return;
    }

    const genderIcons = {
      'Men': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:32px;height:32px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`,
      'Women': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:32px;height:32px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`,
      'Unisex': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:32px;height:32px;"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632l-.037-.666m15.032 0a11.943 11.943 0 00-15.032 0m15.032 0a11.943 11.943 0 00-15.032 0M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zm-15.032 14.72a9.094 9.094 0 01-3.741-.479 3 3 0 014.682-2.72m-.94 3.198h.001" /></svg>`,
      'Kids': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:32px;height:32px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm3.626 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z" /></svg>`
    };

    genders.forEach(g => {
      const card = createElement('div', 'gender-card');
      const iconHtml = genderIcons[g.name] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:32px;height:32px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" /></svg>`;
      card.innerHTML = `
        <div class="gender-icon">${iconHtml}</div>
        <div class="gender-name">${escapeHtml(g.name)}</div>
      `;
      card.addEventListener('click', () => navigateToGender(g));
      DOM.genderGrid.appendChild(card);
    });
  }

  // ============================================
  // RENDER: PRODUCTS
  // ============================================
  function renderProducts() {
    DOM.subcategoryView.style.display = 'none';
    DOM.genderView.style.display = 'none';
    DOM.productsView.style.display = '';

    const cat = state.selectedCategory;
    const sub = state.selectedSubcategory;
    const gender = state.selectedGender;

    let title = cat ? cat.name : 'Products';
    if (sub) title = sub.name;
    if (gender) title += ` — ${gender.name}`;
    DOM.productsTitle.textContent = title;

    const allProducts = dataCache.getAsArray('products');
    let filtered = allProducts;

    if (cat) filtered = filtered.filter(p => p.categoryId === cat.id);
    if (sub) filtered = filtered.filter(p => p.subcategoryId === sub.id);
    if (gender) filtered = filtered.filter(p => p.gender === gender.name);

    DOM.productsGrid.innerHTML = '';

    if (filtered.length === 0) {
      DOM.productsEmpty.style.display = '';
      return;
    }

    DOM.productsEmpty.style.display = 'none';

    filtered.forEach(product => {
      DOM.productsGrid.appendChild(createProductCard(product));
    });

    refreshLazyLoad();
  }

  // ============================================
  // PRODUCT CARD
  // ============================================
  function createProductCard(product) {
    const card = createElement('div', 'product-card');
    const mainImage = (product.images && product.images.length > 0) ? product.images[0] : '';

    card.innerHTML = `
      <div class="product-image-wrapper">
        <img class="product-image" data-src="${escapeHtml(mainImage)}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400'%3E%3Crect fill='%231a1a1a' width='300' height='400'/%3E%3C/svg%3E" alt="${escapeHtml(product.name)}" loading="lazy">
        ${product.featured ? '<span class="product-badge">Featured</span>' : ''}
      </div>
      <div class="product-info">
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <p class="product-price">${formatPrice(product.price)}</p>
        <div class="product-sizes">
          ${(product.sizes || []).map(s => `<span class="size-tag">${escapeHtml(s)}</span>`).join('')}
        </div>
        <button class="product-inquiry-btn">View Details</button>
      </div>
    `;

    card.querySelector('.product-inquiry-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openProductModal(product);
    });

    card.addEventListener('click', () => openProductModal(product));

    return card;
  }

  // ============================================
  // FEATURED SLIDER
  // ============================================
  function renderFeatured() {
    const products = dataCache.getAsArray('products');
    const featured = products.filter(p => p.featured);

    DOM.featuredSlider.innerHTML = '';

    if (featured.length === 0) {
      document.getElementById('featured').style.display = 'none';
      return;
    }

    document.getElementById('featured').style.display = '';

    featured.forEach(product => {
      DOM.featuredSlider.appendChild(createProductCard(product));
    });

    refreshLazyLoad();
  }

  function setupSliderControls() {
    DOM.sliderPrev.addEventListener('click', () => {
      DOM.featuredSlider.scrollBy({ left: -320, behavior: 'smooth' });
    });
    DOM.sliderNext.addEventListener('click', () => {
      DOM.featuredSlider.scrollBy({ left: 320, behavior: 'smooth' });
    });
  }

  // ============================================
  // HOVER EXPAND GALLERY
  // ============================================
  function renderGallery() {
    const products = dataCache.getAsArray('products');
    const allImages = [];

    // Collect images from featured products first, then others
    const featured = products.filter(p => p.featured);
    const rest = products.filter(p => !p.featured);
    [...featured, ...rest].forEach(p => {
      if (p.images) {
        p.images.forEach(img => {
          if (allImages.length < 5) {
            allImages.push({ url: img, name: p.name });
          }
        });
      }
    });

    DOM.expandGallery.innerHTML = '';

    if (allImages.length === 0) {
      document.getElementById('gallerySection').style.display = 'none';
      return;
    }

    document.getElementById('gallerySection').style.display = '';

    allImages.forEach(img => {
      const item = createElement('div', 'gallery-item');
      item.innerHTML = `
        <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.name)}" loading="lazy">
        <div class="gallery-label">${escapeHtml(img.name)}</div>
      `;
      DOM.expandGallery.appendChild(item);
    });
  }

  // ============================================
  // PRODUCT MODAL
  // ============================================
  function openProductModal(product) {
    const images = product.images || [];
    const mainImage = images[0] || '';

    DOM.modalMainImage.src = mainImage;
    DOM.modalProductName.textContent = product.name || '';
    DOM.modalProductPrice.textContent = formatPrice(product.price);
    DOM.modalProductDesc.textContent = product.description || '';

    // Thumbnails
    DOM.modalThumbnails.innerHTML = '';
    images.forEach((img, i) => {
      const thumb = document.createElement('img');
      thumb.src = img;
      thumb.alt = `${product.name} ${i + 1}`;
      if (i === 0) thumb.classList.add('active');
      thumb.addEventListener('click', () => {
        DOM.modalMainImage.src = img;
        DOM.modalThumbnails.querySelectorAll('img').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
      DOM.modalThumbnails.appendChild(thumb);
    });

    // Sizes
    DOM.modalSizes.innerHTML = '';
    (product.sizes || []).forEach(s => {
      const tag = createElement('span', 'modal-size-tag', escapeHtml(s));
      DOM.modalSizes.appendChild(tag);
    });

    // Size Chart
    if (product.sizeChart) {
      DOM.modalSizeChartBtn.style.display = 'inline-block';
      DOM.modalSizeChartImg.src = product.sizeChart;
      DOM.modalSizeChartContainer.style.display = 'none';
      DOM.modalSizeChartBtn.textContent = 'View Size Chart';

      // Clone to remove old listeners
      const newBtn = DOM.modalSizeChartBtn.cloneNode(true);
      DOM.modalSizeChartBtn.parentNode.replaceChild(newBtn, DOM.modalSizeChartBtn);
      DOM.modalSizeChartBtn = newBtn;
      
      DOM.modalSizeChartBtn.addEventListener('click', () => {
        const isHidden = DOM.modalSizeChartContainer.style.display === 'none';
        DOM.modalSizeChartContainer.style.display = isHidden ? 'block' : 'none';
        DOM.modalSizeChartBtn.textContent = isHidden ? 'Hide Size Chart' : 'View Size Chart';
      });
    } else {
      DOM.modalSizeChartBtn.style.display = 'none';
      DOM.modalSizeChartContainer.style.display = 'none';
    }

    // WhatsApp inquiry
    const contact = dataCache.get('siteContent');
    const phone = contact && contact.contact ? contact.contact.phone : '';
    const waNumber = phone.replace(/[^0-9+]/g, '');
    const waText = encodeURIComponent(`Hi! I'm interested in "${product.name}" (${formatPrice(product.price)}). Please provide more details.`);
    DOM.modalWhatsappBtn.href = `https://wa.me/${waNumber}?text=${waText}`;

    DOM.productModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeProductModal() {
    DOM.productModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function setupModal() {
    DOM.modalClose.addEventListener('click', closeProductModal);
    DOM.productModal.addEventListener('click', (e) => {
      if (e.target === DOM.productModal) closeProductModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeProductModal();
    });
  }

  // ============================================
  // SEARCH
  // ============================================
  function setupSearch() {
    const searchHandler = debounce((query) => {
      if (!query || query.length < 2) {
        DOM.searchResults.classList.remove('active');
        return;
      }

      const products = dataCache.getAsArray('products');
      const q = query.toLowerCase();
      const results = products.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      ).slice(0, 8);

      DOM.searchResults.innerHTML = '';

      if (results.length === 0) {
        DOM.searchResults.innerHTML = '<div class="search-no-results">No products found</div>';
      } else {
        results.forEach(product => {
          const item = createElement('div', 'search-result-item');
          const img = (product.images && product.images.length > 0) ? product.images[0] : '';
          item.innerHTML = `
            <img src="${escapeHtml(img)}" alt="${escapeHtml(product.name)}">
            <div class="result-info">
              <div class="result-name">${escapeHtml(product.name)}</div>
              <div class="result-price">${formatPrice(product.price)}</div>
            </div>
          `;
          item.addEventListener('click', () => {
            openProductModal(product);
            DOM.searchResults.classList.remove('active');
            DOM.searchInput.value = '';
          });
          DOM.searchResults.appendChild(item);
        });
      }

      DOM.searchResults.classList.add('active');
    }, 250);

    DOM.searchInput.addEventListener('input', (e) => searchHandler(e.target.value.trim()));

    // Close search on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#navSearch') && !e.target.closest('#searchResults')) {
        DOM.searchResults.classList.remove('active');
      }
    });
  }

  // ============================================
  // BACK TO TOP
  // ============================================
  function setupBackToTop() {
    DOM.backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================
  // FOOTER
  // ============================================
  function setupFooter() {
    DOM.footerYear.textContent = new Date().getFullYear();
  }

  // ============================================
  // LAZY LOAD REFRESH
  // ============================================
  function refreshLazyLoad() {
    // Clean up previous observer
    if (state.lazyObserver) {
      state.lazyObserver.disconnect();
    }
    state.lazyObserver = initLazyLoad();
    initScrollReveal();
  }

  // ============================================
  // CONTACT FORM (Web3Forms)
  // ============================================
  function setupContactForm() {
    const form = document.getElementById('contactForm');
    const btn = document.getElementById('contactSubmitBtn');
    
    if (!form || !btn) return;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const accessKey = formData.get('access_key');
      
      // Verification logic
      if (!accessKey || accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY') {
        if (typeof showToast === 'function') {
          showToast('Please set your true Web3Forms Access Key in index.html to enable this form.', 'error');
        }
        return;
      }
      
      const originalText = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;
      
      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
          if (typeof showToast === 'function') {
            showToast('Message sent successfully! We will get back to you soon.', 'success');
          }
          form.reset();
        } else {
          if (typeof showToast === 'function') {
            showToast(data.message || 'Something went wrong.', 'error');
          }
        }
      } catch (err) {
        if (typeof showToast === 'function') {
          showToast('Network error while sending message. Please try again.', 'error');
        }
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }

  // ============================================
  // LIVE CHAT (Customer - Admin via Firebase)
  // ============================================
  let chatSessionId = localStorage.getItem('lebas_chat_id') || null;
  let chatListener = null;

  function setupChatbot() {
    const chatModal = document.getElementById('chatbotModal');
    const chatBtn = document.getElementById('modalChatBtn');
    const chatClose = document.getElementById('chatbotClose');
    const chatInput = document.getElementById('chatbotInput');
    const chatSend = document.getElementById('chatbotSend');

    if (!chatModal || !chatBtn) return;

    chatBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLiveChat();
    });

    chatClose.addEventListener('click', () => {
      chatModal.classList.remove('active');
    });

    chatSend.addEventListener('click', () => sendLiveMessage());
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendLiveMessage();
    });
  }

  function openLiveChat() {
    const chatModal = document.getElementById('chatbotModal');
    chatModal.classList.add('active');

    const productName = document.getElementById('modalProductName') ? document.getElementById('modalProductName').textContent : 'General Inquiry';

    if (!chatSessionId) {
      chatSessionId = generateId();
      localStorage.setItem('lebas_chat_id', chatSessionId);
      
      const initialMsg = 'I am inquiring about: ' + productName;
      const initialMsgId = generateId();
      
      db.ref('liveChats/' + chatSessionId).set({
        createdAt: Date.now(),
        status: 'active',
        productContext: productName,
        lastMessage: initialMsg,
        lastTimestamp: Date.now()
      });
      
      db.ref('liveChats/' + chatSessionId + '/messages/' + initialMsgId).set({
        text: initialMsg,
        sender: 'customer',
        timestamp: Date.now()
      });
    } else {
      // Update context for existing session if changed
      db.ref('liveChats/' + chatSessionId).once('value').then(snap => {
        const data = snap.val();
        if (data && data.productContext !== productName) {
          db.ref('liveChats/' + chatSessionId).update({
            productContext: productName,
            lastMessage: 'Customer switched to: ' + productName,
            lastTimestamp: Date.now()
          });
          const updateMsg = 'I am now inquiring about: ' + productName;
          db.ref('liveChats/' + chatSessionId + '/messages/' + generateId()).set({
            text: updateMsg,
            sender: 'customer',
            timestamp: Date.now()
          });
        }
      });
    }

    if (chatListener) {
      db.ref('liveChats/' + chatSessionId + '/messages').off('value', chatListener);
    }

    chatListener = db.ref('liveChats/' + chatSessionId + '/messages').on('value', (snap) => {
      renderLiveChatMessages(snap.val());
    });

    document.getElementById('chatbotInput').focus();
  }

  let clientLastMessageCount = 0;

  function renderLiveChatMessages(messages) {
    const container = document.getElementById('chatbotMessages');
    container.innerHTML = '';

    if (!messages) {
      container.innerHTML = '<div class="chat-msg bot"><p>Welcome to LEBAS Fashion! Send us a message and our team will reply shortly.</p></div>';
      clientLastMessageCount = 0;
      return;
    }

    const sorted = Object.entries(messages).map(([id, m]) => ({ id, ...m }));
    sorted.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    // Play sound if there's a new message and it's from the admin
    const newCount = sorted.length;
    if (clientLastMessageCount > 0 && newCount > clientLastMessageCount) {
      const lastMsg = sorted[sorted.length - 1];
      if (lastMsg.sender === 'admin') {
        if (typeof playNotificationSound === 'function') playNotificationSound();
      }
    }
    clientLastMessageCount = newCount;

    sorted.forEach(msg => {
      const div = document.createElement('div');
      div.className = 'chat-msg ' + (msg.sender === 'admin' ? 'bot' : 'user');
      div.innerHTML = '<p>' + escapeHtml(msg.text) + '</p>';
      container.appendChild(div);
    });

    container.scrollTop = container.scrollHeight;
  }

  function sendLiveMessage() {
    const input = document.getElementById('chatbotInput');
    const text = input.value.trim();
    if (!text || !chatSessionId) return;

    const msgId = generateId();
    db.ref('liveChats/' + chatSessionId + '/messages/' + msgId).set({
      text: text,
      sender: 'customer',
      timestamp: Date.now()
    });
    db.ref('liveChats/' + chatSessionId).update({
      lastMessage: text,
      lastTimestamp: Date.now(),
      status: 'active'
    });

    input.value = '';
    input.focus();
  }

  // ============================================
  // START
  // ============================================
  document.addEventListener('DOMContentLoaded', init);

})();