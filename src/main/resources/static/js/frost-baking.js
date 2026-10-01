/**
 * frost-baking.js — 콘텐츠 패널(.content-panel)의 프로스트 굽기 (ADR 0002)
 * 기준: docs/_temp/ui-overhaul-3.md 10번 원칙(P10), 용어는 docs/with-ai/CONTEXT.md
 *
 * 콘텐츠 패널은 실시간 유리가 아니라 불투명 패널이다(ADR 0001). 유리처럼 보이는
 * 재질감은 패널 뒤에 있는 배경(사진 + 햇살 + 보케)을 패널 자리에 맞춰 canvas 에
 * 그리고 한 번 흐린 "구운 그림"이 맡는다. 구운 그림은 JPEG data URL 로 패널의
 * background-image 에 깔리고(glass.css .content-panel), 그 위를 덮개색
 * (--panel-frost-cover)이 한 겹 덮어 글자 대비를 지킨다.
 *
 * 흐름:
 *  1) 사진(.photo-bg::before 의 url) 로드를 기다린다 — 로드 전·실패 시 패널은 바탕색만
 *  2) 패널마다 패널 둘레 여유(BAKE_PADDING)까지 넓힌 canvas 에 문서 좌표로 그린다:
 *     사진(cover, 타원 마스크, 아래쪽 페이드) → 바탕색 → 햇살(cream 만) → 보케
 *  3) 여유를 잘라 패널 크기로 만들고 --panel-frost-image / --panel-frost-size 로 준다
 *  4) 크기가 바뀐 패널만 디바운스해 다시 굽고(ResizeObserver), 창 크기·테마가
 *     바뀌면 전부 다시 굽는다 (colorthemechange, common-handlers.js)
 *  5) 높이 전환(컬랩스 펼침·검색 더보기)은 시작할 때 목표 높이로 미리 굽는다 —
 *     그림은 자연 크기라 전환 중 패널이 그림보다 커지면 아래에 바탕색 띠가 생기고,
 *     끝난 뒤 다시 구우면 보케가 갑자기 드러난다(4기 1턴). 전환이 끝났을 때
 *     크기가 미리 구운 것과 같으면 다시 굽지 않는다. Bootstrap collapse 는
 *     show.bs.collapse 로 알고, 검색 더보기(song-search.js)는 window.frostBaking
 *     .prebakePanelAtHeight 로 알려 준다
 *  6) 그림 교체는 페이드다(4기 2턴) — background-image 는 전환이 안 되므로 본 배경은
 *     새 그림으로 바로 바꾸고, 옛 그림을 패널의 ::before(glass.css .frost-crossfade)에
 *     옛 크기만큼 얹어 opacity 1→0 으로 걷는다. 옛 그림 밖은 투명이라 패널이 자라는
 *     동안 새 그림이 바로 비친다(바탕색 띠 없음). 미리 굽기·다시 굽기 어느 경로든 여기를 지난다.
 *     옛 그림이 새 그림보다 짧을 때(패널이 자랄 때)만 옛 그림 층의 아랫변을 마스크로 흐린다 —
 *     같은 크기 교체에 마스크를 두면 패널이 위아래로 갈라져 보인다(4기 4턴)
 *  7) 테마 전환은 페이드가 아니라 즉시 교체다(4기 4턴) — 토글(common-handlers.js)이 View
 *     Transition 안에서 colorthemechange(synchronous) 를 보내면 그 자리에서 전부 굽고,
 *     페이지 전체 스냅샷의 크로스페이드가 토큰 전환과 프로스트 교체를 한 동작으로 보여 준다
 *
 * 배경 규칙(사진 마스크·페이드·필터, 햇살 각도, 보케 그라디언트)은 glass.css 의
 * .photo-bg / .ray / .bokeh 와 여기 두 곳에 있다 — 한쪽을 바꾸면 다른 쪽도 맞춘다.
 * 좌표는 전부 문서 css px → 캔버스 px 로 손수 변환한다 (ctx.filter 의 px 해석을
 * 캔버스 변환에 맡기지 않는다).
 */
(function () {
    "use strict";

    var PANEL_SELECTOR = ".content-panel";
    var BAKE_SCALE = 0.5;          // 굽기 해상도: css px 의 절반 (DPR 무시 — 흐린 그림이라 티가 나지 않는다)
    var BAKE_PADDING = 24;         // 패널 둘레 여유 px: 블러가 가장자리에서 어둡게 번지지 않게 넓게 굽고 잘라낸다
    var RAY_GAIN = 0.8;            // 햇살 알파 배율
    var BOKEH_GAIN = 2.6;          // 보케 알파 배율: 덮개(--panel-frost-cover)를 뚫고 보이도록 키운다
    var BOKEH_BLUR = 6;            // glass.css .bokeh i 의 blur(6px)
    var RAY_ANGLE = 32 * Math.PI / 180; // glass.css .ray 의 rotate(32deg)
    var JPEG_QUALITY = 0.85;
    var REBAKE_DEBOUNCE_MS = 100; // 전환 중엔 프레임마다 밀리므로 끝난 뒤 한 번만 굽는다
    var HEIGHT_TOLERANCE = 24;    // 미리 굽는 목표 높이의 여유 px — 컬랩스 scrollHeight 는 끝 높이와 어긋난다(1280px 6px, 1400px 11px 실측). 여유가 모자라면 끝에서 다시 굽는다
    var CROSSFADE_MS = 400;       // glass.css @keyframes frost-crossfade-out 과 같은 값

    // 사진 처리: 라이트는 애플 재질 값(blur 20px, 채도 180%), 다크는 glass.css .photo-bg::before 의 filter 에 블러를 더한 값.
    // 패널 바탕색은 --panel-bg 와 같은 값
    var THEME = {
        light: { base: "rgb(255 255 255)", filter: "blur(20px) saturate(1.8)" },
        dark: { base: "rgb(27 36 48)", filter: "blur(14px) saturate(.75) brightness(.62) contrast(1.05)" }
    };

    var photoElement = null;
    var photoImage = null;         // 로드가 끝난 사진 (없으면 아직 못 굽는다)
    var panels = [];
    var lastBakedSizes = new WeakMap(); // 패널 → 마지막으로 구운 { width, height, theme }
    var crossfadeTimers = new WeakMap(); // 패널 → 진행 중인 페이드의 타이머
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    function init() {
        photoElement = document.querySelector(".photo-bg");
        panels = Array.prototype.slice.call(document.querySelectorAll(PANEL_SELECTOR));
        if (!photoElement || !panels.length) return;

        // [임시 비교 스위치] ?frost=off 는 굽지 않은 바탕색 패널, ?frost=clear 는 바탕색 없이 덮개색만 얹은 패널,
        // ?frost=mix 는 히어로만 backdrop-filter 이고 나머지는 clear, 라이트 덮개 .75
        var frostMode = new URLSearchParams(location.search).get("frost");
        if (frostMode === "off") return;
        if (frostMode === "clear") {
            panels.forEach(function (panel) { panel.style.backgroundColor = "transparent"; });
            return;
        }
        if (frostMode === "mix") {
            var mixStyle = document.createElement("style");
            mixStyle.textContent =
                ".content-panel { background-color: transparent; }" +
                "html:not([data-theme='dark']) .content-panel { --panel-frost-cover: rgb(255 255 255 / .75); }" +
                ".hero.content-panel { -webkit-backdrop-filter: blur(20px) saturate(1.8); backdrop-filter: blur(20px) saturate(1.8); }" +
                "html[data-theme='dark'] .hero.content-panel { -webkit-backdrop-filter: blur(20px) saturate(.75); backdrop-filter: blur(20px) saturate(.75); }";
            document.head.appendChild(mixStyle);
            return;
        }

        loadPhoto(function () {
            bakePanels(panels);
        });

        // 크기가 바뀐 패널만 다시 굽는다 — 검색 결과 펼침·접힘 끝에 패널 전부를 굽지 않도록
        var resizeObserver = new ResizeObserver(function (entries) {
            scheduleFrostRebake(entries.map(function (entry) { return entry.target; }));
        });
        panels.forEach(function (panel) { resizeObserver.observe(panel); });

        // 창 크기가 바뀌면 사진 상자(105vh)·보케 산포가 함께 바뀌므로 전부
        window.addEventListener("resize", function () { scheduleFrostRebake(); });

        // 테마가 바뀌면 사진 처리·바탕색이 달라지므로 전부 (푸터 토글, common-handlers.js)
        document.addEventListener("colorthemechange", function (event) {
            if (event.detail && event.detail.synchronous) {
                // View Transition 콜백 안(common-handlers.js): 새 스냅샷에 새 프로스트가 들어가야
                // 하므로 디바운스 없이 지금, 페이드 없이 즉시 (index 패널 11장 75~150ms 실측)
                clearTimeout(rebakeTimer);
                dirtyPanels.clear();
                rebakeAll = false;
                loadPhoto(function () { bakePanels(panels, { force: true, instant: true }); });
            } else {
                scheduleFrostRebake();
            }
        });

        // Bootstrap collapse 펼침: 전환이 시작된 다음 프레임에 목표 높이를 재서 미리 굽는다
        // (컬랩스 요소의 scrollHeight 가 펼쳐진 내용 높이). 접힘은 그림이 잘리기만 하므로 그대로
        document.addEventListener("show.bs.collapse", function (event) {
            var collapseElement = event.target;
            var panel = collapseElement.closest(PANEL_SELECTOR);
            if (!panel) return;
            requestAnimationFrame(function () {
                var targetHeight = panel.offsetHeight - collapseElement.offsetHeight + collapseElement.scrollHeight;
                prebakePanelAtHeight(panel, targetHeight);
            });
        });

        window.frostBaking = { prebakePanelAtHeight: prebakePanelAtHeight };
    }

    // 높이 전환을 시작하는 쪽이 목표 높이를 알려 주면 그 높이로 지금 굽는다
    function prebakePanelAtHeight(panel, targetHeight) {
        if (!panel || !targetHeight) return;
        // 여유만큼 더 굽는다 — 그림이 패널보다 길면 잘리기만 하고, 짧으면 바탕색 띠가 보인다
        loadPhoto(function () { bakePanels([panel], { heightOverride: Math.ceil(targetHeight) + HEIGHT_TOLERANCE }); });
    }

    // 사진 url 은 CSS(.photo-bg::before)가 원본이다 — 여기서 경로를 따로 두지 않는다.
    // 브라우저가 배경으로 이미 받는 중이라 두 번 내려받지는 않는다
    function loadPhoto(onLoaded) {
        if (photoImage) { onLoaded(); return; }
        var backgroundImage = getComputedStyle(photoElement, "::before").backgroundImage;
        var match = backgroundImage.match(/url\("?([^")]+)"?\)/);
        if (!match) return;
        var image = new Image();
        image.onload = function () { photoImage = image; onLoaded(); };
        image.onerror = function () { /* 폴백: 패널은 바탕색만 */ };
        image.src = match[1];
    }

    // ---------- 다시 굽기 예약 ----------
    var rebakeTimer = null;
    var dirtyPanels = new Set();
    var rebakeAll = false;

    // 패널 단위 예약(ResizeObserver)은 크기가 마지막 굽기와 같으면 건너뛰고,
    // 전부 예약(창 크기·테마)은 무조건 굽는다
    function scheduleFrostRebake(changedPanels) {
        if (changedPanels) {
            changedPanels.forEach(function (panel) { dirtyPanels.add(panel); });
        } else {
            rebakeAll = true;
        }
        clearTimeout(rebakeTimer);
        rebakeTimer = setTimeout(function () {
            var targets = rebakeAll ? panels : Array.from(dirtyPanels);
            var force = rebakeAll;
            dirtyPanels.clear();
            rebakeAll = false;
            loadPhoto(function () { bakePanels(targets, { force: force }); });
        }, REBAKE_DEBOUNCE_MS);
    }

    function bakePanels(targets, options) {
        options = options || {};
        // 사진이 꺼진 상태(고대비 등)면 굽지 않는다
        if (getComputedStyle(photoElement).display === "none") return;
        var themeName = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
        var theme = THEME[themeName];
        var scene = collectScene();
        targets.forEach(function (panel) {
            var height = options.heightOverride || panel.offsetHeight;
            var last = lastBakedSizes.get(panel);
            if (!options.force && !options.heightOverride && last && last.theme === themeName &&
                last.width === panel.offsetWidth && height <= last.height && height >= last.height - HEIGHT_TOLERANCE * 2) {
                return; // 미리 구운 크기 안 — 다시 구우면 보케가 갑자기 바뀐다
            }
            bakeFrostForPanel(panel, theme, scene, options.heightOverride, options.instant);
            lastBakedSizes.set(panel, { width: panel.offsetWidth, height: height, theme: themeName });
        });
    }

    // ---------- 좌표 ----------
    // 문서 좌표 사각형. getBoundingClientRect 대신 offset 체인을 쓴다 — 로드 시퀀스
    // (.veil translateY)나 리빌 중인 패널은 transform 이 걸려 있어 보이는 자리가
    // 레이아웃 자리와 다르다. 구운 그림은 레이아웃 자리에 맞아야 한다
    function layoutRect(element) {
        var left = 0, top = 0, node = element;
        while (node) {
            left += node.offsetLeft;
            top += node.offsetTop;
            node = node.offsetParent;
        }
        return { left: left, top: top, width: element.offsetWidth, height: element.offsetHeight };
    }

    // 패널마다 다시 재지 않도록 배경 요소(사진 상자·햇살·보케)의 자리는 한 번만 모은다
    function collectScene() {
        var scene = { photo: layoutRect(photoElement), rays: [], bokehGroups: [] };

        var sky = document.querySelector(".sky");
        if (sky && getComputedStyle(sky).display !== "none") { // dark 는 햇살 없음 (glass.css)
            var skyRect = layoutRect(sky);
            var sunColor = (getComputedStyle(document.documentElement).getPropertyValue("--sun") || "255 240 205").trim();
            scene.sky = skyRect;
            sky.querySelectorAll(".ray").forEach(function (ray) {
                var style = getComputedStyle(ray);
                // 떠오름 애니메이션(ray-in) 중이어도 다 뜬 모습(불투명도 --a)으로 굽는다
                var alpha = (parseFloat(style.getPropertyValue("--a")) || 0) * RAY_GAIN;
                if (!alpha) return;
                scene.rays.push({
                    left: skyRect.left + parseFloat(style.left),
                    top: skyRect.top + parseFloat(style.top),
                    width: parseFloat(style.width),
                    height: parseFloat(style.height),
                    blur: parseFloat(style.getPropertyValue("--b")) || 12,
                    alpha: alpha,
                    color: sunColor
                });
            });
        }

        document.querySelectorAll(".bokeh").forEach(function (group) {
            var groupRect = layoutRect(group);
            var dots = [];
            group.querySelectorAll("i").forEach(function (dot) {
                var style = getComputedStyle(dot);
                var size = parseFloat(style.width);
                var opacity = parseFloat(style.getPropertyValue("--o")) || 0;
                if (!size || !opacity) return;
                dots.push({
                    centerX: groupRect.left + parseFloat(style.left) + size / 2,
                    centerY: groupRect.top + parseFloat(style.top) + size / 2,
                    radius: size / 2,
                    alpha: Math.min(1, opacity * BOKEH_GAIN),
                    color: (style.getPropertyValue("--c") || "255 255 255").trim()
                });
            });
            scene.bokehGroups.push({ rect: groupRect, dots: dots });
        });
        return scene;
    }

    // ---------- 굽기 ----------
    // heightOverride: 높이 전환의 목표 높이 (전환 시작 때 미리 굽는 용도)
    // instant: 페이드 없이 즉시 교체 (테마 전환 — View Transition 이 전환을 맡는다)
    function bakeFrostForPanel(panel, theme, scene, heightOverride, instant) {
        var panelRect = layoutRect(panel);
        if (heightOverride) panelRect.height = heightOverride;
        if (!panelRect.width || !panelRect.height) return;

        // 여유를 포함한 굽기 영역(문서 좌표)과 캔버스 변환
        var originX = panelRect.left - BAKE_PADDING;
        var originY = panelRect.top - BAKE_PADDING;
        var areaWidth = panelRect.width + BAKE_PADDING * 2;
        var areaHeight = panelRect.height + BAKE_PADDING * 2;
        var canvasWidth = Math.round(areaWidth * BAKE_SCALE);
        var canvasHeight = Math.round(areaHeight * BAKE_SCALE);
        var toX = function (x) { return (x - originX) * BAKE_SCALE; };
        var toY = function (y) { return (y - originY) * BAKE_SCALE; };
        var toLength = function (length) { return length * BAKE_SCALE; };
        var withAlpha = function (rgb, alpha) { return rgb.replace(")", " / " + alpha + ")"); };

        var canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        var ctx = canvas.getContext("2d");
        var photo = scene.photo;

        // 1) 사진: 사진 상자에 cover 로 놓고 상자로 클립, 흐림·색 처리는 여기서 한 번
        var coverScale = Math.max(photo.width / photoImage.naturalWidth, photo.height / photoImage.naturalHeight);
        var drawWidth = photoImage.naturalWidth * coverScale;
        var drawHeight = photoImage.naturalHeight * coverScale;
        ctx.save();
        ctx.beginPath();
        ctx.rect(toX(photo.left), toY(photo.top), toLength(photo.width), toLength(photo.height));
        ctx.clip();
        ctx.filter = theme.filter;
        ctx.drawImage(photoImage,
            toX(photo.left + (photo.width - drawWidth) / 2), toY(photo.top + (photo.height - drawHeight) / 2),
            toLength(drawWidth), toLength(drawHeight));
        ctx.filter = "none";
        ctx.restore();

        // 2) 타원 마스크 — glass.css .photo-bg::before 의
        //    radial-gradient(115% 72% at 50% 30%, #000 40%, transparent 88%)
        ctx.globalCompositeOperation = "destination-in";
        ctx.save();
        ctx.translate(toX(photo.left + photo.width * .5), toY(photo.top + photo.height * .3));
        ctx.scale(toLength(photo.width * 1.15), toLength(photo.height * .72));
        var mask = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        mask.addColorStop(.40, "rgba(0,0,0,1)");
        mask.addColorStop(.88, "rgba(0,0,0,0)");
        ctx.fillStyle = mask;
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();

        // 3) 바탕색을 사진 뒤에 — JPEG 는 투명을 검정으로 바꾸므로 먼저 채운다
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = theme.base;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 4) 사진 아래쪽 페이드 → 바탕색 (glass.css .photo-bg::after 대체: 사진이 끝나는
        //    곳이 패널 바탕색이 되어야 패널과 배경이 이어진다)
        ctx.globalCompositeOperation = "source-over";
        var fade = ctx.createLinearGradient(0, toY(photo.top + photo.height * .55), 0, toY(photo.top + photo.height * .96));
        fade.addColorStop(0, withAlpha(theme.base, 0));
        fade.addColorStop(1, theme.base);
        ctx.fillStyle = fade;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 5) 햇살 (glass.css .ray): 하늘 상자로 클립, 막대는 위 가운데를 축으로 32° 기울인다
        if (scene.sky && scene.rays.length) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(toX(scene.sky.left), toY(scene.sky.top), toLength(scene.sky.width), toLength(scene.sky.height));
            ctx.clip();
            scene.rays.forEach(function (ray) {
                ctx.save();
                ctx.translate(toX(ray.left + ray.width / 2), toY(ray.top));
                ctx.rotate(RAY_ANGLE);
                ctx.filter = "blur(" + toLength(ray.blur) + "px)";
                var gradient = ctx.createLinearGradient(0, 0, 0, toLength(ray.height));
                gradient.addColorStop(0, "rgb(" + ray.color + " / 0)");
                gradient.addColorStop(.22, "rgb(" + ray.color + " / " + ray.alpha + ")");
                gradient.addColorStop(.55, "rgb(" + ray.color + " / " + (ray.alpha * .55) + ")");
                gradient.addColorStop(.88, "rgb(" + ray.color + " / 0)");
                ctx.fillStyle = gradient;
                ctx.fillRect(toLength(-ray.width / 2), 0, toLength(ray.width), toLength(ray.height));
                ctx.restore();
            });
            ctx.restore();
        }

        // 6) 보케 (glass.css .bokeh i): 그룹 상자로 클립. 굽기 영역에 걸치는 점만
        scene.bokehGroups.forEach(function (group) {
            var rect = group.rect;
            if (rect.top > originY + areaHeight || rect.top + rect.height < originY) return;
            ctx.save();
            ctx.beginPath();
            ctx.rect(toX(rect.left), toY(rect.top), toLength(rect.width), toLength(rect.height));
            ctx.clip();
            ctx.filter = "blur(" + toLength(BOKEH_BLUR) + "px)";
            group.dots.forEach(function (dot) {
                if (dot.centerX + dot.radius < originX || dot.centerX - dot.radius > originX + areaWidth ||
                    dot.centerY + dot.radius < originY || dot.centerY - dot.radius > originY + areaHeight) return;
                var gradient = ctx.createRadialGradient(toX(dot.centerX), toY(dot.centerY), 0, toX(dot.centerX), toY(dot.centerY), toLength(dot.radius));
                gradient.addColorStop(0, "rgb(" + dot.color + " / " + dot.alpha + ")");
                gradient.addColorStop(.68, "rgb(" + dot.color + " / 0)");
                gradient.addColorStop(1, "rgb(" + dot.color + " / 0)");
                ctx.fillStyle = gradient;
                ctx.fillRect(toX(dot.centerX - dot.radius), toY(dot.centerY - dot.radius), toLength(dot.radius * 2), toLength(dot.radius * 2));
            });
            ctx.filter = "none";
            ctx.restore();
        });

        // 7) 여유를 잘라 패널 크기로
        var cropped = document.createElement("canvas");
        cropped.width = Math.max(1, Math.round(panelRect.width * BAKE_SCALE));
        cropped.height = Math.max(1, Math.round(panelRect.height * BAKE_SCALE));
        cropped.getContext("2d").drawImage(canvas, -toLength(BAKE_PADDING), -toLength(BAKE_PADDING));

        // 자연 크기로 깐다 — 높이 전환 중 그림이 늘어나지 않고 잘리기만 한다
        applyFrostImage(panel, "url(" + cropped.toDataURL("image/jpeg", JPEG_QUALITY) + ")",
            panelRect.width + "px " + panelRect.height + "px", instant);
    }

    // ---------- 적용: 페이드 교체 ----------
    // 본 배경은 언제나 새 그림을 바로 갖는다(전환 중 패널이 자라도 바탕색 띠가 없다).
    // 첫 그림(바탕색 패널 → 프로스트)·모션 최소화·즉시 교체(instant)는 그것으로 끝이고,
    // 그 뒤 교체는 옛 그림을 ::before 에 옛 크기만큼 얹어 사라지게 한다
    function applyFrostImage(panel, imageValue, sizeValue, instant) {
        var previousImage = panel.style.getPropertyValue("--panel-frost-image");
        var previousSize = panel.style.getPropertyValue("--panel-frost-size");
        panel.style.setProperty("--panel-frost-image", imageValue);
        panel.style.setProperty("--panel-frost-size", sizeValue);
        if (!previousImage || reducedMotion || instant) {
            if (crossfadeTimers.has(panel)) endCrossfade(panel); // 걷던 옛 그림이 남지 않게
            return;
        }
        if (crossfadeTimers.has(panel)) {
            // 페이드 중에 또 구웠다: 걷던 그림은 버리고 방금까지의 본 그림부터 새로 걷는다
            // (클래스를 뗐다 다시 붙이므로 리플로 한 번으로 애니메이션을 재시작시킨다)
            endCrossfade(panel);
            void panel.offsetWidth;
        }
        panel.style.setProperty("--panel-frost-image-prev", previousImage);
        panel.style.setProperty("--panel-frost-size-prev", previousSize);
        // 층 높이 = 옛 그림 높이. 옛 그림이 더 짧을 때(패널이 자랄 때)만 아랫변을 마스크로 흐린다 (glass.css)
        var previousHeight = parseFloat(previousSize.split(" ")[1]);
        var nextHeight = parseFloat(sizeValue.split(" ")[1]);
        panel.style.setProperty("--panel-frost-height-prev", previousHeight + "px");
        panel.classList.add("frost-crossfade");
        panel.classList.toggle("frost-crossfade-feather", previousHeight < nextHeight);
        crossfadeTimers.set(panel, setTimeout(function () { endCrossfade(panel); }, CROSSFADE_MS + 50));
    }

    function endCrossfade(panel) {
        clearTimeout(crossfadeTimers.get(panel));
        crossfadeTimers.delete(panel);
        panel.classList.remove("frost-crossfade");
        panel.classList.remove("frost-crossfade-feather");
        panel.style.removeProperty("--panel-frost-image-prev");
        panel.style.removeProperty("--panel-frost-size-prev");
        panel.style.removeProperty("--panel-frost-height-prev");
    }
})();
