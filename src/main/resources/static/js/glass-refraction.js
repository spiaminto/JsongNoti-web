/**
 * glass-refraction.js — 크롬 유리의 굴절 (ADR 0003, D6·D9·P6)
 * 기준: docs/_temp/ui-overhaul-3.md, 용어는 docs/with-ai/CONTEXT.md
 *
 * 크롬 유리(.navbar, .side-button-wrapper) 장마다 SVG 변위 맵으로 가장자리 굴절을
 * 얹는다. 가장자리 띠(BEZEL_WIDTH px)를 볼록한 곡면으로 보고, 곡면의 기울기에
 * 스넬 법칙을 적용해 빛이 꺾이는 만큼 뒤 그림을 안쪽에서 끌어온다 — 볼록 렌즈의
 * 가장자리처럼 뒤 그림이 휘어 들어온다. 색 분산(CHROMATIC_ABERRATION)은 같은 맵을
 * 채널마다 다른 세기로 세 번 적용해 가장자리에 빛깔 번짐을 만든다. 비용은 크롬
 * 2장뿐이다. 콘텐츠 판에는 걸지 않는다.
 *
 * 재질 값의 원본은 CSS 다(glass.css "크롬 유리 재질" 절). 여기서는 backdrop-filter
 * 를 직접 쓰지 않고 요소의 --glass-refraction 에 url(#필터) 만 채우며, CSS 가
 * blur·saturate 뒤에 그 값을 끼워 조립한다. 그래서 상태 전환(CSS transition)과
 * 접근성 미디어 쿼리가 inline 스타일에 막히지 않는다.
 *
 * 변위 맵(feImage 의 data URL)이 로드되기 전에 backdrop-filter 에 url() 이 붙으면
 * Chrome 은 필터 체인 전체를 버려 블러까지 사라지고, 그 요소의 계산된 스타일이
 * 실제로 달라지기 전에는 복구하지 않는다(5기 2번, 사이드 알약에서 확인).
 * 같은 값을 다시 넣는 것은 변경이 아니다. 그래서 필터를 붙인 뒤 두 프레임 뒤와
 * 400ms 뒤에 값이 실제로 달라지도록 no-op 인 opacity(1) 을 붙였다 뗀다.
 *
 * 폴백 사다리(위에서 아래로, 감지로만 내려간다 — 노브 없음):
 *  1) 굴절 + 블러: Chromium 계열 — 여기서 --glass-refraction 에 url(#필터) 를 채운다
 *  2) 블러: backdrop-filter 를 지원하는 나머지 브라우저 — CSS 재질 그대로. Firefox·Safari 는
 *     backdrop-filter: url() 을 무시하거나 깨진 그림을 내므로 @supports 가 아니라
 *     런타임 브랜드로 감지한다(P15)
 *  3) 색만: backdrop-filter 없음 — glass.css @supports not 절이 틴트 알파를 올린다
 *  4) 불투명: prefers-reduced-transparency — glass.css 접근성 절
 *
 * 변위 맵은 요소 크기에 맞춰 만들므로 크기가 바뀌면(ResizeObserver) 다시 만든다.
 * GLASS_SELECTOR 에 요소를 더하면 장마다 filter 하나씩 붙는다.
 */
(function () {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var GLASS_SELECTOR = ".navbar, .side-button-wrapper";
    var FILTER_ID_PREFIX = "glass-refraction-";
    var MAP_MAX_SIZE = 480;   // 변위 맵 캔버스 긴 변 상한 px — 굴절은 가장자리 띠라 해상도가 낮아도 된다
    var BEZEL_WIDTH = 16;     // 굴절이 일어나는 가장자리 띠(곡면) 폭 (css px)
    var BEZEL_DEPTH = 1.6;    // 곡면의 깊이 배율 — 기울기와 유리 두께에 곱한다
    var REFRACTIVE_INDEX = 1.5; // 유리의 굴절률
    var REFRACTION_STRENGTH = 2.4; // 스넬 법칙으로 구한 변위에 곱하는 배율
    var CHROMATIC_ABERRATION = .16; // 색 분산: R 은 (1 + 값)배, B 는 (1 − 값)배로 변위. 0 이면 변위 패스 1개
    var PROFILE_STEPS = 256;  // 곡면 프로파일 표의 칸 수

    var isChromium = !!(navigator.userAgentData && navigator.userAgentData.brands.some(function (brand) {
        return /Chromium/i.test(brand.brand);
    }));
    if (!isChromium) return; // 사다리 2단 이하: CSS 그대로

    // 사다리 4단(투명도 최소화, glass.css 접근성 절)에서는 backdrop-filter 가 none 이라
    // 굴절이 그려지지 않는다 — 맵을 만들지 않는다
    var reducedTransparency = window.matchMedia("(prefers-reduced-transparency: reduce)");

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
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
            return createRefractionPane(svg, element, FILTER_ID_PREFIX + index);
        });

        panes.forEach(function (pane) {
            if (!reducedTransparency.matches) pane.apply();
            new ResizeObserver(function () {
                if (!reducedTransparency.matches) pane.apply();
            }).observe(pane.element);
        });
        reducedTransparency.addEventListener("change", function (event) {
            panes.forEach(function (pane) {
                if (event.matches) pane.remove(); else pane.apply();
            });
        });
    }

    // 유리 한 장의 굴절 상태: 크기가 바뀔 때만 변위 맵을 다시 만든다
    function createRefractionPane(svg, element, filterId) {
        var mapSize = null;

        function apply() {
            var rect = element.getBoundingClientRect();
            var width = Math.round(rect.width), height = Math.round(rect.height);
            if (!width || !height) return;
            if (mapSize && mapSize.width === width && mapSize.height === height) return;
            mapSize = { width: width, height: height };

            var radius = Math.min(parseFloat(getComputedStyle(element).borderTopLeftRadius) || height / 2, width / 2, height / 2);
            var bezel = Math.min(BEZEL_WIDTH, width / 2, height / 2);
            var profile = buildBezelProfile(bezel);
            var mapUrl = buildRefractionDisplacementMap(width, height, radius, bezel, profile);

            var previous = svg.querySelector("#" + filterId);
            if (previous) previous.remove();
            // 맵은 최대 변위를 1 로 정규화해 담으므로 scale 은 최대 변위의 2배(±127 → ±최대 변위 px)
            svg.appendChild(buildRefractionFilter(filterId, mapUrl, width, height, profile.maxDisplacement * 2));
            setRefraction(filterId, false);

            // 맵이 로드된 뒤 값이 실제로 달라지게 두 번 흔든다 (머리말). 그 사이
            // 크기가 또 바뀌었으면 건너뛴다 — 새 apply 가 다시 한다
            var expected = mapSize;
            function nudge(on) {
                if (mapSize !== expected) return;
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

        function remove() {
            mapSize = null;
            element.style.removeProperty("--glass-refraction");
        }

        return { element: element, apply: apply, remove: remove };
    }

    // 곡면 프로파일: 가장자리(t = 0)에서 띠 안쪽 끝(t = 1)까지, 볼록 스쿼클
    // h = (1 − (1 − t)^4)^(1/4) 의 기울기로 입사각을 구하고 스넬 법칙으로 꺾인 각을
    // 구해, 유리 두께를 지나는 동안 옆으로 밀리는 거리(px)를 칸마다 담는다
    function buildBezelProfile(bezel) {
        var displacement = new Float32Array(PROFILE_STEPS), maxDisplacement = .001;
        for (var i = 0; i < PROFILE_STEPS; i++) {
            var t = (i + .5) / PROFILE_STEPS, u = 1 - t;
            var q = 1 - u * u * u * u;
            var surfaceHeight = Math.pow(q, .25);
            var slope = Math.min(u * u * u * Math.pow(Math.max(1e-6, q), -.75) * BEZEL_DEPTH, 14);
            var incidentAngle = Math.atan(slope);
            var refractedAngle = Math.asin(Math.sin(incidentAngle) / REFRACTIVE_INDEX);
            var thickness = bezel * BEZEL_DEPTH * (surfaceHeight + .35);
            displacement[i] = Math.tan(incidentAngle - refractedAngle) * thickness * REFRACTION_STRENGTH;
            if (displacement[i] > maxDisplacement) maxDisplacement = displacement[i];
        }
        return { displacement: displacement, maxDisplacement: maxDisplacement };
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

        // 거리장은 css px 좌표에서 계산한다
        function signedDistance(x, y) {
            var qx = Math.abs(x - width / 2) - (width / 2 - radius);
            var qy = Math.abs(y - height / 2) - (height / 2 - radius);
            return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
        }

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
})();
