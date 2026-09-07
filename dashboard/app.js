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
let toastTimer = null;

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  t.className = "confirm-toast";
  t.textContent = msg;
  t.classList.add("show");

  toastTimer = setTimeout(() => {
    t.classList.remove("show");
  }, 1800);
}

function showEmailChangeToast() {
  const t = document.getElementById("toast");
  if (!t) return;

  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  const currentEmail = DataStore.settings().email || "";

  t.className = "confirm-toast email-toast";
  t.innerHTML = `
    <div class="email-toast-header">
      <div>
        <div class="email-toast-title">Change email</div>
        <div class="email-toast-subtitle">Enter the address for your progress updates.</div>
      </div>
      <button class="email-toast-close" id="emailToastClose" type="button" aria-label="Close">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    <form id="emailChangeForm" class="email-toast-form">
      <label for="emailToastInput">New email address</label>
      <input
        id="emailToastInput"
        name="email"
        type="email"
        value="${currentEmail.replace(/"/g, "&quot;")}"
        placeholder="you@example.com"
        autocomplete="email"
        required
      >
      <div class="email-toast-error" id="emailToastError" aria-live="polite"></div>
      <div class="email-toast-actions">
        <button class="email-toast-cancel" id="emailToastCancel" type="button">Cancel</button>
        <button class="email-toast-save" type="submit">Save email</button>
      </div>
    </form>
  `;

  t.classList.add("show");

  const input = document.getElementById("emailToastInput");
  const form = document.getElementById("emailChangeForm");
  const error = document.getElementById("emailToastError");
  const closeButton = document.getElementById("emailToastClose");
  const cancelButton = document.getElementById("emailToastCancel");

  const close = () => {
    t.classList.remove("show");
  };

  closeButton.addEventListener("click", close);
  cancelButton.addEventListener("click", close);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = input.value.trim();

    if (!input.checkValidity()) {
      error.textContent = "Please enter a valid email address.";
      input.focus();
      return;
    }

    DataStore.updateSettings({ email });
    close();
    showToast("Email updated");
  });

  input.addEventListener("input", () => {
    error.textContent = "";
  });

  input.focus();
  input.select();
}

function showSkipConfirmToast(message, onConfirm) {
  const t = document.getElementById("toast");
  if (!t) return;

  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  t.className = "confirm-toast skip-confirm-toast";
  t.innerHTML = `
    <div class="email-toast-header">
      <div>
        <div class="email-toast-title">Skip transfer</div>
        <div class="email-toast-subtitle">${message}</div>
      </div>
      <button class="email-toast-close" id="skipConfirmClose" type="button" aria-label="Close">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    <div class="email-toast-actions">
      <button class="email-toast-cancel" id="skipConfirmCancel" type="button">Cancel</button>
      <button class="email-toast-save" id="skipConfirmYes" type="button">Skip transfer</button>
    </div>
  `;

  t.classList.add("show");

  const closeButton = document.getElementById("skipConfirmClose");
  const cancelButton = document.getElementById("skipConfirmCancel");
  const yesButton = document.getElementById("skipConfirmYes");

  const close = () => {
    t.classList.remove("show");
  };

  closeButton.addEventListener("click", close);
  cancelButton.addEventListener("click", close);
  yesButton.addEventListener("click", () => {
    close();
    onConfirm();
  });

  yesButton.focus();
}

function showTransferTimeToast() {
  const t = document.getElementById("toast");
  if (!t) return;

  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  const currentTime =
    DataStore.settings().transferTime ||
    DataStore.transferDueTime() ||
    "01:00";

  t.className = "confirm-toast time-toast";
  t.innerHTML = `
    <div class="email-toast-header">
      <div>
        <div class="email-toast-title">Change transfer time</div>
        <div class="email-toast-subtitle">Choose the time your daily transfer should be made.</div>
      </div>
      <button class="email-toast-close" id="timeToastClose" type="button" aria-label="Close">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    <form id="transferTimeForm" class="email-toast-form">
      <label for="transferTimeInput">Daily transfer time</label>
      <input
        id="transferTimeInput"
        name="transferTime"
        type="time"
        value="${currentTime}"
        step="60"
        required
      >
      <div class="email-toast-error" id="transferTimeError" aria-live="polite"></div>
      <div class="email-toast-actions">
        <button class="email-toast-cancel" id="timeToastCancel" type="button">Cancel</button>
        <button class="email-toast-save" type="submit">Save time</button>
      </div>
    </form>
  `;

  t.classList.add("show");

  const input = document.getElementById("transferTimeInput");
  const form = document.getElementById("transferTimeForm");
  const error = document.getElementById("transferTimeError");
  const closeButton = document.getElementById("timeToastClose");
  const cancelButton = document.getElementById("timeToastCancel");

  const close = () => {
    t.classList.remove("show");
  };

  closeButton.addEventListener("click", close);
  cancelButton.addEventListener("click", close);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const transferTime = input.value;

    if (!input.checkValidity() || !/^\d{2}:\d{2}$/.test(transferTime)) {
      error.textContent = "Please enter a valid time.";
      input.focus();
      return;
    }

    DataStore.updateSettings({
      transferTime
    });

    close();
    showToast("Transfer time updated");
  });

  input.addEventListener("input", () => {
    error.textContent = "";
  });

  input.focus();
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

function getDateOffset(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

function getChallengeDayNumber() {
  const settingsFile = DataStore.get().settingsFile || {};

  if (!settingsFile.startDate) {
    return null;
  }

  const startDate = DataStore.parseDateDDMMYYYY(
    settingsFile.startDate
  );

  const today = getDateOffset(0);
  const startMidnight = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );

  if (startMidnight > today) {
    return null;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return (
    Math.round((today - startMidnight) / msPerDay) + 1
  );
}

function getTransferForDate(date) {
  const dateString = DataStore.formatDateDDMMYYYY(date);
  const entry = (DataStore.amounts() || {})[dateString];

  return {
    dateString,
    amount: entry && typeof entry.amount === "number"
      ? entry.amount / 100
      : null,
    completed: DataStore.isTransferCompleted(entry)
  };
}

function getDueText(date, transferTime) {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const today = getDateOffset(0);
  const tomorrow = getDateOffset(1);
  const inTwoDays = getDateOffset(2);

  if (target.getTime() === today.getTime()) {
    return `due today at ${transferTime}`;
  }

  if (target.getTime() === tomorrow.getTime()) {
    return `due tomorrow at ${transferTime}`;
  }

  if (target.getTime() === inTwoDays.getTime()) {
    return `due in 2 days at ${transferTime}`;
  }

  return `due on ${DataStore.formatDateDDMMYYYY(target)} at ${transferTime}`;
}

function renderTransferStatus(element, status, dueText) {
  element.className = "status-line " + status;

  if (status === "completed") {
    element.innerHTML = "Completed!";
  } else if (status === "skipped") {
    element.innerHTML = `Skipped <span class="due">(${dueText})</span>`;
  } else if (status === "scheduled") {
    element.innerHTML = `Scheduled <span class="due">(${dueText})</span>`;
  } else {
    element.innerHTML = `Not completed <span class="due">(${dueText})</span>`;
  }
}

function render() {
  const d = DataStore;
  const savedSoFar = getSavedSoFar();
  const goal = d.goal();
  const progressPct = Math.min(100, (savedSoFar / goal) * 100);
  const rawTodayStatus = d.get().transferStatus;
  const skipActive = d.isTransferSkipped();
  const today = getTransferForDate(getDateOffset(0));
  const next = getTransferForDate(getDateOffset(1));
  const settingsFile = d.get().settingsFile || {};
  const startDate = settingsFile.startDate
    ? d.parseDateDDMMYYYY(settingsFile.startDate)
    : null;
  const challengeNotStarted =
    !!startDate && startDate > getDateOffset(0);
  const configuredNextTransferDate = settingsFile.nextTransferDate
    ? d.parseDateDDMMYYYY(settingsFile.nextTransferDate)
    : null;
  const tomorrow = getDateOffset(1);
  const nextTransferDate =
    configuredNextTransferDate && configuredNextTransferDate > getDateOffset(0)
      ? configuredNextTransferDate
      : tomorrow;

  const dayBadge = document.querySelector(".day-badge");
  if (dayBadge) {
    dayBadge.style.display = challengeNotStarted ? "none" : "";
  }

  if (!challengeNotStarted) {
    document.getElementById("dayNum").textContent = d.day();
  }

  document.getElementById("quoteText").textContent = `"${currentQuote}"`;

  const todayCardLabel = document.querySelectorAll(".transfer-card .stat-label")[0];
  if (todayCardLabel) {
    todayCardLabel.textContent = challengeNotStarted
      ? "First transfer"
      : "Today's transfer";
  }

  let firstTransferText;
  let nextTransferText;

  if (challengeNotStarted) {
    firstTransferText = "0.01";
    nextTransferText = "0.02";
  } else {
    const challengeDay = getChallengeDayNumber();

    if (challengeDay && challengeDay >= 1) {
      firstTransferText = (challengeDay / 100).toFixed(2);
      nextTransferText = ((challengeDay + 1) / 100).toFixed(2);
    } else {
      firstTransferText = today.amount !== null
        ? today.amount.toFixed(2)
        : d.todayTransfer().toFixed(2);
      nextTransferText = next.amount !== null
        ? next.amount.toFixed(2)
        : "0.00";
    }
  }

  document.getElementById("todayTransfer").textContent = firstTransferText;

  document.getElementById("nextTransfer").textContent = nextTransferText;

  document.getElementById("savedSoFar").textContent =
    savedSoFar.toFixed(2);
  document.getElementById("goalAmount").textContent =
    goal.toFixed(2);

  const todayStatus =
    skipActive && rawTodayStatus !== "completed"
      ? "skipped"
      : rawTodayStatus;

  const nextStatus =
    skipActive && rawTodayStatus === "completed"
      ? "skipped"
      : "scheduled";

  renderTransferStatus(
    document.getElementById("statusLine"),
    todayStatus,
    todayStatus === "skipped"
      ? getDueText(getDateOffset(1), d.transferDueTime())
      : getDueText(
          challengeNotStarted && startDate ? startDate : getDateOffset(0),
          d.transferDueTime()
        )
  );

  const nextDueDate =
    challengeNotStarted && startDate
      ? (() => {
          const dayAfterStart = new Date(startDate);
          dayAfterStart.setDate(dayAfterStart.getDate() + 1);
          return dayAfterStart;
        })()
      : skipActive && rawTodayStatus === "completed"
      ? getDateOffset(2)
      : nextTransferDate;

  renderTransferStatus(
    document.getElementById("nextStatusLine"),
    nextStatus,
    getDueText(nextDueDate, d.transferDueTime())
  );

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

  renderLineGraph(getAmountHistory());

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

  const nextDate = s.nextTransferDate || "—";

  document.getElementById("settingsNextTransferValue").textContent =
    `${nextDate}, ${s.transferTime || "--:--"}`;

  const settingsFile = DataStore.get().settingsFile || {};
  const startDate = settingsFile.startDate
    ? DataStore.parseDateDDMMYYYY(settingsFile.startDate)
    : null;
  const today = getDateOffset(0);
  const challengeNotStarted = !!startDate && startDate > today;

  const todayRow = document.getElementById("settingsTodayRow");
  const todayValue = document.getElementById("settingsTodayTransferValue");
  const todayStatusEl = document.getElementById("settingsTodayStatus");
  const skipTodayButton = document.getElementById("btnSkipTodayTransfer");

  if (challengeNotStarted) {
    if (todayRow) todayRow.style.display = "none";
  } else {
    if (todayRow) todayRow.style.display = "";

    const transferTime = s.transferTime || "--:--";
    const todayDateString = DataStore.formatDateDDMMYYYY(today);

    let todayAmountText;
    const challengeDay = getChallengeDayNumber();
    if (challengeDay && challengeDay >= 1) {
      todayAmountText = `£${(challengeDay / 100).toFixed(2)}`;
    } else {
      const todayEntry = (DataStore.amounts() || {})[todayDateString];
      const fallback = typeof todayEntry?.amount === "number"
        ? (todayEntry.amount / 100).toFixed(2)
        : DataStore.todayTransfer().toFixed(2);
      todayAmountText = `£${fallback}`;
    }

    if (todayValue) {
      todayValue.textContent = `${todayAmountText} (${todayDateString}, ${transferTime})`;
    }

    const completed = DataStore.isTransferCompleted(
      (DataStore.amounts() || {})[todayDateString]
    );

    if (todayStatusEl) {
      todayStatusEl.className =
        "settings-status " + (completed ? "completed" : "not_completed");
      todayStatusEl.textContent = completed ? "Completed" : "Not completed";
    }

    if (skipTodayButton) {
      skipTodayButton.style.display = completed ? "none" : "";
    }
  }
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

  skipButton.parentNode.insertBefore(
    button,
    skipButton.nextSibling
  );

  return button;
}

async function handleUnskipNextTransfer() {
  try {
    const unskipped = await DataStore.unskipNextTransfer();

    if (unskipped) {
      showToast("Next transfer unskipped");
    }
  } catch (err) {
    console.error("Could not unskip transfer:", err);
    showToast("Could not unskip transfer");
  }
}

function updateSkipButtons() {
  const skipButton =
    document.getElementById("qsSkipNextTransfer");

  const settingsSkipButton =
    document.getElementById("btnSkipNextTransfer");

  const settingsSkipTodayButton =
    document.getElementById("btnSkipTodayTransfer");

  const settingsTodayRow =
    document.getElementById("settingsTodayRow");

  const unskipButton =
    ensureUnskipButton();

  const skipped =
    DataStore.isTransferSkipped();

  const todayDateString =
    DataStore.formatDateDDMMYYYY(getDateOffset(0));

  const todayEntry = (DataStore.amounts() || {})[todayDateString];
  const todayCompleted =
    DataStore.isTransferCompleted(todayEntry);

  const challengeNotStarted = (() => {
    const settingsFile = DataStore.get().settingsFile || {};
    if (!settingsFile.startDate) return false;
    const start = DataStore.parseDateDDMMYYYY(settingsFile.startDate);
    return start > getDateOffset(0);
  })();

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
      ? '<span class="material-symbols-outlined">close</span> Skipped'
      : '<span class="material-symbols-outlined">skip_next</span> Skip next transfer';
  }

  const showSkipNext = challengeNotStarted
    ? true
    : todayCompleted;
  const showSkipToday = !challengeNotStarted && !todayCompleted;

  if (settingsTodayRow) {
    settingsTodayRow.style.display = challengeNotStarted ? "none" : "";
  }

  if (settingsSkipTodayButton) {
    settingsSkipTodayButton.style.display = showSkipToday ? "" : "none";
    settingsSkipTodayButton.disabled = skipped;
    settingsSkipTodayButton.setAttribute(
      "aria-disabled",
      skipped ? "true" : "false"
    );
    settingsSkipTodayButton.classList.toggle("skipped-btn", skipped);
    settingsSkipTodayButton.innerHTML = skipped
      ? '<span class="material-symbols-outlined">close</span> Skipped'
      : '<span class="material-symbols-outlined">skip_next</span> Skip today\'s transfer';
  }

  if (settingsSkipButton) {
    settingsSkipButton.style.visibility =
      showSkipNext ? "visible" : "hidden";
  }
}

async function handleSkipNextTransfer() {
  if (DataStore.isTransferSkipped()) {
    return;
  }

  showSkipConfirmToast(
    "Are you sure you want to skip the next transfer? You can unskip it from the dashboard afterwards.",
    async () => {
      try {
        const skipPromise = DataStore.skipNextTransfer();

        showToast("Next transfer skipped");

        const skipped = await skipPromise;

        if (!skipped) {
          return;
        }
      } catch (err) {
        console.error(
          "Could not skip transfer:",
          err
        );

        showToast("Could not skip transfer");
      }
    }
  );
}

async function handleSkipTodayTransfer() {
  if (DataStore.isTodayTransferSkipped()) {
    return;
  }

  showSkipConfirmToast(
    "Are you sure you want to skip today's transfer? You can unskip it from the dashboard afterwards.",
    async () => {
      try {
        await DataStore.skipTodayTransfer();
        showToast("Today's transfer skipped");
      } catch (err) {
        console.error(
          "Could not skip today's transfer:",
          err
        );
        showToast("Could not skip today's transfer");
      }
    }
  );
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
      showEmailChangeToast
    );

  document
    .getElementById("qsChangeTime")
    .addEventListener(
      "click",
      showTransferTimeToast
    );

  document
    .getElementById("qsSkipNextTransfer")
    .addEventListener(
      "click",
      handleSkipNextTransfer
    );

  document
    .getElementById("qsSendProgress")
    .addEventListener(
      "click",
      () => {
        const settingsFile = DataStore.get().settingsFile || {};

        if (settingsFile.startDate) {
          const start = DataStore.parseDateDDMMYYYY(
            settingsFile.startDate
          );

          const today = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate()
          );

          const startMidnight = new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate()
          );

          if (startMidnight > today) {
            showToast("Your challenge has not started yet!");
            return;
          }
        }

        showToast("Progress email sent");
      }
    );

  document
    .getElementById("btnChangeTransferTime")
    .addEventListener(
      "click",
      showTransferTimeToast
    );

  document
    .getElementById("btnChangeEmail")
    .addEventListener(
      "click",
      showEmailChangeToast
    );

  document
    .getElementById("btnSkipNextTransfer")
    .addEventListener(
      "click",
      handleSkipNextTransfer
    );

  document
    .getElementById("btnSkipTodayTransfer")
    .addEventListener(
      "click",
      handleSkipTodayTransfer
    );

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
      openInfoModal
    );

  const infoClose = document.getElementById("infoModalClose");
  if (infoClose) {
    infoClose.addEventListener("click", closeInfoModal);
  }

  const infoBackdrop = document.getElementById("infoModalBackdrop");
  if (infoBackdrop) {
    infoBackdrop.addEventListener("click", closeInfoModal);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeInfoModal();
    }
  });
}

function openInfoModal() {
  const modal = document.getElementById("infoModal");
  if (!modal) return;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  const content = modal.querySelector(".info-modal-content");
  if (content) content.scrollTop = 0;
}

function closeInfoModal() {
  const modal = document.getElementById("infoModal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
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

  dummy(
    "btnChangeTransferTimeDummy",
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
  await DataStore.load("fallback.json");

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