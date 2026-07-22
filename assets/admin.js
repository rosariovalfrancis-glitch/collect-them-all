function isAdminAuthenticated() {
  return sessionStorage.getItem("collectAdminAuth") === "true";
}

function requireAdmin() {
  if (!isAdminAuthenticated()) {
    location.href = "../login.html";
    return false;
  }
  const page = document.querySelector("[data-admin-page]");
  const logoutBtn = document.querySelector("[data-admin-logout-btn]");
  const navLinks = document.querySelector("[data-admin-nav]");
  if (page) page.hidden = false;
  if (logoutBtn) logoutBtn.style.display = "";
  if (navLinks) navLinks.hidden = false;
  switchTab(getSavedTab());
  return true;
}

function getSavedTab() {
  return sessionStorage.getItem("collectAdminTab") || "dashboard";
}

function switchTab(name) {
  sessionStorage.setItem("collectAdminTab", name);
  document.querySelectorAll("[data-admin-panel]").forEach((p) => p.hidden = true);
  document.querySelectorAll(`[data-admin-panel="${name}"]`).forEach((p) => p.hidden = false);
  document.querySelectorAll("[data-admin-tab]").forEach((b) => {
    b.classList.toggle("active", b.dataset.adminTab === name);
  });
  document.querySelectorAll("[data-admin-nav] a").forEach((a) => {
    a.classList.toggle("active", a.dataset.adminTabLink === name);
  });
  if (name === "dashboard") renderAdminDashboard();
  else if (name === "orders") { renderAdminOrdersFiltered(); setTimeout(() => { document.querySelector("[data-admin-panel='orders']").scrollIntoView({ behavior: "smooth" }); }, 50); }
  else if (name === "products") renderAdminProducts();
  else if (name === "customers") renderAdminCustomers();
  else if (name === "activity") renderAdminActivityLog();
}

function initAdminLogout() {
  const btn = document.querySelector("[data-admin-logout-btn]");
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    sessionStorage.removeItem("collectAdminAuth");
    localStorage.removeItem("collectCurrentUser");
    requireAdmin();
  });
}

function initAdminNavTabs() {
  document.querySelectorAll("[data-admin-tab]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.adminTab));
  });
  document.querySelectorAll("[data-admin-nav] a[data-admin-tab-link]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab(a.dataset.adminTabLink);
    });
  });
}

function renderAdminDashboard() {
  renderAdminSettings();
  const target = document.querySelector("[data-admin-dashboard-stats]");
  if (!target) return;
  const allOrders = getOrders();
  const pendingOrders = allOrders.filter((o) => o.status === "Waiting for Payment" || o.status === "Deposit Received");
  const totalSales = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  target.innerHTML = `
    <div class="card stat"><span class="muted">Total Orders</span><strong>${allOrders.length}</strong></div>
    <div class="card stat"><span class="muted">Pending Payments</span><strong>${pendingOrders.length}</strong></div>
    <div class="card stat"><span class="muted">Total Sales</span><strong>&#8369;${totalSales.toLocaleString()}</strong></div>
  `;

  const recentTarget = document.querySelector("[data-admin-recent-orders]");
  if (!recentTarget) return;
  const recent = allOrders.slice(-5).reverse();
  if (!recent.length) {
    recentTarget.innerHTML = `<p class="muted">No orders yet.</p>`;
    return;
  }
  recentTarget.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
    <strong style="font-size:0.95rem;">Recent Orders</strong>
    <button class="btn btn-sm btn-outline" onclick="switchTab('orders')">View All Orders</button>
  </div>
  <table class="admin-table"><thead><tr><th>Order#</th><th>Customer</th><th>Status</th></tr></thead><tbody>
    ${recent.map((o) => `<tr><td>${o.number}</td><td>${o.customerName || "—"}</td><td><span class="status">${o.status}</span></td></tr>`).join("")}
  </tbody></table>`;
}

function buildOrderRow(order) {
  const items = order.items ? order.items.map((i) => `${i.name} x${i.qty}`).join(", ") : order.details || "—";
  const total = order.total ? `&#8369;${order.total.toLocaleString()}` : "—";
  const statuses = ["Waiting for Payment", "Deposit Received", "Deposit Verified", "Allocation Pending", "Allocation Confirmed", "Preparing", "Shipped", "Delivered"];
  const addr = [order.barangay, order.city, order.province].filter(Boolean).join(", ") || order.deliveryAddress || "—";
  return `<tr>
    <td><strong>${order.number}</strong></td>
    <td>${order.customerName || "—"}</td>
    <td>${order.contactNumber || "—"}</td>
    <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${items}</td>
    <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.78rem;">${addr}</td>
    <td>${total}</td>
    <td><span class="status">${order.status}</span></td>
    <td>
      <select class="select" data-admin-order-status data-order="${order.number}" style="min-width:100px;padding:4px 8px;font-size:0.78rem;">
        ${statuses.map((s) => `<option value="${s}" ${s === order.status ? "selected" : ""}>${s}</option>`).join("")}
      </select>
    </td>
  </tr>`;
}

function renderAdminOrders() {
  const target = document.querySelector("[data-admin-orders-list]");
  if (!target) return;
  const allOrders = getOrders();
  const regularOrders = allOrders.filter((o) => o.status !== "Pre-Order");
  const preOrders = allOrders.filter((o) => o.status === "Pre-Order");

  let html = `<div style="display:flex;gap:6px;margin-bottom:12px;">
    <button class="btn btn-sm ${window._adminOrderFilter !== "pre" ? "btn-yellow" : "btn-outline"}" data-admin-order-filter="all">Regular Orders (${regularOrders.length})</button>
    <button class="btn btn-sm ${window._adminOrderFilter === "pre" ? "btn-yellow" : "btn-outline"}" data-admin-order-filter="pre">Pre-Orders (${preOrders.length})</button>
  </div>`;

  const showPre = window._adminOrderFilter === "pre";
  const list = showPre ? preOrders : regularOrders;

  if (!list.length) {
    html += `<p class="muted">No ${showPre ? "pre-orders" : "orders"} yet.</p>`;
    target.innerHTML = html;
    return;
  }

  html += `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
    <h2>${showPre ? "Pre-Orders" : "All Orders"}</h2>
    <input class="field" data-admin-order-search placeholder="Search by order# or name" style="max-width:260px;min-height:38px;">
  </div>`;

  html += `<table class="admin-table"><thead><tr>
    <th>Order#</th><th>Customer</th><th>Contact</th><th>Items</th><th>Ship to</th><th>Total</th><th>Status</th><th>Action</th>
  </tr></thead><tbody>
    ${list.map(buildOrderRow).join("")}
  </tbody></table>`;

  target.innerHTML = html;

  target.querySelectorAll("[data-admin-order-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      window._adminOrderFilter = btn.dataset.adminOrderFilter === "pre" ? "pre" : "reg";
      renderAdminOrders();
    });
  });

  initAdminOrderSearch(target);
}

function initAdminOrderSearch(scope) {
  const input = (scope || document).querySelector("[data-admin-order-search]");
  if (!input) return;
  input.addEventListener("input", () => {
    const term = input.value.trim().toLowerCase();
    const rows = (scope || document).querySelectorAll("[data-admin-orders-list] tbody tr");
    rows.forEach((row) => {
      row.hidden = term && !row.textContent.toLowerCase().includes(term);
    });
  });
}

function renderAdminProducts() {
  const target = document.querySelector("[data-admin-products-list]");
  if (!target) return;

  const all = products;
  const regular = all.filter((p) => p.category !== "Pre-Order");
  const preorder = all.filter((p) => p.category === "Pre-Order");

  let html = `<div style="display:flex;gap:6px;margin-bottom:12px;">
    <button class="btn btn-sm ${window._adminProdFilter !== "pre" ? "btn-yellow" : "btn-outline"}" data-admin-prod-filter="all">Products (${regular.length})</button>
    <button class="btn btn-sm ${window._adminProdFilter === "pre" ? "btn-yellow" : "btn-outline"}" data-admin-prod-filter="pre">Pre-Orders (${preorder.length})</button>
  </div>`;

  const showPre = window._adminProdFilter === "pre";
  const list = showPre ? preorder : regular;

  if (!list.length) {
    html += `<p class="muted">No ${showPre ? "pre-order" : "regular"} products yet.</p>`;
    target.innerHTML = html;
    return;
  }

  html += `<table class="admin-table"><thead><tr>
    <th>Featured</th><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th>
  </tr></thead><tbody>
    ${list.map((p, i) => {
      const realIdx = all.indexOf(p);
      const isFeat = p.featured === true;
      return `<tr>
      <td><button class="btn btn-sm ${isFeat ? "btn-yellow" : "btn-outline"}" data-admin-toggle-feat="${realIdx}" title="${isFeat ? "Remove from Featured" : "Add to Featured"}" style="padding:2px 6px;min-height:28px;font-size:0.9rem;width:32px;">${isFeat ? "★" : "+"}</button></td>
      <td><strong>${p.name}</strong></td>
      <td>${window.displayCategory ? displayCategory(p) : p.category}</td>
      <td>&#8369;${p.price.toLocaleString()}</td>
      <td><span class="status ${p.status === "Pre-Order" ? "status-pre" : ""}">${p.status}</span>
      </td>
      <td style="display:flex;gap:6px;align-items:center;">
        <button class="btn btn-outline" data-admin-edit-prod data-prod-index="${realIdx}" style="padding:4px 12px;min-height:32px;font-size:0.75rem;">Edit</button>
        ${p.category === "Pre-Order" 
          ? `<button class="btn btn-sm ${p.closed ? "btn-yellow" : "btn-danger"}" data-admin-toggle-pre="${realIdx}" style="padding:3px 10px;min-height:28px;font-size:0.7rem;">${p.closed ? "Reopen" : "Close"}</button>`
          : `<button class="btn btn-sm ${p.status === "Unavailable" ? "btn-yellow" : "btn-danger"}" data-admin-toggle-sold="${realIdx}" style="padding:3px 10px;min-height:28px;font-size:0.7rem;">${p.status === "Unavailable" ? "Available" : "Unavailable"}</button>`}
        <button class="btn btn-sm" data-admin-delete-prod data-prod-index="${realIdx}" title="Remove" style="padding:2px 6px;min-height:24px;font-size:0.7rem;background:transparent;border:1px solid var(--line);color:var(--muted);cursor:pointer;">×</button>
      </td>
    </tr>`;
    }).join("")}
  </tbody></table>`;

  target.innerHTML = html;

  target.querySelectorAll("[data-admin-prod-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      window._adminProdFilter = btn.dataset.adminProdFilter === "pre" ? "pre" : "reg";
      renderAdminProducts();
      // Auto-set the Add form to match the active filter
      const form = document.querySelector("[data-admin-prod-form]");
      if (form) {
        const catSel = form.querySelector("[name='category']");
        if (catSel) {
          const isPre = window._adminProdFilter === "pre";
          catSel.innerHTML = "";
          if (isPre) {
            const o = document.createElement("option");
            o.value = "Pre-Order"; o.textContent = "Pre-Order"; o.selected = true;
            catSel.appendChild(o);
          } else {
            ["Cards", "Sealed Products", "Others"].forEach((c) => {
              const o = document.createElement("option");
              o.value = c; o.textContent = c;
              catSel.appendChild(o);
            });
          }
        }
        form.querySelector("[name='edit_index']").value = "-1";
        form.querySelector("button[type='submit']").textContent = "Add Product";
        const evt = new Event("change");
        if (catSel) catSel.dispatchEvent(evt);
      }
    });
  });

  target.querySelectorAll("[data-admin-delete-prod]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.prodIndex);
      const p = products[idx];
      if (p && confirm(`Delete "${p.name}"?`)) {
        logAdminAction("product_delete", `Deleted product "${p.name}"`, "product", p.id);
        products.splice(idx, 1);
        saveProducts(products);
        renderAdminProducts();
      }
    });
  });

  target.querySelectorAll("[data-admin-toggle-feat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.adminToggleFeat);
      const p = products[idx];
      if (!p) return;
      p.featured = p.featured === true ? false : true;
      logAdminAction("product_featured", `${p.featured ? "Featured" : "Unfeatured"} product "${p.name}"`, "product", p.id);
      saveProducts(products);
      renderAdminProducts();
    });
  });

  target.querySelectorAll("[data-admin-toggle-pre]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.adminTogglePre);
      const p = products[idx];
      if (!p) return;
      p.closed = !p.closed;
      if (p.closed) p.closesAt = null;
      saveProducts(products);
      renderAdminProducts();
    });
  });

  target.querySelectorAll("[data-admin-toggle-sold]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.adminToggleSold);
      const p = products[idx];
      if (!p) return;
      p.status = p.status === "Unavailable" ? "In Stock" : "Unavailable";
      logAdminAction("product_status", `Changed "${p.name}" to ${p.status}`, "product", p.id);
      saveProducts(products);
      renderAdminProducts();
    });
  });

  target.querySelectorAll("[data-admin-edit-prod]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.prodIndex);
      const p = products[idx];
      if (!p) return;
      const form = document.querySelector("[data-admin-prod-form]");
      if (form) {
        form.querySelector("[name='edit_index']").value = idx;
        form.querySelector("[name='name']").value = p.name;
        const cs = p.caseSize || 1;
        const unitPrice = Math.round(p.price / cs);
        form.querySelector("[name='price']").value = unitPrice;
        form.querySelector("[name='case_size']").value = cs;
        form.querySelector("[name='case_price']").value = p.price;
        form.querySelector("[name='status']").value = p.status;
        form.querySelector("[name='image']").value = p.image;
        form.querySelector("[name='description']").value = p.description;
        form.querySelector("[name='set_name']").value = p.set;
        form.querySelector("[name='closes_at']").value = toDatetimeLocal(p.closesAt) || "";
        form.querySelector("button[type='submit']").textContent = "Update Product";
        // Rebuild category options based on active filter tab
        const catSel = form.querySelector("[name='category']");
        if (catSel) {
          const isPreFilter = window._adminProdFilter === "pre";
          catSel.innerHTML = "";
          if (isPreFilter) {
            const o = document.createElement("option");
            o.value = "Pre-Order"; o.textContent = "Pre-Order"; o.selected = true;
            catSel.appendChild(o);
          } else {
            ["Cards", "Sealed Products", "Others"].forEach((c) => {
              const o = document.createElement("option");
              o.value = c; o.textContent = c;
              if (c === p.category) o.selected = true;
              catSel.appendChild(o);
            });
          }
        }
        // Trigger field visibility sync
        const evt = new Event("change");
        if (catSel) catSel.dispatchEvent(evt);
      }
    });
  });
}

function initAdminProductForm() {
  const form = document.querySelector("[data-admin-prod-form]");
  if (!form) return;

  const statusSelect = form.querySelector("[name='status']");
  function buildStatusOptions(includePre) {
    statusSelect.innerHTML = "";
    ["In Stock", "Low Stock", "Unavailable"].forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      statusSelect.appendChild(opt);
    });
    if (includePre) {
      const opt = document.createElement("option");
      opt.value = "Pre-Order";
      opt.textContent = "Pre-Order";
      statusSelect.appendChild(opt);
    }
  }
  buildStatusOptions(false);

  const categorySelect = form.querySelector("[name='category']");
  const closesAtInput = form.querySelector("[name='closes_at']");
  const caseSizeInput = form.querySelector("[name='case_size']");
  const casePriceInput = form.querySelector("[name='case_price']");

  function syncCategoryFields() {
    const cat = categorySelect ? categorySelect.value : "";
    const pre = cat === "Pre-Order";
    // Hide dropdown arrow when only one option (Pre-Order filter active)
    if (categorySelect) {
      categorySelect.classList.toggle("select-readonly", categorySelect.options.length <= 1);
    }
    // Hide status dropdown when Pre-Order (category implies status)
    if (categorySelect && statusSelect) {
      statusSelect.style.display = pre ? "none" : "";
    }
    // Closes at / case fields: show only for Pre-Order
    if (closesAtInput) closesAtInput.style.display = pre ? "" : "none";
    if (caseSizeInput) caseSizeInput.style.display = pre ? "" : "none";
    if (casePriceInput) casePriceInput.style.display = pre ? "" : "none";
  }

  if (categorySelect) {
    categorySelect.addEventListener("change", syncCategoryFields);
    syncCategoryFields();
  }

  function updateCasePrice() {
    const up = parseInt(form.querySelector("[name='price']").value) || 0;
    const cs = parseInt(form.querySelector("[name='case_size']").value) || 1;
    const cp = up * cs;
    form.querySelector("[name='case_price']").value = cp;
  }
  form.querySelector("[name='price']").addEventListener("input", updateCasePrice);
  form.querySelector("[name='case_size']").addEventListener("input", updateCasePrice);

  const fileInput = form.querySelector("[name='image_upload']");
  const uploadBtn = form.querySelector("[data-upload-image]");
  const imageField = form.querySelector("[name='image']");

  // When a file is selected, show a preview that it's ready to upload
  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (!file) return;
      // Show the filename as a hint in the image field
      const hint = "(ready to upload: " + file.name + ")";
      imageField.placeholder = hint;
    });
  }

  // Cloudinary upload button
  if (uploadBtn && fileInput && imageField) {
    uploadBtn.addEventListener("click", function () {
      const file = fileInput.files[0];
      if (!file) {
        showToast("Select an image file first.");
        return;
      }

      uploadBtn.disabled = true;
      uploadBtn.textContent = "Uploading...";

      var apiBase = (window.SITE_CONFIG && window.SITE_CONFIG.apiBaseUrl) || "";
      if (!apiBase) {
        showToast("API base URL not configured in site-config.js");
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Upload ☁";
        return;
      }

      var fd = new FormData();
      fd.append("file", file);

      fetch(apiBase + "/api/upload-image", {
        method: "POST",
        body: fd,
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            imageField.value = data.url;
            showToast("Image uploaded to Cloudinary!");
          } else {
            showToast("Upload failed: " + (data.error || "Unknown error"));
          }
        })
        .catch(function (err) {
          showToast("Upload error: " + err.message);
        })
        .finally(function () {
          uploadBtn.disabled = false;
          uploadBtn.textContent = "Upload ☁";
        });
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const idx = parseInt(data.get("edit_index") || "-1");
    const rawId = data.get("name").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const category = data.get("category").trim();
    const isPre = category === "Pre-Order";
    const rawClosesAt = data.get("closes_at");
    const closesAt = rawClosesAt ? new Date(rawClosesAt).toISOString() : null;

    const product = {
      id: idx >= 0 && idx < products.length ? products[idx].id : rawId + "-" + Date.now(),
      name: data.get("name").trim(),
      set: data.get("set_name").trim(),
      category,

      price: isPre && data.get("case_price") ? parseInt(data.get("case_price")) : (parseInt(data.get("price")) || 0),
      caseSize: isPre && data.get("case_size") ? parseInt(data.get("case_size")) : 1,
      status: isPre ? "Pre-Order" : (data.get("status") || "In Stock").trim(),
      image: data.get("image").trim(),
      description: data.get("description").trim(),
      closesAt,
      closed: isPre ? false : undefined
    };

    if (idx >= 0 && idx < products.length) {
      product.id = products[idx].id;
      products[idx] = product;
      logAdminAction("product_update", `Updated product "${product.name}"`, "product", product.id);
    } else {
      products.push(product);
      logAdminAction("product_add", `Added new product "${product.name}"`, "product", product.id);
    }

    saveProducts(products);
    resetAdminProductForm();
    autoClosePreOrders();
    renderAdminProducts();
    showToast("Product saved.");
  });
}

function resetAdminProductForm() {
  const form = document.querySelector("[data-admin-prod-form]");
  if (!form) return;
  form.reset();
  form.querySelector("[name='edit_index']").value = "-1";
  form.querySelector("button[type='submit']").textContent = "Add Product";
  // Restore category options matching the active filter
  const catSel = form.querySelector("[name='category']");
  if (catSel) {
    const isPre = window._adminProdFilter === "pre";
    catSel.innerHTML = "";
    if (isPre) {
      const o = document.createElement("option");
      o.value = "Pre-Order"; o.textContent = "Pre-Order"; o.selected = true;
      catSel.appendChild(o);
    } else {
      catSel.innerHTML = '<option value="Cards">Cards</option><option value="Sealed Products">Sealed Products</option><option value="Pre-Order">Pre-Order</option><option value="Others">Others</option>';
    }
    catSel.dispatchEvent(new Event("change"));
  }
}

function toDatetimeLocal(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function autoClosePreOrders() {
  let changed = false;
  const now = Date.now();
  for (const p of products) {
    if (p.category === "Pre-Order" && p.closesAt && !p.closed) {
      if (new Date(p.closesAt).getTime() <= now) {
        p.closed = true;
        changed = true;
      }
    }
  }
  if (changed) saveProducts(products);
}

function loadHomeConfig() {
  const stored = localStorage.getItem("collectHomeConfig");
  if (stored) { try { return JSON.parse(stored); } catch { /* fall through */ } }
  return null;
}

function renderAdminHome() {
  renderAdminSettings();
  initAdminExpForm();
  renderAdminExpList();
  const form = document.querySelector("[data-admin-home-form]");
  if (!form) return;
  const saved = loadHomeConfig() || {};

  const fields = ["hero_card1","hero_card2","hero_card3"];
  fields.forEach((f) => {
    const el = form.querySelector(`[name="${f}"]`);
    if (el) el.value = saved[f] || "";
  });

  // File upload handlers for hero cards
  [1, 2, 3].forEach((i) => {
    const fileInput = form.querySelector(`[name="hero_card${i}_upload"]`);
    if (fileInput) {
      fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          form.querySelector(`[name="hero_card${i}"]`).value = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }
  });

  if (!form.dataset.homeInit) {
    form.dataset.homeInit = "1";
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const config = {};
      fields.forEach((f) => {
        const val = data.get(f);
        config[f] = val ? val.trim() : "";
      });
      localStorage.setItem("collectHomeConfig", JSON.stringify(config));
      alert("Home page saved! Refresh the home page to see changes.");
    });
  }
}

function showHomePreview(exp, target) {
  if (!exp || !exp.name) { target.innerHTML = `<span class="muted">Fill in the form and save to see a preview.</span>`; return; }
  target.innerHTML = `
    <div class="exp-banner" style="transform:scale(0.8);transform-origin:top left;width:125%;">
      <div class="exp-banner-inner">
        <div class="exp-badge">${exp.tagline || "Tagline"}</div>
        <h2 class="exp-title">${exp.name}</h2>
        <p class="exp-desc">${exp.description || ""}</p>
        <div class="exp-actions">
          <a class="btn btn-primary" href="#">View All Products</a>
          <a class="btn btn-outline" href="#">View All Cards</a>
          <span class="exp-release">Released ${exp.releaseDate || "TBA"}</span>
        </div>
      </div>
      <div class="exp-trailer-wrap">
        <div class="exp-trailer" style="background:rgba(255,255,255,0.1);border-radius:8px;display:flex;align-items:center;justify-content:center;min-height:120px;color:var(--muted);font-size:0.85rem;">
          ${exp.trailerId ? `<img src="https://img.youtube.com/vi/${exp.trailerId}/maxresdefault.jpg" alt="" style="width:100%;border-radius:8px;">` : "No trailer ID"}
        </div>
      </div>
    </div>
  `;
}

function resetAdminHomeForm() {
  localStorage.removeItem("collectHomeConfig");
  renderAdminHome();
}

function initAdminExpForm() {
  const form = document.querySelector("[data-admin-exp-form]");
  if (!form || form.dataset.expInit) return;
  form.dataset.expInit = "1";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const idx = parseInt(data.get("exp_edit_index") || "-1");
    const name = data.get("exp_name").trim();
    const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const rawId = data.get("exp_trailer_id").trim();
    const m = rawId.match(/(?:youtube\.com\/.*[?&]v=|youtu\.be\/|^)([a-zA-Z0-9_-]{11})(?:$|[?&])/);
    const trailerId = m ? m[1] : rawId;
    const exp = {
      id, name,
      apiSetId: data.get("exp_api_set_id").trim(),
      releaseDate: data.get("exp_release_date").trim(),
      tagline: data.get("exp_tagline").trim(),
      description: data.get("exp_description").trim(),
      trailerId,
      trailerUrl: trailerId ? "https://youtu.be/" + trailerId : ""
    };
    let list = loadExpansions();
    if (idx >= 0 && idx < list.length) {
      // Preserve fields not in the form from the existing entry
      if (!exp.apiSetId) exp.apiSetId = list[idx].apiSetId || list[idx].api_set_id || "";
      exp.imagePrefix = list[idx].imagePrefix || list[idx].image_prefix || "";
      exp.productSet = list[idx].productSet || list[idx].product_set || "";
      exp.cardCount = list[idx].cardCount || list[idx].card_count || 0;
      list[idx] = exp;
    } else {
      list.unshift(exp);
    }
    localStorage.setItem("collectExpansions", JSON.stringify(list));
    resetAdminExpForm();
    renderAdminExpList();
    alert("Expansion saved.");
  });

  // File upload handlers not needed for expansions (all text fields)
}

function loadExpansions() {
  const defaults = (typeof SITE !== "undefined" && SITE.expansions) || [];
  try {
    const s = localStorage.getItem("collectExpansions");
    if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length) {
      const seen = {};
      const result = [];
      p.forEach(e => { if (e.id && !seen[e.id]) { seen[e.id] = true; result.push(e); } });
      defaults.forEach(e => { if (e.id && !seen[e.id]) { seen[e.id] = true; result.push(e); } });
      return result;
    }}
  } catch { /* fall through */ }
  return defaults;
}

function saveExpansions(list) {
  localStorage.setItem("collectExpansions", JSON.stringify(list));
}

function resetAdminExpForm() {
  const form = document.querySelector("[data-admin-exp-form]");
  if (!form) return;
  form.reset();
  const hidden = form.querySelector("[name='exp_edit_index']");
  if (hidden) hidden.value = "-1";
  const btn = form.querySelector("button[type='submit']");
  if (btn) btn.textContent = "Add Expansion";
}

function renderAdminExpList() {
  const target = document.querySelector("[data-admin-exp-list]");
  if (!target) return;
  const list = loadExpansions();
  if (!list.length) {
    target.innerHTML = '<p class="muted">No expansions yet.</p>';
    return;
  }
  target.innerHTML = `<table class="admin-table"><thead><tr><th>Name</th><th>Release</th><th>Actions</th></tr></thead><tbody>
    ${list.map((exp, i) => {
      return `<tr>
      <td><strong>${exp.name}</strong></td>
      <td>${exp.releaseDate || exp.release_date || ""}</td>
      <td style="display:flex;gap:6px;">
        <button class="btn btn-outline" data-admin-edit-exp="${i}" style="padding:4px 12px;font-size:0.75rem;">Edit</button>
        <button class="btn btn-sm" data-admin-delete-exp="${i}" title="Remove" style="padding:2px 6px;min-height:24px;font-size:0.7rem;background:transparent;border:1px solid var(--line);color:var(--muted);cursor:pointer;">×</button>
      </td>
    </tr>`;
    }).join("")}
  </tbody></table>`;

  target.querySelectorAll("[data-admin-edit-exp]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = parseInt(btn.dataset.adminEditExp);
      const list = loadExpansions();
      const exp = list[i];
      if (!exp) return;
      const form = document.querySelector("[data-admin-exp-form]");
      if (!form) return;
      form.querySelector("[name='exp_edit_index']").value = i;
      form.querySelector("[name='exp_name']").value = exp.name || "";
      form.querySelector("[name='exp_release_date']").value = exp.releaseDate || exp.release_date || "";
      form.querySelector("[name='exp_api_set_id']").value = exp.apiSetId || exp.api_set_id || "";
      form.querySelector("[name='exp_tagline']").value = exp.tagline || "";
      form.querySelector("[name='exp_description']").value = exp.description || "";
      form.querySelector("[name='exp_trailer_id']").value = exp.trailerId || exp.trailer_id || "";
      form.querySelector("button[type='submit']").textContent = "Update Expansion";
      form.scrollIntoView({ behavior: "smooth" });
    });
  });

  target.querySelectorAll("[data-admin-delete-exp]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = parseInt(btn.dataset.adminDeleteExp);
      const list = loadExpansions();
      if (!list[i]) return;
      if (!confirm(`Delete "${list[i].name}"?`)) return;
      list.splice(i, 1);
      saveExpansions(list);
      renderAdminExpList();
    });
  });
}

function getApiBase() {
  return (window.SITE_CONFIG && window.SITE_CONFIG.apiBaseUrl) || "";
}

function logAdminAction(actionType, description, targetType, targetId) {
  var user = getCurrentUser();
  var email = user ? user.email : "unknown";
  var apiBase = getApiBase();
  if (!apiBase) return;
  fetch(apiBase + "/api/activity-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      admin_email: email,
      action_type: actionType,
      description: description,
      target_type: targetType || "",
      target_id: targetId || "",
    }),
  }).catch(function () {});
}

// ===================== CUSTOMER LIST =====================
function renderAdminCustomers() {
  var target = document.querySelector("[data-admin-customers-list]");
  if (!target) return;
  var apiBase = getApiBase();
  if (!apiBase) {
    target.innerHTML = '<p class="muted">API not configured.</p>';
    return;
  }
  target.innerHTML = '<p class="muted">Loading customers...</p>';
  fetch(apiBase + "/api/customers")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success || !data.customers || !data.customers.length) {
        target.innerHTML = '<p class="muted">No customers found.</p>';
        return;
      }
      var html = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">' +
        '<h3>All Customers (' + data.customers.length + ')</h3>' +
        '<input class="field" data-admin-customer-search placeholder="Search by name or email" style="max-width:260px;min-height:38px;">' +
        '</div>';
      html += '<table class="admin-table"><thead><tr>' +
        '<th>Name</th><th>Email</th><th>Registered</th><th>Orders</th><th>Total Spent</th><th>Role</th>' +
        '</tr></thead><tbody>';
      data.customers.forEach(function (c) {
        var date = c.created_at ? new Date(c.created_at).toLocaleDateString() : "—";
        var role = c.is_admin ? '<span class="status" style="background:rgba(124,58,237,0.2);">Admin</span>' : "Customer";
        html += '<tr>' +
          '<td><strong>' + (c.name || "—") + '</strong></td>' +
          '<td>' + (c.email || "—") + '</td>' +
          '<td>' + date + '</td>' +
          '<td>' + (c.order_count || 0) + '</td>' +
          '<td>&#8369;' + (c.total_spent || 0).toLocaleString() + '</td>' +
          '<td>' + role + '</td>' +
          '</tr>';
      });
      html += '</tbody></table>';
      target.innerHTML = html;

      var searchInput = target.querySelector("[data-admin-customer-search]");
      if (searchInput) {
        searchInput.addEventListener("input", function () {
          var term = searchInput.value.trim().toLowerCase();
          target.querySelectorAll("tbody tr").forEach(function (row) {
            row.hidden = term && !row.textContent.toLowerCase().includes(term);
          });
        });
      }
    })
    .catch(function (err) {
      target.innerHTML = '<p class="muted">Failed to load customers: ' + err.message + '</p>';
    });
}

// ===================== ORDER STATUS FILTERS =====================
function renderAdminOrdersFiltered() {
  var target = document.querySelector("[data-admin-orders-list]");
  if (!target) return;
  var allOrders = getOrders();
  var filter = window._adminOrderStatusFilter || "all";

  var statusGroups = {
    all: allOrders,
    pending: allOrders.filter(function (o) { return o.status === "Waiting for Payment" || o.status === "Deposit Received"; }),
    processing: allOrders.filter(function (o) { return o.status === "Deposit Verified" || o.status === "Allocation Pending" || o.status === "Allocation Confirmed" || o.status === "Preparing"; }),
    shipped: allOrders.filter(function (o) { return o.status === "Shipped"; }),
    delivered: allOrders.filter(function (o) { return o.status === "Delivered"; }),
    cancelled: allOrders.filter(function (o) { return o.status === "Cancelled"; }),
  };

  var tabs = [
    { key: "all", label: "All", count: statusGroups.all.length },
    { key: "pending", label: "Pending", count: statusGroups.pending.length },
    { key: "processing", label: "Processing", count: statusGroups.processing.length },
    { key: "shipped", label: "Shipped", count: statusGroups.shipped.length },
    { key: "delivered", label: "Delivered", count: statusGroups.delivered.length },
    { key: "cancelled", label: "Cancelled", count: statusGroups.cancelled.length },
  ];

  var html = '<div class="admin-order-filters" style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">';
  tabs.forEach(function (t) {
    var active = filter === t.key ? "btn-yellow" : "btn-outline";
    html += '<button class="btn btn-sm ' + active + '" data-order-status-filter="' + t.key + '">' + t.label + ' (' + t.count + ')</button>';
  });
  html += '</div>';

  var list = statusGroups[filter] || statusGroups.all;

  if (!list.length) {
    html += '<p class="muted">No orders in this category.</p>';
    target.innerHTML = html;
    bindOrderStatusFilters(target);
    return;
  }

  html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">' +
    '<h2>' + tabs.find(function (t) { return t.key === filter; }).label + ' Orders</h2>' +
    '<input class="field" data-admin-order-search placeholder="Search by order# or name" style="max-width:260px;min-height:38px;">' +
    '</div>';

  html += '<table class="admin-table"><thead><tr>' +
    '<th>Order#</th><th>Customer</th><th>Contact</th><th>Items</th><th>Ship to</th><th>Total</th><th>Status</th><th>Action</th>' +
    '</tr></thead><tbody>' +
    list.map(buildOrderRow).join("") +
    '</tbody></table>';

  target.innerHTML = html;
  bindOrderStatusFilters(target);
  initAdminOrderSearch(target);
}

function bindOrderStatusFilters(scope) {
  scope.querySelectorAll("[data-order-status-filter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      window._adminOrderStatusFilter = btn.dataset.orderStatusFilter;
      renderAdminOrdersFiltered();
    });
  });
}

// ===================== ACTIVITY LOG =====================
function renderAdminActivityLog() {
  var target = document.querySelector("[data-admin-activity-log]");
  if (!target) return;
  var apiBase = getApiBase();
  if (!apiBase) {
    target.innerHTML = '<p class="muted">API not configured.</p>';
    return;
  }
  target.innerHTML = '<p class="muted">Loading activity log...</p>';
  fetch(apiBase + "/api/activity-log?limit=200")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success || !data.logs || !data.logs.length) {
        target.innerHTML = '<p class="muted">No activity recorded yet.</p>';
        return;
      }
      var html = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">' +
        '<h3>Recent Activity (' + data.logs.length + ' entries)</h3>' +
        '<input class="field" data-admin-log-search placeholder="Search activity..." style="max-width:260px;min-height:38px;">' +
        '</div>';
      html += '<table class="admin-table"><thead><tr>' +
        '<th>Time</th><th>Admin</th><th>Action</th><th>Description</th><th>Target</th>' +
        '</tr></thead><tbody>';
      data.logs.forEach(function (log) {
        var time = log.created_at ? new Date(log.created_at).toLocaleString() : "—";
        var target = log.target_type ? log.target_type + (log.target_id ? "#" + log.target_id : "") : "—";
        html += '<tr>' +
          '<td style="white-space:nowrap;font-size:0.8rem;">' + time + '</td>' +
          '<td>' + (log.admin_email || "—") + '</td>' +
          '<td><span class="status">' + (log.action_type || "—") + '</span></td>' +
          '<td>' + (log.description || "—") + '</td>' +
          '<td>' + target + '</td>' +
          '</tr>';
      });
      html += '</tbody></table>';
      target.innerHTML = html;

      var searchInput = target.querySelector("[data-admin-log-search]");
      if (searchInput) {
        searchInput.addEventListener("input", function () {
          var term = searchInput.value.trim().toLowerCase();
          target.querySelectorAll("tbody tr").forEach(function (row) {
            row.hidden = term && !row.textContent.toLowerCase().includes(term);
          });
        });
      }
    })
    .catch(function (err) {
      target.innerHTML = '<p class="muted">Failed to load activity log: ' + err.message + '</p>';
    });
}

// ===================== ADMIN SEARCH BAR =====================
function initAdminSearch() {
  var input = document.querySelector("[data-admin-search]");
  var resultsDiv = document.querySelector("[data-admin-search-results]");
  if (!input || !resultsDiv) return;

  var debounceTimer;
  input.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    var term = input.value.trim();
    if (term.length < 2) {
      resultsDiv.style.display = "none";
      resultsDiv.innerHTML = "";
      return;
    }
    debounceTimer = setTimeout(function () {
      performAdminSearch(term.toLowerCase(), resultsDiv);
    }, 250);
  });

  input.addEventListener("blur", function () {
    setTimeout(function () {
      resultsDiv.style.display = "none";
    }, 200);
  });
  input.addEventListener("focus", function () {
    if (input.value.trim().length >= 2 && resultsDiv.innerHTML) {
      resultsDiv.style.display = "";
    }
  });
}

function performAdminSearch(term, target) {
  var results = [];

  // Search orders
  var allOrders = getOrders();
  allOrders.forEach(function (o) {
    var text = [o.number, o.customerName, o.contactNumber, o.status, o.details].join(" ").toLowerCase();
    if (text.includes(term)) {
      results.push({
        type: "Order",
        label: o.number + " — " + (o.customerName || "Unknown"),
        detail: o.status,
        tab: "orders",
      });
    }
  });

  // Search products
  products.forEach(function (p) {
    var text = [p.name, p.category, p.status, p.set].join(" ").toLowerCase();
    if (text.includes(term)) {
      results.push({
        type: "Product",
        label: p.name,
        detail: p.category + " — " + p.status,
        tab: "products",
      });
    }
  });

  if (!results.length) {
    target.innerHTML = '<div class="admin-search-empty">No results for "' + term + '"</div>';
    target.style.display = "";
    return;
  }

  var html = '<div class="admin-search-list">';
  results.slice(0, 20).forEach(function (r) {
    html += '<button class="admin-search-item" data-admin-search-goto="' + r.tab + '">' +
      '<span class="admin-search-type">' + r.type + '</span> ' +
      '<span class="admin-search-label">' + r.label + '</span> ' +
      '<span class="admin-search-detail">' + r.detail + '</span>' +
      '</button>';
  });
  html += '</div>';
  target.innerHTML = html;
  target.style.display = "";

  target.querySelectorAll("[data-admin-search-goto]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchTab(btn.dataset.adminSearchGoto);
      target.style.display = "none";
      target.innerHTML = "";
      input.value = "";
    });
  });
}

function clearAllData() {
  if (!confirm("Reset ALL data? This will wipe orders, products, accounts, cart, and expansions. This cannot be undone.")) return;
  localStorage.removeItem("collectOrders");
  localStorage.removeItem("collectProducts");
  localStorage.removeItem("collectUsers");
  localStorage.removeItem("collectCart");
  localStorage.removeItem("collectExpansions");
  localStorage.removeItem("collectHomeConfig");
  localStorage.removeItem("collectCurrentUser");
  location.reload();
}

function renderAdminSettings() {
  const target = document.querySelector("[data-admin-settings]");
  if (!target) return;
  const user = getCurrentUser();
  const email = user ? user.email : "(not logged in)";
  target.innerHTML = `
    <div style="display:grid;gap:12px;max-width:400px;">
      <p><strong>Logged in as:</strong> ${email}</p>
      <p class="form-help">Admin access is tied to your database account. To change credentials, use the <a href="../login.html">login page</a>.</p>
    </div>
    <div style="text-align:right;margin-top:16px;"><button class="btn btn-outline" onclick="clearAllData()" style="color:var(--red);border-color:rgba(239,83,80,0.3);">Reset All Data</button></div>
  `;
}

document.addEventListener("change", (e) => {
  const orderSel = e.target.closest("[data-admin-order-status]");
  if (orderSel) {
    const all = getOrders();
    const order = all.find((o) => o.number === orderSel.dataset.order);
    if (order) {
      const oldStatus = order.status;
      order.status = orderSel.value;
      localStorage.setItem("collectOrders", JSON.stringify(all));
      logAdminAction("order_status", `Changed order ${order.number} from "${oldStatus}" to "${order.status}"`, "order", order.number);
      renderAdminDashboard();
      renderAdminOrdersFiltered();
    }
    return;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  initAdminLogout();
  initAdminNavTabs();
  initAdminProductForm();
  initAdminSearch();

  // One-time cleanup: remove stale featured flags set by a previous bug
  let cleaned = false;
  for (const p of products) {
    if (p.featured !== undefined) {
      delete p.featured;
      cleaned = true;
    }
  }
  if (cleaned) saveProducts(products);

  if (requireAdmin()) {
    autoClosePreOrders();
    renderAdminDashboard();
    renderAdminOrdersFiltered();
    renderAdminProducts();
  }
});
