/**
 * glass-refraction.js — 크롬 유리의 굴절 (ADR 0003, D6·D9·P6)
 * 기준: docs/_temp/ui-overhaul-3.md, 용어는 docs/with-ai/CONTEXT.md
 *
 * 크롬 유리(.navbar, .side-button-wrapper) 장마다 SVG 변위 맵으로 가장자리 굴절을
 * 얹는다 — 알약의 가장자리 띠(EDGE_BAND px) 안에서 뒤 그림이 바깥쪽으로 휘어
 * 유리 렌즈처럼 보인다. 비용은 크롬 2장뿐이라 예산(P5) 안이다. 콘텐츠 판에는
 * 걸지 않는다.
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
    var EDGE_BAND = 18;       // 굴절이 일어나는 가장자리 띠 폭 (css px)
    var DISPLACEMENT_SCALE = 46; // feDisplacementMap scale — 띠 안쪽 최대 변위 px

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

            var radius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || height / 2;
            var mapUrl = buildRefractionDisplacementMap(width, height, radius);

            var previous = svg.querySelector("#" + filterId);
            if (previous) previous.remove();
            svg.appendChild(buildRefractionFilter(filterId, mapUrl, width, height));
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

    // feImage(변위 맵) + feDisplacementMap 두 단계 필터
    function buildRefractionFilter(filterId, mapUrl, width, height) {
        var filter = document.createElementNS(SVG_NS, "filter");
        filter.id = filterId;
        filter.setAttribute("color-interpolation-filters", "sRGB");
        filter.setAttribute("x", "0");
        filter.setAttribute("y", "0");
        filter.setAttribute("width", "100%");
        filter.setAttribute("height", "100%");

        var mapImage = document.createElementNS(SVG_NS, "feImage");
        mapImage.setAttribute("href", mapUrl);
        mapImage.setAttribute("x", "0");
        mapImage.setAttribute("y", "0");
        mapImage.setAttribute("width", width);
        mapImage.setAttribute("height", height);
        mapImage.setAttribute("preserveAspectRatio", "none");
        mapImage.setAttribute("result", "map");

        var displacement = document.createElementNS(SVG_NS, "feDisplacementMap");
        displacement.setAttribute("in", "SourceGraphic");
        displacement.setAttribute("in2", "map");
        displacement.setAttribute("scale", String(DISPLACEMENT_SCALE));
        displacement.setAttribute("xChannelSelector", "R");
        displacement.setAttribute("yChannelSelector", "G");

        filter.append(mapImage, displacement);
        return filter;
    }

    // 변위 맵: 둥근 사각형의 부호 거리장(SDF)으로 가장자리 띠 안에서만 바깥 방향
    // (거리장의 기울기)으로 밀되, 가장자리에 가까울수록 세게(u³). R=x 변위,
    // G=y 변위, 128 이 0 이다
    function buildRefractionDisplacementMap(width, height, radius) {
        var downscale = Math.min(1, MAP_MAX_SIZE / Math.max(width, height));
        var mapWidth = Math.max(4, Math.round(width * downscale));
        var mapHeight = Math.max(4, Math.round(height * downscale));
        var cornerRadius = Math.min(radius, width / 2, height / 2) * downscale;
        var band = Math.max(2, EDGE_BAND * downscale);

        function signedDistance(x, y) {
            var qx = Math.abs(x - mapWidth / 2) - (mapWidth / 2 - cornerRadius);
            var qy = Math.abs(y - mapHeight / 2) - (mapHeight / 2 - cornerRadius);
            return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - cornerRadius;
        }

        var canvas = document.createElement("canvas");
        canvas.width = mapWidth;
        canvas.height = mapHeight;
        var ctx = canvas.getContext("2d");
        var image = ctx.createImageData(mapWidth, mapHeight);
        for (var y = 0; y < mapHeight; y++) {
            for (var x = 0; x < mapWidth; x++) {
                var depth = -signedDistance(x + .5, y + .5); // 안쪽으로 들어온 거리
                var dx = 0, dy = 0;
                if (depth >= 0 && depth < band) {
                    var closeness = 1 - depth / band;
                    var magnitude = closeness * closeness * closeness;
                    var gradientX = signedDistance(x + 1.5, y + .5) - signedDistance(x - .5, y + .5);
                    var gradientY = signedDistance(x + .5, y + 1.5) - signedDistance(x + .5, y - .5);
                    var gradientLength = Math.hypot(gradientX, gradientY) || 1;
                    dx = gradientX / gradientLength * magnitude;
                    dy = gradientY / gradientLength * magnitude;
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
