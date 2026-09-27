/**
 * glass-motion.js — 공통 모션 (배경 연출·크롬·스크롤)
 * 기준: docs/_temp/ui-overhaul-3.md, 용어는 docs/with-ai/CONTEXT.md
 *
 * 담당:
 *  1) 로드 시퀀스: .veil 요소에 .on 을 붙여 --vd 딜레이 순서대로 띄운다
 *  2) 스크롤 리빌: [data-lift] 요소가 30% 이상 보이면 .is-lit 을 붙인다 (기존 fade-in.js 대체)
 *  3) scroll edge: 화면 상단 점진 블러 베일(.scroll-veil)을 심고 scrollY > 8 에서
 *     .navbar 에 .scrolled 를 붙여 띄운다 (ui-rnd 5턴). 크롬 유리(.glass-capsule)마다
 *     콘텐츠 판이 밑에 들어오면 .over-content, 글자 밑에 busy 판(.content-panel-busy)이 있으면
 *     .over-content-busy 를 붙여 상태를 바꾼다 (glass.css 재질 절)
 *  4) 스크롤 방향 반응(P12): 브랜드 캡슐이 스크롤 위치가 아니라 방향에 반응하도록
 *     html[data-scroll-direction] 을 up/down 으로 쓴다 — 축소 모션은 containers.css
 *  5) 보케: .bokeh i 의 위치·크기를 로드마다 랜덤으로 흩뿌린다
 *  6) 접힘 스크롤 팔로우: index 더보기를 접으면 토글 버튼을 화면 중앙까지
 *     활강시켜 포착한 뒤, 중앙에 고정한 채 접힘을 따라 함께 이동한다. followScroll·
 *     followTrackButton 은 window.glassMotion 으로 공개되어 검색 더보기 접힘과
 *     애창곡 노래 클릭 스크롤(song-search.js)도 쓴다
 *  7) 메뉴 캡슐의 이동: 스크롤해 내려가면 메뉴 캡슐이 돌면서 오른쪽 아래의 엄지 자리로
 *     내려가고 맨 위로 돌아오면 올라온다 (1200px 미만에서만, containers.css)
 *  8) 캡슐별 동적 다크모드: 라이트 테마에서 캡슐이 busy 판(.content-panel-busy)의 영상·이미지
 *     위에 있으면 밑의 픽셀 밝기를 읽어 어두우면 .is-over-dark 를 붙인다 (glass.css 재질 절).
 *     기본값은 꺼짐(GLASS_TONE_ENABLED)
 *  9) 크롬 유리의 접점 반응: 누르는 자리의 발광(.is-glowing)과 아이콘 버튼 그룹의
 *     선택 렌즈(.selection-lens). 젤 프레스는 CSS 만으로 한다 (glass.css)
 *
 * 콘텐츠 판은 불투명 프로스트라(ADR 0001) 여기서는 손대지 않는다 — 굽기는 frost-baking.js.
 *
 * 컬랩스의 높이 전환 자체에는 관여하지 않는다 — 전 페이지 순정 부트스트랩
 * collapse 를 쓴다. (과거 6·7번 높이 예약 구역은 body 그라디언트가 문서
 * 높이에 묶여 있던 시절의 렉 우회였고, 배경을 뷰포트 고정으로 분리하며
 * 제거했다. 6번에 얹혀 있던 스크롤 팔로우만 UX 로 남긴다)
 */
(function () {
    "use strict";

    // head 에서 로드되므로 DOM 파싱이 끝난 뒤 시작한다
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    function init() {

    // 로드 시퀀스: 스타일이 적용된 다음 프레임에 .on 을 붙여야 transition 이 발생한다
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            document.querySelectorAll(".veil").forEach(function (el) {
                el.classList.add("on");
            });
        });
    });

    // 햇살은 떠오름(ray-in)이 끝나면 합성 레이어에서 내린다 (glass.css .ray.settled).
    // reduced-motion 에서도 .01s 애니메이션이 끝나므로 animationend 는 항상 온다
    document.querySelectorAll(".ray").forEach(function (el) {
        el.addEventListener("animationend", function () {
            el.classList.add("settled");
        }, { once: true });
    });

    // 스크롤 리빌: 30% 이상 보이면 떠오르고, 한 번 떠오르면 다시 숨지 않는다
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-lit");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: .3 });

    document.querySelectorAll("[data-lift]").forEach(function (el) {
        observer.observe(el);
    });

    // scroll edge: 상단 점진 블러 베일(.scroll-veil)은 상단바 있는 페이지에만 심는다 —
    // 표시는 CSS 형제 선택자(.navbar.scrolled ~ .scroll-veil)가 따라온다
    var navbar = document.querySelector(".navbar");
    if (navbar) {
        var scrollVeil = document.createElement("div");
        scrollVeil.className = "scroll-veil";
        scrollVeil.setAttribute("aria-hidden", "true");
        // 형제 선택자가 물리도록 상단바와 같은 부모(#container)의 끝에 심는다
        // (fixed 라 부모가 어디든 뷰포트 기준으로 뜬다)
        navbar.parentElement.appendChild(scrollVeil);
        var onScroll = function () {
            navbar.classList.toggle("scrolled", window.scrollY > 8);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        // 메뉴 캡슐의 이동 (containers.css "메뉴 캡슐의 이동" 절): 120px 을 넘게 내려가면 돌면서
        // 오른쪽 아래로 내려가고, 40px 아래로 돌아오면 올라온다 — 문턱을 둘로 나눠 맨 위
        // 근처에서 오르내리지 않게 한다. 1200px 이상에서는 위에 머문다
        var MENU_DOCK_AT = 120, MENU_UNDOCK_AT = 40;
        // 자리: 위는 콘텐츠 열(1140px)의 오른쪽 끝·윗선 16px (containers.css 의 --chrome-* 와 같은 값),
        // 아래는 오른쪽 12px·캡슐의 아랫선이 화면 높이의 70%
        var MENU_COLUMN_HALF = 570, MENU_EDGE = 12, MENU_TOP = 16, MENU_DOCK_BOTTOM_LINE = .7;
        var menuCapsule = document.querySelector(".menu-capsule");
        var menuButtons = menuCapsule ? Array.prototype.slice.call(menuCapsule.querySelectorAll(".icon-link")) : [];
        var menuStaysOnTop = window.matchMedia("(min-width: 1200px)");
        var menuReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        var menuDocked = false;

        // 자리는 right·bottom 이 아니라 기기 픽셀에 맞춘 left·top 으로 놓는다 — 소수점 자리에 놓이면
        // 이동이 끝난 뒤 내용이 픽셀 격자에 다시 물리며 살짝 움직인다
        var placeMenuCapsule = function () {
            var ratio = window.devicePixelRatio || 1;
            var viewportWidth = document.documentElement.clientWidth;
            var left = menuDocked
                ? viewportWidth - MENU_EDGE - menuCapsule.offsetWidth
                : viewportWidth - Math.max(MENU_EDGE, viewportWidth / 2 - MENU_COLUMN_HALF) - menuCapsule.offsetWidth;
            var top = menuDocked ? window.innerHeight * MENU_DOCK_BOTTOM_LINE - menuCapsule.offsetHeight : MENU_TOP;
            menuCapsule.style.left = Math.round(left * ratio) / ratio + "px";
            menuCapsule.style.top = Math.round(top * ratio) / ratio + "px";
            menuCapsule.style.right = "auto";
        };

        var applyMenuDocked = function () {
            menuCapsule.classList.toggle("is-docked", menuDocked);
            placeMenuCapsule();
        };

        // instant: 전환 없이 자리만 바꾼다 (로드 때 이미 내려와 있는 경우)
        var setMenuDocked = function (nextDocked, instant) {
            if (nextDocked === menuDocked) return;
            menuDocked = nextDocked;
            if (instant) {
                applyMenuDocked();
                updateGlassStates();
                return;
            }
            if (menuReducedMotion.matches) {
                menuCapsule.classList.add("is-swapping");
                setTimeout(function () {
                    applyMenuDocked();
                    updateGlassStates();
                    menuCapsule.classList.remove("is-swapping");
                }, 160);
                return;
            }
            // FLIP: 레이아웃을 바꾼 뒤, 바뀌기 전 자리·방향으로 되돌려 놓고(전환 없이) 제자리로 풀어 준다
            menuCapsule.classList.add("is-traveling");
            var first = menuCapsule.getBoundingClientRect();
            menuCapsule.style.translate = "0px 0px";
            menuCapsule.classList.add("is-flip-start", "is-specular-off");
            applyMenuDocked();
            var last = menuCapsule.getBoundingClientRect();
            var dx = (first.left + first.width / 2) - (last.left + last.width / 2);
            var dy = (first.top + first.height / 2) - (last.top + last.height / 2);
            menuCapsule.style.translate = dx + "px " + dy + "px";
            menuCapsule.style.rotate = menuDocked ? "-90deg" : "90deg";
            menuButtons.forEach(function (button) { button.style.rotate = menuDocked ? "90deg" : "-90deg"; });
            void menuCapsule.offsetWidth;
            menuCapsule.classList.remove("is-flip-start", "is-specular-off");
            menuCapsule.style.translate = "0px 0px";
            menuCapsule.style.rotate = "0deg";
            menuButtons.forEach(function (button) { button.style.rotate = "0deg"; });
            updateGlassStates();
        };

        var updateMenuDocked = function (instant) {
            if (!menuCapsule) return;
            var y = window.scrollY;
            if (menuStaysOnTop.matches) setMenuDocked(false, instant);
            else if (!menuDocked && y > MENU_DOCK_AT) setMenuDocked(true, instant);
            else if (menuDocked && y < MENU_UNDOCK_AT) setMenuDocked(false, instant);
        };

        // 크롬 유리의 상태(glass.css 재질 절): 캡슐마다 셋 중 하나다. 앞의 것이 이긴다.
        //  .over-content-busy — 캡슐 글자 밑에 busy 판(.content-panel-busy)이 있다
        //  .over-content      — 콘텐츠 판(.content-panel)이 캡슐 밑에 들어와 있다. 내려가 있는 메뉴 캡슐은 늘 콘텐츠 위다
        //  (클래스 없음)      — 사진 위
        // 스크롤 프레임마다 한 번만 판정한다
        var glassCapsules = document.querySelectorAll(".brand-capsule, .menu-capsule");
        var glassStatesQueued = false;

        // 올라가는 중인 메뉴 캡슐은 날아가는 자리가 아니라 도착할 자리로 본다
        var menuCapsulePlacedBox = function () {
            return { left: menuCapsule.offsetLeft, top: menuCapsule.offsetTop, right: menuCapsule.offsetLeft + menuCapsule.offsetWidth, bottom: menuCapsule.offsetTop + menuCapsule.offsetHeight };
        };

        // 캡슐 글자가 놓인 자리: 메뉴 캡슐은 첫 버튼부터 끝 버튼까지(도착할 자리 기준), 브랜드 캡슐은 글자(h1)만
        var capsuleTextBox = function (capsule) {
            if (capsule !== menuCapsule) return (capsule.querySelector("h1") || capsule).getBoundingClientRect();
            var placed = menuCapsulePlacedBox();
            if (!menuButtons.length) return placed;
            var first = menuButtons[0], last = menuButtons[menuButtons.length - 1];
            return {
                left: placed.left + first.offsetLeft, top: placed.top + first.offsetTop,
                right: placed.left + last.offsetLeft + last.offsetWidth, bottom: placed.top + last.offsetTop + last.offsetHeight
            };
        };

        // box 가 glass 와 가장자리 6px 안쪽까지 겹치는가
        var overlapsGlass = function (box, glass) {
            return box.width > 0 && box.top < glass.bottom - 6 && box.bottom > glass.top + 6 &&
                box.left < glass.right - 6 && box.right > glass.left + 6;
        };

        var updateGlassStates = function () {
            glassStatesQueued = false;
            // 판은 검색 결과처럼 나중에 생기기도 하므로 판정할 때마다 찾는다
            var panelBoxes = Array.prototype.map.call(document.querySelectorAll(".content-panel"), function (panel) {
                return panel.getBoundingClientRect();
            });
            var busyBoxes = Array.prototype.map.call(document.querySelectorAll(".content-panel-busy"), function (panel) {
                return panel.getBoundingClientRect();
            });
            Array.prototype.forEach.call(glassCapsules, function (capsule) {
                var overContent;
                if (capsule === menuCapsule && menuDocked) {
                    overContent = true;
                } else {
                    var glass = capsule === menuCapsule ? menuCapsulePlacedBox() : capsule.getBoundingClientRect();
                    overContent = panelBoxes.some(function (box) { return overlapsGlass(box, glass); });
                }
                var textBox = capsuleTextBox(capsule);
                var overBusy = busyBoxes.some(function (box) { return overlapsGlass(box, textBox); });
                // toggle 은 상태가 같으면 속성을 다시 쓰지 않는다
                capsule.classList.toggle("over-content-busy", overBusy);
                capsule.classList.toggle("over-content", overContent && !overBusy);
            });
        };
        window.addEventListener("scroll", function () {
            if (glassStatesQueued) return;
            glassStatesQueued = true;
            requestAnimationFrame(function () {
                updateMenuDocked(false);
                updateGlassStates();
            });
        }, { passive: true });
        if (menuCapsule) {
            menuCapsule.addEventListener("transitionend", function (event) {
                if (event.target === menuCapsule && event.propertyName === "translate") menuCapsule.classList.remove("is-traveling");
            });
            window.addEventListener("resize", placeMenuCapsule);
            menuStaysOnTop.addEventListener("change", function () { updateMenuDocked(false); });
            placeMenuCapsule();
            updateMenuDocked(true);
        }
        updateGlassStates();

        // 캡슐별 동적 다크모드 (glass.css 재질 절의 .is-over-dark): 라이트 테마에서 캡슐이
        // busy 판(.content-panel-busy)의 영상·이미지 위에 있으면 캡슐 밑의 픽셀 밝기(0 검정 ~ 1 흰색)를
        // 읽어, 어두우면 캡슐을 어두운 유리로 뒤집는다. 브랜드 캡슐은 글자 밑만 본다.
        // 픽셀은 스크롤이 멈췄을 때만 읽는다: 멈추면 바로 한 번, 겹쳐 있는 동안 초당 2번(영상 장면이
        // 바뀐다). 스크롤 중에는 사각형 겹침만 보고, 매체 위를 벗어난 캡슐만 밝은 유리로 돌린다.
        // 장면 전환마다 깜빡이지 않게 문턱을 둘로 나누고 한 번 바뀌면 잠시 유지한다.
        // GLASS_TONE_ENABLED 가 false 면 리스너·타이머를 두지 않는다
        var GLASS_TONE_ENABLED = false;
        var TONE_DARK_BELOW = .40, TONE_LIGHT_ABOVE = .55, TONE_HOLD_MS = 600;
        var TONE_SAMPLE_MS = 500, TONE_SCROLL_IDLE_MS = 150;
        var TONE_PAGE_LUMA = .85; // 매체 밖(판·사진)의 밝기
        var toneCanvas = document.createElement("canvas");
        toneCanvas.width = 16;
        toneCanvas.height = 8;
        var toneContext = null;
        var toneStates = new Map();
        var toneTimer = null, toneScrollIdleTimer = null;

        // 화면의 사각형(area)을 매체 원본 좌표로 옮겨 평균 밝기를 읽는다 (object-fit: cover 기준).
        // 아직 그릴 수 없는 매체는 null
        var readMediaLuma = function (media, box, area) {
            var naturalWidth = media.videoWidth || media.naturalWidth;
            var naturalHeight = media.videoHeight || media.naturalHeight;
            if (!naturalWidth || (media.tagName === "VIDEO" && media.readyState < 2)) return null;
            var scale = Math.max(box.width / naturalWidth, box.height / naturalHeight);
            var offsetX = (box.width - naturalWidth * scale) / 2;
            var offsetY = (box.height - naturalHeight * scale) / 2;
            try {
                toneContext = toneContext || toneCanvas.getContext("2d", { willReadFrequently: true });
                toneContext.drawImage(media,
                    (area.left - box.left - offsetX) / scale, (area.top - box.top - offsetY) / scale,
                    (area.right - area.left) / scale, (area.bottom - area.top) / scale,
                    0, 0, toneCanvas.width, toneCanvas.height);
                var pixels = toneContext.getImageData(0, 0, toneCanvas.width, toneCanvas.height).data;
                var sum = 0;
                for (var i = 0; i < pixels.length; i += 4) {
                    sum += (.2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2]) / 255;
                }
                return sum / (pixels.length / 4);
            } catch (error) {
                return null;
            }
        };

        // readPixels 가 false 면 픽셀은 읽지 않고, 매체 위를 벗어난 캡슐만 밝은 유리로 돌린다
        var updateGlassTone = function (readPixels) {
            var darkTheme = document.documentElement.getAttribute("data-theme") === "dark";
            var mediaBoxes = darkTheme ? [] : Array.prototype.map.call(document.querySelectorAll(".content-panel-busy video, .content-panel-busy img"), function (media) {
                return { media: media, box: media.getBoundingClientRect() };
            });
            var overlapping = false;
            Array.prototype.forEach.call(glassCapsules, function (capsule) {
                var reference = capsuleTextBox(capsule);
                var referenceSize = Math.max(1, (reference.right - reference.left) * (reference.bottom - reference.top));
                var luma = 0, covered = 0, unreadable = false;
                mediaBoxes.forEach(function (item) {
                    var area = {
                        left: Math.max(reference.left, item.box.left), top: Math.max(reference.top, item.box.top),
                        right: Math.min(reference.right, item.box.right), bottom: Math.min(reference.bottom, item.box.bottom)
                    };
                    if (area.right - area.left < 1 || area.bottom - area.top < 1) return;
                    if (!readPixels) {
                        unreadable = true;
                        return;
                    }
                    var value = readMediaLuma(item.media, item.box, area);
                    if (value === null) {
                        unreadable = true;
                        return;
                    }
                    var share = (area.right - area.left) * (area.bottom - area.top) / referenceSize;
                    luma += value * share;
                    covered += share;
                });
                var state = toneStates.get(capsule) || { dark: false, changedAt: 0 };
                var nextDark;
                if (covered > 0) {
                    overlapping = true;
                    var total = luma + TONE_PAGE_LUMA * Math.max(0, 1 - covered);
                    nextDark = state.dark ? total < TONE_LIGHT_ABOVE : total < TONE_DARK_BELOW;
                    if (nextDark !== state.dark && performance.now() - state.changedAt < TONE_HOLD_MS) nextDark = state.dark;
                } else if (unreadable) {
                    overlapping = true;
                    nextDark = state.dark; // 스크롤 중이거나 매체가 준비되지 않았으면 그대로 둔다
                } else {
                    nextDark = false; // 매체 위를 벗어나면 바로 밝은 유리로
                }
                if (nextDark !== state.dark) {
                    state = { dark: nextDark, changedAt: performance.now() };
                    capsule.classList.toggle("is-over-dark", nextDark);
                }
                toneStates.set(capsule, state);
            });
            if (readPixels && overlapping && !toneTimer) {
                toneTimer = setInterval(function () { updateGlassTone(true); }, TONE_SAMPLE_MS);
            } else if ((!readPixels || !overlapping) && toneTimer) {
                clearInterval(toneTimer);
                toneTimer = null;
            }
        };

        var toneGeometryQueued = false;
        if (GLASS_TONE_ENABLED) {
            window.addEventListener("scroll", function () {
                if (!toneGeometryQueued) {
                    toneGeometryQueued = true;
                    requestAnimationFrame(function () {
                        toneGeometryQueued = false;
                        updateGlassTone(false);
                    });
                }
                clearTimeout(toneScrollIdleTimer);
                toneScrollIdleTimer = setTimeout(function () { updateGlassTone(true); }, TONE_SCROLL_IDLE_MS);
            }, { passive: true });
            window.addEventListener("load", function () { updateGlassTone(true); });
            updateGlassTone(true);
        }

        // 스크롤 방향 반응 (P12, D10): 6px 넘게 움직였을 때만 방향을 판정해
        // 손 떨림에 흔들리지 않게 하고, 아래 방향은 상단 80px 아래에서만 —
        // 페이지 맨 위에서는 내비바가 펴진 채로 있어야 한다.
        // 속성은 html 에 두어 containers.css 의 축소 규칙이 내비바에 걸린다.
        // 같은 값을 다시 쓰지 않고 방향이 바뀔 때만 쓴다
        var lastDirectionY = window.scrollY;
        var scrollDirection = null;
        window.addEventListener("scroll", function () {
            var y = window.scrollY;
            var delta = y - lastDirectionY;
            if (Math.abs(delta) <= 6) return;
            var nextDirection = delta > 0 && y > 80 ? "down" : "up";
            if (nextDirection !== scrollDirection) {
                scrollDirection = nextDirection;
                document.documentElement.setAttribute("data-scroll-direction", nextDirection);
            }
            lastDirectionY = y;
        }, { passive: true });
    }

    // 크롬 유리의 접점 반응 (glass.css "크롬 유리의 접점 반응" 절)
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // 접점 발광: 누르는 동안 포인터 자리를 --glass-glow-x/y 에 쓰고 .is-glowing 을 붙인다
    document.querySelectorAll(".glass-capsule").forEach(function (glass) {
        var pressing = false;
        function placeGlow(event) {
            var rect = glass.getBoundingClientRect();
            glass.style.setProperty("--glass-glow-x", (event.clientX - rect.left) + "px");
            glass.style.setProperty("--glass-glow-y", (event.clientY - rect.top) + "px");
        }
        glass.addEventListener("pointerdown", function (event) {
            pressing = true;
            placeGlow(event);
            glass.classList.add("is-glowing");
        });
        glass.addEventListener("pointermove", function (event) {
            if (pressing) placeGlow(event);
        });
        ["pointerup", "pointercancel", "pointerleave"].forEach(function (type) {
            glass.addEventListener(type, function () {
                pressing = false;
                glass.classList.remove("is-glowing");
            });
        });
    });

    // 선택 렌즈: 아이콘 버튼 그룹마다 렌즈 한 장을 심고, 포인터가 올라간 버튼의
    // 자리·크기로 옮긴다. 그룹에 처음 들어올 때는 전환 없이 그 자리에 놓고,
    // 버튼 사이를 옮길 때는 이동 방향으로 살짝 늘어났다 돌아온다
    document.querySelectorAll(".menu-capsule").forEach(function (group) {
        var lens = document.createElement("span");
        lens.className = "selection-lens";
        lens.setAttribute("aria-hidden", "true");
        group.insertBefore(lens, group.firstChild);
        group.classList.add("has-selection-lens");

        var lastPosition = null;
        group.querySelectorAll(".icon-link").forEach(function (button) {
            button.addEventListener("pointerenter", function () {
                var x = button.offsetLeft, y = button.offsetTop;
                lens.style.width = button.offsetWidth + "px";
                lens.style.height = button.offsetHeight + "px";
                if (!lastPosition) {
                    lens.classList.add("is-placing");
                    lens.style.translate = x + "px " + y + "px";
                    void lens.offsetWidth; // 전환 없이 놓인 자리를 확정한 뒤 전환을 되살린다
                    lens.classList.remove("is-placing");
                } else {
                    if (!reducedMotion.matches) {
                        var horizontal = Math.abs(x - lastPosition.x) >= Math.abs(y - lastPosition.y);
                        lens.style.scale = horizontal ? "1.1 .95" : ".95 1.1";
                        setTimeout(function () { lens.style.scale = "1 1"; }, 130);
                    }
                    lens.style.translate = x + "px " + y + "px";
                }
                lastPosition = { x: x, y: y };
                lens.classList.add("is-on");
            });
        });
        group.addEventListener("pointerleave", function () {
            lens.classList.remove("is-on");
            lastPosition = null;
        });
    });

    // scroll 중 hover 억제: 휠 노치마다(스크롤 제스처가 끝날 때마다) Chrome 이
    // 포인터 아래 행의 hover 를 갱신해 행 배경이 켜졌다 꺼지고, 그때마다 결과
    // 카드가 재페인트되어 GPU 래스터를 기다린다 (ui-overhaul-2 7턴 실측: 첫
    // 스크롤 최장 프레임 67~100ms, hover 규칙을 끄면 17ms). 풀어 주는 기준은
    // scrollend 가 아니라 250ms 무입력 — 천천히 노치 단위로 굴릴 때 노치 사이에도
    // 억제가 유지돼야 하고, 순간 점프 스크롤(프로그램 scrollTo)은 프레임마다
    // scroll·scrollend 가 짝으로 와서 클래스가 깜빡이기 때문이다.
    // CSS 는 song-table.css 의 body.is-scrolling 규칙이 맡는다
    var scrollIdleTimer = null;
    var clearScrolling = function () {
        clearTimeout(scrollIdleTimer);
        scrollIdleTimer = null;
        document.body.classList.remove("is-scrolling");
    };
    var markScrolling = function () {
        if (scrollIdleTimer === null) document.body.classList.add("is-scrolling");
        clearTimeout(scrollIdleTimer);
        scrollIdleTimer = setTimeout(clearScrolling, 250);
    };
    window.addEventListener("scroll", markScrolling, { passive: true });

    // 보케: 팔레트·불투명도는 markup 값을 유지하고, 위치와 크기만 로드마다 다르게.
    // 위치는 % 가 아니라 px 로 박는다 — % 로 두면 더보기(컬랩스)로 섹션 높이가
    // 변하는 동안 매 프레임 블러 원들이 재배치·재페인트되어 버벅임의 원인이 된다
    var bokehCoveredHeights = new WeakMap(); // 점이 흩어져 있는 영역 높이 (증감 판단 기준)
    function scatterBokeh() {
        // 전체 재산포는 확장 커버용 추가 점(data-clone)을 걷어내고 원본만 다시 편다
        document.querySelectorAll(".bokeh i[data-clone]").forEach(function (dot) {
            dot.remove();
        });
        document.querySelectorAll(".bokeh i").forEach(function (dot) {
            var area = dot.parentElement.getBoundingClientRect();
            var host = dot.parentElement.parentElement.getBoundingClientRect();
            var off = (area.width - host.width) / 2; // .bokeh 의 좌우 클리핑 여백
            // 재산포 시 랜덤 크기가 누적 증폭되지 않도록 markup 원본 크기를 저장해 둔다
            var base = parseFloat(dot.getAttribute("data-s") || dot.style.getPropertyValue("--s")) || 240;
            dot.setAttribute("data-s", base);
            var size = Math.round(base * (.8 + Math.random() * .5));
            dot.style.setProperty("--x", Math.round(off + (Math.random() * 100 - 10) / 100 * host.width) + "px");
            // 점 크기를 빼고 놓는다 — 아래 클리핑 경계에 걸치면 가로 직선으로 잘린다
            dot.style.setProperty("--y", Math.round(Math.random() * Math.max(0, area.height - size)) + "px");
            dot.style.setProperty("--s", size + "px");
        });
        document.querySelectorAll(".bokeh").forEach(function (b) {
            bokehCoveredHeights.set(b, b.getBoundingClientRect().height);
        });
    }
    scatterBokeh();

    // px 고정 위치는 뷰포트 폭이 바뀌면(회전, 창 크기 조절) 어긋나므로 다시 흩뿌린다.
    // 뷰포트 높이만 변하는 경우(모바일 주소창 접힘)는 건드리지 않아
    // 더보기 최적화(px 고정)가 그대로 유지된다
    var bokehLastWidth = window.innerWidth;
    var bokehResizeTimer = null;
    window.addEventListener("resize", function () {
        clearTimeout(bokehResizeTimer);
        bokehResizeTimer = setTimeout(function () {
            if (window.innerWidth !== bokehLastWidth) {
                bokehLastWidth = window.innerWidth;
                scatterBokeh();
            }
        }, 200);
    });

    // 산포는 로드 시점 영역 높이에 px 로 박히므로, 검색 결과 펼침처럼 기준
    // 영역이 자라면 새 구간에는 보케가 없다(줄면 영역 밖에 점이 남는다).
    // 기존 점을 옮기면(전체 재산포) 접기/펴기마다 배경이 통째로 바뀌어
    // 부자연스러우므로, 기존 점은 그대로 두고 **새로 생긴 구간에만** 추가
    // 점(data-clone, 원본 팔레트 순환)을 심고 줄면 그 추가분만 걷어낸다.
    // 300ms 디바운스 — 컬랩스 전환 중에는 계속 밀려 매 프레임 작업이 없다
    // 추가 점은 뿅 나타나지 않고 opacity 만 전환해 떠오른다(사용자 피드백) —
    // opacity 는 컴포지터 처리라 블러 원이어도 성능 부담이 없다
    var bokehReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function fadeInBokehDot(dot) {
        if (bokehReduceMotion) return;
        dot.style.opacity = "0";
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                dot.style.transition = "opacity 1.4s ease";
                dot.style.opacity = "1";
            });
        });
    }
    function fadeOutBokehDot(dot) {
        if (bokehReduceMotion) { dot.remove(); return; }
        dot.style.transition = "opacity 1s ease";
        dot.style.opacity = "0";
        setTimeout(function () { dot.remove(); }, 1100);
    }

    function coverBokehGrowth(b, covered, height) {
        var originals = b.querySelectorAll("i:not([data-clone])");
        if (!originals.length) return;
        var span = height - covered;
        var count = Math.min(8, Math.max(1, Math.round(span / 350)));
        var hostWidth = b.parentElement.getBoundingClientRect().width;
        var off = (b.getBoundingClientRect().width - hostWidth) / 2; // 좌우 클리핑 여백
        for (var i = 0; i < count; i++) {
            var src = originals[i % originals.length];
            var base = parseFloat(src.getAttribute("data-s")) || 240;
            var size = Math.round(base * (.8 + Math.random() * .5));
            // 점 크기를 뺀 자리가 없으면 심지 않는다 — 아래 클리핑 경계에
            // 걸치면 가로 직선으로 잘린다
            if (covered + size > height) continue;
            var dot = src.cloneNode(false);
            dot.setAttribute("data-clone", "");
            dot.style.setProperty("--x", Math.round(off + (Math.random() * 100 - 10) / 100 * hostWidth) + "px");
            dot.style.setProperty("--y", Math.round(covered + Math.random() * (height - size - covered)) + "px");
            dot.style.setProperty("--s", size + "px");
            b.appendChild(dot);
            fadeInBokehDot(dot);
        }
    }

    if (window.ResizeObserver) {
        var bokehGrowTimer = null;
        var bokehObserver = new ResizeObserver(function () {
            clearTimeout(bokehGrowTimer);
            bokehGrowTimer = setTimeout(function () {
                document.querySelectorAll(".bokeh").forEach(function (b) {
                    var covered = bokehCoveredHeights.get(b) || 0;
                    var h = b.getBoundingClientRect().height;
                    if (h > covered + 150) {
                        coverBokehGrowth(b, covered, h);
                        bokehCoveredHeights.set(b, h);
                    } else if (h < covered - 150) {
                        b.querySelectorAll("i[data-clone]").forEach(function (dot) {
                            // 점 바닥이 줄어든 경계를 넘으면 걷어낸다 — 걸친 채 남으면
                            // 가로 직선으로 잘린 모습이 된다
                            var bottom = parseFloat(dot.style.getPropertyValue("--y")) + parseFloat(dot.style.getPropertyValue("--s"));
                            if (bottom > h) fadeOutBokehDot(dot);
                        });
                        bokehCoveredHeights.set(b, h);
                    }
                });
            }, 300);
        });
        document.querySelectorAll(".bokeh").forEach(function (b) {
            bokehObserver.observe(b);
        });
    }

    // 접힘 스크롤 팔로우 (index 더보기): 최하단 근처에서 접으면 문서가 줄며
    // 브라우저가 scrollY 를 계단식으로 클램프해 화면이 우두커니 남는다 —
    // 대신 접힘과 함께 화면을 토글 버튼이 뷰포트 중앙에 오는 위치로 감속
    // 이동시킨다. 높이 예약 없이 동작한다: 목표 위치가 접힘 완료 후 레이아웃
    // 기준이라 전환 중 클램프와 충돌하지 않는다. 사용자 입력(휠·터치·키)이
    // 들어오면 즉시 중단하고 양보한다
    var followReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var followRaf = null;
    var followCleanup = null;

    function cancelFollowScroll() {
        if (followRaf) cancelAnimationFrame(followRaf);
        followRaf = null;
        if (followCleanup) { followCleanup(); followCleanup = null; }
        document.documentElement.style.overflowAnchor = "";
    }

    // easeOutExpo — 표(ease)를 앞서가는 선행 곡선. "치고 나가서 부드럽게
    // 정착"이 또렷하고, 표(500ms)보다 긴 850ms 로 감속 꼬리를 남긴다 (7턴)
    function easeOutExpo(t) {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        return 1 - Math.pow(2, -10 * t);
    }

    // easeInOutSine — index 접힘 2박자(시안 A)의 활강 곡선 (22턴). 접힘 완료
    // 시점(정지 상태)에서 출발하므로 램프 0 으로 완만히 붙는다 — 정지에서
    // expo 로 치면 발차기처럼 읽히고, cubic 은 램프가 길어 박자 사이
    // 쉼이 300ms 대로 늘어진다 (실측). sine 은 쉼 ~200ms 로 이어 붙는다
    function easeInOutSine(t) {
        return -(Math.cos(Math.PI * t) - 1) / 2;
    }

    // 임계감쇠 스프링 곡선 (시안 B, 22턴): 1 − e^(−ωt)(1+ωt).
    // 접힘과 "동시에" 출발하는 연속형 — 출발이 포물선(속도 0)이라
    // 초반 ~100ms 는 접힘 클램프와 위치·속도가 겹치며 자연스럽게
    // 이어받고, 이후 스프링이 앞서 내려가 한 호흡으로 감속 정착한다.
    // ω=9, T=1200ms (ωT=10.8) — 98% 정착 0.64s + 긴 마이크로 꼬리
    var SPRING_WT = 10.8;
    var SPRING_NORM = 1 - Math.exp(-SPRING_WT) * (1 + SPRING_WT);
    function springEase(t) {
        var wt = SPRING_WT * t;
        return (1 - Math.exp(-wt) * (1 + wt)) / SPRING_NORM;
    }

    // index 접힘 팔로우 방식:
    //  "track"    — 시안 B2: 버튼을 화면 중앙으로 포착 후 고정한 채 함께 이동
    //  "spring"   — 시안 B: 최종 목표로 동시 스프링 (버튼은 도착 시에만 중앙)
    //  "two-beat" — 시안 A: 접힘 완료 후 활강
    var indexFollowMode = "track";

    function followScroll(fromY, toY, opts) {
        var duration = (opts && opts.duration) || 850;
        var ease = (opts && opts.ease) || easeOutExpo;
        if (followReduceMotion || Math.abs(toY - fromY) < 1) {
            document.documentElement.style.overflowAnchor = "";
            return;
        }
        // 콘텐츠가 뷰포트 위에서 줄어들 때 스크롤 앵커링이 매 프레임 y 를
        // 덮어써 팔로우를 삼킨다 (실측: 최종 y 가 정확히 클램프 경로) —
        // 팔로우 동안만 끄고, 종료·중단 시 cancelFollowScroll 이 복원한다
        document.documentElement.style.overflowAnchor = "none";
        var start = null;
        var abort = function () { cancelFollowScroll(); };
        window.addEventListener("wheel", abort, { passive: true });
        window.addEventListener("touchstart", abort, { passive: true });
        window.addEventListener("keydown", abort);
        followCleanup = function () {
            window.removeEventListener("wheel", abort);
            window.removeEventListener("touchstart", abort);
            window.removeEventListener("keydown", abort);
        };
        function step(ts) {
            if (start === null) start = ts;
            var t = Math.min((ts - start) / duration, 1);
            window.scrollTo(0, fromY + (toY - fromY) * ease(t));
            if (t < 1) {
                followRaf = requestAnimationFrame(step);
            } else {
                cancelFollowScroll();
            }
        }
        followRaf = requestAnimationFrame(step);
    }

    // "track" 팔로우 — 버튼의 실위치를 매 프레임 읽어 카메라를 버튼에 건다.
    // 화면 기준 버튼의 중앙 이탈량(e)만 스프링 곡선으로 0 까지 줄인다:
    //   y = desired(t) − e0·(1 − springEase(t/T)),  desired = 버튼 중앙이 화면
    //   중앙에 오는 스크롤값(실시간). e 가 줄어드는 동안은 버튼이 화면 안에서
    //   중앙으로 활강하고(1국면), 0 이 된 뒤로는 버튼에 고정된 채 접힘을 따라
    //   함께 이동한다(2국면). 접힘의 문서 수축·버튼 이동을 그대로 흡수하므로
    //   사전 실측(display 토글)이 필요 없다. 종료는 포착 완료 + hidden 이후.
    //   관성 활강의 몸통은 접힘 전환 자체(glass.css .closing 1s 감속 곡선)가
    //   만들고, 포착은 그 활강 내내 버튼을 중앙 근처로 스르륵 모으는 역할 —
    //   접힘(1s)과 거의 같은 길이로 두어 "딱 고정" 대신 근접 유지로 읽히게 한다
    var TRACK_CAPTURE_MS = 900;

    // (보관) 시안 C 포착 곡선 — 언더댐핑 스프링: 중앙을 지나쳤다 되돌아온다.
    // 오버슛 = e^(−πζ/√(1−ζ²)) (ζ=.45 → ~21%), ωT=7 → 피크 ~0.5T.
    // 22턴 실험 결과 기각 — 스크롤 오버슛은 화면 전체 평행이동이라 "뿅"으로
    // 읽히지 않고, 도착 순간 버튼 scale 뿅(settle-pop)도 시험 후 기각.
    // 되살리려면 followTrackButton 의 springEase 를 trackEase 로 바꾸면 된다
    var TRACK_ZETA = 0.45;
    var TRACK_WT = 7;
    var trackEaseNorm = null;
    function trackEaseRaw(t) {
        var zw = TRACK_ZETA * TRACK_WT;
        var wd = TRACK_WT * Math.sqrt(1 - TRACK_ZETA * TRACK_ZETA);
        return 1 - Math.exp(-zw * t) * (Math.cos(wd * t) + (zw / wd) * Math.sin(wd * t));
    }
    function trackEase(t) {
        if (trackEaseNorm === null) trackEaseNorm = trackEaseRaw(1);
        return trackEaseRaw(t) / trackEaseNorm;
    }
    var trackHiddenDone = false;
    // 접힘 완료 신호 — track 팔로우의 종료 허가. index 는 hidden.bs.collapse,
    // 검색 더보기는 높이 전환의 onfinish 가 호출한다 (팔로우는 한 번에 하나만
    // 도니 플래그 공유로 충분하다)
    function settleFollowTrack() { trackHiddenDone = true; }
    // index 지난달 컬랩스와 검색 더보기(song-search.js)가 같은 곡선·시간으로
    // 쓴다 — 두 접힘 모두 1s 감속 높이 전환이라 한 호흡이다 (ADR 0004)
    function followTrackButton(btnEl) {
        if (followReduceMotion) return;
        var captureEase = springEase;
        var captureMs = TRACK_CAPTURE_MS;
        var se = document.scrollingElement || document.documentElement;
        document.documentElement.style.overflowAnchor = "none";
        trackHiddenDone = false;
        var e0 = null;
        var start = null;
        var abort = function () { cancelFollowScroll(); };
        window.addEventListener("wheel", abort, { passive: true });
        window.addEventListener("touchstart", abort, { passive: true });
        window.addEventListener("keydown", abort);
        followCleanup = function () {
            window.removeEventListener("wheel", abort);
            window.removeEventListener("touchstart", abort);
            window.removeEventListener("keydown", abort);
        };
        function step(ts) {
            if (start === null) start = ts;
            var t = Math.min((ts - start) / captureMs, 1);
            var r = btnEl.getBoundingClientRect();
            var desired = r.top + r.height / 2 + window.scrollY - se.clientHeight / 2;
            // 문서가 전환 중에 실제로 줄어드는 만큼 상한도 프레임마다 따라간다
            var natural = se.scrollHeight - se.clientHeight;
            desired = Math.max(0, Math.min(natural, desired));
            if (e0 === null) e0 = desired - window.scrollY;
            window.scrollTo(0, desired - e0 * (1 - captureEase(t)));
            // hidden 미발화 대비 3s 안전 상한
            if (t >= 1 && (trackHiddenDone || ts - start > 3000)) {
                cancelFollowScroll();
                return;
            }
            followRaf = requestAnimationFrame(step);
        }
        followRaf = requestAnimationFrame(step);
    }

    ["tjLastMonthSongContentBorder", "kyLastMonthSongContentBorder"].forEach(function (id) {
        var collapseEl = document.getElementById(id);
        if (!collapseEl) return;
        var toggleBtn = document.querySelector('[data-bs-target="#' + id + '"]');

        // 2박자 팔로우 (22턴): 접히는 동안(1박자)은 브라우저 클램프가 화면을
        // 자연스럽게 당기게 두고, 접힘 완료(hidden) 시점의 실제 위치에서
        // 목표까지 활강(2박자)한다. 접힘 중에 트윈을 같이 돌리면 곡선이
        // 클램프보다 느린 구간에서 화면이 멈칫한다 (실측: ~200ms 정지).
        // 예약(1박자 중) 상태의 사용자 입력은 팔로우를 취소한다
        var pendingFollowTarget = null;

        function removePendingListeners() {
            window.removeEventListener("wheel", cancelPendingFollow);
            window.removeEventListener("touchstart", cancelPendingFollow);
            window.removeEventListener("keydown", cancelPendingFollow);
        }

        function cancelPendingFollow() {
            pendingFollowTarget = null;
            removePendingListeners();
            document.documentElement.style.overflowAnchor = "";
        }

        collapseEl.addEventListener("hide.bs.collapse", function () {
            // 접히는 동안 행 리빌(row-in) 정지 — 아래 측정의 display 토글이
            // 애니메이션을 재시작시켜 행이 사라졌다 다시 떠오르는 것을 막는다
            collapseEl.classList.add("closing");
            cancelFollowScroll();
            if (!toggleBtn) return;
            if (indexFollowMode === "track") {
                followTrackButton(toggleBtn);
                return;
            }
            var se = document.scrollingElement || document.documentElement;
            var docEl = document.documentElement;
            var y0 = window.scrollY;
            // 접힘 완료 후 레이아웃을 페인트 전에 실측한다 (display 강제 후 원복).
            // 그리드 2열 구조라 문서 수축량·버튼 이동량이 컬랩스 높이와 다르므로
            // 예측 대신 실측이 정확하다. 측정 중에는 html min-height 받침과
            // overflow-anchor 해제를 한 쌍으로 건다 — 받침만으로는 뷰포트 위
            // 콘텐츠가 사라지는 순간 스크롤 앵커링이 y 를 즉시 끌어올리고
            // 원복해도 돌아오지 않아 측정·팔로우가 전부 오염된다 (실측)
            var shBefore = se.scrollHeight;
            var footer = document.querySelector(".footer");
            if (!footer) return;
            docEl.style.minHeight = shBefore + "px";
            docEl.style.overflowAnchor = "none";
            var fBefore = footer.getBoundingClientRect().top;
            var style = collapseEl.style;
            style.display = "none";
            var fAfter = footer.getBoundingClientRect().top;
            var btnRect = toggleBtn.getBoundingClientRect();
            var btnCenterAfter = btnRect.top + btnRect.height / 2 + y0;
            style.display = "";
            docEl.style.minHeight = "";
            var delta = fBefore - fAfter; // 실제 문서 수축량 (footer 상승분)
            var futureMax = Math.max(0, shBefore - delta - se.clientHeight);
            // 버튼이 뷰포트 중앙에 오는 y. 문서 범위(0..futureMax)로만 자르고
            // 방향은 제한하지 않는다 — 중간 지점에서 접어도 위·아래 어느 쪽이든
            // 중앙으로 정렬한다. 아래 방향은 수축(최대치 감소)과 겹치지 않으므로
            // 클램프 간섭이 없다
            var centered = btnCenterAfter - se.clientHeight / 2;
            var target = Math.max(0, Math.min(futureMax, centered));
            if (Math.abs(target - y0) < 1) {
                docEl.style.overflowAnchor = ""; // 이동 불요 — 앵커링 원복
                return;
            }
            if (indexFollowMode === "spring") {
                // 시안 B: 접힘과 동시에 스프링 감속. 초반은 클램프와 겹치고
                // (scrollTo 가 max 로 잘려 자동으로 min(스프링, 클램프)),
                // 이후 스프링이 앞서 내려가므로 멈칫 구간이 없다
                followScroll(y0, target, { duration: 1200, ease: springEase });
                return;
            }
            // 시안 A: 활강은 hidden 에서 시작 — overflow-anchor 는 예약
            // 취소 또는 followScroll 종료가 복원한다
            pendingFollowTarget = target;
            window.addEventListener("wheel", cancelPendingFollow, { passive: true });
            window.addEventListener("touchstart", cancelPendingFollow, { passive: true });
            window.addEventListener("keydown", cancelPendingFollow);
        });

        collapseEl.addEventListener("hidden.bs.collapse", function () {
            collapseEl.classList.remove("closing");
            settleFollowTrack(); // track 팔로우 종료 허가
            removePendingListeners();
            if (pendingFollowTarget !== null) {
                var target = pendingFollowTarget;
                pendingFollowTarget = null;
                // 검색·애창곡 호출부는 기본값(850ms 선행 곡선) 유지
                followScroll(window.scrollY, target, { duration: 850, ease: easeInOutSine });
            }
        });

        collapseEl.addEventListener("show.bs.collapse", function () {
            collapseEl.classList.remove("closing"); // 접힘 중 재펼침 대비
            cancelPendingFollow();
            cancelFollowScroll();
        });
    });

    // 다른 스크립트(검색 더보기 등)도 같은 팔로우를 쓸 수 있게 공개.
    // followTrackButton 을 쓰는 쪽은 접힘 완료 시점에 settleFollowTrack 을
    // 호출해 종료를 허가한다 (2기 1턴: 검색 더보기 접기가 track 으로 합류 —
    // 선계산 활강은 높이 전환과 곡선이 어긋나 화면이 프레임마다 요동했다)
    window.glassMotion = {
        followScroll: followScroll,
        cancelFollowScroll: cancelFollowScroll,
        followTrackButton: followTrackButton,
        settleFollowTrack: settleFollowTrack
    };

    } // init 끝
})();
