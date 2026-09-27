/**
 * glass-fallback-panel.js — [임시] 크로미움 외 보기 패널
 *
 * 크롬 유리를 Safari·Firefox 처럼(굴절 없이 블러만) 보는 스위치를 누르는 확인용 패널이다.
 * 확인이 끝나면 이 파일을 지우고, glass-material.js 의 loadFallbackPanel 호출을 걷는다.
 * 스위치 자체(window.glassFallback)는 glass-material.js 에 있다.
 *
 * glass-material.js 가 주소에 ?glass-fallback 이 있거나 스위치가 켜져 있을 때 불러온다.
 */
(function () {
    "use strict";

    var fallback = window.glassFallback;
    if (!fallback || document.getElementById("glass-fallback-panel")) return;

    var style = document.createElement("style");
    style.textContent = [
        "#glass-fallback-panel { position: fixed; left: 12px; bottom: calc(12px + env(safe-area-inset-bottom)); z-index: 2147483000;",
        "  display: flex; align-items: center; gap: 10px; padding: 8px 10px 8px 12px; border-radius: 12px;",
        "  background: #fff; color: #1b232b; border: 1px solid rgb(30 42 56 / .18); box-shadow: 0 4px 16px rgb(0 0 0 / .18);",
        "  font: 600 13px/1.3 system-ui, -apple-system, 'Segoe UI', sans-serif; letter-spacing: 0; }",
        "#glass-fallback-panel label { display: flex; align-items: center; gap: 6px; margin: 0; cursor: pointer; }",
        "#glass-fallback-panel input { margin: 0; width: 16px; height: 16px; }",
        "#glass-fallback-panel button { margin: 0; padding: 4px 8px; border-radius: 8px; border: 1px solid rgb(30 42 56 / .2);",
        "  background: #f3f5f7; color: #1b232b; font: inherit; line-height: 1.2; cursor: pointer; }"
    ].join("\n");
    document.head.appendChild(style);

    var panel = document.createElement("div");
    panel.id = "glass-fallback-panel";
    panel.innerHTML =
        '<label><input type="checkbox">크로미움 외 보기 (굴절 끔)</label>' +
        '<button type="button" aria-label="패널 닫기">닫기</button>';
    document.body.appendChild(panel);

    var toggle = panel.querySelector("input");
    toggle.checked = fallback.get();
    toggle.addEventListener("change", function () { fallback.set(toggle.checked); });
    panel.querySelector("button").addEventListener("click", function () { panel.remove(); });
    document.addEventListener("glassfallbackchange", function () { toggle.checked = fallback.get(); });
})();
