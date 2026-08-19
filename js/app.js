(async function () {
  const fallback = () => {
    const animate = (targets, keyframes = {}, options = {}) => {
      const els =
        typeof targets === "string"
          ? [...document.querySelectorAll(targets)]
          : targets && targets.length !== undefined
            ? [...targets]
            : [targets];
      els.forEach((el) => {
        if (!el || !el.style) return;
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      const duration = (options.duration || 0.3) * 1000;
      const finished = Promise.resolve();
      return { duration, finished };
    };
    const inView = (sel, cb) => {
      document.querySelectorAll(sel).forEach((el) => cb({ target: el }));
    };
    const stagger = () => 0;
    const scroll = () => {};
    return { animate, inView, stagger, scroll };
  };

  const safety = setTimeout(() => {
    const loader = document.querySelector("#loader");
    if (loader) loader.remove();
    document
      .querySelectorAll(".cat, .feature__copy, .feature__card, .quote blockquote, .consulta__grid > *, .card")
      .forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
  }, 4500);

  let motionApi;
  try {
    motionApi = await Promise.race([
      import("https://cdn.jsdelivr.net/npm/motion@11.16.0/+esm"),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3500)),
    ]);
  } catch {
    motionApi = fallback();
  }

  const { animate, inView, stagger, scroll } = motionApi;
  const { CONFIG, products } = window.FF;

  const grid = document.querySelector("#grid");
  const filters = document.querySelector("#filters");
  const modal = document.querySelector("#modal");
  const modalBody = document.querySelector("#modalBody");
  const form = document.querySelector("#form");
  const formProducto = document.querySelector("#formProducto");
  const formOk = document.querySelector("#formOk");
  const nav = document.querySelector("#nav");
  const burger = document.querySelector("#burger");
  const drawer = document.querySelector("#drawer");
  const loader = document.querySelector("#loader");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const waLink = (text = "Hola Fabian, quiero consultar stock.") =>
    `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;

  const waMessage = (product, extra = "") => {
    const bits = [`Hola ${CONFIG.shopName}, quiero consultar este equipo: ${product}.`];
    if (extra) bits.push(extra);
    return bits.join(" ");
  };

  document.querySelectorAll("[data-whatsapp]").forEach((el) => {
    el.href = waLink();
    el.target = "_blank";
    el.rel = "noopener";
  });

  const cardHTML = (p, i) => `
    <button class="card" data-open="${p.id}" style="opacity:0; transform:translateY(28px)">
      <div class="card__media">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        <span class="card__tag">${p.tag}</span>
      </div>
      <div class="card__body">
        <span class="card__kind">${String(i + 1).padStart(2, "0")} · ${p.kind}</span>
        <h3>${p.name}</h3>
        <p>${p.blurb}</p>
        <span class="card__go">Ver ficha →</span>
      </div>
    </button>
  `;

  const renderGrid = (filter = "todos") => {
    const list = filter === "todos" ? products : products.filter((p) => p.category === filter);
    grid.innerHTML = list.map((p) => cardHTML(p, products.indexOf(p))).join("");
    const cards = grid.querySelectorAll(".card");
    animate(cards, { opacity: [0, 1], y: [28, 0] }, { delay: stagger(0.06), duration: 0.55, easing: [0.22, 1, 0.36, 1] });
  };

  renderGrid();

  filters.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    filters.querySelectorAll("button").forEach((b) => b.classList.toggle("is-on", b === btn));
    renderGrid(btn.dataset.filter);
  });

  document.querySelectorAll("[data-jump]").forEach((el) => {
    el.addEventListener("click", (event) => {
      const cat = el.dataset.jump;
      const btn = filters.querySelector(`[data-filter="${cat}"]`);
      if (btn) btn.click();
      if (el.tagName === "BUTTON") {
        event.preventDefault();
        document.querySelector("#catalogo").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      }
    });
  });

  const modalMarkup = (p, consult = false) => {
    if (consult) {
      return `
        <div class="modal__layout">
          <div class="modal__img"><img src="${p.image}" alt="${p.name}" /></div>
          <div class="modal__info">
            <p class="kind">Consulta · ${p.kind}</p>
            <h2 id="modalTitle">${p.name}</h2>
            <p class="modal__story">Dejá tus datos y te respondemos por este equipo. También podés ir directo a WhatsApp.</p>
            <form class="modal-form" id="modalForm">
              <input name="nombre" required placeholder="Tu nombre" autocomplete="name" />
              <input name="tel" required placeholder="WhatsApp" autocomplete="tel" />
              <textarea name="mensaje" rows="3" placeholder="Calibre, uso, plazo..."></textarea>
              <div class="modal__actions">
                <button class="btn btn--copper" type="submit">Enviar consulta</button>
                <a class="btn btn--line" target="_blank" rel="noopener" href="${waLink(waMessage(p.name))}">WhatsApp directo</a>
              </div>
            </form>
          </div>
        </div>`;
    }

    return `
      <div class="modal__layout">
        <div class="modal__img"><img src="${p.image}" alt="${p.name}" /></div>
        <div class="modal__info">
          <p class="kind">${p.kind}</p>
          <h2 id="modalTitle">${p.name}</h2>
          <p class="modal__story">${p.story}</p>
          <dl class="specs">
            ${p.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}
          </dl>
          <div class="modal__actions">
            <button class="btn btn--copper" data-consult="${p.id}">Consultar este equipo</button>
            <a class="btn btn--line" target="_blank" rel="noopener" href="${waLink(waMessage(p.name))}">WhatsApp</a>
          </div>
        </div>
      </div>`;
  };

  const bindModalForm = (p) => {
    const mf = document.querySelector("#modalForm");
    if (!mf) return;
    mf.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(mf));
      const extra = `Soy ${data.nombre}. Mi WhatsApp: ${data.tel}. ${data.mensaje || ""}`.trim();
      window.open(waLink(waMessage(p.name, extra)), "_blank", "noopener");
      closeModal();
    });
  };

  const openModal = (id) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    modalBody.innerHTML = modalMarkup(p, false);
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    animate(modal.querySelector(".modal__backdrop"), { opacity: [0, 1] }, { duration: 0.28 });
    animate(
      modal.querySelector(".modal__panel"),
      { opacity: [0, 1], y: [28, 0], scale: [0.96, 1] },
      { duration: 0.45, easing: [0.22, 1, 0.36, 1] }
    );
  };

  const closeModal = async () => {
    const panel = modal.querySelector(".modal__panel");
    const back = modal.querySelector(".modal__backdrop");
    await Promise.all([
      animate(panel, { opacity: 0, y: 16, scale: 0.98 }, { duration: 0.22 }).finished,
      animate(back, { opacity: 0 }, { duration: 0.22 }).finished,
    ]);
    modal.hidden = true;
    document.body.style.overflow = "";
  };

  document.addEventListener("click", (e) => {
    const open = e.target.closest("[data-open]");
    if (open) {
      openModal(open.dataset.open);
      return;
    }
    const consult = e.target.closest("[data-consult]");
    if (consult) {
      const p = products.find((x) => x.id === consult.dataset.consult);
      formProducto.value = p ? `${p.name} · ${p.kind}` : "";
      modalBody.innerHTML = modalMarkup(p, true);
      animate(modalBody, { opacity: [0, 1], y: [12, 0] }, { duration: 0.3 });
      bindModalForm(p);
      return;
    }
    if (e.target.closest("[data-close]")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const product = data.producto || "consulta general";
    const extra = `Soy ${data.nombre}. Mi WhatsApp: ${data.tel}. ${data.mensaje || ""}`.trim();
    window.open(waLink(waMessage(product, extra)), "_blank", "noopener");
    formOk.hidden = false;
  });

  let lastY = 0;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      nav.classList.toggle("is-solid", y > 20);
      nav.classList.toggle("is-hidden", y > lastY && y > 180 && !drawer.classList.contains("is-open"));
      lastY = y;
    },
    { passive: true }
  );

  burger.addEventListener("click", () => {
    const on = burger.classList.toggle("is-on");
    drawer.classList.toggle("is-open", on);
    burger.setAttribute("aria-expanded", String(on));
  });

  drawer.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      burger.classList.remove("is-on");
      drawer.classList.remove("is-open");
    })
  );

  const desktopCursor =
    !reduce &&
    window.matchMedia("(min-width: 981px)").matches &&
    window.matchMedia("(hover: hover)").matches &&
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(pointer: coarse)").matches;

  if (desktopCursor) {
    document.body.classList.add("has-cursor");
    const dot = document.querySelector(".cursor__dot");
    const ring = document.querySelector(".cursor__ring");
    let x = 0;
    let y = 0;
    let rx = 0;
    let ry = 0;

    window.addEventListener("pointermove", (e) => {
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate(${x}px, ${y}px)`;
    });

    const loop = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    };
    loop();

    document.addEventListener("pointerover", (e) => {
      if (e.target.closest("a, button, input, textarea")) document.body.classList.add("is-hovering");
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest("a, button, input, textarea")) document.body.classList.remove("is-hovering");
    });
  }

  const disableCursor = () => document.body.classList.remove("has-cursor");
  window.matchMedia("(max-width: 980px)").addEventListener("change", (e) => {
    if (e.matches) disableCursor();
  });
  window.addEventListener("touchstart", disableCursor, { passive: true });

  if (!reduce) {
    inView(".cat, .feature__copy, .feature__card, .quote blockquote, .consulta__grid > *", (info) => {
      animate(info.target, { opacity: [0, 1], y: [30, 0] }, { duration: 0.65, easing: [0.22, 1, 0.36, 1] });
    });

    const heroImg = document.querySelector(".hero__media img");
    const hero = document.querySelector(".hero");
    if (heroImg && scroll) {
      try {
        scroll(animate(heroImg, { y: [0, 90], scale: [1.08, 1.16] }, { easing: "linear" }), {
          target: hero,
          offset: ["start start", "end start"],
        });
      } catch {
        /* fallback silencioso */
      }
    }
  } else {
    document
      .querySelectorAll(".cat, .feature__copy, .feature__card, .quote blockquote, .consulta__grid > *")
      .forEach((el) => {
        el.style.opacity = "1";
      });
  }

  const finishLoader = () => {
    clearTimeout(safety);
    animate(loader, { opacity: 0 }, { duration: 0.45 }).finished.then(() => {
      if (loader) loader.remove();
      animate(
        ".hero__title span, .hero__lead, .hero__cta, .hero .eyebrow, .hero__meta",
        { opacity: [0, 1], y: [24, 0] },
        { delay: stagger(0.08), duration: 0.7, easing: [0.22, 1, 0.36, 1] }
      );
    });
  };

  animate(".loader__bar span", { width: ["0%", "100%"] }, { duration: 1.05, easing: [0.22, 1, 0.36, 1] }).finished.then(finishLoader);
})();
