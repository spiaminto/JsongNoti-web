/**
 * glass-motion.js — 글래스모피즘 공통 모션
 * 기준 시안: static/design-preview/11-1-liquid-glass-fluid.html
 *
 * 담당:
 *  1) 로드 시퀀스: .veil 요소에 .on 을 붙여 --vd 딜레이 순서대로 띄운다
 *  2) 스크롤 리빌: [data-lift] 요소가 30% 이상 보이면 .is-lit 을 붙인다 (기존 fade-in.js 대체)
 *  3) scroll edge: 콘텐츠가 상단바 아래로 지나갈 때 .navbar 재질을 두껍게 하고,
 *     화면 상단 점진 블러 베일(.scroll-veil)을 심어 콘텐츠를 가장자리에서 디졸브 (ui-rnd 5턴)
 *  4) 반사광: .sheen 유리에서 포인터를 따라 --mx/--my 를 갱신
 *  5) 보케: .bokeh i 의 위치·크기를 로드마다 랜덤으로 흩뿌린다
 *  6) 접힘 스크롤 팔로우: index 더보기를 접으면 토글 버튼을 화면 중앙까지
 *     활강시켜 포착한 뒤, 중앙에 고정한 채 접힘을 따라 함께 이동한다. followScroll 은
 *     window.glassMotion 으로 공개되어 검색 더보기 접힘과 애창곡 노래
 *     클릭 스크롤(song-search.js)도 쓴다
 *  7) interaction glow: 유리 버튼 pointerdown 접점 좌표(--glow-x/--glow-y)를
 *     심고 .glowing 을 토글한다 — 발광 자체는 CSS(@property transition) (ui-rnd 5턴)
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

    // scroll edge: 콘텐츠가 상단바 아래로 지나갈 때만 재질을 두껍게.
    // 상단 점진 블러 베일(.scroll-veil)은 상단바 있는 페이지에만 심는다 —
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
    }

    // interaction glow: 누른 접점에서 국소 발광 — 좌표만 심고 발광은 CSS 가 맡는다
    var glowReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.addEventListener("pointerdown", function (e) {
        if (glowReduceMotion) return;
        var btn = e.target.closest(".btn, .glass-btn");
        if (!btn) return;
        var rect = btn.getBoundingClientRect();
        btn.style.setProperty("--glow-x", Math.round(e.clientX - rect.left) + "px");
        btn.style.setProperty("--glow-y", Math.round(e.clientY - rect.top) + "px");
        btn.classList.add("glowing");
    });

    // 어디서 떼든(버튼 밖 드래그 아웃 포함) 발광을 감쇠 국면으로 넘긴다
    function fadeGlow() {
        document.querySelectorAll(".glowing").forEach(function (el) {
            el.classList.remove("glowing");
        });
    }
    document.addEventListener("pointerup", fadeGlow);
    document.addEventListener("pointercancel", fadeGlow);

    // 반사광: 포인터와 1:1 로 따라온다 (rAF 로 요소당 프레임당 1회만 갱신)
    document.querySelectorAll(".sheen").forEach(function (el) {
        var pending = false;
        el.addEventListener("pointermove", function (e) {
            if (pending) return;
            pending = true;
            requestAnimationFrame(function () {
                var rect = el.getBoundingClientRect();
                el.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width * 100).toFixed(2) + "%");
                el.style.setProperty("--my", ((e.clientY - rect.top) / rect.height * 100).toFixed(2) + "%");
                el.classList.add("lit-by-pointer");
                pending = false;
            });
        });
        el.addEventListener("pointerleave", function () {
            el.classList.remove("lit-by-pointer");
        });
    });

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
    // 검색 더보기는 래퍼 transitionend 가 호출한다 (팔로우는 한 번에 하나만
    // 도니 플래그 공유로 충분하다)
    function settleFollowTrack() { trackHiddenDone = true; }
    function followTrackButton(btnEl) {
        if (followReduceMotion) return;
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
            var t = Math.min((ts - start) / TRACK_CAPTURE_MS, 1);
            var r = btnEl.getBoundingClientRect();
            var desired = r.top + r.height / 2 + window.scrollY - se.clientHeight / 2;
            desired = Math.max(0, Math.min(se.scrollHeight - se.clientHeight, desired));
            if (e0 === null) e0 = desired - window.scrollY;
            window.scrollTo(0, desired - e0 * (1 - springEase(t)));
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
