/**
 * app.js
 * Wires DataStore -> DOM. All the numbers/text on the page come
 * from the variables exposed by data-store.js (which itself reads
 * data.json). Edit data.json to change what's shown; edit here to
 * change how it's shown.
 */

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

function render() {
  const d = DataStore;

  document.getElementById("dayNum").textContent = d.day();
  document.getElementById("quoteText").textContent = `"${d.quote()}"`;
  document.getElementById("todayTransfer").textContent = d.todayTransfer().toFixed(2);
  document.getElementById("savedSoFar").textContent = d.savedSoFar().toFixed(2);
  document.getElementById("goalAmount").textContent = d.goal().toFixed(2);

  // status line
  const statusEl = document.getElementById("statusLine");
  statusEl.className = "status-line " + d.transferStatus();
  if (d.transferStatus() === "completed") {
    statusEl.innerHTML = `Completed!`;
  } else {
    statusEl.innerHTML = `Not completed <span class="due">(due today at ${d.transferDueTime()})</span>`;
  }

  // progress bar (penny cells)
  const pct = d.progressPct();
  document.getElementById("progressPct").textContent = `${pct.toFixed(1)}%`;
  const remaining = Math.max(0, d.goal() - d.savedSoFar());
  document.getElementById("remaining").textContent = `£${remaining.toFixed(2)} to go`;

  const track = document.getElementById("progressTrack");
  track.innerHTML = "";
  const CELLS = 40;
  const filledCount = Math.round((pct / 100) * CELLS);
  for (let i = 0; i < CELLS; i++) {
    const cell = document.createElement("div");
    cell.className = "penny-cell" + (i < filledCount ? " filled" : "");
    track.appendChild(cell);
  }

  // line graph
  renderLineGraph(d.history());

  // chart view toggle radios
  const view = d.chartView();
  document.querySelectorAll('input[name="chartView"]').forEach((r) => {
    r.checked = r.value === view;
  });
  document.getElementById("labelBar").classList.toggle("active-label", view === "progress_bar");
  document.getElementById("labelLine").classList.toggle("active-label", view === "line_graph");
  document.getElementById("barView").style.display = view === "progress_bar" ? "block" : "none";
  document.getElementById("lineView").style.display = view === "line_graph" ? "block" : "none";

  // settings form
  const s = d.settings();
  document.getElementById("emailInput").value = s.email;
  document.getElementById("timeInput").value = s.transferTime;
  document.getElementById("progressEmailToggle").checked = s.progressEmailsEnabled;
}

function renderLineGraph(history) {
  const svg = document.getElementById("lineSvg");
  if (!history || history.length === 0) {
    svg.innerHTML = "";
    return;
  }
  const w = 400, h = 120, pad = 10;
  const values = history.map((p) => p.amount);
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;

  const points = history.map((p, i) => {
    const x = pad + (i / (history.length - 1 || 1)) * (w - pad * 2);
    const y = h - pad - ((p.amount - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  svg.innerHTML = `
    <polyline points="${points}" fill="none" stroke="#2dd6b8" stroke-width="2" />
    ${history.map((p, i) => {
      const x = pad + (i / (history.length - 1 || 1)) * (w - pad * 2);
      const y = h - pad - ((p.amount - min) / range) * (h - pad * 2);
      return `<circle cx="${x}" cy="${y}" r="3" fill="#d9b34c" />`;
    }).join("")}
  `;
}

function switchTab(tab) {
  const progressBtn = document.getElementById("tabProgress");
  const settingsBtn = document.getElementById("tabSettings");
  const progressView = document.getElementById("progressView");
  const settingsView = document.getElementById("settingsView");

  progressBtn.classList.toggle("active", tab === "progress");
  settingsBtn.classList.toggle("active", tab === "settings");
  progressView.classList.toggle("hidden", tab !== "progress");
  settingsView.classList.toggle("visible", tab === "settings");
}

function wireEvents() {
  document.getElementById("tabProgress").addEventListener("click", () => switchTab("progress"));
  document.getElementById("tabSettings").addEventListener("click", () => switchTab("settings"));

  document.querySelectorAll('input[name="chartView"]').forEach((r) => {
    r.addEventListener("change", (e) => {
      DataStore.setChartView(e.target.value);
    });
  });

  document.getElementById("saveSettingsBtn").addEventListener("click", () => {
    DataStore.updateSettings({
      email: document.getElementById("emailInput").value,
      transferTime: document.getElementById("timeInput").value,
      progressEmailsEnabled: document.getElementById("progressEmailToggle").checked,
    });
    // keep the headline "due today at" text in sync with the new transfer time
    DataStore.update({ transferDueTime: document.getElementById("timeInput").value });
    showToast("Settings saved");
  });

  document.getElementById("qsChangeEmail").addEventListener("click", () => switchTab("settings"));
  document.getElementById("qsChangeTime").addEventListener("click", () => switchTab("settings"));
  document.getElementById("qsSendProgress").addEventListener("click", () => {
    // Hook this up to your real email-sending endpoint when you have one.
    showToast("Progress email sent");
  });

  document.getElementById("infoBtn").addEventListener("click", () => {
    alert("1p Challenge Automator: saves an extra 1p more each day, automatically transferred toward your goal.");
  });
}

async function init() {
  await DataStore.load("data.json");
  DataStore.onChange(render);
  render();
  wireEvents();
  switchTab("progress");
}

init().catch((err) => {
  console.error(err);
  document.body.innerHTML = `<p style="color:#f16b5c;padding:40px;font-family:monospace;">
    Failed to load data.json — make sure you're serving these files over
    http:// (not opening index.html directly with file://), e.g. run:
    <br><br><code>python3 -m http.server</code><br><br>
    from this folder, then open http://localhost:8000
  </p>`;
});