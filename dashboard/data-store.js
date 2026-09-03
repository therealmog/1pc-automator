/**
 * data-store.js
 * ---------------------------------------------------------------
 * Single source of truth for every variable the dashboard needs.
 *
 * Loads:
 *   - data.json
 *   - ../amounts.json
 *   - ../settings.json
 *
 * amounts.json is used for:
 *   - today's transfer amount/status
 *   - the cumulative line graph
 *
 * settings.json is used for:
 *   - transfer time
 *   - email
 *   - start/end dates
 *   - next transfer date
 *   - currentAmount
 * ---------------------------------------------------------------
 */

const DataStore = (() => {
  let state = null;
  const listeners = [];

  async function load(path = "data.json") {
    const res = await fetch(path, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Failed to load ${path}: ${res.status}`);
    }

    state = await res.json();

    // Load the complete amounts.json file.
    await loadAmountsFromFile();

    // Load settings.json.
    await loadSettingsFromFile();

    // Restore any locally stored skip state.
    restoreLocalSkipState();

    notify();

    return state;
  }

  function notify() {
    listeners.forEach((fn) => fn(state));
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  function get() {
    if (!state) {
      throw new Error("DataStore not loaded yet — call load() first");
    }

    return state;
  }

  function formatDateDDMMYYYY(date = new Date()) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
  }

  function parseDateDDMMYYYY(str) {
    const [dd, mm, yyyy] = str.split("/").map(Number);
    return new Date(yyyy, mm - 1, dd);
  }

  function isTransferCompleted(entry) {
    if (!entry) return false;

    return (
      entry.completed === true ||
      entry.completed === "true"
    );
  }

  /**
   * Load the complete amounts.json file.
   *
   * Example:
   *
   * {
   *   "05/06/2026": {
   *     "amount": 1,
   *     "completed": true
   *   },
   *   "06/06/2026": {
   *     "amount": 2,
   *     "completed": true
   *   }
   * }
   *
   * Amounts are stored in pence.
   */
  async function loadAmountsFromFile(path = "../amounts.json") {
    try {
      const res = await fetch(path, { cache: "no-store" });

      if (!res.ok) {
        throw new Error(`Failed to load ${path}: ${res.status}`);
      }

      const amounts = await res.json();

      state.amounts = amounts;

      const todayKey = formatDateDDMMYYYY();
      const todayEntry = amounts[todayKey];

      if (
        todayEntry &&
        typeof todayEntry.amount === "number"
      ) {
        // amounts.json stores pence.
        state.todayTransfer = todayEntry.amount / 100;

        state.transferStatus = isTransferCompleted(todayEntry)
          ? "completed"
          : "not_completed";
      } else {
        console.warn(
          `No entry for ${todayKey} in ${path} — keeping fallback transfer values.`
        );
      }
    } catch (err) {
      console.warn(
        `Could not load amounts from ${path}:`,
        err
      );

      // Keep a safe fallback so the rest of the dashboard
      // continues to function.
      state.amounts = state.amounts || {};
    }
  }

  /**
   * Return the chronological amounts data up to and including today.
   *
   * The returned objects contain:
   *   - date
   *   - amount (pounds)
   *   - completed
   *   - cumulative (pounds)
   *
   * Only completed transfers increase the cumulative total.
   * Uncompleted days still receive a point, but the line remains flat.
   */
  function cumulativeHistory() {
    const amounts = get().amounts || {};

    const today = new Date();
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const entries = Object.entries(amounts)
      .map(([dateString, entry]) => {
        if (!entry || typeof entry.amount !== "number") {
          return null;
        }

        const date = parseDateDDMMYYYY(dateString);

        return {
          dateString,
          date,
          amountPence: entry.amount,
          amount: entry.amount / 100,
          completed: isTransferCompleted(entry),
        };
      })
      .filter(Boolean)
      .filter((entry) => entry.date <= todayMidnight)
      .sort((a, b) => a.date - b.date);

    let cumulativePence = 0;

    return entries.map((entry) => {
      if (entry.completed) {
        cumulativePence += entry.amountPence;
      }

      return {
        date: entry.dateString,
        amount: entry.amount,
        completed: entry.completed,
        cumulative: cumulativePence / 100,
      };
    });
  }

  /**
   * Load settings.json.
   */
  async function loadSettingsFromFile(path = "../settings.json") {
    try {
      const res = await fetch(path, { cache: "no-store" });

      if (!res.ok) {
        throw new Error(`Failed to load ${path}: ${res.status}`);
      }

      const settings = await res.json();

      state.settingsFile = { ...settings };

      if (settings.transferTime) {
        state.transferDueTime = settings.transferTime;

        state.settings = {
          ...state.settings,
          transferTime: settings.transferTime,
        };
      }

      if (settings.userEmail) {
        state.settings = {
          ...state.settings,
          email: settings.userEmail,
        };
      }

      if (settings.endDate) {
        state.settings = {
          ...state.settings,
          endDate: settings.endDate,
        };
      }

      if (settings.nextTransferDate) {
        state.settings = {
          ...state.settings,
          nextTransferDate: settings.nextTransferDate,
        };
      }

      if (settings.startDate) {
        const start = parseDateDDMMYYYY(settings.startDate);
        const today = new Date();

        const startMidnight = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate()
        );

        const todayMidnight = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );

        const msPerDay = 24 * 60 * 60 * 1000;

        const dayNumber =
          Math.round(
            (todayMidnight - startMidnight) / msPerDay
          ) + 1;

        state.day = dayNumber;
      }
    } catch (err) {
      console.warn(
        `Could not load settings from ${path}:`,
        err
      );
    }
  }

  /**
   * Restore locally stored skip state.
   *
   * This allows the UI to remember a skipped transfer during
   * the current browser session.
   */
  function restoreLocalSkipState() {
    try {
      const stored = sessionStorage.getItem(
        "1p-dashboard-skip"
      );

      if (!stored) {
        state.skipActive = false;
        state.skippedTransferDate = null;
        return;
      }

      const local = JSON.parse(stored);

      if (local.nextTransferDate) {
        state.settings = {
          ...state.settings,
          nextTransferDate: local.nextTransferDate,
        };

        state.settingsFile = {
          ...(state.settingsFile || {}),
          nextTransferDate: local.nextTransferDate,
        };
      }

      if (
        local.skipActive &&
        local.nextTransferDate
      ) {
        const today = new Date();
        const todayKey = formatDateDDMMYYYY(today);

        const nextDate = parseDateDDMMYYYY(
          local.nextTransferDate
        );

        // Keep the skipped state active while the postponed
        // transfer date is still in the future.
        if (
          parseDateDDMMYYYY(todayKey) < nextDate
        ) {
          state.skipActive = true;
          state.skippedTransferDate =
            local.skippedTransferDate || null;

          return;
        }
      }

      // The skipped transfer date has arrived, so the skip
      // should no longer be considered active.
      sessionStorage.removeItem(
        "1p-dashboard-skip"
      );

      state.skipActive = false;
      state.skippedTransferDate = null;
    } catch (e) {
      console.warn(
        "Could not restore skipped-transfer state:",
        e
      );

      state.skipActive = false;
      state.skippedTransferDate = null;
    }
  }

  /**
   * Skip the next transfer.
   *
   * Behaviour:
   *   1. Remember the original transfer date.
   *   2. Move nextTransferDate forward by one day.
   *   3. Mark the transfer as skipped.
   *   4. Persist the skipped state in sessionStorage.
   *   5. Notify the UI so it can immediately update.
   */
  async function skipNextTransfer() {
    // Do not allow a second skip while one is already active.
    // This protects the original date required by Unskip.
    if (state.skipActive) {
      return false;
    }

    const current =
      state.settings &&
      state.settings.nextTransferDate;

    const baseDate = current
      ? parseDateDDMMYYYY(current)
      : new Date();

    // Move the next transfer forward by exactly one day.
    baseDate.setDate(baseDate.getDate() + 1);

    const nextTransferDate =
      formatDateDDMMYYYY(baseDate);

    // Remember the original date so Unskip can restore it.
    const skippedTransferDate =
      current ||
      formatDateDDMMYYYY(new Date());

    state.settings = {
      ...state.settings,
      nextTransferDate,
    };

    state.settingsFile = {
      ...(state.settingsFile || {}),
      nextTransferDate,
    };

    // This is what makes DataStore.transferStatus()
    // return "skipped".
    state.skipActive = true;
    state.skippedTransferDate =
      skippedTransferDate;

    try {
      sessionStorage.setItem(
        "1p-dashboard-skip",
        JSON.stringify({
          skipActive: true,
          skippedTransferDate,
          nextTransferDate,
        })
      );
    } catch (e) {
      console.warn(
        "Could not persist skipped-transfer state:",
        e
      );
    }

    // Immediately update the dashboard.
    notify();
    await save();

    // Attempt to persist the changed date to the real
    // settings.json file. This requires a backend that
    // supports PUT requests.
    try {
      const res = await fetch(
        "../settings.json",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            state.settingsFile
          ),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      console.warn(
        "Could not write nextTransferDate to ../settings.json. " +
        "The UI/session state has been updated; " +
        "a backend write endpoint is required for the JSON file itself.",
        e
      );
    }

    return true;
  }

  /**
   * Undo the currently active skipped transfer.
   *
   * Restores the original nextTransferDate that was saved
   * when skipNextTransfer() was called.
   */
  async function unskipNextTransfer() {
    const originalDate =
      state.skippedTransferDate;

    // Nothing to undo.
    if (!state.skipActive || !originalDate) {
      return false;
    }

    // Restore the original transfer date.
    state.settings = {
      ...state.settings,
      nextTransferDate: originalDate,
    };

    state.settingsFile = {
      ...(state.settingsFile || {}),
      nextTransferDate: originalDate,
    };

    // Clear the skipped state.
    state.skipActive = false;
    state.skippedTransferDate = null;

    try {
      sessionStorage.removeItem(
        "1p-dashboard-skip"
      );
    } catch (e) {
      console.warn(
        "Could not clear skipped-transfer state:",
        e
      );
    }

    // Immediately update the dashboard.
    notify();
    await save();

    // Attempt to persist the restored date to settings.json.
    try {
      const res = await fetch(
        "../settings.json",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            state.settingsFile
          ),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      console.warn(
        "Could not write restored nextTransferDate to ../settings.json.",
        e
      );
    }

    return true;
  }

  // ---- convenience getters ----

  const day = () => get().day;

  const quote = () => get().quote;

  const todayTransfer = () =>
    get().todayTransfer;

  /**
   * When skipActive is true, this deliberately overrides
   * the normal completed/not_completed status.
   *
   * Therefore the UI receives:
   *
   *   "skipped"
   *
   * while the transfer is skipped.
   */
  const transferStatus = () =>
    get().skipActive
      ? "skipped"
      : get().transferStatus;

  const transferDueTime = () =>
    get().transferDueTime;

  const isTransferSkipped = () =>
    !!get().skipActive;

  const savedSoFar = () =>
    get().savedSoFar;

  const goal = () =>
    get().goal;

  const progressPct = () =>
    Math.min(
      100,
      (get().savedSoFar / get().goal) * 100
    );

  const chartView = () =>
    get().chartView;

  const settings = () =>
    get().settings;

  const history = () =>
    get().history;

  const amounts = () =>
    get().amounts || {};

  const getCumulativeHistory = () =>
    cumulativeHistory();

  // ---- setters ----

  function update(partial) {
    state = {
      ...state,
      ...partial,
    };

    notify();
    save();
  }

  function updateSettings(partial) {
    state.settings = {
      ...state.settings,
      ...partial,
    };

    notify();
    save();
  }

  function markTransferCompleted() {
    update({
      transferStatus: "completed",
    });
  }

  function setChartView(view) {
    update({
      chartView: view,
    });
  }

  async function save() {
    try {
      sessionStorage.setItem(
        "1p-dashboard-data",
        JSON.stringify(state)
      );
    } catch (e) {
      console.warn(
        "Could not persist data:",
        e
      );
    }
  }

  return {
    load,
    onChange,
    get,

    update,
    updateSettings,

    markTransferCompleted,
    setChartView,

    formatDateDDMMYYYY,
    parseDateDDMMYYYY,
    isTransferCompleted,

    loadAmountsFromFile,
    loadSettingsFromFile,

    cumulativeHistory,
    getCumulativeHistory,

    // Skipped-transfer functionality.
    skipNextTransfer,
    unskipNextTransfer,
    isTransferSkipped,

    day,
    quote,
    todayTransfer,
    transferStatus,
    transferDueTime,

    savedSoFar,
    goal,
    progressPct,

    chartView,
    settings,
    history,
    amounts,
  };
})();