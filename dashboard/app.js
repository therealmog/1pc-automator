/**
 * app.js
 * ---------------------------------------------------------------
 * Wires DataStore -> DOM.
 *
 * Quotes are presentation content, so they live here rather than in
 * data-store.js. One quote is selected when the page loads and stays
 * fixed until the page is refreshed.
 * ---------------------------------------------------------------
 */

const QUOTES = [
  "A rich man spends when a smart man saves.",
  "Do not save what is left after spending; spend what is left after saving.",
  "Beware of little expenses; a small leak will sink a great ship.",
  "An investment in knowledge pays the best interest.",
  "The habit of saving is itself an education.",
  "Never spend your money before you have earned it.",
  "Money is a terrible master but an excellent servant.",
  "A penny saved is a penny earned.",
  "Save a little money each month and at the end of the year you will be surprised at how little you had.",
  "The quickest way to double your money is to fold it in half and put it in your pocket.",
  "It is not your salary that makes you rich; it is your spending habits.",
  "Small savings today can become big opportunities tomorrow.",
  "Financial freedom begins with taking control of your money.",
  "Every saved pound is a pound working for your future.",
  "A goal without a plan is just a wish.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Little by little, a little becomes a lot.",
  "The best time to start saving was yesterday. The next best time is today.",
  "Discipline is choosing between what you want now and what you want most.",
  "Your future self will thank you for the money you save today."
];

let currentQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;

  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

function getSavedSoFar() {
  const settingsFile = DataStore.get().settingsFile || {};
  const currentAmountPence = Number(settingsFile.currentAmount);

  if (Number.isFinite(currentAmountPence)) {
    return currentAmountPence / 100;
  }

  return 0;
}

function getAmountHistory() {
  const amounts = DataStore.amounts();
  const today = new Date();
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return Object.entries(amounts)
    .map(([dateString, entry]) => {
      if (!entry || typeof entry.amount !== "number") {
        return null;
      }

      const date = DataStore.parseDateDDMMYYYY(dateString);

      return {
        dateString,
        date,
        amount: entry.amount / 100
      };
    })
    .filter(Boolean)
    .filter((entry) => entry.date <= todayMidnight)
    .sort((a, b) => a.date - b.date);
}

function render() {
  const d = DataStore;
  const savedSoFar = getSavedSoFar();
  const goal = d.goal();
  const progressPct = Math.min(100, (savedSoFar / goal) * 100);
  const transferStatus = d.transferStatus();

  document.getElementById("dayNum").textContent = d.day();
  document.getElementById("quoteText").textContent = `"${currentQuote}"`;
  document.getElementById("todayTransfer").textContent =
    d.todayTransfer().toFixed(2);
  document.getElementById("savedSoFar").textContent =
    savedSoFar.toFixed(2);
  document.getElementById("goalAmount").textContent =
    goal.toFixed(2);

  // Status line.
  const statusEl = document.getElementById("statusLine");
  statusEl.className = "status-line " + transferStatus;

  if (transferStatus === "completed") {
    statusEl.innerHTML = "Completed!";
  } else if (transferStatus === "skipped") {
    statusEl.innerHTML = `Skipped <span class="due">(due tomorrow at ${d.transferDueTime()})</span>`;
  } else {
    statusEl.innerHTML =
      `Not completed <span class="due">(due today at ${d.transferDueTime()})</span>`;
  }

  // Progress bar.
  document.getElementById("progressPct").textContent =
    `${progressPct.toFixed(1)}%`;

  const remaining = Math.max(0, goal - savedSoFar);
  document.getElementById("remaining").textContent =
    `£${remaining.toFixed(2)} to go`;

  const track = document.getElementById("progressTrack");
  track.innerHTML = "";

  const CELLS = 40;
  const filledCount = Math.round((progressPct / 100) * CELLS);

  for (let i = 0; i < CELLS; i++) {
    const cell = document.createElement("div");
    cell.className =
      "penny-cell" + (i < filledCount ? " filled" : "");
    track.appendChild(cell);
  }

  // Raw daily transfer line graph. The completed flag is ignored.
  renderLineGraph(getAmountHistory());

  // Chart view toggle radios.
  const view = d.chartView();

  document.querySelectorAll('input[name="chartView"]').forEach((r) => {
    r.checked = r.value === view;
  });

  document
    .getElementById("labelBar")
    .classList.toggle("active-label", view === "progress_bar");

  document
    .getElementById("labelLine")
    .classList.toggle("active-label", view === "line_graph");

  document.getElementById("barView").style.display =
    view === "progress_bar" ? "block" : "none";

  document.getElementById("lineView").style.display =
    view === "line_graph" ? "block" : "none";

  renderSettingsTab();
  updateSkipButtons();
}

function renderSettingsTab() {
  const s = DataStore.settings();

  document.getElementById("settingsEmailValue").textContent =
    s.email || "—";

  document.getElementById("settingsTransferTimeValue").textContent =
    s.transferTime || "--:--";

  document.getElementById("settingsEndDateValue").textContent =
    `(ends ${s.endDate || "—"})`;

  // Use the actual nextTransferDate from settings.json/DataStore.
  // This is important because skipping a transfer moves this date forward.
  const nextDate = s.nextTransferDate || "—";

  document.getElementById("settingsNextTransferValue").textContent =
    `${nextDate}, ${s.transferTime || "--:--"}`;
}

function renderLineGraph(history) {
  const svg = document.getElementById("lineSvg");

  if (!history || history.length === 0) {
    svg.innerHTML = "";
    return;
  }

  const w = 400;
  const h = 120;
  const pad = 10;

  const values = history.map((p) => p.amount);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const getPoint = (p, i) => {
    const x =
      pad +
      (i / (history.length - 1 || 1)) *
        (w - pad * 2);

    const y =
      h -
      pad -
      ((p.amount - min) / range) *
        (h - pad * 2);

    return { x, y };
  };

  const points = history
    .map((p, i) => {
      const { x, y } = getPoint(p, i);
      return `${x},${y}`;
    })
    .join(" ");

  svg.innerHTML = `
    <polyline
      points="${points}"
      fill="none"
      stroke="#2dd6b8"
      stroke-width="2.5"
    />

    ${history
      .map((p, i) => {
        const { x, y } = getPoint(p, i);

        return `
          <circle
            cx="${x}"
            cy="${y}"
            r="4"
            fill="#2dd6b8"
            stroke="#2dd6b8"
          >
            <title>${p.dateString}: £${p.amount.toFixed(2)}</title>
          </circle>
        `;
      })
      .join("")}
  `;
}

function ensureUnskipButton() {
  let button = document.getElementById("qsUnskipNextTransfer");

  if (button) {
    return button;
  }

  const skipButton =
    document.getElementById("qsSkipNextTransfer");

  if (!skipButton) {
    return null;
  }

  button = document.createElement("button");
  button.className = "qs-btn";
  button.id = "qsUnskipNextTransfer";
  button.type = "button";

  button.innerHTML =
    '<span class="material-symbols-outlined">undo</span> Unskip next transfer';

  // No direct listener here. The button is dynamically created,
  // so wireEvents() uses event delegation instead.

  skipButton.parentNode.insertBefore(
    button,
    skipButton.nextSibling
  );

  return button;
}

function unskipNextTransfer() {
  const state = DataStore.get();

  if (!state.skipActive) {
    return false;
  }

  const originalTransferDate =
    state.skippedTransferDate;

  if (!originalTransferDate) {
    console.warn(
      "Cannot unskip transfer because the original transfer date was not stored."
    );
    return false;
  }

  // Restore the original date and clear the skip state atomically.
  DataStore.update({
    skipActive: false,
    skippedTransferDate: null,

    settings: {
      ...(state.settings || {}),
      nextTransferDate: originalTransferDate
    },

    settingsFile: {
      ...(state.settingsFile || {}),
      nextTransferDate: originalTransferDate
    }
  });

  // Remove the temporary browser skip state.
  try {
    sessionStorage.removeItem("1p-dashboard-skip");
  } catch (e) {
    console.warn(
      "Could not clear local skipped-transfer state:",
      e
    );
  }

  // Attempt to persist the restored date to the real settings file.
  const latestState = DataStore.get();

  fetch("../settings.json", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(
      latestState.settingsFile
    )
  }).catch((e) => {
    console.warn(
      "Could not write restored nextTransferDate to ../settings.json. " +
      "The browser/session state has still been restored; " +
      "a backend write endpoint is required to physically modify the JSON file.",
      e
    );
  });

  return true;
}

function handleUnskipNextTransfer() {
  if (unskipNextTransfer()) {
    showToast("Next transfer unskipped");
  }
}

function updateSkipButtons() {
  const skipButton =
    document.getElementById("qsSkipNextTransfer");

  const settingsSkipButton =
    document.getElementById("btnSkipNextTransfer");

  const unskipButton =
    ensureUnskipButton();

  const skipped =
    DataStore.isTransferSkipped();

  // Quick Settings:
  // explicitly control display rather than relying on the
  // native hidden attribute, because .qs-btn has display:block.
  if (skipButton) {
    skipButton.style.display =
      skipped ? "none" : "block";

    skipButton.setAttribute(
      "aria-hidden",
      skipped ? "true" : "false"
    );
  }

  if (unskipButton) {
    unskipButton.style.display =
      skipped ? "block" : "none";

    unskipButton.setAttribute(
      "aria-hidden",
      skipped ? "false" : "true"
    );
  }

  // Settings panel:
  // disable and grey the Skip button while skipped.
  if (settingsSkipButton) {
    settingsSkipButton.disabled = skipped;

    settingsSkipButton.setAttribute(
      "aria-disabled",
      skipped ? "true" : "false"
    );

    settingsSkipButton.classList.toggle(
      "skipped-btn",
      skipped
    );

    settingsSkipButton.innerHTML = skipped
      ? '<span class="material-symbols-outlined">skip_next</span> Skipped'
      : '<span class="material-symbols-outlined">skip_next</span> Skip next transfer';
  }
}

async function handleSkipNextTransfer() {
  if (DataStore.isTransferSkipped()) {
    return;
  }

  try {
    await DataStore.skipNextTransfer();

    showToast("Next transfer skipped");
  } catch (err) {
    console.error(
      "Could not skip transfer:",
      err
    );

    showToast("Could not skip transfer");
  }
}

function switchTab(tab) {
  const progressBtn =
    document.getElementById("tabProgress");

  const settingsBtn =
    document.getElementById("tabSettings");

  const progressView =
    document.getElementById("progressView");

  const settingsView =
    document.getElementById("settingsView");

  progressBtn.classList.toggle(
    "active",
    tab === "progress"
  );

  settingsBtn.classList.toggle(
    "active",
    tab === "settings"
  );

  progressView.classList.toggle(
    "hidden",
    tab !== "progress"
  );

  settingsView.classList.toggle(
    "visible",
    tab === "settings"
  );

  document
    .getElementById("quickSettingsPanel")
    .classList.toggle(
      "hidden",
      tab !== "progress"
    );

  document
    .getElementById("dangerZonePanel")
    .classList.toggle(
      "hidden",
      tab !== "settings"
    );
}

function wireEvents() {
  document
    .getElementById("tabProgress")
    .addEventListener(
      "click",
      () => switchTab("progress")
    );

  document
    .getElementById("tabSettings")
    .addEventListener(
      "click",
      () => switchTab("settings")
    );

  document
    .querySelectorAll('input[name="chartView"]')
    .forEach((r) => {
      r.addEventListener("change", (e) => {
        DataStore.setChartView(
          e.target.value
        );
      });
    });

  document
    .getElementById("qsChangeEmail")
    .addEventListener(
      "click",
      () => switchTab("settings")
    );

  document
    .getElementById("qsChangeTime")
    .addEventListener(
      "click",
      () => switchTab("settings")
    );

  document
    .getElementById("qsSendProgress")
    .addEventListener(
      "click",
      () => {
        // Hook this up to your real email-sending endpoint
        // when you have one.
        showToast("Progress email sent");
      }
    );

  document
    .getElementById("qsSkipNextTransfer")
    .addEventListener(
      "click",
      handleSkipNextTransfer
    );

  document
    .getElementById("btnSkipNextTransfer")
    .addEventListener(
      "click",
      handleSkipNextTransfer
    );

  // IMPORTANT:
  // Unskip is dynamically created by ensureUnskipButton().
  // Event delegation means this keeps working even if the
  // button is recreated during a render.
  document
    .getElementById("quickSettingsPanel")
    .addEventListener("click", (e) => {
      const button =
        e.target.closest(
          "#qsUnskipNextTransfer"
        );

      if (!button) {
        return;
      }

      handleUnskipNextTransfer();
    });

  document
    .getElementById("infoBtn")
    .addEventListener(
      "click",
      () => {
        alert(
          "1p Challenge Automator: saves an extra 1p more each day, automatically transferred toward your goal."
        );
      }
    );
}

function wireDummyButtons() {
  const dummy = (id, label) => {
    const button =
      document.getElementById(id);

    if (!button) {
      return;
    }

    button.addEventListener(
      "click",
      () => {
        console.log(
          `${label} clicked (dummy — not wired up yet)`
        );
      }
    );
  };

  // TODO: this one should switch the view to an
  // email-reset flow, verification code first —
  // leaving as a dummy for now.
  dummy("btnChangeEmail", "Change email");
  dummy(
    "btnChangeTransferTime",
    "Change transfer time"
  );
  dummy(
    "btnPauseChallenge",
    "Pause challenge"
  );
  dummy(
    "btnRestartChallenge",
    "Restart challenge"
  );
  dummy(
    "btnEndChallenge",
    "End challenge"
  );
  dummy(
    "btnWipeData",
    "Wipe stored AWS data"
  );
}

async function init() {
  await DataStore.load("data.json");

  DataStore.onChange(render);

  render();
  wireEvents();
  wireDummyButtons();
  switchTab("progress");
}

init().catch((err) => {
  console.error(err);

  document.body.innerHTML = `
    <p style="color:#f16b5c;padding:40px;font-family:monospace;">
      Failed to load dashboard data — make sure you're serving these files over
      http:// (not opening dashboard.html directly with file://), e.g. run:
      <br><br>
      <code>python3 -m http.server</code>
      <br><br>
      from this folder, then open http://localhost:8000
    </p>
  `;
});