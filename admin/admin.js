(function () {
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) {
    return String(s === undefined || s === null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fmtDate(ts) {
    var d = new Date(ts);
    return d.toLocaleString();
  }

  function showLogin() {
    $("login-view").classList.remove("hidden");
    $("app-view").classList.add("hidden");
  }

  function showApp() {
    $("login-view").classList.add("hidden");
    $("app-view").classList.remove("hidden");
    loadStats();
    loadContent("index");
  }

  var toastTimer;
  function showToast(msg) {
    $("toast-msg").textContent = msg;
    $("toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $("toast").classList.remove("show"); }, 2200);
  }

  function api(url, opts) {
    return fetch(url, Object.assign({ credentials: "same-origin" }, opts)).then(function (r) {
      if (r.status === 401) {
        showLogin();
        throw new Error("unauthorized");
      }
      return r.json();
    });
  }

  /* ---------- auth ---------- */

  $("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    $("login-error").textContent = "";
    fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: $("login-user").value, password: $("login-pass").value })
    })
      .then(function (r) {
        if (!r.ok) throw new Error("bad");
        return r.json();
      })
      .then(showApp)
      .catch(function () {
        $("login-error").textContent = "Invalid username or password.";
      });
  });

  $("logout-btn").addEventListener("click", function () {
    fetch("/api/admin/logout", { method: "POST" }).then(showLogin);
  });

  api("/api/admin/me").then(showApp).catch(function () {});

  /* ---------- tabs ---------- */

  document.querySelectorAll(".tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var tab = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.add("hidden"); });
      var panel = $("tab-" + tab);
      panel.classList.remove("hidden");
      panel.style.animation = "none";
      void panel.offsetWidth;
      panel.style.animation = "";
      if (tab === "overview") loadStats();
      if (tab === "content") loadContent($("content-page").value);
      if (tab === "orders") loadOrders();
      if (tab === "visits") loadVisits();
    });
  });

  /* ---------- overview ---------- */

  var chartInstance = null;

  function renderList(el, data) {
    var html = data.map(function (item) {
      return "<tr><td>" + esc(item.name) + "</td><td>" + item.count + "</td></tr>";
    }).join("");
    el.innerHTML = html || "<tr><td colspan='2'>No data yet</td></tr>";
  }

  function renderChart(lastDays) {
    var box = $("chart").parentElement;
    if (typeof Chart === "undefined") {
      box.classList.add("chart-fallback");
      var max = 1;
      lastDays.forEach(function (d) { if (d.visits > max) max = d.visits; });
      $("chart").outerHTML = lastDays.map(function (d) {
        var h = Math.max(2, Math.round((d.visits / max) * 100));
        return "<div class='bar-col'><span class='bar-val'>" + d.visits + "</span>" +
          "<div class='bar' style='height:" + h + "%'></div>" +
          "<span class='bar-label'>" + esc(d.label) + "</span></div>";
      }).join("");
      return;
    }

    if (chartInstance) chartInstance.destroy();

    var labels = lastDays.map(function (d) { return d.label; });
    var visits = lastDays.map(function (d) { return d.visits; });
    var orders = lastDays.map(function (d) { return d.orders; });
    var conv = lastDays.map(function (d) {
      return d.visits ? Math.round((d.orders / d.visits) * 1000) / 10 : 0;
    });

    chartInstance = new Chart($("chart"), {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Visits",
            data: visits,
            backgroundColor: "rgba(79, 110, 247, 0.75)",
            hoverBackgroundColor: "#4f6ef7",
            borderRadius: 6,
            yAxisID: "y",
            barPercentage: 0.55,
            categoryPercentage: 0.7
          },
          {
            label: "Orders",
            data: orders,
            backgroundColor: "rgba(16, 185, 129, 0.75)",
            hoverBackgroundColor: "#10b981",
            borderRadius: 6,
            yAxisID: "y",
            barPercentage: 0.55,
            categoryPercentage: 0.7
          },
          {
            label: "Conversion %",
            data: conv,
            type: "line",
            borderColor: "#f59e0b",
            backgroundColor: "#f59e0b",
            pointBackgroundColor: "#f59e0b",
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2.5,
            tension: 0.4,
            yAxisID: "y1",
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            labels: { usePointStyle: true, boxWidth: 8, font: { weight: 600 } }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var v = ctx.parsed && ctx.parsed.y !== undefined ? ctx.parsed.y : ctx.raw;
                return ctx.dataset.label + ": " + v + (ctx.dataset.label === "Conversion %" ? "%" : "");
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "#eef1f8" },
            border: { display: false },
            ticks: { precision: 0 }
          },
          y1: {
            position: "right",
            beginAtZero: true,
            max: 100,
            grid: { display: false },
            border: { display: false },
            ticks: { callback: function (v) { return v + "%"; } }
          },
          x: { grid: { display: false }, border: { display: false } }
        }
      }
    });
  }

  function loadStats() {
    api("/api/admin/stats").then(function (s) {
      $("ov-visits").textContent = s.totals.visits;
      $("ov-today").textContent = s.totals.today;
      $("ov-week").textContent = s.totals.week;
      $("ov-unique").textContent = s.totals.uniqueIps;
      $("ov-orders").textContent = s.totals.orders;
      $("ov-orders-today").textContent = s.totals.ordersToday;
      $("ov-conversion").textContent = s.totals.conversion + "%";

      renderChart(s.lastDays);

      $("pages-list").innerHTML = Object.keys(s.pages).map(function (p) {
        return "<div>" + esc(p) + ": <strong>" + s.pages[p] + "</strong></div>";
      }).join("") || "<div>No data yet</div>";

      renderList($("locations-body"), s.topLocations);
      renderList($("referrers-body"), s.topReferrers);
      renderList($("sources-body"), s.topSources);
      renderList($("campaigns-body"), s.topCampaigns);
    }).catch(function () {});
  }

  /* ---------- content editor ---------- */

  var editor = null;
  var previewTimer = null;
  var draftTimer = null;

  function editorValue() {
    return editor ? editor.getValue() : $("content-editor").value;
  }

  function setEditorValue(v) {
    if (editor) editor.setValue(v); else $("content-editor").value = v;
  }

  function draftKey() {
    return "ls_draft_" + $("content-page").value;
  }

  function triggerChange() {
    updateCharCount();
    schedulePreview();
    scheduleDraft();
  }

  function updateCharCount() {
    $("editor-count").textContent = editorValue().length.toLocaleString() + " chars";
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(updatePreview, 350);
  }

  function updatePreview() {
    var page = $("content-page").value;
    var css = page === "sales" ? "/sales.css" : "/styles.css";
    var content = editorValue().replace(/⟦([^⟧]*)⟧/g, '<span class="ph">$1</span>');
    var doc =
      '<!DOCTYPE html><html><head><meta charset="utf-8"><base href="/">' +
      '<link rel="stylesheet" href="' + css + '">' +
      "<style>" +
      "html,body{margin:0}" +
      ".ph{display:inline-block;background:#f1f5f9;color:#64748b;border:1px dashed #94a3b8;" +
      "border-radius:6px;padding:2px 10px;font-style:italic}" +
      ".img-ph{display:flex;align-items:center;justify-content:center;min-height:60px;margin:8px 0;" +
      "background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;color:#94a3b8;" +
      "font-size:0.8rem;padding:8px;text-align:center;word-break:break-all}" +
      "</style></head><body>" +
      content +
      "<script>" +
      "document.querySelectorAll('img').forEach(function(img){var box=function(){img.outerHTML=" +
      "'<div class=\\\"img-ph\\\">Image not found: '+(img.getAttribute('src')||'no src')+'</div>'};" +
      "if(!img.getAttribute('src')){box();return;}img.addEventListener('error',box);});" +
      "<\/script>" +
      "</body></html>";
    var fr = $("preview-frame");
    var win = fr.contentWindow || fr;
    var wdoc = win.document || win;
    wdoc.open();
    wdoc.write(doc);
    wdoc.close();
  }

  function updateAutosaveStatus(msg, saved) {
    var el = $("autosave-status");
    el.textContent = msg;
    el.classList.toggle("saved", !!saved);
  }

  function scheduleDraft() {
    clearTimeout(draftTimer);
    updateAutosaveStatus("Editing…", false);
    draftTimer = setTimeout(function () {
      try {
        localStorage.setItem(draftKey(), editorValue());
        updateAutosaveStatus("Draft saved ✓", true);
      } catch (e) {}
    }, 800);
  }

  function clearDraft() {
    try { localStorage.removeItem(draftKey()); } catch (e) {}
  }

  function insertAtCursor(text) {
    var ph = text.indexOf("⟦");
    var phEnd = text.indexOf("⟧", ph + 1);
    var select = ph !== -1 && phEnd !== -1;

    if (editor) {
      var doc = editor.getDoc();
      var pos = doc.getCursor();
      doc.replaceRange(text, pos);
      if (select) {
        var from = offsetToPos(text, pos.line, pos.ch, ph + 1);
        var to = offsetToPos(text, pos.line, pos.ch, phEnd);
        doc.setSelection(from, to);
      }
      editor.focus();
    } else {
      var ta = $("content-editor");
      var start = ta.selectionStart, end = ta.selectionEnd;
      ta.value = ta.value.slice(0, start) + text + ta.value.slice(end);
      if (select) {
        ta.selectionStart = start + ph + 1;
        ta.selectionEnd = start + phEnd;
      } else {
        ta.selectionStart = ta.selectionEnd = start + text.length;
      }
      ta.focus();
    }
    triggerChange();
  }

  function offsetToPos(text, baseLine, baseCh, offset) {
    var parts = text.slice(0, offset).split("\n");
    return {
      line: baseLine + parts.length - 1,
      ch: parts.length > 1 ? parts[parts.length - 1].length : baseCh + offset
    };
  }

  var SNIPPETS = {
    h2: "<h2>⟦New Section Heading⟧</h2>",
    p: "<p>⟦Write your paragraph text here⟧</p>",
    cta:
      '<div class="cta-wrap"><a href="#" class="cta-button">⟦BUY NOW⟧</a></div>',
    testimonial:
      '<div class="testimonial"><p>"⟦Customer testimonial text…⟧"</p><span class="t-author">— ⟦Customer Name⟧</span></div>',
    product:
      '<div class="product-box"><img src="images/product.jpg" alt="Product">' +
      "<h3>⟦Happy Family Manpower Syrup⟧</h3>" +
      '<p class="price">Promo Price: <s>31,000</s> <b>15,500</b></p>' +
      '<a href="#" class="cta-button">⟦ORDER NOW⟧</a></div>',
    form:
      '<p class="form-heading">PLEASE FILL THE FORM BELOW TO PLACE ORDER</p>\n' +
      '<form class="order-form" id="order-form-main">\n' +
      '  <label for="of-name">NAME <span class="req">*</span></label>\n' +
      '  <input type="text" id="of-name" name="name" placeholder="Please input your complete name" required>\n' +
      '  <label for="of-phone">PHONE NUMBER <span class="req">*</span></label>\n' +
      '  <input type="tel" id="of-phone" name="phone" placeholder="Phone number" required>\n' +
      '  <label for="of-alt">ALTERNATIVE PHONE NUMBER <span class="req">*</span></label>\n' +
      '  <input type="tel" id="of-alt" name="altphone" placeholder="Alternative phone number" required>\n' +
      '  <label for="of-num">NUMBER <span class="req">*</span></label>\n' +
      '  <input type="tel" id="of-num" name="number" placeholder="Phone" required>\n' +
      '  <label for="of-address">COMPLETE DELIVERY ADDRESS <span class="req">*</span></label>\n' +
      '  <textarea id="of-address" name="address" rows="3" placeholder="Please ensure you put your current delivery address" required></textarea>\n' +
      '  <label for="of-quantity">QUANTITY <span class="req">*</span></label>\n' +
      '  <select id="of-quantity" name="quantity" required>\n' +
      '    <option value="">Please pick the quantity you want to purchase</option>\n' +
      '    <option value="1">BUY ONE BOTTLE - 15,500 (PROMO PRICE)</option>\n' +
      '    <option value="2">BUY TWO BOTTLES - 25,000 (BESTSELLER)</option>\n' +
      '    <option value="3">BUY THREE BOTTLES - 35,000 (PREMIUM)</option>\n' +
      '    <option value="4">BUY FOUR BOTTLES - 45,000 (FULL PACKAGE)</option>\n' +
      "  </select>\n" +
      '  <button type="submit" class="order-submit">PLACE ORDER</button>\n' +
      "</form>",
    call:
      '<div class="contact-lines">' +
      '<p class="contact">CALLS ONLY: <a href="tel:+2348133885432">+234 813 388 5432</a></p>' +
      '<p class="contact">CHAT ON WHATSAPP: <a href="https://wa.me/2349110850890">+234 911 085 0890</a></p></div>',
    divider: '<hr class="divider">'
  };

  function initEditor() {
    var ta = $("content-editor");
    if (typeof CodeMirror !== "undefined") {
      editor = CodeMirror.fromTextArea(ta, {
        mode: "htmlmixed",
        theme: "material-darker",
        lineNumbers: true,
        lineWrapping: true,
        indentUnit: 2,
        tabSize: 2,
        extraKeys: { "Ctrl-S": saveContent, "Cmd-S": saveContent }
      });
      editor.on("change", triggerChange);
      bindEditorDrop(editor.getWrapperElement());
      bindEditorPaste(editor.getInputField());
    } else {
      ta.addEventListener("input", triggerChange);
      bindEditorDrop(ta);
      bindEditorPaste(ta);
    }
  }

  document.querySelectorAll(".editor-toolbar .tool").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-insert");
      if (!key) return;
      if (key === "img") {
        openImageModal();
        return;
      }
      insertAtCursor("\n" + SNIPPETS[key] + "\n");
    });
  });

  $("undo-btn").addEventListener("click", function () {
    if (editor) editor.undo(); else document.execCommand("undo");
  });
  $("redo-btn").addEventListener("click", function () {
    if (editor) editor.redo(); else document.execCommand("redo");
  });

  /* image picker */
  $("modal-close").addEventListener("click", closeImageModal);
  $("image-modal").addEventListener("click", function (e) {
    if (e.target === $("image-modal")) closeImageModal();
  });

  function openImageModal() {
    $("image-modal").classList.remove("hidden");
    var grid = $("image-grid");
    grid.innerHTML = '<span class="hint">Loading images…</span>';
    api("/api/admin/images").then(function (d) {
      if (!d.images.length) {
        grid.innerHTML = '<span class="hint">No images found in images/ folder</span>';
        return;
      }
      grid.innerHTML = d.images.map(function (name) {
        return '<div class="image-item" data-img="' + esc(name) + '">' +
          '<img src="/images/' + esc(name) + '" alt="' + esc(name) + '" loading="lazy">' +
          '<span class="img-name">' + esc(name) + "</span></div>";
      }).join("");
      grid.querySelectorAll(".image-item").forEach(function (item) {
        item.addEventListener("click", function () {
          var name = item.getAttribute("data-img");
          insertAtCursor('\n<img src="images/' + esc(name) + '" alt="Image">\n');
          closeImageModal();
        });
      });
    }).catch(function () {
      grid.innerHTML = '<span class="hint">Failed to load images</span>';
    });
  }

  function closeImageModal() {
    $("image-modal").classList.add("hidden");
  }

  /* external image import */
  function importStatus(msg, ok) {
    var el = $("import-status");
    el.textContent = msg;
    el.className = "import-status" + (ok ? " ok" : ok === false ? " err" : "");
  }

  $("import-btn").addEventListener("click", function () {
    var url = $("import-url").value.trim();
    if (!url) return importStatus("Enter a URL first", false);
    var btn = $("import-btn");
    btn.disabled = true;
    importStatus("Downloading…");
    api("/api/admin/images/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url })
    }).then(function (d) {
      if (!d.ok) throw new Error(d.error || "failed");
      importStatus("Downloaded " + d.name, true);
      openImageModal();
    }).catch(function (err) {
      importStatus(err.message || "Download failed", false);
    }).finally(function () {
      btn.disabled = false;
    });
  });

  $("insert-url-btn").addEventListener("click", function () {
    var url = $("import-url").value.trim();
    if (!url) return importStatus("Enter a URL first", false);
    insertAtCursor('\n<img src="' + esc(url) + '" alt="External image">\n');
    importStatus("Inserted URL", true);
    closeImageModal();
  });

  /* local file upload */
  function uploadImageFile(file, done, fail) {
    var fd = new FormData();
    fd.append("image", file);
    fetch("/api/admin/images/upload", {
      method: "POST",
      credentials: "same-origin",
      body: fd
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.ok) throw new Error(d.error || "Upload failed");
      done(d.name);
    }).catch(function (err) {
      showToast((err && err.message) || "Upload failed");
      if (fail) fail();
    });
  }

  function insertImageTag(name, pos) {
    var tag = '\n<img src="images/' + name + '" alt="Image">\n';
    if (editor) {
      editor.getDoc().replaceRange(tag, pos || editor.getDoc().getCursor());
      editor.focus();
    } else {
      var ta = $("content-editor");
      var idx = pos !== undefined ? pos : ta.selectionStart;
      ta.value = ta.value.slice(0, idx) + tag + ta.value.slice(idx);
      ta.focus();
    }
    triggerChange();
  }

  $("upload-file").addEventListener("change", function () {
    var file = this.files && this.files[0];
    if (!file) return;
    var label = $("upload-label");
    var text = $("upload-text");
    var reset = function () {
      label.classList.remove("uploading");
      text.textContent = "Upload from PC";
      this.value = "";
    }.bind(this);
    label.classList.add("uploading");
    text.textContent = "Uploading…";
    importStatus("Uploading " + file.name + "…");
    uploadImageFile(file, function (name) {
      reset();
      importStatus("Uploaded " + name, true);
      insertImageTag(name);
      closeImageModal();
      showToast("Image added: " + name);
    }, reset);
  });

  /* drag & drop + paste an image straight into the editor */
  function bindEditorDrop(target) {
    target.addEventListener("dragover", function (e) {
      e.preventDefault();
      $("editor-pane").classList.add("dragover");
    });
    target.addEventListener("dragleave", function () {
      $("editor-pane").classList.remove("dragover");
    });
    target.addEventListener("drop", function (e) {
      e.preventDefault();
      $("editor-pane").classList.remove("dragover");
      var img = (e.dataTransfer.files || [])[0];
      if (!img) {
        if (e.dataTransfer && /^image\//.test(String(e.dataTransfer.getData("text/uri-list") || ""))) return;
        return;
      }
      if (!/^image\//.test(img.type)) { showToast("Please drop an image file"); return; }
      var pos = editor && editor.coordsChar
        ? editor.coordsChar({ left: e.clientX, top: e.clientY })
        : undefined;
      showToast("Uploading image…");
      uploadImageFile(img, function (name) {
        insertImageTag(name, pos);
        showToast("Image added: " + name);
      });
    });
  }

  function bindEditorPaste(target) {
    target.addEventListener("paste", function (e) {
      var items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      var file = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].kind === "file" && items[i].type.indexOf("image/") === 0) {
          file = items[i].getAsFile();
          break;
        }
      }
      if (!file) return;
      e.preventDefault();
      var pos = editor ? editor.getDoc().getCursor() : $("content-editor").selectionStart;
      showToast("Uploading pasted image…");
      uploadImageFile(file, function (name) {
        insertImageTag(name, pos);
        showToast("Image added: " + name);
      });
    });
  }

  $("image-modal").addEventListener("dragover", function (e) { e.preventDefault(); });
  $("image-modal").addEventListener("drop", function (e) {
    e.preventDefault();
    var img = (e.dataTransfer.files || [])[0];
    if (!img) return;
    if (!/^image\//.test(img.type)) { importStatus("Drop an image file", false); return; }
    importStatus("Uploading…");
    uploadImageFile(img, function (name) {
      importStatus("Uploaded " + name, true);
      insertImageTag(name);
      closeImageModal();
      showToast("Image added: " + name);
    });
  });

  /* page switching + loading */
  $("content-page").addEventListener("change", function () {
    var page = this.value;
    $("open-live").href = page === "sales" ? "/sales" : "/";
    loadContent(page);
  });

  function loadContent(page) {
    api("/api/admin/content/" + page).then(function (d) {
      var content = d.content || "";
      setEditorValue(content);
      $("content-status").textContent = "";
      updateCharCount();
      updatePreview();
      try {
        var draft = localStorage.getItem(draftKey());
        if (draft && draft !== content) {
          if (window.confirm("You have an unsaved draft for this page. Restore it?")) {
            setEditorValue(draft);
            updateCharCount();
            schedulePreview();
          } else {
            clearDraft();
          }
        }
      } catch (e) {}
    }).catch(function () {});
  }

  function saveContent() {
    var page = $("content-page").value;
    var btn = $("content-save");
    var content = editorValue().replace(/⟦|⟧/g, "");
    btn.disabled = true;
    btn.textContent = "Saving…";
    api("/api/admin/content/" + page, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content })
    }).then(function () {
      showToast("Content published");
      $("content-status").textContent = "Saved " + new Date().toLocaleTimeString();
      clearDraft();
      updateAutosaveStatus("All changes saved ✓", true);
    }).catch(function () {
      showToast("Failed to save");
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = "Save & Publish";
    });
  }

  $("content-save").addEventListener("click", saveContent);

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveContent();
    }
  });

  initEditor();

  /* ---------- backup / restore ---------- */

  $("backup-btn").addEventListener("click", function () {
    api("/api/admin/backup").then(function (data) {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "leadsite-backup-" + new Date().toISOString().slice(0, 10) + ".json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Backup downloaded");
    }).catch(function () {
      showToast("Backup failed");
    });
  });

  $("restore-btn").addEventListener("click", function () {
    $("restore-file").click();
  });

  $("restore-file").addEventListener("change", function () {
    var file = this.files && this.files[0];
    if (!file) return;
    this.value = "";
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch (e) {
        showToast("Not a valid JSON file");
        return;
      }
      if (!window.confirm("This will REPLACE all current data (content, orders, visits) with this backup. Continue?")) return;
      api("/api/admin/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: parsed })
      }).then(function (d) {
        if (!d.ok) throw new Error(d.error || "Restore failed");
        showToast("Backup restored (" + d.counts.orders + " orders, " + d.counts.visits + " visits)");
        loadStats();
        loadOrders();
        loadVisits();
        loadContent($("content-page").value);
      }).catch(function (err) {
        showToast((err && err.message) || "Restore failed");
      });
    };
    reader.readAsText(file);
  });

  $("reset-stats-btn").addEventListener("click", function () {
    if (!window.confirm("Reset ALL visit statistics? This clears charts and top lists. Your orders are kept. This cannot be undone.")) return;
    api("/api/admin/reset-visits", { method: "POST" }).then(function () {
      showToast("Statistics reset");
      loadStats();
      loadVisits();
    }).catch(function () {
      showToast("Reset failed");
    });
  });

  /* ---------- orders ---------- */

  $("refresh-orders").addEventListener("click", loadOrders);

  function loadOrders() {
    api("/api/admin/orders").then(function (d) {
      $("orders-body").innerHTML = d.orders.map(function (o) {
        return "<tr>" +
          "<td>" + o.id + "</td>" +
          "<td>" + fmtDate(o.ts) + "</td>" +
          "<td>" + esc(o.name) + "</td>" +
          "<td>" + esc(o.phone) + "</td>" +
          "<td>" + esc(o.altphone) + "</td>" +
          "<td>" + esc(o.number) + "</td>" +
          "<td>" + esc(o.address) + "</td>" +
          "<td>" + esc(o.quantity) + "</td>" +
          "<td>" + esc(o.city + ", " + o.country) + "</td>" +
          "<td>" + esc(o.referrer) + "</td>" +
          "<td>" + esc(o.utm_source) + "</td>" +
          "</tr>";
      }).join("") || "<tr><td colspan='11'>No orders yet</td></tr>";
    }).catch(function () {});
  }

  /* ---------- visits ---------- */

  $("refresh-visits").addEventListener("click", loadVisits);

  function device(u) {
    if (!u) return "Unknown";
    if (/mobile|android|iphone/i.test(u)) return "Mobile";
    if (/tablet|ipad/i.test(u)) return "Tablet";
    return "Desktop";
  }

  function loadVisits() {
    api("/api/admin/visits").then(function (d) {
      var list = d.visits.slice(0, 200);
      $("visits-body").innerHTML = list.map(function (v) {
        return "<tr>" +
          "<td>" + v.id + "</td>" +
          "<td>" + fmtDate(v.ts) + "</td>" +
          "<td>" + esc(v.page) + "</td>" +
          "<td>" + esc(v.ip) + "</td>" +
          "<td>" + esc(v.city + ", " + v.country) + "</td>" +
          "<td>" + esc(v.referrer) + "</td>" +
          "<td>" + esc(v.utm_source) + "</td>" +
          "<td>" + esc(v.utm_campaign) + "</td>" +
          "<td>" + device(v.ua) + "</td>" +
          "</tr>";
      }).join("") || "<tr><td colspan='9'>No visits yet</td></tr>";
    }).catch(function () {});
  }
})();
