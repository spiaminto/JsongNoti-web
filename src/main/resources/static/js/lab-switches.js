/**
 * lab-switches.js — [임시 실험 스위치] 왼쪽 아래 스위치 상자
 *
 * 휴대폰에서 성능 비교용 동작을 켜고 끄는 상자다. 고른 값은 localStorage 'labSwitches'
 * ({ 클래스 이름: true })에 남고, theme-init.js 가 다음 로드의 첫 페인트 전에 html 클래스로 붙인다.
 * 바꾼 값은 새로 고침해야 온전히 적용된다 — 등장 효과는 패널마다 한 번이고, 오버스크롤 smart 는
 * glass-motion.js 가 로드 때 읽는다. 상자는 접으면 동그란 버튼이 되고, 접힘 여부는
 * localStorage 'labSwitchesMinimized' 에 남는다.
 *
 * 스위치가 붙이는 클래스는 glass.css 의 실험 스위치 절과 glass-motion.js 가 읽는다.
 */
(function () {
    "use strict";

    var SWITCH_GROUPS = [
        {
            title: "오버스크롤",
            kind: "radio",
            options: [
                { label: "켬", className: null },
                { label: "스마트", className: "overscroll-smart" },
                { label: "끔", className: "overscroll-off" }
            ]
        },
        {
            title: "캡슐 유리 재질 만들기",
            kind: "radio",
            options: [
                { label: "바로", className: null },
                { label: "로드 뒤로", className: "glass-material-late" }
            ]
        },
        {
            title: "떠오를 때 흐림",
            kind: "radio",
            options: [
                { label: "있음", className: null },
                { label: "없음", className: "entrance-no-blur" }
            ]
        },
        {
            title: "바로 나오는 스크롤 속도 (px/ms)",
            kind: "radio",
            options: [
                { label: "2", className: "reveal-speed-2" },
                { label: "4", className: null },
                { label: "6", className: "reveal-speed-6" },
                { label: "8", className: "reveal-speed-8" },
                { label: "끔", className: "reveal-motion-always" }
            ],
            speedMeter: true
        }
    ];

    var STYLE = [
        ".lab-switches{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:1040;",
        "width:280px;max-width:calc(100vw - 24px);box-sizing:border-box;padding:16px;border-radius:var(--r-panel);",
        "background:var(--panel-bg);color:var(--ink);box-shadow:var(--panel-shadow);border:1px solid rgb(128 128 128 / .25);",
        "font-size:var(--fs-md);line-height:1.4}",
        ".lab-switches-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}",
        ".lab-switches-title{font-size:var(--fs-body);font-weight:var(--fw-title)}",
        ".lab-switches-group{margin-top:12px}",
        ".lab-switches-group-title{color:var(--ink-3);font-weight:var(--fw-mid);margin-bottom:6px}",
        ".lab-switches-segments{display:flex;gap:4px;padding:4px;border-radius:var(--r-control);background:rgb(128 128 128 / .14)}",
        ".lab-switches-segments button{flex:1;height:var(--btn-h-md);border:0;border-radius:calc(var(--r-control) - 4px);",
        "background:transparent;color:var(--ink-2);font:inherit;font-weight:var(--fw-strong)}",
        ".lab-switches-segments button.is-on{background:var(--ink);color:var(--panel-bg)}",
        ".lab-switches-speed{margin-top:8px;color:var(--ink-3);font-variant-numeric:tabular-nums}",
        ".lab-switches-check{display:flex;align-items:center;gap:10px;min-height:40px;cursor:pointer}",
        ".lab-switches-check input{width:20px;height:20px;margin:0;accent-color:var(--ink)}",
        ".lab-switches-reload{width:100%;height:var(--btn-h-lg);margin-top:14px;border:0;border-radius:var(--r-capsule);",
        "background:rgb(128 128 128 / .14);color:var(--ink-3);font:inherit;font-weight:var(--fw-strong)}",
        ".lab-switches-reload.is-pending{background:var(--ink);color:var(--panel-bg)}",
        ".lab-switches-minimize{width:36px;height:36px;border:0;border-radius:50%;background:rgb(128 128 128 / .14);",
        "color:var(--ink-2);font:inherit;font-size:var(--fs-lg);line-height:1}",
        ".lab-switches.is-minimized{width:52px;height:52px;padding:0;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer}",
        ".lab-switches.is-minimized > :not(.lab-switches-icon){display:none}",
        ".lab-switches-icon{display:none;position:relative;color:var(--ink-2)}",
        ".lab-switches.is-minimized .lab-switches-icon{display:block}",
        ".lab-switches-icon.has-active::after{content:'';position:absolute;top:-3px;right:-5px;width:8px;height:8px;",
        "border-radius:50%;background:var(--ink)}"
    ].join("");

    var SLIDERS_ICON =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
        '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>' +
        '<circle cx="9" cy="6" r="2.2" fill="var(--panel-bg)"/><circle cx="15" cy="12" r="2.2" fill="var(--panel-bg)"/>' +
        '<circle cx="7" cy="18" r="2.2" fill="var(--panel-bg)"/></svg>';

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    function readStorage(key, fallback) {
        try {
            var value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch (ignored) {
            return fallback;
        }
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (ignored) {
            // 저장소 접근이 막힌 환경은 이번 로드에서만 바뀐다
        }
    }

    // 스크롤 한 번(멈춤 사이)의 가장 빠른 속도를 보여 준다. 속도는 glass-motion.js 가 잰 값을 읽는다
    function createSpeedMeter() {
        var SCROLL_GESTURE_GAP_MS = 400;
        var meter = document.createElement("div");
        meter.className = "lab-switches-speed";
        meter.textContent = "이번 스크롤 최고 속도: -";
        var peakSpeed = 0, lastScrollAt = 0, meterQueued = false;
        window.addEventListener("scroll", function () {
            var now = performance.now();
            if (now - lastScrollAt > SCROLL_GESTURE_GAP_MS) peakSpeed = 0;
            lastScrollAt = now;
            if (meterQueued) return;
            meterQueued = true;
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    meterQueued = false;
                    if (!window.glassMotion || !window.glassMotion.currentScrollSpeed) return;
                    var speed = window.glassMotion.currentScrollSpeed();
                    if (speed <= peakSpeed) return;
                    peakSpeed = speed;
                    meter.textContent = "이번 스크롤 최고 속도: " + peakSpeed.toFixed(1);
                });
            });
        }, { passive: true });
        return meter;
    }

    function init() {
        var savedSwitches = readStorage("labSwitches", {});
        var switches = {};
        Object.keys(savedSwitches).forEach(function (className) {
            if (savedSwitches[className]) switches[className] = true;
        });
        var loadedState = JSON.stringify(switches);

        var style = document.createElement("style");
        style.textContent = STYLE;
        document.head.appendChild(style);

        var box = document.createElement("div");
        box.className = "lab-switches";

        var icon = document.createElement("span");
        icon.className = "lab-switches-icon";
        icon.innerHTML = SLIDERS_ICON;
        box.appendChild(icon);

        var head = document.createElement("div");
        head.className = "lab-switches-head";
        var title = document.createElement("span");
        title.className = "lab-switches-title";
        title.textContent = "실험 스위치";
        var minimizeButton = document.createElement("button");
        minimizeButton.type = "button";
        minimizeButton.className = "lab-switches-minimize";
        minimizeButton.setAttribute("aria-label", "스위치 상자 접기");
        minimizeButton.textContent = "–";
        head.appendChild(title);
        head.appendChild(minimizeButton);
        box.appendChild(head);

        var reloadButton = document.createElement("button");
        reloadButton.type = "button";
        reloadButton.className = "lab-switches-reload";
        reloadButton.textContent = "새로 고침";
        reloadButton.addEventListener("click", function () {
            location.reload();
        });

        var refreshers = [];
        var refreshAll = function () {
            refreshers.forEach(function (refresh) { refresh(); });
            var pending = JSON.stringify(switches) !== loadedState;
            reloadButton.classList.toggle("is-pending", pending);
            reloadButton.textContent = pending ? "새로 고침해서 적용" : "새로 고침";
            icon.classList.toggle("has-active", Object.keys(switches).length > 0);
        };
        var setSwitch = function (className, on) {
            if (on) switches[className] = true;
            else delete switches[className];
            document.documentElement.classList.toggle(className, on);
            writeStorage("labSwitches", switches);
        };

        SWITCH_GROUPS.forEach(function (group) {
            var section = document.createElement("div");
            section.className = "lab-switches-group";
            var groupTitle = document.createElement("div");
            groupTitle.className = "lab-switches-group-title";
            groupTitle.textContent = group.title;
            section.appendChild(groupTitle);

            if (group.kind === "radio") {
                var segments = document.createElement("div");
                segments.className = "lab-switches-segments";
                group.options.forEach(function (option) {
                    var button = document.createElement("button");
                    button.type = "button";
                    button.textContent = option.label;
                    button.addEventListener("click", function () {
                        group.options.forEach(function (other) {
                            if (other.className) setSwitch(other.className, other === option);
                        });
                        refreshAll();
                    });
                    refreshers.push(function () {
                        var on = option.className
                            ? !!switches[option.className]
                            : group.options.every(function (other) { return !other.className || !switches[other.className]; });
                        button.classList.toggle("is-on", on);
                    });
                    segments.appendChild(button);
                });
                section.appendChild(segments);
                if (group.speedMeter) section.appendChild(createSpeedMeter());
            } else {
                group.options.forEach(function (option) {
                    var label = document.createElement("label");
                    label.className = "lab-switches-check";
                    var checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.addEventListener("change", function () {
                        setSwitch(option.className, checkbox.checked);
                        refreshAll();
                    });
                    refreshers.push(function () {
                        checkbox.checked = !!switches[option.className];
                    });
                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(option.label));
                    section.appendChild(label);
                });
            }
            box.appendChild(section);
        });
        box.appendChild(reloadButton);

        var setMinimized = function (minimized) {
            box.classList.toggle("is-minimized", minimized);
            box.setAttribute("role", minimized ? "button" : "group");
            box.setAttribute("aria-label", minimized ? "실험 스위치 펼치기" : "실험 스위치");
            writeStorage("labSwitchesMinimized", minimized);
        };
        minimizeButton.addEventListener("click", function (event) {
            event.stopPropagation();
            setMinimized(true);
        });
        box.addEventListener("click", function () {
            if (box.classList.contains("is-minimized")) setMinimized(false);
        });

        setMinimized(readStorage("labSwitchesMinimized", false) === true);
        refreshAll();
        document.body.appendChild(box);
    }
})();
