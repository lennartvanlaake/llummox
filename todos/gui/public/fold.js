(() => {
  const KEY = "todos:fold";

  const read = () => {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || "{}");
    } catch {
      return {};
    }
  };

  const write = (state) => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable (private mode); folding still works.
    }
  };

  const restore = () => {
    const state = read();
    document.querySelectorAll("details[data-fold]").forEach((el) => {
      const key = el.dataset.fold;
      if (key && Object.prototype.hasOwnProperty.call(state, key)) {
        el.open = Boolean(state[key]);
      }
    });
  };

  document.addEventListener(
    "toggle",
    (event) => {
      const el = event.target;
      if (!(el instanceof HTMLDetailsElement) || !el.dataset.fold) return;
      const state = read();
      state[el.dataset.fold] = el.open;
      write(state);
    },
    true,
  );

  document.addEventListener("htmx:afterSwap", restore);
  restore();
})();
