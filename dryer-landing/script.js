/* =============================================================
   نَدى (Nada) — interactions
   ============================================================= */
(function () {
  "use strict";
  var CFG = window.NADA_CONFIG || {};
  var PRICE = CFG.PRICE_PER_UNIT || 175;
  var MAX_QTY = CFG.MAX_QTY || 5;
  var WA_NUMBER = (CFG.WHATSAPP_NUMBER || "").replace(/[^0-9]/g, "");
  var PREFERS_REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- FAQ (data-driven) ---------- */
  var FAQ = [
    { q: "تشتغل بأي دولة أسافر لها؟",
      a: "نَدى تشتغل على الكهرباء العادية 220-240 فولت — نفس كهرباء قطر ودول الخليج، وتنفعك بتركيا وأوروبا ومصر وأغلب آسيا وإفريقيا (تحتاج بس محوّل شكل الفيشة بحسب الدولة). لكن بكل صدق: الدول اللي كهرباؤها 110 فولت مثل أمريكا وكندا واليابان تحتاج محوّل جهد (Voltage Converter) — محوّل شكل الفيشة العادي ما يكفي فيها. ما نقول لك تشتغل بأي دولة، بس تشتغل بأغلبها اللي كهرباؤها زي كهربانا." },
    { q: "تنفعني بالعمرة والحج أنشّف ملابسي بالفندق؟",
      a: "إي نعم، هذا من أنسب استخداماتها. تعلّقها على رف أو مغلاق خزانة بغرفتك في مكة أو المدينة، تحط ملابس الإحرام أو ملابسك المغسولة وتقفل السحّاب، وتنشف بهواء دافئ لطيف بخصوصية تامة وبلا ما تعتمد على مغسلة الفندق. القطع الخفيفة والقطنية تنشف مريح، والقطع الأثقل تحتاج وقت أطول شوي." },
    { q: "أقدر أستخدمها بغرفة الفندق أو السكن الجامعي؟",
      a: "أكيد. ما تحتاج تركيب ولا مكان — بس فيشة كهرباء ورف أو مغلاق تعلّقها عليه. مثالية للفندق والسكن الجامعي والغرف الصغيرة، وتنشّف ملابسك بهدوء وخصوصية بلا مغسلة مشتركة ولا نشر على الكراسي." },
    { q: "تدخل شنطة سفري؟ كم مقاسها وهي مطوية؟",
      a: "تنطوي مسطّحة لمقاس صغير حوالي 35×26×15 سم ووزنها 1.55 كجم بس — تدخل شنطة السفر الكبيرة أو حتى شنطة الكابينة بسهولة جنب ملابسك، وترجع تفردها بثواني أول ما توصل." },
    { q: "كيف تشتغل؟ هل هي مثل الدراير الكبير؟",
      a: "لا، مو دراير بأسطوانة دوّارة. حقيبة تجفيف تعلّقها على أي رف أو مغلاق، تحط ملابسك جواها وتقفل السحّاب، وهواء دافئ لطيف يعبّي الحقيبة ويجففها تدريجياً بحرارة ثابتة. تنشيف لطيف يحافظ على القماش، مو حرارة عالية ولا تدوير." },
    { q: "كيف يتم الدفع ومتى؟",
      a: "الدفع عند الاستلام. تفحص المنتج بيدك أول ما يوصلك، وإذا ما عجبك لا تستلمه ولا تدفع شي — وإذا رضيت تدفع كاش للمندوب. بدون أي دفع مقدّم أو بطاقة." },
    { q: "لو ما أسافر واجد، تنفعني بالبيت؟",
      a: "إي، تخدمك بالبيت زين — بأيام الرطوبة والعجاج، أو بالشقق اللي بلا شرفة، أو لما تبي تجفف قطعة وحدة بسرعة مثل ثوب أو ملابس صلاة أو ملابس بيبي. بس أكثر ما تتميز فيه إنها تروح معاك بالسفر." }
  ];

  function buildFaq() {
    var list = $("#faqList");
    if (!list) return;
    var html = "";
    FAQ.forEach(function (item, i) {
      var panelId = "faq-panel-" + i;
      html +=
        '<div class="faq-item reveal">' +
          '<button class="faq-q" type="button" aria-expanded="false" aria-controls="' + panelId + '">' +
            '<span>' + item.q + '</span>' +
            '<svg class="ic chev" aria-hidden="true" focusable="false"><use href="#i-chev"/></svg>' +
          '</button>' +
          '<div class="faq-a" id="' + panelId + '" role="region" aria-hidden="true"><div class="faq-a-inner">' + item.a + '</div></div>' +
        '</div>';
    });
    list.innerHTML = html;
    // one delegated listener on the stable container (robust; no per-node binding)
    list.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest(".faq-q");
      if (!btn || !list.contains(btn)) return;
      var el = btn.closest(".faq-item");
      var ans = el.querySelector(".faq-a");
      var open = el.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      ans.setAttribute("aria-hidden", open ? "false" : "true");
      ans.style.maxHeight = open ? ans.scrollHeight + "px" : "0px";
    });
  }

  /* ---------- prices from config ---------- */
  function renderPrices() {
    $$("[data-price]").forEach(function (el) { el.textContent = String(PRICE); });
  }

  /* ---------- smooth scroll ---------- */
  function scrollToEl(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: PREFERS_REDUCED ? "auto" : "smooth", block: "start" });
  }
  function bindScrollers() {
    $$("[data-scroll]").forEach(function (b) {
      b.addEventListener("click", function () { scrollToEl($(b.getAttribute("data-scroll"))); });
    });
  }

  /* ---------- quantity + total ---------- */
  var qty = 1;
  function renderQty() {
    var v = $("#qtyVal"), t = $("#totalVal");
    if (v) v.textContent = String(qty);
    if (t) t.textContent = (PRICE * qty) + " ريال";
    var minus = $("#qtyMinus"), plus = $("#qtyPlus");
    if (minus) minus.disabled = qty <= 1;
    if (plus) plus.disabled = qty >= MAX_QTY;
  }
  function bindQty() {
    var minus = $("#qtyMinus"), plus = $("#qtyPlus");
    if (minus) minus.addEventListener("click", function () { if (qty > 1) { qty--; renderQty(); } });
    if (plus) plus.addEventListener("click", function () { if (qty < MAX_QTY) { qty++; renderQty(); } });
    renderQty();
  }

  /* ---------- phone normalization + validation ---------- */
  // Accepts local 8-digit, or with +974 / 00974 / 974 / leading 0. Returns 8 digits or "".
  function normalizePhone(raw) {
    var d = (raw || "").replace(/[^0-9]/g, "");
    if (d.indexOf("00974") === 0) d = d.slice(5);
    else if (d.length === 11 && d.indexOf("974") === 0) d = d.slice(3);
    if (d.length === 9 && d.charAt(0) === "0") d = d.slice(1);
    return d.length === 8 ? d : "";
  }
  function setInvalid(name, bad) {
    var f = document.querySelector('[data-field="' + name + '"]');
    if (!f) return;
    f.classList.toggle("invalid", !!bad);
    var input = f.querySelector("input, textarea");
    if (input) input.setAttribute("aria-invalid", bad ? "true" : "false");
  }
  function validate(data) {
    var ok = true;
    if (!data.name || data.name.trim().length < 2) { setInvalid("name", true); ok = false; } else setInvalid("name", false);
    if (!normalizePhone(data.phone)) { setInvalid("phone", true); ok = false; } else setInvalid("phone", false);
    if (!data.address || data.address.trim().length < 5) { setInvalid("address", true); ok = false; } else setInvalid("address", false);
    return ok;
  }

  /* ---------- WhatsApp handoff ---------- */
  function buildWaMessage(data) {
    var map = {
      name: data.name.trim(),
      phone: "974" + normalizePhone(data.phone),
      address: data.address.trim(),
      qty: String(qty),
      total: String(PRICE * qty)
    };
    return (CFG.WHATSAPP_TEMPLATE || "").replace(/\{(name|phone|address|qty|total)\}/g, function (_, k) {
      return map[k] != null ? map[k] : "";
    });
  }
  function openWhatsApp(text) {
    if (!WA_NUMBER || WA_NUMBER.length < 8) { toast("رقم واتساب غير مهيأ — راجع الإعدادات"); return false; }
    var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);
    var w = window.open(url, "_blank");
    if (!w) { window.location.href = url; }        // popup blocked → same-tab fallback
    else { try { w.opener = null; } catch (e) {} }  // sever opener (tabnabbing hardening)
    return true;
  }
  function toast(msg) {
    var t = $("#toast"), m = $("#toastMsg");
    if (m) m.textContent = msg || "تم — يفتح واتساب…";
    if (!t) return;
    t.classList.add("show");
    setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  /* ---------- tracking (never blocks checkout) ---------- */
  function loadSnapPixels(ids) {
    if (!ids || !ids.length) return;
    try {
      (function (e, t, n) {
        if (e.snaptr) return; var a = e.snaptr = function () { a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments); };
        a.queue = []; var s = "script"; var r = t.createElement(s); r.async = true;
        r.src = "https://sc-static.net/scevent.min.js"; var u = t.getElementsByTagName(s)[0]; u.parentNode.insertBefore(r, u);
      })(window, document);
      // init EVERY pixel id so a single snaptr('track', ...) fans out to all of them
      ids.forEach(function (id) { try { window.snaptr("init", id); } catch (e) {} });
      window.snaptr("track", "PAGE_VIEW");
    } catch (e) { /* swallow */ }
  }
  function trackOrder(total) {
    if (!window.snaptr) return;
    // mirror keychain.qa: START_CHECKOUT on submit, then PURCHASE with the order value
    try { window.snaptr("track", "START_CHECKOUT"); } catch (e) { /* swallow */ }
    try {
      window.snaptr("track", "PURCHASE", {
        currency: "QAR",
        price: total,
        item_category: "portable clothes dryer",
        description: "نشّافة نَدى المحمولة"
      });
    } catch (e) { /* swallow */ }
  }

  /* ---------- Google Sheets order log (fire-and-forget, never blocks checkout) ---------- */
  function syncToSheet(data, total) {
    var endpoint = CFG.SHEETS_ENDPOINT;
    if (!endpoint) return;
    try {
      var payload = JSON.stringify({
        name: data.name.trim(),
        phone: "974" + normalizePhone(data.phone),
        address: data.address.trim(),
        qty: qty,
        total: total
      });
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true // survives the tab-switch / same-tab fallback to wa.me
      }).catch(function () { /* swallow — sheet sync must never surface to the customer */ });
    } catch (e) { /* swallow */ }
  }

  /* ---------- order form ---------- */
  function bindForm() {
    var form = $("#orderForm");
    if (!form) return;
    $$("#orderForm input, #orderForm textarea").forEach(function (el) {
      el.addEventListener("input", function () {
        var field = el.closest(".field");
        if (field) { field.classList.remove("invalid"); el.setAttribute("aria-invalid", "false"); }
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = { name: form.name.value, phone: form.phone.value, address: form.address.value };
      if (!validate(data)) {
        var firstBad = $(".field.invalid");
        if (firstBad) {
          var input = firstBad.querySelector("input, textarea");
          if (input) input.focus();
          firstBad.scrollIntoView({ behavior: PREFERS_REDUCED ? "auto" : "smooth", block: "center" });
        }
        return;
      }
      var total = PRICE * qty;
      trackOrder(total);
      var opened = openWhatsApp(buildWaMessage(data));   // synchronous → keeps user gesture
      syncToSheet(data, total);
      if (opened) toast("تم — يفتح واتساب…");
    });
  }

  /* ---------- help / floating whatsapp ---------- */
  function bindHelpWa() {
    var handler = function () { openWhatsApp("السلام عليكم، عندي استفسار عن نشّافة نَدى."); };
    var f = $("#waFloat"), h = $("#waHelp");
    if (f) f.addEventListener("click", handler);
    if (h) h.addEventListener("click", handler);
  }

  /* ---------- sticky CTA + header shadow ---------- */
  function bindSticky() {
    var sticky = $("#stickyCta"), header = $("#siteHeader"), hero = $(".hero"), order = $("#order");
    function update() {
      var y = window.scrollY || 0;
      if (header) header.classList.toggle("scrolled", y > 12);
      if (!sticky) return;
      var pastHero = hero ? y > (hero.offsetTop + hero.offsetHeight - 120) : y > 300;
      var orderVisible = false;
      if (order) {
        var r = order.getBoundingClientRect();
        orderVisible = r.top < window.innerHeight * 0.85 && r.bottom > 0;
      }
      sticky.classList.toggle("show", pastHero && !orderVisible);
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- scroll reveal (progressive enhancement) ---------- */
  function bindReveal() {
    var items = $$(".reveal");
    if (PREFERS_REDUCED || !("IntersectionObserver" in window)) return; // stays visible
    document.documentElement.classList.add("reveal-on");
    var ioFired = false;
    var io = new IntersectionObserver(function (entries) {
      ioFired = true;
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      if (!ioFired) { io.disconnect(); items.forEach(function (el) { el.classList.add("in"); }); }
    }, 1500);
  }

  /* ---------- init ---------- */
  function init() {
    // decorative icons out of the a11y tree
    $$("svg.ic").forEach(function (s) { s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false"); });
    // non-submit buttons default to type=submit — pin them to button
    $$("[data-scroll], #waHelp, #waFloat").forEach(function (b) {
      if (b.tagName === "BUTTON" && !b.getAttribute("type")) b.setAttribute("type", "button");
    });
    renderPrices();
    buildFaq();
    bindScrollers();
    bindQty();
    bindForm();
    bindHelpWa();
    bindSticky();
    bindReveal();
    var snapIds = (CFG.SNAP_PIXEL_IDS && CFG.SNAP_PIXEL_IDS.length) ? CFG.SNAP_PIXEL_IDS : (CFG.SNAP_PIXEL_ID ? [CFG.SNAP_PIXEL_ID] : []);
    loadSnapPixels(snapIds);
    if (!WA_NUMBER || WA_NUMBER.length < 8) {
      console.warn("[نَدى] WHATSAPP_NUMBER not set correctly in config.js — order/help buttons won't reach WhatsApp.");
    }
  }
  // Run whether the script loads before OR after DOMContentLoaded (robust for inlined/deferred use).
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
