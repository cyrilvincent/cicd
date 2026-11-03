"use strict";

const STORAGE_KEY = "api-tester:base-url";
const TIMEOUT_MS = 8000;
const STATE_LABELS = { idle: "En attente", run: "En cours", pass: "Réussi", fail: "Échec" };

const baseInput = document.getElementById("base-url");
const runAllBtn = document.getElementById("run-all");
const docsLink = document.getElementById("docs-link");
const summary = document.getElementById("summary");

const stages = [
  {
    id: "root",
    path: () => "/",
    checks: (res) => [{ label: "Le statut est 200", ok: res.status === 200 }],
  },
  {
    id: "versions",
    path: () => "/versions",
    checks: (res, body) => {
      const isObject = body !== null && typeof body === "object";
      return [
        { label: "Le statut est 200", ok: res.status === 200 },
        { label: "La réponse contient version", ok: isObject && "version" in body },
        { label: "La réponse contient is_prod", ok: isObject && "is_prod" in body },
      ];
    },
  },
  {
    id: "add",
    validate: () => {
      const a = document.getElementById("num-a").value;
      const b = document.getElementById("num-b").value;
      if (a === "" || b === "" || !Number.isFinite(Number(a)) || !Number.isFinite(Number(b))) {
        return "Saisis deux nombres valides pour a et b.";
      }
      return null;
    },
    path: () => {
      const a = document.getElementById("num-a").value;
      const b = document.getElementById("num-b").value;
      return `/add/${encodeURIComponent(a)}/${encodeURIComponent(b)}`;
    },
    checks: (res, body) => {
      const a = Number(document.getElementById("num-a").value);
      const b = Number(document.getElementById("num-b").value);
      const hasResult = body !== null && typeof body === "object" && typeof body.result === "number";
      return [
        { label: "Le statut est 200", ok: res.status === 200 },
        { label: `Le résultat vaut ${a} + ${b}`, ok: hasResult && Math.abs(body.result - (a + b)) < 1e-9 },
      ];
    },
  },
];

const getBase = () => baseInput.value.trim().replace(/\/+$/, "");

function setState(li, state) {
  li.dataset.state = state;
  li.querySelector(".chip").textContent = STATE_LABELS[state];
}

function showResult(li, { meta, checks = [], body = "" }) {
  const result = li.querySelector(".result");
  result.hidden = false;
  li.querySelector(".meta").textContent = meta;
  const list = li.querySelector(".checks");
  list.replaceChildren(
    ...checks.map((c) => {
      const item = document.createElement("li");
      item.className = c.ok ? "ok" : "ko";
      item.textContent = c.label;
      return item;
    })
  );
  li.querySelector(".body").textContent = body;
}

async function runStage(stage) {
  const li = document.querySelector(`[data-stage="${stage.id}"]`);
  const button = li.querySelector(".send");

  const problem = stage.validate ? stage.validate() : null;
  if (problem) {
    setState(li, "fail");
    showResult(li, { meta: "Requête non envoyée", checks: [{ label: problem, ok: false }] });
    return { ok: false, ms: 0 };
  }

  const url = getBase() + stage.path();
  setState(li, "run");
  button.disabled = true;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = performance.now();

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
    const text = await res.text();
    const ms = Math.round(performance.now() - start);

    let body = text;
    let pretty = text;
    try {
      body = JSON.parse(text);
      pretty = JSON.stringify(body, null, 2);
    } catch (_) {
      /* la réponse n’est pas du JSON : on l’affiche telle quelle */
    }

    const checks = stage.checks(res, body);
    const ok = checks.every((c) => c.ok);
    setState(li, ok ? "pass" : "fail");
    showResult(li, { meta: `${res.status} ${res.statusText} – ${ms} ms – ${url}`, checks, body: pretty });
    return { ok, ms };
  } catch (error) {
    const ms = Math.round(performance.now() - start);
    const timedOut = error.name === "AbortError";
    const message = timedOut
      ? `Aucune réponse après ${TIMEOUT_MS / 1000} s. Vérifie que l’API est démarrée à cette adresse.`
      : "Impossible de lire la réponse. Vérifie que l’API tourne (uvicorn) et que cette page est servie depuis une origine autorisée par le CORS, par exemple http://localhost:4200.";
    setState(li, "fail");
    showResult(li, {
      meta: `Échec – ${ms} ms – ${url}`,
      checks: [{ label: message, ok: false }],
    });
    return { ok: false, ms };
  } finally {
    clearTimeout(timer);
    button.disabled = false;
  }
}

async function runAll() {
  runAllBtn.disabled = true;
  summary.className = "summary";
  summary.textContent = "Tests en cours…";
  document.querySelectorAll(".stage").forEach((li) => {
    setState(li, "idle");
    li.querySelector(".result").hidden = true;
  });

  let passed = 0;
  let total = 0;
  for (const stage of stages) {
    const { ok, ms } = await runStage(stage);
    total += ms;
    if (ok) passed += 1;
  }

  const failed = stages.length - passed;
  summary.className = failed === 0 ? "summary ok" : "summary ko";
  summary.textContent =
    failed === 0
      ? `Les ${stages.length} tests ont réussi (${total} ms).`
      : `${passed} réussi${passed > 1 ? "s" : ""}, ${failed} en échec (${total} ms).`;
  runAllBtn.disabled = false;
}

function updateDocsLink() {
  docsLink.href = `${getBase()}/docs`;
}

function init() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) baseInput.value = saved;
  } catch (_) {
    /* stockage indisponible : on garde l’adresse par défaut */
  }
  updateDocsLink();

  baseInput.addEventListener("input", () => {
    updateDocsLink();
    try {
      localStorage.setItem(STORAGE_KEY, baseInput.value.trim());
    } catch (_) {
      /* ignoré */
    }
  });

  runAllBtn.addEventListener("click", runAll);

  stages.forEach((stage) => {
    const li = document.querySelector(`[data-stage="${stage.id}"]`);
    li.querySelector(".send").addEventListener("click", () => runStage(stage));
  });

  document.querySelectorAll(".params input").forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") runStage(stages.find((s) => s.id === "add"));
    });
  });
}

init();
