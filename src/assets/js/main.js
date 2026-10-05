(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Navigation: mobile drawer + mega menus ---------- */
  const nav = $("#main-nav");
  const toggle = $(".nav-toggle");
  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  $$(".main-nav > ul > li > button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const li = btn.parentElement;
      const open = !li.classList.contains("open");
      $$(".main-nav li.open").forEach((o) => { o.classList.remove("open"); o.firstElementChild.setAttribute("aria-expanded", "false"); });
      li.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open);
    });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".main-nav")) $$(".main-nav li.open").forEach((o) => o.classList.remove("open"));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      $$(".main-nav li.open").forEach((o) => o.classList.remove("open"));
      $("#search-panel")?.classList.remove("open");
    }
  });

  /* ---------- Site search (client-side over the page index) ---------- */
  const searchToggle = $("[data-search-toggle]");
  const panel = $("#search-panel");
  const input = $("#site-search");
  const results = $(".search-results");
  let index = null;
  searchToggle?.addEventListener("click", async () => {
    const open = panel.classList.toggle("open");
    searchToggle.setAttribute("aria-expanded", open);
    if (open) {
      input.focus();
      if (!index) index = await fetch("assets/js/search-index.json").then((r) => r.json()).catch(() => []);
    }
  });
  input?.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    results.innerHTML = "";
    if (!q || !index) return;
    index
      .filter((p) => `${p.title} ${p.keywords} ${p.description}`.toLowerCase().includes(q))
      .slice(0, 6)
      .forEach((p) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = p.url;
        a.textContent = p.title;
        li.append(a);
        results.append(li);
      });
    if (!results.children.length) results.innerHTML = "<li>لا توجد نتائج — جرّب كلمة أخرى.</li>";
  });

  /* ---------- Home hero carousel ---------- */
  const hero = $("[data-hero]");
  if (hero) {
    const slides = $$(".hero-slide", hero);
    const dots = $$(".hero-dot", hero);
    const pause = $(".hero-pause", hero);
    let i = 0, timer = null, playing = !reduceMotion;
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle("is-active", k === i); s.setAttribute("aria-hidden", k !== i); });
      dots.forEach((d, k) => {
        d.classList.remove("is-active");
        if (k === i) { void d.offsetWidth; d.classList.add("is-active"); }
        d.setAttribute("aria-current", k === i);
      });
    };
    const play = () => { clearInterval(timer); if (playing) timer = setInterval(() => go(i + 1), 7000); };
    dots.forEach((d, k) => d.addEventListener("click", () => { go(k); play(); }));
    pause?.addEventListener("click", () => {
      playing = !playing;
      pause.textContent = playing ? "❚❚" : "▶";
      pause.setAttribute("aria-label", playing ? "إيقاف العرض" : "تشغيل العرض");
      hero.classList.toggle("is-paused", !playing);
      play();
    });
    go(0); play();
  }

  /* ---------- Sub-navigation scroll-spy ---------- */
  const subLinks = $$(".subnav a");
  if (subLinks.length && "IntersectionObserver" in window) {
    const map = new Map(subLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          subLinks.forEach((a) => a.classList.remove("is-active"));
          map.get(en.target.id)?.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    map.forEach((_, id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* ---------- Reveal on scroll ---------- */
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: .12 });
    $$(".reveal").forEach((el) => io.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("in"));
  }

  /* ---------- Count-up figures ---------- */
  $$("[data-count]").forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || "", suffix = el.dataset.suffix || "";
    if (reduceMotion || !("IntersectionObserver" in window)) { el.textContent = prefix + end + suffix; return; }
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / 1400);
        el.textContent = prefix + Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    io.observe(el);
  });

  /* ---------- News filter ---------- */
  const chips = $$(".news-filter .chip");
  chips.forEach((chip) => chip.addEventListener("click", () => {
    chips.forEach((c) => c.setAttribute("aria-pressed", c === chip));
    const cat = chip.dataset.filter;
    $$("[data-cat]").forEach((card) => { card.hidden = cat !== "all" && card.dataset.cat !== cat; });
  }));

  /* ---------- VOC monitor simulator (fuel stations page) ---------- */
  const mon = $("[data-voc-monitor]");
  if (mon) {
    const lvl = $("#voc-level", mon), a1 = $("#voc-a1", mon), a2 = $("#voc-a2", mon);
    const range = 2000; // ppm full scale (configurable on the real instrument)
    const out = {
      value: $("[data-voc-value]", mon), ma: $("[data-ma]", mon), reg: $("[data-modbus]", mon),
      lvl: $("[data-out=\"level\"]", mon), a1: $("[data-out=\"a1\"]", mon), a2: $("[data-out=\"a2\"]", mon),
      r1: $("[data-relay=\"1\"]", mon), r2: $("[data-relay=\"2\"]", mon), r3: $("[data-relay=\"3\"]", mon),
      spark: $("[data-spark] polyline", mon), log: $("[data-log]", mon),
    };
    const history = Array(60).fill(+lvl.value);
    let logged = 0;
    const render = () => {
      const base = +lvl.value;
      const noise = base * 0.06 * (Math.random() - .5) + (Math.random() - .5) * 2;
      const v = Math.max(0, Math.min(range, base + noise));
      history.push(v); history.shift();
      const mA = 4 + (v / range) * 16;
      out.value.innerHTML = `${v.toFixed(1)}<small>ppm</small>`;
      out.ma.textContent = mA.toFixed(2) + " mA";
      out.reg.textContent = "40001 = " + Math.round(v * 10);
      out.lvl.textContent = base; out.a1.textContent = a1.value; out.a2.textContent = a2.value;
      out.r1.classList.toggle("on", v >= +a1.value);
      out.r2.classList.toggle("on", v >= +a2.value);
      out.r3.classList.toggle("on", false);
      const max = Math.max(+a2.value * 1.2, ...history, 10);
      out.spark.setAttribute("points", history.map((h, k) => `${(k / 59) * 300},${90 - (h / max) * 84}`).join(" "));
      if (++logged % 5 === 0) out.log.textContent = `${(logged / 5)} سجل محفوظ`;
    };
    [lvl, a1, a2].forEach((el) => el.addEventListener("input", render));
    render();
    if (!reduceMotion) setInterval(render, 1000);
  }

  /* ---------- Forms: quote / contact / newsletter ---------- */
  const params = new URLSearchParams(location.search);
  $$("form[data-lead-form]").forEach((form) => {
    const svc = params.get("service");
    if (svc && form.service) form.service.value = svc;
    const status = $(".form-status", form);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const data = Object.fromEntries(new FormData(form));
      data.page = location.pathname;
      const btn = $("button[type=submit]", form);
      btn.disabled = true;
      const endpoint = window.SELORIN?.formEndpoint;
      try {
        if (endpoint) {
          const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
          if (!res.ok) throw new Error(res.status);
          status.className = "form-status ok";
          status.textContent = "تم استلام طلبك بنجاح، سيتواصل معك فريقنا في أسرع وقت.";
          form.reset();
        } else {
          // No backend configured yet: hand the request off to the visitor's mail client.
          const body = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join("\n");
          location.href = `mailto:${window.SELORIN?.email}?subject=${encodeURIComponent("طلب من الموقع — " + (data.service || "استفسار"))}&body=${encodeURIComponent(body)}`;
          status.className = "form-status ok";
          status.textContent = "تم تجهيز رسالتك في برنامج البريد — اضغط إرسال لإكمال الطلب.";
        }
      } catch {
        status.className = "form-status err";
        status.textContent = "تعذّر الإرسال حالياً. تواصل معنا مباشرة عبر الهاتف أو واتساب.";
      } finally {
        btn.disabled = false;
      }
    });
  });
  $$("[data-newsletter]").forEach((f) => f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("input[type=email]", f).value;
    const endpoint = window.SELORIN?.formEndpoint;
    if (endpoint) {
      try {
        const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ type: "newsletter", email }) });
        if (!res.ok) throw new Error(res.status);
        f.innerHTML = "<p>شكراً لاشتراكك في النشرة البيئية.</p>";
      } catch {
        f.insertAdjacentHTML("afterend", "<p>تعذّر الاشتراك حالياً، حاول لاحقاً.</p>");
      }
    } else {
      location.href = `mailto:${window.SELORIN?.email}?subject=${encodeURIComponent("اشتراك في النشرة البيئية")}&body=${encodeURIComponent(email)}`;
    }
  }));

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
