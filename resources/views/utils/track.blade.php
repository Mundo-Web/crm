(function () {
    const pathsToTrack = @json($paths);
    const selectorsToTrack = @json($selectors);
    const endpoint = "{{ config('app.url') }}/free/track";

    function sendTracking(payload) {
        fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
            keepalive: true // útil si el usuario abandona la página
        }).catch(() => { });
    }

    // =========================
    // TRACK PAGE VISIT
    // =========================
    const currentPath = window.location.pathname;

    if (pathsToTrack.includes(currentPath)) {
        sendTracking({
            type: "page_view",
            path: currentPath,
            url: window.location.href,
            referrer: document.referrer,
            timestamp: Date.now()
        });
    }

    // =========================
    // TRACK CLICKS
    // =========================
    if (selectorsToTrack.length > 0) {
        document.addEventListener("click", function (e) {
            for (let selector of selectorsToTrack) {
                const matchedElement = e.target.closest(selector);
                if (matchedElement) {
                    sendTracking({
                        type: "click",
                        selector: selector,
                        path: window.location.pathname,
                        text: matchedElement.innerText?.trim().slice(0, 100),
                        timestamp: Date.now()
                    });
                    break; // evita doble envío si coincide con varios
                }
            }
        });
    }

})();