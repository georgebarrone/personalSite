(() => {
    const root = document.documentElement;
    const views = Array.from(document.querySelectorAll("[data-view]"));
    const tabs = Array.from(document.querySelectorAll("[data-view-target]"));
    const themeToggle = document.querySelector("[data-theme-toggle]");
    const themeLabel = document.querySelector("[data-theme-label]");
    const validViews = new Set(views.map((view) => view.dataset.view));
    const themeKey = "gb-theme";

    function getRequestedView() {
        const hashView = window.location.hash.replace("#", "");
        if (validViews.has(hashView)) {
            return hashView;
        }

        const fileName = window.location.pathname.split("/").pop();
        if (fileName === "personal.html") {
            return "personal";
        }

        return document.body.dataset.initialView || "home";
    }

    function getCanonicalUrl(view) {
        const path = window.location.pathname.replace(/personal\.html$/, "index.html");
        const search = window.location.search;
        return view === "personal" ? `${path}${search}#personal` : `${path}${search}`;
    }

    function setView(view, shouldUpdateHistory = false) {
        const nextView = validViews.has(view) ? view : "home";

        views.forEach((panel) => {
            const isActive = panel.dataset.view === nextView;
            panel.hidden = !isActive;
            panel.classList.toggle("is-active", isActive);
        });

        tabs.forEach((tab) => {
            const isActive = tab.dataset.viewTarget === nextView;
            tab.setAttribute("aria-selected", String(isActive));
            tab.tabIndex = isActive ? 0 : -1;
        });

        document.title = nextView === "personal"
            ? "George Barrone - Personal About Me"
            : "George Barrone - Developer & Engineer";

        if (shouldUpdateHistory) {
            try {
                window.history.pushState({ view: nextView }, "", getCanonicalUrl(nextView));
            } catch {
                // Some local previews reject URL updates; the view has already switched.
            }
        }
    }

    function getStoredTheme() {
        try {
            const storedTheme = window.localStorage.getItem(themeKey);
            return storedTheme === "dark" ? "dark" : "light";
        } catch {
            return "light";
        }
    }

    function syncThemeUi(theme) {
        if (!themeToggle || !themeLabel) {
            return;
        }

        const isDark = theme === "dark";
        themeToggle.setAttribute("aria-pressed", String(isDark));
        themeToggle.setAttribute("aria-label", isDark ? "Activate light mode" : "Activate dark mode");
        themeLabel.textContent = isDark ? "Dark" : "Light";
    }

    function setTheme(theme) {
        const nextTheme = theme === "dark" ? "dark" : "light";
        root.dataset.theme = nextTheme;
        syncThemeUi(nextTheme);

        try {
            window.localStorage.setItem(themeKey, nextTheme);
        } catch {
            // Ignore storage access issues; the current session theme is still applied.
        }
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => {
            setView(tab.dataset.viewTarget, true);
        });

        tab.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                return;
            }

            event.preventDefault();
            const direction = event.key === "ArrowRight" ? 1 : -1;
            const nextIndex = (index + direction + tabs.length) % tabs.length;
            tabs[nextIndex].focus();
            setView(tabs[nextIndex].dataset.viewTarget, true);
        });
    });

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            setTheme(root.dataset.theme === "dark" ? "light" : "dark");
        });
    }

    window.addEventListener("popstate", () => {
        setView(getRequestedView());
    });

    setTheme(getStoredTheme());
    setView(getRequestedView());
})();
