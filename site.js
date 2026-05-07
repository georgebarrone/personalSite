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

    function initAmbientBackground() {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

        if (reducedMotion.matches || !finePointer.matches) {
            return;
        }

        let frameId = 0;
        let nextX = window.innerWidth / 2;
        let nextY = window.innerHeight * 0.4;

        function syncAmbientPosition() {
            frameId = 0;

            const width = Math.max(window.innerWidth, 1);
            const height = Math.max(window.innerHeight, 1);
            const xRatio = nextX / width;
            const yRatio = nextY / height;
            const edgeDistance = Math.min(xRatio, 1 - xRatio);
            const edgeStrength = 1 - Math.min(edgeDistance / 0.36, 1);

            root.style.setProperty("--ambient-x", `${nextX}px`);
            root.style.setProperty("--ambient-y", `${nextY}px`);
            root.style.setProperty("--ambient-left-y", `${nextY}px`);
            root.style.setProperty("--ambient-right-y", `${height - nextY}px`);
            root.style.setProperty("--ambient-drift-x", `${(xRatio - 0.5) * -16}px`);
            root.style.setProperty("--ambient-drift-y", `${(yRatio - 0.5) * -16}px`);
            root.style.setProperty("--ambient-opacity", `${0.48 + edgeStrength * 0.22}`);
        }

        function queueAmbientPosition(event) {
            nextX = event.clientX;
            nextY = event.clientY;

            if (!frameId) {
                frameId = window.requestAnimationFrame(syncAmbientPosition);
            }
        }

        window.addEventListener("pointermove", queueAmbientPosition, { passive: true });
        window.addEventListener("pointerleave", () => {
            nextX = window.innerWidth / 2;
            nextY = window.innerHeight * 0.4;

            if (!frameId) {
                frameId = window.requestAnimationFrame(syncAmbientPosition);
            }
        });
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
    initAmbientBackground();
})();
