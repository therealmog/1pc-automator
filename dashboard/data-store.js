/**
 * data-store.js
 * ---------------------------------------------------------------
 * Single source of truth for every variable the dashboard needs.
 * Loads from data.json and exposes a small API so any other script
 * (app.js, or a future page) can read/update the same values.
 *
 * Swap-in path for a real backend later: replace the two fetch()
 * calls in load() / save() with calls to your API, and nothing
 * else in the app has to change.
 * ---------------------------------------------------------------
 */

const DataStore = (() => {
  let state = null;
  const listeners = [];

  async function load(path = "data.json") {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    state = await res.json();
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
