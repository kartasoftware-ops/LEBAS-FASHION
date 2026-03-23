/* ============================================
   LEBAS FASHION — Admin Panel Logic
   ============================================ */

(function() {
  'use strict';

  // ============================================
  // AUTH GUARD
  // ============================================
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'login.html';
    } else {
      init();
    }
  });

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
  let confirmCallback = null;

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    setupSidebar();
    setupLogout();
    setupConfirmDialog();
    setupCategoryForm();
    setupSubcategoryForm();
    setupProductForm();
    setupContentForm();
    setupThemeForm();
    listenToFirebase();
  }

  // ============================================
  // SIDEBAR NAVIGATION
  // ============================================
  function setupSidebar() {
    const nav = document.getElementById('sidebarNav');
    const panelTitle = document.getElementById('panelTitle');
    const hamburger = document.getElementById('adminHamburger');
    const sidebar = document.getElementById('adminSidebar');

    const panelNames = {
      dashboard: 'Dashboard',
      categories: 'Category Management',
      subcategories: 'Subcategory Management',
      products: 'Product Management',
      content: 'Site Content Editor',
      theme: 'Theme Control',
      contactmsgs: 'Contact Messages',
      chatleads: 'Chat Leads'
    };

    nav.addEventListener('click', (e) => {
      const item = e.target.closest('.sidebar-nav-item');
      if (!item) return;

      const panel = item.dataset.panel;
      // Update active state
      nav.querySelectorAll('.sidebar-nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Show panel
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      const targetPanel = document.getElementById('panel' + capitalize(panel));
      if (targetPanel) targetPanel.classList.add('active');

      // Update title
      panelTitle.textContent = panelNames[panel] || 'Dashboard';

      // Close mobile sidebar
      sidebar.classList.remove('open');
    });

    // Hamburger
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && !e.target.closest('.admin-sidebar') && !e.target.closest('.admin-hamburger')) {
        sidebar.classList.remove('open');
      }
    });
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ============================================
  // LOGOUT
  // ============================================
  function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
      auth.signOut().then(() => {
        window.location.href = 'login.html';
      });
    });
  }

  // ============================================
  // CONFIRM DIALOG
  // ============================================
  function setupConfirmDialog() {
    document.getElementById('confirmCancel').addEventListener('click', () => {
      document.getElementById('confirmOverlay').classList.remove('active');
      confirmCallback = null;
    });
    document.getElementById('confirmOk').addEventListener('click', () => {
      document.getElementById('confirmOverlay').classList.remove('active');
      if (confirmCallback) {
        confirmCallback();
        confirmCallback = null;
      }
    });
  }

  function showConfirm(title, msg, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMsg').textContent = msg;
    confirmCallback = callback;
    document.getElementById('confirmOverlay').classList.add('active');
  }

  // ============================================
  // FIREBASE LISTENERS
  // ============================================
  function listenToFirebase() {
    db.ref('categories').on('value', snap => {
      dataCache.set('categories', snap.val());
      renderCategoriesTable();
      updateDashboard();
      populateCategoryDropdowns();
    });

    db.ref('subcategories').on('value', snap => {
      dataCache.set('subcategories', snap.val());
      renderSubcategoriesTable();
      updateDashboard();
      populateSubcategoryDropdowns();
    });



    db.ref('products').on('value', snap => {
      dataCache.set('products', snap.val());
      renderProductsTable();
      updateDashboard();
    });

    db.ref('siteContent').on('value', snap => {
      dataCache.set('siteContent', snap.val());
      populateContentForm();
      populateThemeForm();
    });

    db.ref('contactMessages').on('value', snap => {
      dataCache.set('contactMessages', snap.val());
      renderContactMessagesTable();
    });
  }

  // ============================================
  // DASHBOARD
  // ============================================
  function updateDashboard() {
    const cats = dataCache.getAsArray('categories');
    const subs = dataCache.getAsArray('subcategories');
    const prods = dataCache.getAsArray('products');
    const featured = prods.filter(p => p.featured);

    document.getElementById('statCategories').textContent = cats.length;
    document.getElementById('statSubcategories').textContent = subs.length;
    document.getElementById('statProducts').textContent = prods.length;
    document.getElementById('statFeatured').textContent = featured.length;

    // Recent products (last 5)
    const tbody = document.getElementById('dashboardRecentProducts');
    if (prods.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--admin-text-dim);padding:40px;">No products yet</td></tr>';
      return;
    }

    const recent = prods.slice(-5).reverse();
    const catMap = {};
    cats.forEach(c => catMap[c.id] = c.name);

    tbody.innerHTML = recent.map(p => {
      const img = (p.images && p.images.length > 0) ? p.images[0] : '';
      return `<tr>
        <td>${img ? `<img class="table-img" src="${escapeHtml(img)}" alt="">` : '—'}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${formatPrice(p.price)}</td>
        <td>${escapeHtml(catMap[p.categoryId] || '—')}</td>
        <td>${p.featured ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--admin-warning);vertical-align:middle"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' : '—'}</td>
      </tr>`;
    }).join('');
  }

  // ============================================
  // CATEGORY CRUD
  // ============================================
  function setupCategoryForm() {
    const form = document.getElementById('categoryForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const editId = document.getElementById('categoryEditId').value;
      const data = {
        name: document.getElementById('categoryName').value.trim(),
        image: document.getElementById('categoryImage').value.trim(),
        order: parseInt(document.getElementById('categoryOrder').value) || 0
      };

      if (!data.name) return showToast('Please enter a category name', 'error');

      try {
        if (editId) {
          await db.ref('categories/' + editId).update(data);
          showToast('Category updated!', 'success');
        } else {
          await db.ref('categories').push(data);
          showToast('Category added!', 'success');
        }
        resetCategoryForm();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });

    document.getElementById('categoryFormReset').addEventListener('click', resetCategoryForm);
  }

  function resetCategoryForm() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryEditId').value = '';
    document.getElementById('categoryFormTitle').textContent = 'Add Category';
  }

  function editCategory(id, cat) {
    document.getElementById('categoryEditId').value = id;
    document.getElementById('categoryName').value = cat.name || '';
    document.getElementById('categoryImage').value = cat.image || '';
    document.getElementById('categoryOrder').value = cat.order || 0;
    document.getElementById('categoryFormTitle').textContent = 'Edit Category';
    document.querySelector('#panelCategories .form-card').scrollIntoView({ behavior: 'smooth' });
  }

  function deleteCategory(id, name) {
    showConfirm('Delete Category', `Are you sure you want to delete "${name}"?`, async () => {
      try {
        await db.ref('categories/' + id).remove();
        showToast('Category deleted', 'success');
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });
  }

  function renderCategoriesTable() {
    const cats = dataCache.getAsArray('categories');
    const tbody = document.getElementById('categoriesTable');

    if (cats.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--admin-text-dim);">No categories yet</td></tr>';
      return;
    }

    cats.sort((a, b) => (a.order || 0) - (b.order || 0));

    tbody.innerHTML = cats.map(c => `
      <tr>
        <td>${c.image ? `<img class="table-img" src="${escapeHtml(c.image)}" alt="">` : '—'}</td>
        <td>${escapeHtml(c.name)}</td>
        <td>${c.order || 0}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="window._adminEdit('category','${c.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="window._adminDelete('category','${c.id}','${escapeHtml(c.name)}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // ============================================
  // SUBCATEGORY CRUD
  // ============================================
  function setupSubcategoryForm() {
    const form = document.getElementById('subcategoryForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const editId = document.getElementById('subcategoryEditId').value;
      const data = {
        categoryId: document.getElementById('subcategoryCategoryId').value,
        name: document.getElementById('subcategoryName').value.trim(),
        image: document.getElementById('subcategoryImage').value.trim()
      };

      if (!data.categoryId) return showToast('Please select a category', 'error');
      if (!data.name) return showToast('Please enter a subcategory name', 'error');

      try {
        if (editId) {
          await db.ref('subcategories/' + editId).update(data);
          showToast('Subcategory updated!', 'success');
        } else {
          await db.ref('subcategories').push(data);
          showToast('Subcategory added!', 'success');
        }
        resetSubcategoryForm();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });

    document.getElementById('subcategoryFormReset').addEventListener('click', resetSubcategoryForm);
  }

  function resetSubcategoryForm() {
    document.getElementById('subcategoryForm').reset();
    document.getElementById('subcategoryEditId').value = '';
    document.getElementById('subcategoryFormTitle').textContent = 'Add Subcategory';
  }

  function editSubcategory(id, sub) {
    document.getElementById('subcategoryEditId').value = id;
    document.getElementById('subcategoryCategoryId').value = sub.categoryId || '';
    document.getElementById('subcategoryName').value = sub.name || '';
    document.getElementById('subcategoryImage').value = sub.image || '';
    document.getElementById('subcategoryFormTitle').textContent = 'Edit Subcategory';
    document.querySelector('#panelSubcategories .form-card').scrollIntoView({ behavior: 'smooth' });
  }

  function deleteSubcategory(id, name) {
    showConfirm('Delete Subcategory', `Are you sure you want to delete "${name}"?`, async () => {
      try {
        await db.ref('subcategories/' + id).remove();
        showToast('Subcategory deleted', 'success');
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });
  }

  function renderSubcategoriesTable() {
    const subs = dataCache.getAsArray('subcategories');
    const cats = dataCache.getAsArray('categories');
    const catMap = {};
    cats.forEach(c => catMap[c.id] = c.name);

    const tbody = document.getElementById('subcategoriesTable');

    if (subs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--admin-text-dim);">No subcategories yet</td></tr>';
      return;
    }

    tbody.innerHTML = subs.map(s => `
      <tr>
        <td>${s.image ? `<img class="table-img" src="${escapeHtml(s.image)}" alt="">` : '—'}</td>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(catMap[s.categoryId] || '—')}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="window._adminEdit('subcategory','${s.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="window._adminDelete('subcategory','${s.id}','${escapeHtml(s.name)}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  }


  // ============================================
  // PRODUCT CRUD
  // ============================================
  function setupProductForm() {
    const form = document.getElementById('productForm');

    // Featured toggle
    const toggle = document.getElementById('productFeaturedToggle');
    const featuredInput = document.getElementById('productFeatured');
    const featuredLabel = document.getElementById('productFeaturedLabel');

    toggle.addEventListener('click', () => {
      const isActive = toggle.classList.toggle('active');
      featuredInput.value = isActive ? 'true' : 'false';
      featuredLabel.textContent = isActive ? 'Yes' : 'No';
    });

    // Dynamic category → subcategory
    document.getElementById('productCategoryId').addEventListener('change', (e) => {
      const catId = e.target.value;
      const subSelect = document.getElementById('productSubcategoryId');
      subSelect.innerHTML = '<option value="">Select subcategory...</option>';
      if (!catId) return;

      const subs = dataCache.getAsArray('subcategories').filter(s => s.categoryId === catId);
      subs.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        subSelect.appendChild(opt);
      });
    });

    // Add size
    document.getElementById('addSizeBtn').addEventListener('click', () => {
      const container = document.getElementById('sizesContainer');
      const item = document.createElement('div');
      item.className = 'dynamic-list-item';
      item.innerHTML = `
        <input type="text" placeholder="e.g. XL" class="size-input">
        <button type="button" class="remove-item" onclick="this.parentElement.remove()">✕</button>
      `;
      container.appendChild(item);
    });

    // Add image
    document.getElementById('addImageBtn').addEventListener('click', () => {
      const container = document.getElementById('imagesContainer');
      const item = document.createElement('div');
      item.className = 'dynamic-list-item';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '8px';
      item.innerHTML = `
        <input type="url" placeholder="https://..." class="image-input" style="flex-grow:1;">
        <label class="btn btn-secondary btn-sm" style="cursor:pointer; padding:8px 12px; white-space:nowrap; margin-bottom:0;">
          Upload Photo
          <input type="file" accept="image/png, image/jpeg" style="display:none;" onchange="window._adminUploadImage(this, null, this.closest('.dynamic-list-item').querySelector('.image-input'))">
        </label>
        <button type="button" class="remove-item" onclick="this.parentElement.remove()">✕</button>
      `;
      container.appendChild(item);
    });

    // Submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const editId = document.getElementById('productEditId').value;

      const sizes = [];
      document.querySelectorAll('#sizesContainer .size-input').forEach(inp => {
        const val = inp.value.trim();
        if (val) sizes.push(val);
      });

      const images = [];
      document.querySelectorAll('#imagesContainer .image-input').forEach(inp => {
        const val = inp.value.trim();
        if (val) images.push(val);
      });

      const data = {
        name: document.getElementById('productName').value.trim(),
        price: parseFloat(document.getElementById('productPrice').value) || 0,
        categoryId: document.getElementById('productCategoryId').value,
        subcategoryId: document.getElementById('productSubcategoryId').value,
        gender: document.getElementById('productGender').value,
        description: document.getElementById('productDescription').value.trim(),
        featured: document.getElementById('productFeatured').value === 'true',
        sizeChart: document.getElementById('productSizeChart').value.trim(),
        sizes: sizes,
        images: images
      };

      if (!data.name) return showToast('Please enter a product name', 'error');
      if (!data.categoryId) return showToast('Please select a category', 'error');

      try {
        if (editId) {
          await db.ref('products/' + editId).update(data);
          showToast('Product updated!', 'success');
        } else {
          await db.ref('products').push(data);
          showToast('Product added!', 'success');
        }
        resetProductForm();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });

    document.getElementById('productFormReset').addEventListener('click', resetProductForm);
  }

  function resetProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productEditId').value = '';
    document.getElementById('productFormTitle').textContent = 'Add Product';
    document.getElementById('productFeatured').value = 'false';
    document.getElementById('productFeaturedToggle').classList.remove('active');
    document.getElementById('productFeaturedLabel').textContent = 'No';
    document.getElementById('productSizeChart').value = '';

    // Reset dynamic inputs
    document.getElementById('sizesContainer').innerHTML = `
      <div class="dynamic-list-item">
        <input type="text" placeholder="e.g. S" class="size-input">
        <button type="button" class="remove-item" onclick="this.parentElement.remove()">✕</button>
      </div>`;
    document.getElementById('imagesContainer').innerHTML = `
      <div class="dynamic-list-item" style="display:flex; align-items:center; gap:8px;">
        <input type="url" placeholder="https://..." class="image-input" style="flex-grow:1;">
        <label class="btn btn-secondary btn-sm" style="cursor:pointer; padding:8px 12px; white-space:nowrap; margin-bottom:0;">
          Upload Photo
          <input type="file" accept="image/png, image/jpeg" style="display:none;" onchange="window._adminUploadImage(this, null, this.closest('.dynamic-list-item').querySelector('.image-input'))">
        </label>
        <button type="button" class="remove-item" onclick="this.parentElement.remove()">✕</button>
      </div>`;
  }

  function editProduct(id, product) {
    document.getElementById('productEditId').value = id;
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productCategoryId').value = product.categoryId || '';

    // Trigger subcategory dropdown update
    const catChangeEvent = new Event('change');
    document.getElementById('productCategoryId').dispatchEvent(catChangeEvent);
    
    // Wait for subcategory options to populate
    setTimeout(() => {
      document.getElementById('productSubcategoryId').value = product.subcategoryId || '';
    }, 100);

    document.getElementById('productGender').value = product.gender || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productSizeChart').value = product.sizeChart || '';

    const isFeatured = product.featured === true;
    document.getElementById('productFeatured').value = isFeatured ? 'true' : 'false';
    document.getElementById('productFeaturedToggle').classList.toggle('active', isFeatured);
    document.getElementById('productFeaturedLabel').textContent = isFeatured ? 'Yes' : 'No';

    // Sizes
    const sizesContainer = document.getElementById('sizesContainer');
    sizesContainer.innerHTML = '';
    const sizes = product.sizes || [''];
    sizes.forEach(s => {
      const item = document.createElement('div');
      item.className = 'dynamic-list-item';
      item.innerHTML = `
        <input type="text" placeholder="e.g. S" class="size-input" value="${escapeHtml(s)}">
        <button type="button" class="remove-item" onclick="this.parentElement.remove()">✕</button>
      `;
      sizesContainer.appendChild(item);
    });

    // Images
    const imagesContainer = document.getElementById('imagesContainer');
    imagesContainer.innerHTML = '';
    const images = product.images || [''];
    images.forEach(img => {
      const item = document.createElement('div');
      item.className = 'dynamic-list-item';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '8px';
      item.innerHTML = `
        <input type="url" placeholder="https://..." class="image-input" value="${escapeHtml(img)}" style="flex-grow:1;">
        <label class="btn btn-secondary btn-sm" style="cursor:pointer; padding:8px 12px; white-space:nowrap; margin-bottom:0;">
          Upload Photo
          <input type="file" accept="image/png, image/jpeg" style="display:none;" onchange="window._adminUploadImage(this, null, this.closest('.dynamic-list-item').querySelector('.image-input'))">
        </label>
        <button type="button" class="remove-item" onclick="this.parentElement.remove()">✕</button>
      `;
      imagesContainer.appendChild(item);
    });

    document.getElementById('productFormTitle').textContent = 'Edit Product';
    document.querySelector('#panelProducts .form-card').scrollIntoView({ behavior: 'smooth' });
  }

  function deleteProduct(id, name) {
    showConfirm('Delete Product', `Are you sure you want to delete "${name}"?`, async () => {
      try {
        await db.ref('products/' + id).remove();
        showToast('Product deleted', 'success');
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });
  }

  function renderProductsTable() {
    const prods = dataCache.getAsArray('products');
    const cats = dataCache.getAsArray('categories');
    const catMap = {};
    cats.forEach(c => catMap[c.id] = c.name);

    const tbody = document.getElementById('productsTable');

    if (prods.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--admin-text-dim);">No products yet</td></tr>';
      return;
    }

    tbody.innerHTML = prods.map(p => {
      const img = (p.images && p.images.length > 0) ? p.images[0] : '';
      return `
      <tr>
        <td>${img ? `<img class="table-img" src="${escapeHtml(img)}" alt="">` : '—'}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${formatPrice(p.price)}</td>
        <td>${escapeHtml(catMap[p.categoryId] || '—')}</td>
        <td>${escapeHtml(p.gender || '—')}</td>
        <td>${p.featured ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--admin-warning);vertical-align:middle"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' : '—'}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="window._adminEdit('product','${p.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="window._adminDelete('product','${p.id}','${escapeHtml(p.name)}')">Delete</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  // ============================================
  // POPULATE DROPDOWNS
  // ============================================
  function populateCategoryDropdowns() {
    const cats = dataCache.getAsArray('categories');
    cats.sort((a, b) => (a.order || 0) - (b.order || 0));

    const selectors = ['subcategoryCategoryId', 'productCategoryId'];
    selectors.forEach(selId => {
      const sel = document.getElementById(selId);
      if (!sel) return;
      const currentVal = sel.value;
      sel.innerHTML = '<option value="">Select category...</option>';
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        sel.appendChild(opt);
      });
      sel.value = currentVal;
    });
  }

  function populateSubcategoryDropdowns() {
    const subs = dataCache.getAsArray('subcategories');
    const sel = document.getElementById('genderSubcategoryId');
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">Select subcategory...</option>';

    const cats = dataCache.getAsArray('categories');
    const catMap = {};
    cats.forEach(c => catMap[c.id] = c.name);

    subs.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${catMap[s.categoryId] || 'Unknown'})`;
      sel.appendChild(opt);
    });
    sel.value = currentVal;
  }

  // ============================================
  // SITE CONTENT
  // ============================================
  function setupContentForm() {
    document.getElementById('contentForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      // Collect hero images
      const heroImages = [];
      document.querySelectorAll('#heroImagesContainer .hero-image-input').forEach(input => {
        const val = input.value.trim();
        if (val) heroImages.push(val);
      });

      const data = {
        hero: {
          title: document.getElementById('contentHeroTitle').value.trim(),
          subtitle: document.getElementById('contentHeroSubtitle').value.trim(),
          images: heroImages
        },
        about: {
          text: document.getElementById('contentAbout').value.trim(),
          image: document.getElementById('contentAboutImage') ? document.getElementById('contentAboutImage').value.trim() : ''
        },
        philosophy: {
          text: document.getElementById('contentPhilosophy').value.trim(),
          image: document.getElementById('contentPhilosophyImage') ? document.getElementById('contentPhilosophyImage').value.trim() : ''
        },
        premium: {
          text: document.getElementById('contentPremium').value.trim(),
          image: document.getElementById('contentPremiumImage') ? document.getElementById('contentPremiumImage').value.trim() : ''
        },
        contact: {
          phone: document.getElementById('contentPhone').value.trim(),
          email: document.getElementById('contentEmail').value.trim(),
          address: document.getElementById('contentAddress').value.trim()
        },
        social: {
          facebook: document.getElementById('socialFacebook') ? document.getElementById('socialFacebook').value.trim() : '',
          whatsapp: document.getElementById('socialWhatsapp') ? document.getElementById('socialWhatsapp').value.trim() : '',
          instagram: document.getElementById('socialInstagram') ? document.getElementById('socialInstagram').value.trim() : '',
          twitter: document.getElementById('socialTwitter') ? document.getElementById('socialTwitter').value.trim() : '',
          tiktok: document.getElementById('socialTiktok') ? document.getElementById('socialTiktok').value.trim() : '',
          linkedin: document.getElementById('socialLinkedin') ? document.getElementById('socialLinkedin').value.trim() : ''
        }
      };

      // Preserve existing theme
      const existing = dataCache.get('siteContent');
      if (existing && existing.theme) {
        data.theme = existing.theme;
      }

      try {
        await db.ref('siteContent').set(data);
        showToast('Site content saved!', 'success');
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });

    // Add hero image button
    document.getElementById('addHeroImageBtn').addEventListener('click', () => {
      const container = document.getElementById('heroImagesContainer');
      const item = document.createElement('div');
      item.className = 'dynamic-list-item';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '8px';
      item.innerHTML = `
        <input type="url" placeholder="https://..." class="hero-image-input" style="flex-grow:1;">
        <label class="btn btn-secondary btn-sm" style="cursor:pointer; padding:8px 12px; white-space:nowrap; margin-bottom:0;">
          Upload Photo
          <input type="file" accept="image/png, image/jpeg" style="display:none;" onchange="window._adminUploadImage(this, null, this.closest('.dynamic-list-item').querySelector('.hero-image-input'))">
        </label>
        <button type="button" class="remove-item" onclick="this.parentElement.remove()">✕</button>
      `;
      container.appendChild(item);
    });
  }

  function populateContentForm() {
    const content = dataCache.get('siteContent');
    if (!content) return;

    if (content.hero) {
      document.getElementById('contentHeroTitle').value = content.hero.title || '';
      document.getElementById('contentHeroSubtitle').value = content.hero.subtitle || '';

      // Populate hero images
      const container = document.getElementById('heroImagesContainer');
      let images = [];
      if (content.hero.images && Array.isArray(content.hero.images)) {
        images = content.hero.images.filter(img => img);
      } else if (content.hero.image) {
        images = [content.hero.image];
      }

      if (images.length > 0) {
        container.innerHTML = '';
        images.forEach(img => {
          const item = document.createElement('div');
          item.className = 'dynamic-list-item';
          item.style.display = 'flex';
          item.style.alignItems = 'center';
          item.style.gap = '8px';
          item.innerHTML = `
            <input type="url" placeholder="https://..." class="hero-image-input" value="${escapeHtml(img)}" style="flex-grow:1;">
            <label class="btn btn-secondary btn-sm" style="cursor:pointer; padding:8px 12px; white-space:nowrap; margin-bottom:0;">
              Upload Photo
              <input type="file" accept="image/png, image/jpeg" style="display:none;" onchange="window._adminUploadImage(this, null, this.closest('.dynamic-list-item').querySelector('.hero-image-input'))">
            </label>
            <button type="button" class="remove-item" onclick="this.parentElement.remove()">✕</button>
          `;
          container.appendChild(item);
        });
      }
    }
    if (content.about) {
      document.getElementById('contentAbout').value = content.about.text || '';
      if (document.getElementById('contentAboutImage')) document.getElementById('contentAboutImage').value = content.about.image || '';
    }
    if (content.philosophy) {
      document.getElementById('contentPhilosophy').value = content.philosophy.text || '';
      if (document.getElementById('contentPhilosophyImage')) document.getElementById('contentPhilosophyImage').value = content.philosophy.image || '';
    }
    if (content.premium) {
      document.getElementById('contentPremium').value = content.premium.text || '';
      if (document.getElementById('contentPremiumImage')) document.getElementById('contentPremiumImage').value = content.premium.image || '';
    }
    if (content.contact) {
      document.getElementById('contentPhone').value = content.contact.phone || '';
      document.getElementById('contentEmail').value = content.contact.email || '';
      document.getElementById('contentAddress').value = content.contact.address || '';
    }
    if (content.social) {
      if (document.getElementById('socialFacebook')) document.getElementById('socialFacebook').value = content.social.facebook || '';
      if (document.getElementById('socialWhatsapp')) document.getElementById('socialWhatsapp').value = content.social.whatsapp || '';
      if (document.getElementById('socialInstagram')) document.getElementById('socialInstagram').value = content.social.instagram || '';
      if (document.getElementById('socialTwitter')) document.getElementById('socialTwitter').value = content.social.twitter || '';
      if (document.getElementById('socialTiktok')) document.getElementById('socialTiktok').value = content.social.tiktok || '';
      if (document.getElementById('socialLinkedin')) document.getElementById('socialLinkedin').value = content.social.linkedin || '';
    }
  }

  // ============================================
  // THEME
  // ============================================
  function setupThemeForm() {
    const primary = document.getElementById('themePrimary');
    const secondary = document.getElementById('themeSecondary');
    const primaryHex = document.getElementById('themePrimaryHex');
    const secondaryHex = document.getElementById('themeSecondaryHex');

    primary.addEventListener('input', () => { primaryHex.textContent = primary.value; });
    secondary.addEventListener('input', () => { secondaryHex.textContent = secondary.value; });

    document.getElementById('themeForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await db.ref('siteContent/theme').set({
          primary: primary.value,
          secondary: secondary.value
        });
        showToast('Theme saved!', 'success');
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });
  }

  function populateThemeForm() {
    const content = dataCache.get('siteContent');
    if (!content || !content.theme) return;

    const primary = document.getElementById('themePrimary');
    const secondary = document.getElementById('themeSecondary');
    if (content.theme.primary) {
      primary.value = content.theme.primary;
      document.getElementById('themePrimaryHex').textContent = content.theme.primary;
    }
    if (content.theme.secondary) {
      secondary.value = content.theme.secondary;
      document.getElementById('themeSecondaryHex').textContent = content.theme.secondary;
    }
  }

  // ============================================
  // GLOBAL ACTION HANDLERS (for inline onclick)
  // ============================================
  window._adminUploadImage = function(fileInput, targetId, explicitTarget) {
    const file = fileInput.files[0];
    if (!file) return;

    const target = explicitTarget || document.getElementById(targetId);
    if (!target) return;

    target.value = 'Processing Image...';
    target.disabled = true;

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 jpeg
        target.value = canvas.toDataURL('image/jpeg', 0.85);
        target.disabled = false;
        fileInput.value = '';
        showToast('Image processed and ready to save!', 'success');
      };
      img.onerror = function() {
        target.value = '';
        target.disabled = false;
        fileInput.value = '';
        showToast('Error processing image', 'error');
      };
      img.src = e.target.result;
    };
    reader.onerror = function() {
      target.value = '';
      target.disabled = false;
      fileInput.value = '';
      showToast('Error reading file', 'error');
    };
    reader.readAsDataURL(file);
  };

  window._adminEdit = function(type, id) {
    const data = dataCache.get(type === 'category' ? 'categories' : 
                               type === 'subcategory' ? 'subcategories' : 'products');
    if (!data || !data[id]) return;

    switch (type) {
      case 'category': editCategory(id, data[id]); break;
      case 'subcategory': editSubcategory(id, data[id]); break;
      case 'product': editProduct(id, data[id]); break;
    }
  };

  window._adminDelete = function(type, id, name) {
    switch (type) {
      case 'category': deleteCategory(id, name); break;
      case 'subcategory': deleteSubcategory(id, name); break;
      case 'product': deleteProduct(id, name); break;
      case 'contactmsg': deleteContactMessage(id, name); break;
    }
  };

  // ============================================
  // CONTACT MESSAGES
  // ============================================
  function renderContactMessagesTable() {
    const msgsObj = dataCache.get('contactMessages');
    const tbody = document.getElementById('contactMessagesTable');
    if (!tbody) return;

    if (!msgsObj) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--admin-text-dim);">No messages yet</td></tr>';
      return;
    }

    const msgs = Object.entries(msgsObj).map(([id, val]) => ({ id, ...val }));
    msgs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (msgs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--admin-text-dim);">No messages yet</td></tr>';
      return;
    }

    tbody.innerHTML = msgs.map(m => {
      const date = m.timestamp ? new Date(m.timestamp).toLocaleString() : '—';
      return `
      <tr>
        <td style="white-space:nowrap;font-size:0.85rem;">${date}</td>
        <td>
          <div style="font-weight:600;">${escapeHtml(m.name || '—')}</div>
          <div style="font-size:0.8rem;color:var(--admin-text-muted);">${escapeHtml(m.email || '—')}</div>
        </td>
        <td>${escapeHtml(m.phone || '—')}</td>
        <td>
          <div style="font-size:0.8rem;color:var(--admin-primary);margin-bottom:4px;">Industry: ${escapeHtml(m.industry || '—')}</div>
          <div style="font-size:0.9rem;">${escapeHtml(m.message || '—')}</div>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-danger btn-sm" onclick="window._adminDelete('contactmsg','${m.id}','${escapeHtml(m.name || 'this message')}')">Delete</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  function deleteContactMessage(id, name) {
    showConfirm('Delete Message', `Are you sure you want to delete the message from "${name}"?`, async () => {
      try {
        await db.ref('contactMessages/' + id).remove();
        showToast('Message deleted', 'success');
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });
  }

  // ============================================
  // LIVE CHAT
  // ============================================
  let activeChatId = null;
  let activeChatListener = null;
  
  let adminKnownTimestamps = {};
  let isInitialAdminLoad = true;

  // Listen to all chat sessions
  db.ref('liveChats').on('value', snap => {
    const data = snap.val();
    
    if (data && !isInitialAdminLoad) {
      let playSound = false;
      Object.entries(data).forEach(([id, session]) => {
        if (session.lastTimestamp > (adminKnownTimestamps[id] || 0)) {
          playSound = true;
        }
        adminKnownTimestamps[id] = session.lastTimestamp;
      });
      if (playSound && typeof playNotificationSound === 'function') {
        playNotificationSound();
      }
    } else if (data) {
      Object.entries(data).forEach(([id, session]) => {
        adminKnownTimestamps[id] = session.lastTimestamp;
      });
      isInitialAdminLoad = false;
    }
    
    renderChatSessions(data);
  });

  function renderChatSessions(data) {
    const sidebar = document.getElementById('adminChatList');
    if (!sidebar) return;
    sidebar.innerHTML = '';

    if (!data) {
      sidebar.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--admin-text-muted);">No active chats</div>';
      return;
    }

    const sessions = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    sessions.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));

    sessions.forEach(session => {
      const date = session.lastTimestamp ? new Date(session.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const div = document.createElement('div');
      div.className = `chat-session-item ${activeChatId === session.id ? 'active' : ''}`;
      div.onclick = () => openChatSession(session.id);
      
      let badgeHtml = session.status === 'active' ? '<div class="chat-session-badge"></div>' : '';
      let productMeta = session.productContext ? `<div style="font-size:0.75rem; color:var(--admin-primary); margin-bottom:4px; font-weight:500;">📦 ${escapeHtml(session.productContext)}</div>` : '';

      div.innerHTML = `
        ${badgeHtml}
        <div class="chat-session-header">
          <span>Customer ID: ${session.id.substring(0, 6)}...</span>
          <span class="chat-session-time">${date}</span>
        </div>
        ${productMeta}
        <div class="chat-session-preview">${escapeHtml(session.lastMessage || 'No messages')}</div>
      `;
      sidebar.appendChild(div);
    });
  }

  function openChatSession(sessionId) {
    activeChatId = sessionId;
    
    // Update UI active state
    document.querySelectorAll('.chat-session-item').forEach(el => el.classList.remove('active'));
    document.getElementById('adminChatEmpty').style.display = 'none';
    document.getElementById('adminChatActive').style.display = 'flex';
    document.getElementById('adminChatCustomerName').textContent = 'Loading context...';

    // Fetch session data to get product context for header
    db.ref('liveChats/' + sessionId).once('value').then(snap => {
      const data = snap.val();
      const pName = data && data.productContext ? data.productContext : 'General Inquiry';
      document.getElementById('adminChatCustomerName').innerHTML = `Customer (${sessionId.substring(0, 6)}) <span style="font-size:0.8rem; font-weight:normal; color:var(--admin-primary); margin-left:10px; background:rgba(201,168,76,0.1); padding:4px 8px; border-radius:4px; border:1px solid rgba(201,168,76,0.2);">📦 Inquiring: ${escapeHtml(pName)}</span>`;
    });

    // Remove old listener
    if (activeChatListener) {
      db.ref('liveChats/' + activeChatListener + '/messages').off();
    }
    activeChatListener = sessionId;

    // Listen to messages for this session
    db.ref('liveChats/' + sessionId + '/messages').on('value', snap => {
      if (activeChatId === sessionId) {
        renderChatMessages(snap.val());
      }
    });

    // Setup input
    const input = document.getElementById('adminChatInput');
    const sendBtn = document.getElementById('adminChatSend');
    const endBtn = document.getElementById('btnEndChat');

    // Clean previous event hooks by cloning and replacing
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    const newEndBtn = endBtn.cloneNode(true);
    endBtn.parentNode.replaceChild(newEndBtn, endBtn);

    newSendBtn.addEventListener('click', () => sendAdminReply(sessionId, newInput.value));
    newInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendAdminReply(sessionId, newInput.value);
    });
    
    newEndBtn.addEventListener('click', () => {
      if(confirm('Are you sure you want to end this chat session?')) {
        db.ref('liveChats/' + sessionId).update({ status: 'ended' });
        showToast('Chat session ended.', 'success');
      }
    });

    newInput.focus();
    
    // Refresh sidebar highlighting
    db.ref('liveChats').once('value').then(snap => renderChatSessions(snap.val()));
  }

  function renderChatMessages(messages) {
    const container = document.getElementById('adminChatMessages');
    container.innerHTML = '';

    if (!messages) return;

    const sorted = Object.entries(messages).map(([id, m]) => ({ id, ...m }));
    sorted.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    sorted.forEach(msg => {
      const isAdmin = msg.sender === 'admin';
      const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      
      const div = document.createElement('div');
      div.className = 'admin-msg ' + (isAdmin ? 'admin' : 'customer');
      div.innerHTML = `
        <div style="display:flex; flex-direction:column;">
          <div class="admin-msg-content">${escapeHtml(msg.text)}</div>
          <div class="admin-msg-time">${time}</div>
        </div>
      `;
      container.appendChild(div);
    });

    container.scrollTop = container.scrollHeight;
  }

  function sendAdminReply(sessionId, text) {
    if (!text.trim()) return;
    
    const input = document.getElementById('adminChatInput');
    const msgId = generateId();
    const now = Date.now();
    
    // Prevent the admin from hearing a notification for their own message
    adminKnownTimestamps[sessionId] = now;
    
    db.ref('liveChats/' + sessionId + '/messages/' + msgId).set({
      text: text.trim(),
      sender: 'admin',
      timestamp: now
    });
    
    db.ref('liveChats/' + sessionId).update({
      lastMessage: text.trim(),
      lastTimestamp: now
    });
    
    input.value = '';
    input.focus();
  }

})();
