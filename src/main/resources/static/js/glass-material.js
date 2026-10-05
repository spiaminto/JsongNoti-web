/**
 * glass-material.js — 크롬 유리의 재질 중 그려서 만드는 두 층: 굴절과 스페큘러 (ADR 0003)
 * 기준: docs/_temp/ui-overhaul-5.md 4번, 용어는 docs/with-ai/CONTEXT.md
 *
 * 크롬 유리(.glass-capsule — 브랜드 캡슐, 메뉴 캡슐)의 가장자리 띠(BEZEL_WIDTH px)를 볼록한
 * 곡면으로 보고, 그 곡면 하나에서 두 층을 만든다. 콘텐츠 패널에는 걸지 않는다.
 *
 *  굴절 (Chromium 만): 곡면의 기울기에 스넬 법칙을 적용해 빛이 꺾이는 만큼 뒤 그림을
 *    안쪽에서 끌어오는 SVG 변위 맵 — 볼록 렌즈의 가장자리처럼 뒤 그림이 휘어 들어온다.
 *    색 분산(CHROMATIC_ABERRATION)은 같은 맵을 채널마다 다른 세기로 세 번 적용해
 *    가장자리에 빛깔 번짐을 만든다.
 *  스페큘러 (모든 브라우저): 곡면의 법선과 광원 방향으로 하이라이트를 캔버스에 구워
 *    ::after 에 얹는다 — 빛 받는 쪽 림, 반대편 림, 둘레의 옅은 림, 두께 그늘.
 *    굽기 전이나 스크립트가 없을 때는 CSS 의 conic 링이 그대로 폴백이다.
 *
 * 재질 값의 원본은 CSS 다(glass.css "크롬 유리 재질" 절). 여기서는 요소의
 * --glass-refraction 에 url(#필터), --glass-specular 에 구운 이미지를 채우고
 * .has-baked-specular 를 붙일 뿐이며, 조립은 CSS 가 한다. 그래서 상태 전환(CSS
 * transition)과 접근성 미디어 쿼리가 inline 스타일에 막히지 않는다.
 *
 * 변위 맵(feImage 의 data URL)이 로드되기 전에 backdrop-filter 에 url() 이 붙으면
 * Chrome 은 필터 체인 전체를 버려 블러까지 사라지고, 그 요소의 계산된 스타일이
 * 실제로 달라지기 전에는 복구하지 않는다(5기 2번, 사이드 알약에서 확인).
 * 같은 값을 다시 넣는 것은 변경이 아니다. 그래서 필터를 붙인 뒤 두 프레임 뒤와
 * 400ms 뒤에 값이 실제로 달라지도록 no-op 인 opacity(1) 을 붙였다 뗀다.
 *
 * 폴백 사다리(위에서 아래로, 감지로 내려간다):
 *  1) 굴절 + 블러: Chromium 계열 — 여기서 --glass-refraction 에 url(#필터) 를 채운다
 *  2) 블러: backdrop-filter 를 지원하는 나머지 브라우저 — CSS 재질 그대로. Firefox·Safari 는
 *     backdrop-filter: url() 을 무시하거나 깨진 그림을 내므로 @supports 가 아니라
 *     런타임 브랜드로 감지한다(P15)
 *  3) 색만: backdrop-filter 없음 — glass.css @supports not 절이 틴트 알파를 올린다
 *  4) 불투명: prefers-reduced-transparency — glass.css 접근성 절
 *
 * 크로미움 외 보기 스위치: window.glassFallback.set(true) 로 이 브라우저에서 2단(블러)을
 * 흉내 낸다 — 굴절을 걸지 않는다. 선택은 localStorage 에 남는다. 주소에 ?glass-fallback 을
 * 붙이거나 켜 둔 동안에는 임시 패널(glass-fallback-panel.js)을 불러온다.
 * ?glass-fallback=on / off 로 주소에서 바로 켜고 끈다.
 *
 * 두 층 모두 요소 크기에 맞춰 만들므로 크기가 바뀌면(ResizeObserver) 다시 만들고,
 * 스페큘러는 테마가 바뀌어도(두께 그늘의 색) 다시 굽는다. 장마다 최근 두 크기의 층을
 * 기억해 두어, 메뉴 캡슐이 가로와 세로를 오갈 때는 두 번째부터 굽지 않고 다시 쓴다.
 * GLASS_SELECTOR 에 요소를 더하면 장마다 크기별 filter·이미지가 붙는다.
 */
(function () {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var GLASS_SELECTOR = ".glass-capsule";
    var FILTER_ID_PREFIX = "glass-refraction-";
    var MAP_MAX_SIZE = 480;   // 변위 맵 캔버스 긴 변 상한 px — 굴절은 가장자리 띠라 해상도가 낮아도 된다
    var BEZEL_WIDTH = 16;     // 굴절·스페큘러가 놓이는 가장자리 띠(곡면) 폭 (css px)
    var BEZEL_DEPTH = 1.6;    // 곡면의 깊이 배율 — 기울기와 유리 두께에 곱한다
    var REFRACTIVE_INDEX = 1.5; // 유리의 굴절률
    var REFRACTION_STRENGTH = 2.4; // 스넬 법칙으로 구한 변위에 곱하는 배율
    var CHROMATIC_ABERRATION = .16; // 색 분산: R 은 (1 + 값)배, B 는 (1 − 값)배로 변위. 0 이면 변위 패스 1개
    var PROFILE_STEPS = 256;  // 곡면 프로파일 표의 칸 수

    var LIGHT_ANGLE = 225;          // 광원 방향(도). 225 는 좌상
    var SPECULAR_FOCUS = 3;         // 하이라이트 집중도 — 클수록 광원 쪽에만 좁게 맺힌다
    var SPECULAR_ALPHA = 1;         // 광원 쪽 림의 세기
    var SPECULAR_BACK_ALPHA = .6;   // 광원 반대편 림의 세기 (광원 쪽 대비)
    var RIM_ALPHA = .22;            // 방향과 무관하게 둘레 전체에 도는 옅은 림
    var THICKNESS_SHADE_ALPHA = .12; // 곡면이 가파른 곳에 얹는 두께 그늘
    var SHADE_RGB_LIGHT = [30, 42, 56]; // 두께 그늘의 색: light 는 잉크, dark 는 검정
    var SHADE_RGB_DARK = [0, 0, 0];
    var SPECULAR_MAX_PIXEL_RATIO = 2; // 스페큘러 캔버스의 픽셀 배율 상한
    var BAKED_SIZE_MEMORY = 2;       // 장마다 구운 층을 기억해 두는 크기 수

    var isChromium = !!(navigator.userAgentData && navigator.userAgentData.brands.some(function (brand) {
        return /Chromium/i.test(brand.brand);
    }));

    // 사다리 4단(투명도 최소화, glass.css 접근성 절)에서는 backdrop-filter 가 none 이라
    // 굴절이 그려지지 않는다 — 맵을 만들지 않는다
    var reducedTransparency = window.matchMedia("(prefers-reduced-transparency: reduce)");

    // 크로미움 외 보기 스위치 (머리말)
    var FALLBACK_STORAGE_KEY = "glass-fallback";
    var FALLBACK_URL_PARAM = "glass-fallback";
    var FALLBACK_PANEL_SCRIPT = "glass-fallback-panel.js";
    var ownScriptSrc = document.currentScript ? document.currentScript.src : "";
    var nonChromiumPreview = readNonChromiumPreview();
    var fallbackUrlValue = new URLSearchParams(location.search).get(FALLBACK_URL_PARAM);
    if (fallbackUrlValue === "on" || fallbackUrlValue === "off") {
        nonChromiumPreview = fallbackUrlValue === "on";
        storeNonChromiumPreview();
    }

    // [임시 실험 스위치] html.glass-material-late (lab-switches.js): 로드 시퀀스(햇살·캡슐·히어로가 떠오르는 동안)가
    // 끝난 뒤에 만든다. 만드는 데 S10 에서 150~190ms 가 한 번에 걸린다(6기 실측)
    var GLASS_MATERIAL_LATE_MS = 1600;
    function start() {
        if (document.documentElement.classList.contains("glass-material-late")) setTimeout(init, GLASS_MATERIAL_LATE_MS);
        else init();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }

    function init() {
        var glasses = document.querySelectorAll(GLASS_SELECTOR);
        if (!glasses.length) return;

        // 필터를 담을 보이지 않는 SVG 한 장 (요소마다 filter 하나)
        var svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("width", "0");
        svg.setAttribute("height", "0");
        svg.setAttribute("aria-hidden", "true");
        svg.style.position = "absolute";
        document.body.appendChild(svg);

        var panes = Array.prototype.map.call(glasses, function (element, index) {
            return createGlassPane(svg, element, FILTER_ID_PREFIX + index);
        });

        panes.forEach(function (pane) {
            pane.apply();
            new ResizeObserver(pane.apply).observe(pane.element);
        });
        reducedTransparency.addEventListener("change", function () {
            panes.forEach(function (pane) { pane.rebuild(); });
        });
        // 테마가 바뀌면 두께 그늘의 색이 달라진다
        new MutationObserver(function () {
            panes.forEach(function (pane) { pane.rebuild(); });
        }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

        window.glassFallback = {
            get: function () {
                return nonChromiumPreview;
            },
            set: function (on) {
                nonChromiumPreview = !!on;
                storeNonChromiumPreview();
                panes.forEach(function (pane) { pane.rebuild(); });
                document.dispatchEvent(new CustomEvent("glassfallbackchange", { detail: nonChromiumPreview }));
            }
        };
        if (fallbackUrlValue !== null || nonChromiumPreview) loadFallbackPanel();
    }

    function readNonChromiumPreview() {
        try {
            return localStorage.getItem(FALLBACK_STORAGE_KEY) === "on";
        } catch (error) {
            return false;
        }
    }

    function storeNonChromiumPreview() {
        try {
            if (nonChromiumPreview) localStorage.setItem(FALLBACK_STORAGE_KEY, "on");
            else localStorage.removeItem(FALLBACK_STORAGE_KEY);
        } catch (error) {
            // 저장할 수 없으면 이 페이지에서만 흉내 낸다
        }
    }

    // 임시 패널은 이 스크립트와 같은 폴더에서 불러온다
    function loadFallbackPanel() {
        if (!ownScriptSrc || document.querySelector('script[data-glass-fallback-panel]')) return;
        var script = document.createElement("script");
        script.src = ownScriptSrc.replace(/glass-material\.js(\?.*)?$/, FALLBACK_PANEL_SCRIPT);
        script.setAttribute("data-glass-fallback-panel", "");
        document.head.appendChild(script);
    }

    // 유리 한 장: 크기가 바뀔 때만 두 층을 다시 만든다. 크기마다 만든 층(스페큘러 이미지,
    // 굴절 필터)은 최근 BAKED_SIZE_MEMORY 개까지 기억해 두고, 같은 크기로 돌아오면 다시 쓴다
    function createGlassPane(svg, element, filterIdBase) {
        var builtSize = null;
        var speculars = []; // { key, url } — 최근에 쓴 것이 뒤
        var filters = [];   // { key, id, node }
        var filterCount = 0;

        function recall(list, key) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].key === key) {
                    var entry = list.splice(i, 1)[0];
                    list.push(entry);
                    return entry;
                }
            }
            return null;
        }

        function remember(list, entry) {
            list.push(entry);
            while (list.length > BAKED_SIZE_MEMORY) {
                var oldest = list.shift();
                if (oldest.node) oldest.node.remove();
            }
        }

        function apply() {
            // 스크롤 방향 반응의 축소(transform)에 흔들리지 않게 레이아웃 크기를 쓴다
            var width = element.offsetWidth, height = element.offsetHeight;
            if (!width || !height) return;
            if (builtSize && builtSize.width === width && builtSize.height === height) return;
            builtSize = { width: width, height: height };

            // 곡면은 기억해 둔 층이 없을 때만 계산한다
            var geometry = null;
            function bezelGeometry() {
                if (!geometry) {
                    var bezel = Math.min(BEZEL_WIDTH, width / 2, height / 2);
                    geometry = {
                        radius: Math.min(parseFloat(getComputedStyle(element).borderTopLeftRadius) || height / 2, width / 2, height / 2),
                        bezel: bezel,
                        profile: buildBezelProfile(bezel)
                    };
                }
                return geometry;
            }

            var sizeKey = width + "x" + height;
            var dark = document.documentElement.getAttribute("data-theme") === "dark";
            var specularKey = sizeKey + (dark ? " dark" : " light");
            var specular = recall(speculars, specularKey);
            if (!specular) {
                var specularGeometry = bezelGeometry();
                specular = { key: specularKey, url: buildSpecularImage(width, height, specularGeometry.radius, specularGeometry.bezel, specularGeometry.profile, dark) };
                remember(speculars, specular);
            }
            element.style.setProperty("--glass-specular", "url(" + specular.url + ")");
            element.classList.add("has-baked-specular");

            if (!isChromium || reducedTransparency.matches || nonChromiumPreview) { // 사다리 2단 이하: 굴절 없음
                element.style.removeProperty("--glass-refraction");
                return;
            }
            var filter = recall(filters, sizeKey);
            if (!filter) {
                var filterGeometry = bezelGeometry();
                var mapUrl = buildRefractionDisplacementMap(width, height, filterGeometry.radius, filterGeometry.bezel, filterGeometry.profile);
                var id = filterIdBase + "-" + filterCount++;
                // 맵은 최대 변위를 1 로 정규화해 담으므로 scale 은 최대 변위의 2배(±127 → ±최대 변위 px)
                var node = buildRefractionFilter(id, mapUrl, width, height, filterGeometry.profile.maxDisplacement * 2);
                svg.appendChild(node);
                filter = { key: sizeKey, id: id, node: node };
                remember(filters, filter);
            }
            var filterId = filter.id;
            setRefraction(filterId, false);

            // 맵이 로드된 뒤 값이 실제로 달라지게 두 번 흔든다 (머리말). 그 사이
            // 다시 만들어졌으면 건너뛴다 — 새 apply 가 다시 한다
            var expected = builtSize;
            function nudge(on) {
                if (builtSize !== expected) return;
                setRefraction(filterId, on);
            }
            requestAnimationFrame(function () {
                requestAnimationFrame(function () { nudge(true); });
            });
            setTimeout(function () { nudge(false); }, 400);
        }

        // CSS 가 backdrop-filter 끝에 끼우는 값만 채운다.
        // withNoop 이면 no-op 인 opacity(1) 을 뒤에 붙여 값이 달라지게 한다
        function setRefraction(id, withNoop) {
            element.style.setProperty("--glass-refraction", "url(#" + id + ")" + (withNoop ? " opacity(1)" : ""));
        }

        function rebuild() {
            builtSize = null;
            apply();
        }

        return { element: element, apply: apply, rebuild: rebuild };
    }

    // 곡면 프로파일: 가장자리(t = 0)에서 띠 안쪽 끝(t = 1)까지, 볼록 스쿼클
    // h = (1 − (1 − t)^4)^(1/4) 의 기울기로 입사각을 구하고 스넬 법칙으로 꺾인 각을
    // 구해, 유리 두께를 지나는 동안 옆으로 밀리는 거리(px)를 칸마다 담는다.
    // 기울기 표(slopes)는 스페큘러가 곡면의 가파른 정도로 쓴다
    function buildBezelProfile(bezel) {
        var displacement = new Float32Array(PROFILE_STEPS), slopes = new Float32Array(PROFILE_STEPS), maxDisplacement = .001;
        for (var i = 0; i < PROFILE_STEPS; i++) {
            var t = (i + .5) / PROFILE_STEPS, u = 1 - t;
            var q = 1 - u * u * u * u;
            var surfaceHeight = Math.pow(q, .25);
            var slope = Math.min(u * u * u * Math.pow(Math.max(1e-6, q), -.75) * BEZEL_DEPTH, 14);
            slopes[i] = slope;
            var incidentAngle = Math.atan(slope);
            var refractedAngle = Math.asin(Math.sin(incidentAngle) / REFRACTIVE_INDEX);
            var thickness = bezel * BEZEL_DEPTH * (surfaceHeight + .35);
            displacement[i] = Math.tan(incidentAngle - refractedAngle) * thickness * REFRACTION_STRENGTH;
            if (displacement[i] > maxDisplacement) maxDisplacement = displacement[i];
        }
        return { displacement: displacement, slopes: slopes, maxDisplacement: maxDisplacement };
    }

    // feImage(변위 맵) + feDisplacementMap. 색 분산이 있으면 채널마다 세기를 달리해
    // 세 번 변위하고(R 세게, G 그대로, B 약하게) 채널만 남겨 screen 으로 다시 합친다
    var CHANNEL_ONLY_MATRIX = {
        red: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
        green: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",
        blue: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
    };
    function buildRefractionFilter(filterId, mapUrl, width, height, displacementScale) {
        var filter = document.createElementNS(SVG_NS, "filter");
        filter.id = filterId;
        filter.setAttribute("color-interpolation-filters", "sRGB");
        filter.setAttribute("x", "0");
        filter.setAttribute("y", "0");
        filter.setAttribute("width", "100%");
        filter.setAttribute("height", "100%");

        function append(name, attributes) {
            var node = document.createElementNS(SVG_NS, name);
            Object.keys(attributes).forEach(function (key) { node.setAttribute(key, attributes[key]); });
            filter.appendChild(node);
        }
        function appendDisplacement(factor, result) {
            append("feDisplacementMap", {
                "in": "SourceGraphic", in2: "map", scale: (displacementScale * factor).toFixed(2),
                xChannelSelector: "R", yChannelSelector: "G", result: result
            });
        }

        append("feImage", { href: mapUrl, x: 0, y: 0, width: width, height: height, preserveAspectRatio: "none", result: "map" });
        if (CHROMATIC_ABERRATION > 0) {
            appendDisplacement(1 + CHROMATIC_ABERRATION, "displacedRed");
            append("feColorMatrix", { "in": "displacedRed", type: "matrix", values: CHANNEL_ONLY_MATRIX.red, result: "red" });
            appendDisplacement(1, "displacedGreen");
            append("feColorMatrix", { "in": "displacedGreen", type: "matrix", values: CHANNEL_ONLY_MATRIX.green, result: "green" });
            appendDisplacement(1 - CHROMATIC_ABERRATION, "displacedBlue");
            append("feColorMatrix", { "in": "displacedBlue", type: "matrix", values: CHANNEL_ONLY_MATRIX.blue, result: "blue" });
            append("feBlend", { "in": "red", in2: "green", mode: "screen", result: "redGreen" });
            append("feBlend", { "in": "redGreen", in2: "blue", mode: "screen" });
        } else {
            appendDisplacement(1, "displaced");
        }
        return filter;
    }

    // 변위 맵: 둥근 사각형의 부호 거리장(SDF)으로 가장자리 띠 안에서만, 거리장의
    // 기울기(바깥 방향)의 반대쪽 — 안쪽 — 에서 표본을 끌어온다. 세기는 곡면 프로파일을
    // 최대 변위로 나눈 값. R=x 변위, G=y 변위, 128 이 0 이다
    function buildRefractionDisplacementMap(width, height, radius, bezel, profile) {
        var downscale = Math.min(1, MAP_MAX_SIZE / Math.max(width, height));
        var mapWidth = Math.max(4, Math.round(width * downscale));
        var mapHeight = Math.max(4, Math.round(height * downscale));

        var signedDistance = roundedRectSignedDistance(width, height, radius);

        var canvas = document.createElement("canvas");
        canvas.width = mapWidth;
        canvas.height = mapHeight;
        var ctx = canvas.getContext("2d");
        var image = ctx.createImageData(mapWidth, mapHeight);
        for (var y = 0; y < mapHeight; y++) {
            for (var x = 0; x < mapWidth; x++) {
                var px = (x + .5) / downscale, py = (y + .5) / downscale;
                var depth = -signedDistance(px, py); // 안쪽으로 들어온 거리
                var dx = 0, dy = 0;
                if (depth >= 0 && depth < bezel) {
                    var gradientX = signedDistance(px + 1, py) - signedDistance(px - 1, py);
                    var gradientY = signedDistance(px, py + 1) - signedDistance(px, py - 1);
                    var gradientLength = Math.hypot(gradientX, gradientY) || 1;
                    var step = Math.min(PROFILE_STEPS - 1, (depth / bezel * PROFILE_STEPS) | 0);
                    var magnitude = profile.displacement[step] / profile.maxDisplacement;
                    dx = -gradientX / gradientLength * magnitude;
                    dy = -gradientY / gradientLength * magnitude;
                }
                var offset = (y * mapWidth + x) * 4;
                image.data[offset] = Math.round(128 + dx * 127);
                image.data[offset + 1] = Math.round(128 + dy * 127);
                image.data[offset + 2] = 128;
                image.data[offset + 3] = 255;
            }
        }
        ctx.putImageData(image, 0, 0);
        return canvas.toDataURL();
    }

    // 둥근 사각형의 부호 거리장 (css px 좌표, 안쪽이 음수)
    function roundedRectSignedDistance(width, height, radius) {
        return function (x, y) {
            var qx = Math.abs(x - width / 2) - (width / 2 - radius);
            var qy = Math.abs(y - height / 2) - (height / 2 - radius);
            return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
        };
    }

    // 스페큘러: 가장자리 띠의 픽셀마다 곡면이 바깥으로 기운 방향(거리장의 기울기)과
    // 광원 방향의 내적으로 밝기를 정한다. 흰 빛(광원 쪽 림 + 반대편 림 + 둘레 림)과
    // 두께 그늘을 한 픽셀에 합쳐 담는다
    function buildSpecularImage(width, height, radius, bezel, profile, dark) {
        var pixelRatio = Math.min(SPECULAR_MAX_PIXEL_RATIO, window.devicePixelRatio || 1);
        var canvasWidth = Math.round(width * pixelRatio), canvasHeight = Math.round(height * pixelRatio);
        var signedDistance = roundedRectSignedDistance(width, height, radius);
        var lightAngle = LIGHT_ANGLE * Math.PI / 180;
        var lightX = Math.cos(lightAngle), lightY = Math.sin(lightAngle);
        var shadeRgb = dark ? SHADE_RGB_DARK : SHADE_RGB_LIGHT;

        var canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        var ctx = canvas.getContext("2d");
        var image = ctx.createImageData(canvasWidth, canvasHeight);
        for (var y = 0; y < canvasHeight; y++) {
            for (var x = 0; x < canvasWidth; x++) {
                var px = (x + .5) / pixelRatio, py = (y + .5) / pixelRatio;
                var depth = -signedDistance(px, py);
                if (depth < 0 || depth >= bezel) continue;
                var gradientX = signedDistance(px + 1, py) - signedDistance(px - 1, py);
                var gradientY = signedDistance(px, py + 1) - signedDistance(px, py - 1);
                var gradientLength = Math.hypot(gradientX, gradientY) || 1;
                var facing = (gradientX * lightX + gradientY * lightY) / gradientLength;
                var slope = profile.slopes[Math.min(PROFILE_STEPS - 1, (depth / bezel * PROFILE_STEPS) | 0)];
                var steepness = slope / Math.sqrt(1 + slope * slope);
                var lit = Math.pow(Math.max(0, facing), SPECULAR_FOCUS) + SPECULAR_BACK_ALPHA * Math.pow(Math.max(0, -facing), SPECULAR_FOCUS);
                var whiteAlpha = Math.min(1, SPECULAR_ALPHA * lit * steepness * steepness + RIM_ALPHA * Math.pow(steepness, 4));
                var shadeAlpha = THICKNESS_SHADE_ALPHA * steepness * (1 - whiteAlpha);
                var alpha = whiteAlpha + shadeAlpha;
                if (alpha <= 0) continue;
                var offset = (y * canvasWidth + x) * 4;
                image.data[offset] = Math.round((255 * whiteAlpha + shadeRgb[0] * shadeAlpha) / alpha);
                image.data[offset + 1] = Math.round((255 * whiteAlpha + shadeRgb[1] * shadeAlpha) / alpha);
                image.data[offset + 2] = Math.round((255 * whiteAlpha + shadeRgb[2] * shadeAlpha) / alpha);
                image.data[offset + 3] = Math.round(Math.min(1, alpha) * 255);
            }
        }
        ctx.putImageData(image, 0, 0);
        return canvas.toDataURL();
    }
})();
