const fs = require("fs");
const path = require("path");

const root = __dirname;
const config = JSON.parse(fs.readFileSync(path.join(root, "tools.json"), "utf8"));
const availableFiles = new Set(fs.readdirSync(root));
const listedFiles = new Set();

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

const categories = [...new Set(config.tools.map(tool => tool.category))];
const filters = categories.map(category => {
  return `<button class="filter" type="button" data-category="${escapeHtml(category)}" aria-pressed="false">${escapeHtml(category)}</button>`;
}).join("\n");

const cards = config.tools.map(tool => {
  if (!tool.file.endsWith(".html") || path.basename(tool.file) !== tool.file || !availableFiles.has(tool.file)) {
    throw new Error(`Invalid or missing tool page: ${tool.file}`);
  }
  if (listedFiles.has(tool.file)) throw new Error(`Duplicate tool page: ${tool.file}`);
  if (!tool.icon || !tool.name || !tool.description || !tool.category) {
    throw new Error(`Incomplete metadata for: ${tool.file}`);
  }
  listedFiles.add(tool.file);

  const file = escapeHtml(tool.file);
  const name = escapeHtml(tool.name);
  const icon = escapeHtml(tool.icon);
  const description = escapeHtml(tool.description);
  const category = escapeHtml(tool.category);
  const searchText = escapeHtml([tool.file, tool.name, tool.description, tool.category, ...(tool.keywords || [])].join(" ").toLowerCase());

  return `<li class="app-card" data-category="${category}" data-search="${searchText}">
  <a class="app-link" href="${file}">
    <div class="app-card-top">
      <span class="app-icon" aria-hidden="true">${icon}</span>
      <span class="app-category">${category}</span>
    </div>
    <h3>${name}</h3>
    <p>${description}</p>
    <span class="app-action">Open tool <span aria-hidden="true">↗</span></span>
  </a>
</li>`;
}).join("\n");

const unlistedFiles = [...availableFiles].filter(file => file.endsWith(".html") && file !== "index.html" && !listedFiles.has(file));
if (unlistedFiles.length) throw new Error(`Add metadata for: ${unlistedFiles.join(", ")}`);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="Browse a collection of small, useful browser tools." />
<title>JiBT Tools</title>
<style>
  :root {
    color-scheme: light;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    color: #172033;
    background: #f5f7fb;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
  }

  * { box-sizing: border-box; }

  body { margin: 0; min-height: 100vh; }

  button, input { font: inherit; }

  .page { max-width: 1180px; margin: 0 auto; padding: 0 28px 48px; }

  .site-header {
    height: 78px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .brand { display: flex; flex: none; align-items: center; gap: 11px; color: #172033; text-decoration: none; }

  .brand-mark {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: linear-gradient(145deg, #6558e8, #9787ff);
    color: #fff;
    font-size: 19px;
    font-weight: 800;
    box-shadow: 0 5px 14px #6558e83d;
  }

  .brand-name { font-size: 16px; font-weight: 780; letter-spacing: -.03em; }

  .catalog { padding-top: 7px; }

  .search-box {
    display: flex;
    flex: 0 1 300px;
    align-items: center;
    gap: 9px;
    min-width: 0;
    height: 42px;
    padding: 0 12px;
    border: 1px solid #e0e5ef;
    border-radius: 11px;
    background: #fff;
    box-shadow: 0 3px 10px #27324a08;
    transition: border-color .15s ease, box-shadow .15s ease;
  }

  .search-symbol { flex: none; color: #78839a; font-size: 18px; line-height: 1; }

  .search-box input {
    flex: 1;
    width: 100%;
    min-width: 0;
    padding: 9px 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: #172033;
    font-size: 13px;
  }

  .search-box input::placeholder { color: #929bad; }
  .search-box:focus-within { border-color: #aaa4f5; box-shadow: 0 0 0 3px #6558e815; }

  .filters { display: flex; gap: 8px; overflow-x: auto; padding: 2px 1px 17px; scrollbar-width: none; }
  .filters::-webkit-scrollbar { display: none; }

  .filter {
    flex: none;
    padding: 8px 14px;
    border: 1px solid #e2e6ee;
    border-radius: 999px;
    background: #fff;
    color: #626c80;
    font-size: 12px;
    font-weight: 650;
    cursor: pointer;
    transition: background .15s ease, color .15s ease, border-color .15s ease;
  }

  .filter:hover { border-color: #c5cbe0; color: #343e57; }
  .filter.active { border-color: #282e49; background: #282e49; color: #fff; }

  .app-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 15px; }

  .app-card {
    min-width: 0;
    min-height: 234px;
    overflow: hidden;
    border: 1px solid #e4e8ef;
    border-radius: 18px;
    background: #fff;
    box-shadow: 0 5px 16px #27324a08;
    transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
  }

  .app-card:hover, .app-card:focus-within {
    transform: translateY(-3px);
    border-color: #cfd5e2;
    box-shadow: 0 14px 32px #27324a12;
  }

  .app-card[hidden] { display: none; }

  .app-link { display: flex; min-height: 234px; flex-direction: column; padding: 18px; color: inherit; text-decoration: none; }

  .app-card-top { display: flex; align-items: start; justify-content: space-between; gap: 10px; }

  .app-icon {
    display: grid;
    width: 62px;
    height: 62px;
    flex: none;
    place-items: center;
    border: 1px solid #eceef5;
    border-radius: 18px;
    background: linear-gradient(145deg, #f6f7ff, #eef0fa);
    font-size: 32px;
    box-shadow: inset 0 1px #fff;
  }

  .app-category { padding: 6px 9px; border-radius: 999px; background: #f3f4f8; color: #778095; font-size: 10px; font-weight: 700; }
  .app-card h3 { margin: 16px 0 6px; font-size: 16px; letter-spacing: -.025em; line-height: 1.25; }
  .app-card p { margin: 0; color: #737d91; font-size: 12px; line-height: 1.5; }

  .app-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 17px;
    color: #4f50a8;
    font-size: 12px;
    font-weight: 720;
  }

  .app-action span { font-size: 16px; transition: transform .15s ease; }
  .app-card:hover .app-action span, .app-card:focus-within .app-action span { transform: translate(2px, -2px); }

  .empty-state { margin: 0; padding: 42px 15px; border: 1px dashed #d8deea; border-radius: 16px; color: #737d91; text-align: center; }
  .empty-state[hidden] { display: none; }

  .site-footer { display: flex; justify-content: space-between; gap: 12px; margin-top: 36px; padding-top: 18px; border-top: 1px solid #e4e8ef; color: #8991a2; font-size: 11px; }

  @media (max-width: 900px) {
    .app-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (max-width: 620px) {
    .page { padding: 0 16px 32px; }
    .site-header { height: 66px; gap: 10px; }
    .search-box { flex-basis: 230px; height: 40px; padding: 0 10px; }
    .search-box input { font-size: 12px; }
    .search-symbol { font-size: 17px; }
    .app-grid { gap: 10px; }
    .app-card, .app-link { min-height: 220px; }
    .app-link { padding: 14px; }
    .app-icon { width: 54px; height: 54px; border-radius: 16px; font-size: 28px; }
    .app-category { max-width: 95px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .app-card h3 { font-size: 14px; }
    .app-card p { font-size: 11px; }
    .site-footer { flex-direction: column; }
  }

  @media (max-width: 380px) {
    .app-grid { grid-template-columns: 1fr; }
    .app-card, .app-link { min-height: 200px; }
  }
</style>
</head>
<body>
<div class="page">
  <header class="site-header">
    <a class="brand" href="index.html" aria-label="JiBT tools home">
      <span class="brand-mark" aria-hidden="true">J</span>
      <span class="brand-name">JiBT Store</span>
    </a>
    <label class="search-box" for="search">
      <span class="search-symbol" aria-hidden="true">⌕</span>
      <input id="search" type="search" placeholder="Search tools" autocomplete="off">
    </label>
  </header>

  <main>
    <section class="catalog" id="catalog" aria-label="Tool catalog">
      <nav class="filters" aria-label="Filter tools by category">
        <button class="filter active" type="button" data-category="all" aria-pressed="true">All tools</button>
${filters}
      </nav>
      <ul class="app-grid" id="app-grid">
${cards}
      </ul>
      <p class="empty-state" id="empty-state" hidden>No tools found. Try another search or category.</p>
    </section>
  </main>

  <footer class="site-footer">
    <span>JiBT Store</span>
    <span>Select a tool to open it.</span>
  </footer>
</div>
<script>
  const search = document.getElementById("search");
  const cards = Array.from(document.querySelectorAll(".app-card"));
  const filters = Array.from(document.querySelectorAll(".filter"));
  const emptyState = document.getElementById("empty-state");
  let selectedCategory = "all";

  function updateCatalog() {
    const query = search.value.trim().toLowerCase();
    cards.forEach(card => {
      const matchesCategory = selectedCategory === "all" || card.dataset.category === selectedCategory;
      const matchesSearch = card.dataset.search.includes(query);
      card.hidden = !matchesCategory || !matchesSearch;
    });
    emptyState.hidden = cards.some(card => !card.hidden);
  }

  filters.forEach(filter => filter.addEventListener("click", () => {
    selectedCategory = filter.dataset.category;
    filters.forEach(item => {
      const active = item === filter;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    updateCatalog();
  }));

  search.addEventListener("input", updateCatalog);
  document.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      search.focus();
    }
    if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      search.focus();
    }
  });
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "index.html"), html);
console.log("Generated index.html from tools.json");
console.log("Linked files:", [...listedFiles]);
