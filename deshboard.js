$(document).ready(function () {
    // Live Clock
    function updateClock() {
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
        const timeStr = now.toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
        $("#live-clock").text(`${dateStr} ${timeStr}`);
    }
    if ($("#live-clock").length) {
        setInterval(updateClock, 1000);
        updateClock();
    }

    // Initialize Materialize Components
    $(".sidenav").sidenav();

    // Auto-active Sidebar Logic
    const currentPath = window.location.pathname.split("/").pop() || "deshboard.html";
    const currentParams = window.location.search;
    const fullUrl = currentPath + currentParams;

    $(".dashboard-sidenav a").each(function () {
        const linkUrl = $(this).attr("href");
        if (linkUrl === fullUrl || (linkUrl === currentPath && !currentParams)) {
            $(".dashboard-sidenav a").removeClass("active-nav");
            $(this).addClass("active-nav");
            const parentLi = $(this).closest(".collapsible-body").closest("li");
            if (parentLi.length) {
                parentLi.addClass("active");
            }
        }
    });

    $(".collapsible").collapsible();
    $(".tabs").tabs();

    let allEvents = {};

    // Load Live Event Data
    fetch("event_list.json")
        .then((response) => response.json())
        .then((data) => {
            allEvents = data.events;
            const hash = window.location.hash.replace("#", "") || "inplay";
            renderTabContent(hash);
            updateTabBadges();
        })
        .catch((err) => console.error("Error loading events:", err));

    function renderTabContent(tabId) {
        const container = $("#match-list-body");
        if (!container.length) return;

        let html = "";
        const sportNames = { 4: "CRICKET", 1: "FOOTBALL", 2: "TENNIS", 7: "HORSE RACING", 4339: "GREYHOUND", 10: "KABADDI", 11: "POLITICS" };

        let filteredEvents = [];

        if (tabId === "inplay") {
            // Collect all in-play from all sports
            Object.keys(allEvents).forEach(sportId => {
                allEvents[sportId].forEach(event => {
                    if (event.in_play) {
                        filteredEvents.push({ ...event, sportId });
                    }
                });
            });
        } else {
            const sportIdsMap = {
                cricket: "4",
                football: "1",
                tennis: "2",
                horse: "7",
                greyhound: "4339",
                kabaddi: "10",
                politics: "11"
            };
            const sId = sportIdsMap[tabId];
            if (allEvents[sId]) {
                filteredEvents = allEvents[sId].map(e => ({ ...e, sportId: sId }));
            } else if (["horse", "greyhound", "kabaddi", "politics"].includes(tabId)) {
                // Mock data for fidelity if empty
                html = `<div class="center-align" style="padding: 50px; color: #777;"><h5>No ${tabId.toUpperCase()} Events at the moment</h5></div>`;
                container.html(html);
                return;
            }
        }

        if (filteredEvents.length === 0) {
            html = `<div class="center-align" style="padding: 50px; color: #777;"><h5>No Events Available</h5></div>`;
        } else {
            // Group by sport for IN-PLAY, or just list for specific sport
            const grouped = {};
            filteredEvents.forEach(e => {
                if (!grouped[e.sportId]) grouped[e.sportId] = [];
                grouped[e.sportId].push(e);
            });

            const activeSportIds = tabId === "inplay" ? [4, 1, 2] : Object.keys(grouped);

            activeSportIds.forEach(sId => {
                if (grouped[sId]) {
                    if (tabId === "inplay") {
                        html += `<div class="sport-header">${sportNames[sId]}</div>`;
                    }
                    grouped[sId].forEach(event => {
                        const date = new Date(event.open_date);
                        const timeStr = date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + date.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" }).toUpperCase();
                        html += `
                        <div class="event-row" style="display: flex; align-items: center; padding: 6px 15px; border-bottom: 1px solid #ddd; background: #fff;">
                            <div class="event-info-left" onclick="window.location.href='multi_market.html?id=${event.id}'" style="cursor: pointer; display: flex; align-items: center; flex: 1;">
                               <i class="material-icons active">
                        lock_open
                        </i>
                                <div class="event-details" style="display: flex; flex-direction: column; margin-left: 10px;">
                                    <span class="event-time" style="font-size: 10px; color: #000; font-weight: 500;">${timeStr}</span>
                                    <span class="event-name" style="font-size: 13px; font-weight: normal; color: #000; line-height: 1.3; margin-top: 2px;">${event.name}</span>
                                    <span class="event-score" style="font-size: 12px; font-weight: bold; color: #d32f2f; margin-top: 1px;">0</span>
                                </div>
                            </div>
                            <div class="event-icons-right" style="display: flex; align-items: center; gap: 5px; margin-top: 5px;">
                                ${event.in_play ? '<div class="live-indicator"></div>' : ""}
                                <img class="right tv-active" src="https://allexchbet.com/allexchbet.com/images/tv.svg">
                                <span class="right bm-active">BM</span>
                                
                            </div>
                        </div>`;
                    });
                }
            });
        }
        container.html(html);
    }

    function updateTabBadges() {
        // Logic to update counts in tab badges
        let totalInPlay = 0;
        Object.keys(allEvents).forEach(sId => {
            allEvents[sId].forEach(e => { if (e.in_play) totalInPlay++; });
        });
        $(".tabs .tab a[href='#inplay'] .tab-badge").text(totalInPlay);
        $(".tabs .tab a[href='#cricket'] .tab-badge").text(allEvents["4"]?.length || 0);
        $(".tabs .tab a[href='#football'] .tab-badge").text(allEvents["1"]?.length || 0);
        $(".tabs .tab a[href='#tennis'] .tab-badge").text(allEvents["2"]?.length || 0);
    }

    // Tab click listener
    $(".tabs .tab a").on("click", function (e) {
        const href = $(this).attr("href");
        if (href && href.startsWith("#")) {
            const tabId = href.replace("#", "");
            renderTabContent(tabId);
        } else if (href) {
            window.location.href = href;
        }
    });

    // Match tab click listener (MARKET / LIVE)
    $(".match-tab").on("click", function () {
        $(".match-tab").removeClass("active");
        $(this).addClass("active");
    });

    // Mercury Function for dynamic announcements
    window.mercury = function (msg) {
        const ticker = $("#mercury-ticker-text");
        if (ticker.length) {
            ticker.text(msg);
            ticker.css("animation", "none");
            ticker[0].offsetHeight; // trigger reflow
            ticker.css("animation", "mercury-scroll 25s linear infinite");
        }
    };

    // Automatically start mercury on load across all pages utilizing deshboard.js
    window.mercury("Cheating of any kind such as Market Manipulation,Sniping,Court-Siding,Commission Abuse & Bets After Event Closed are not allowed on any site operating on this platform.This Site RESERVES the RIGHT to VOID the bets in QUESTION WITHOUT WARNING !");

});
