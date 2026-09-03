/**
 * data-store.js
 * ---------------------------------------------------------------
 * Single source of truth for every variable the dashboard needs.
 * Loads from data.json (placeholders for anything not yet wired to
 * a real file) and then overrides values from your actual project
 * files — amounts.json and settings.json — so any other script
 * (app.js, or a future page) can read/update the same values.
 *
 * Swap-in path for a real backend later: replace the fetch() calls
 * in load() / save() with calls to your API, and nothing else in
 * the app has to change.
 * ---------------------------------------------------------------
 */

const DataStore = (() => {
  let state = null;
  const listeners = [];

  async function load(path = "data.json") {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    state = await res.json();

    // Pull today's transfer amount + completed status from your real
    // amounts.json, and transferTime/startDate/userEmail/endDate from
    // settings.json — overriding whatever placeholder values were in
    // data.json.
    await loadTodayTransferFromAmounts();
    await loadSettingsFromFile();

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
    if (!state) throw new Error("DataStore not loaded yet — call load() first");
    return state;
  }

  /**
   * Formats a Date as "DD/MM/YYYY" — matches the key format used
   * in amounts.json / settings.json (e.g. "08/08/2026").
   */
  function formatDateDDMMYYYY(date = new Date()) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0"); // getMonth() is 0-indexed
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  /** Parses a "DD/MM/YYYY" string into a Date (midnight local time). */
  function parseDateDDMMYYYY(str) {
    const [dd, mm, yyyy] = str.split("/").map(Number);
    return new Date(yyyy, mm - 1, dd);
  }

  /**
   * Reads an entry's "completed" field, whether it's stored as a real
   * boolean (true) or a string ("true") — both come back true here.
   */
  function isTransferCompleted(entry) {
    if (!entry) return false;
    return entry.completed === true || entry.completed === "true";
  }

  /**
   * amounts.json shape (one level up from the dashboard folder):
   *   { "08/08/2026": { "amount": 65, "completed": "true" }, ... }
   * amount is pence -> divide by 100 for pounds.
   * completed drives the "Completed!" / "Not completed" status line.
   */
  async function loadTodayTransferFromAmounts(path = "../amounts.json") {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
      const amounts = await res.json();

      const todayKey = formatDateDDMMYYYY();
      const entry = amounts[todayKey];

      if (!entry || typeof entry.amount !== "number") {
        console.warn(`No entry for ${todayKey} in ${path} — keeping fallback value from data.json.`);
        return;
      }

      state.todayTransfer = entry.amount / 100; // pence -> pounds
      state.transferStatus = isTransferCompleted(entry) ? "completed" : "not_completed";
    } catch (err) {
      console.warn(`Could not load today's transfer from ${path}:`, err);
    }
  }

  /**
   * settings.json shape (one level up from the dashboard folder):
   *   { "userEmail": "...", "transferTime": "01:00",
   *     "startDate": "05/06/2026", "endDate": "07/07/2027" }
   *
   * - transferTime feeds the "(due today at HH:MM)" text and the
   *   Settings tab's "Daily transfer time" row.
   * - userEmail feeds the Settings tab's "Current email" row.
   * - endDate feeds the Settings tab's "(ends ...)" text.
   * - startDate is used to CALCULATE "saved so far" rather than
   *   storing it directly: this is the classic 1p-a-day challenge,
   *   so by day n (counting the start date itself as day 1) the
   *   total saved is 1p + 2p + ... + np = n(n+1)/2 pence — but only
   *   once today's transfer has actually completed. If it hasn't,
   *   we show yesterday's running total instead (day n-1).
   */
  async function loadSettingsFromFile(path = "../settings.json") {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
      const settings = await res.json();

      if (settings.transferTime) {
        state.transferDueTime = settings.transferTime;
        state.settings = { ...state.settings, transferTime: settings.transferTime };
      }

      if (settings.userEmail) {
        state.settings = { ...state.settings, email: settings.userEmail };
      }

      if (settings.endDate) {
        state.settings = { ...state.settings, endDate: settings.endDate };
      }

      if (settings.startDate) {
        const start = parseDateDDMMYYYY(settings.startDate);
        const today = new Date();
        const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const msPerDay = 24 * 60 * 60 * 1000;
        const dayNumber = Math.round((todayMidnight - startMidnight) / msPerDay) + 1; // start date = Day 1

        state.day = dayNumber; // the "Day 65" badge — always the real calendar count

        // "Saved so far" only counts today's contribution once it's completed.
        // If not completed yet, fall back to yesterday's running total.
        const effectiveDay = state.transferStatus === "completed" ? dayNumber : dayNumber - 1;
        const pence = effectiveDay > 0 ? (effectiveDay * (effectiveDay + 1)) / 2 : 0;
        state.savedSoFar = pence / 100; // pence -> pounds
      }
    } catch (err) {
      console.warn(`Could not load settings from ${path}:`, err);
    }
  }

  // ---- convenience getters (the "variables" you asked for) ----
  const day = () => get().day;
  const quote = () => get().quote;
  const todayTransfer = () => get().todayTransfer;
  const transferStatus = () => get().transferStatus; // "completed" | "not_completed"
  const transferDueTime = () => get().transferDueTime;
  const savedSoFar = () => get().savedSoFar;
  const goal = () => get().goal;
  const progressPct = () => Math.min(100, (get().savedSoFar / get().goal) * 100);
  const chartView = () => get().chartView; // "progress_bar" | "line_graph"
  const settings = () => get().settings;
  const history = () => get().history;

  // ---- setters: update in-memory state, notify UI, and persist ----
  function update(partial) {
    state = { ...state, ...partial };
    notify();
    save();
  }

  function updateSettings(partial) {
    state.settings = { ...state.settings, ...partial };
    notify();
    save();
  }

  function markTransferCompleted() {
    update({ transferStatus: "completed" });
  }

  function setChartView(view) {
    update({ chartView: view });
  }

  async function save() {
    // No backend yet: persist locally in the browser session only.
    // Replace this with e.g. fetch('/api/data', { method: 'PUT', body: JSON.stringify(state) })
    // once you have a Flask (or other) API behind the dashboard.
    try {
      sessionStorage.setItem("1p-dashboard-data", JSON.stringify(state));
    } catch (e) {
      console.warn("Could not persist data:", e);
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
    loadTodayTransferFromAmounts,
    loadSettingsFromFile,
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
  };
})();