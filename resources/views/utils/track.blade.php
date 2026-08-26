(function () {
    const pathsToTrack = @json($paths);
    const selectorsToTrack = @json($selectors);
    const breakdownID = "{{ $breakdownId }}";
    const endpoint = "{{ config('app.url') }}/free/track";

    // Set session cookie x-Breakdown-ID
    document.cookie = `X-Breakdown-ID=${breakdownID}; path=/; max-age=2592000`;
    try {
        localStorage.setItem("atalaya_breakdown_id", breakdownID);
        const urlParams = new URLSearchParams(window.location.search);
        const utms = {
            utm_source: urlParams.get("utm_source") || "",
            utm_medium: urlParams.get("utm_medium") || "",
            utm_campaign: urlParams.get("utm_campaign") || "",
            utm_term: urlParams.get("utm_term") || "",
            utm_content: urlParams.get("utm_content") || "",
            page_url: window.location.href,
            referrer: document.referrer || ""
        };
        if (utms.utm_source || utms.utm_campaign || utms.utm_medium) {
            localStorage.setItem("atalaya_utms", JSON.stringify(utms));
        }
    } catch(e){}

    function sendTracking(payload) {
        fetch(endpoint, {
            method: "POST",
            headers: {
                "X-Breakdown-ID": breakdownID,
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