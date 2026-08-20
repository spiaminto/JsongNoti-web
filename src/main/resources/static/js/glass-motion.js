/**
 * glass-motion.js — 글래스모피즘 공통 모션
 * 기준 시안: static/design-preview/11-1-liquid-glass-fluid.html
 *
 * 담당:
 *  1) 로드 시퀀스: .veil 요소에 .on 을 붙여 --vd 딜레이 순서대로 띄운다
 *  2) 스크롤 리빌: [data-lift] 요소가 30% 이상 보이면 .is-lit 을 붙인다 (기존 fade-in.js 대체)
 *  3) scroll edge: 콘텐츠가 상단바 아래로 지나갈 때만 .navbar 재질을 두껍게
 *  4) 반사광: .sheen 유리에서 포인터를 따라 --mx/--my 를 갱신
 *  5) 보케: .bokeh i 의 위치·크기를 로드마다 랜덤으로 흩뿌린다
 *  6) 더보기 높이 예약: 랜딩 컬랩스가 문서 높이를 매 프레임 키우지 않게 한다
 *  7) 검색 결과 컬랩스 예약: 검색·애창곡의 결과 컬랩스에 6)과 같은 원리를 적용한다
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

    // scroll edge: 콘텐츠가 상단바 아래로 지나갈 때만 재질을 두껍게
    var navbar = document.querySelector(".navbar");
    if (navbar) {
        var onScroll = function () {
            navbar.classList.toggle("scrolled", window.scrollY > 8);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
    }

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
    function scatterBokeh() {
        document.querySelectorAll(".bokeh i").forEach(function (dot) {
            var area = dot.parentElement.getBoundingClientRect();
            // 재산포 시 랜덤 크기가 누적 증폭되지 않도록 markup 원본 크기를 저장해 둔다
            var base = parseFloat(dot.getAttribute("data-s") || dot.style.getPropertyValue("--s")) || 240;
            dot.setAttribute("data-s", base);
            dot.style.setProperty("--x", Math.round((Math.random() * 100 - 10) / 100 * area.width) + "px");
            dot.style.setProperty("--y", Math.round(Math.random() * .92 * area.height) + "px");
            dot.style.setProperty("--s", Math.round(base * (.8 + Math.random() * .5)) + "px");
        });
    }
    scatterBokeh();

    // px 고정 위치는 뷰포트 폭이 바뀌면(회전, 창 크기 조절) 어긋나므로 다시 흩뿌린다.
    // 높이만 변하는 경우(모바일 주소창 접힘, 컬랩스 펼침)는 건드리지 않아
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

    // 더보기 높이 예약: 컬랩스가 문서 높이를 매 프레임 키우면 루트 스크롤 레이어가
    // 프레임마다 리사이즈·재타일링되어 GPU 가 프레임을 놓친다 (5.5턴 트레이스 실측 —
    // 밀려나는 콘텐츠를 숨겨도 버벅임이 남고, 높이를 예약하면 사라진다).
    // 펼침·접힘 시작 순간 그리드 min-height 를 최종 높이로 고정해 문서 높이를
    // 1프레임에 확정하고, 아래 콘텐츠(.showcase/.footer)는 transform 합성
    // 애니메이션으로 기존처럼 미끄러뜨린다. 트랜지션이 끝나면 min-height 를 해제해
    // 평상시 반응형 레이아웃에는 관여하지 않는다.
    var songsGrid = document.querySelector(".songs-grid");
    var lastMonthCollapses = [
        document.getElementById("tjLastMonthSongContentBorder"),
        document.getElementById("kyLastMonthSongContentBorder")
    ];
    if (songsGrid && lastMonthCollapses[0] && lastMonthCollapses[1]) {
        var belowGrid = [document.querySelector(".showcase"), document.querySelector(".footer")]
            .filter(Boolean);
        var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        // song-table.css .collapsing 의 transition(0.5s ease)과 맞춘다
        var GLIDE = { duration: 500, easing: "ease" };
        var glides = [];

        // 아래 콘텐츠를 from → to(px) 로 미끄러뜨린다. 문서 높이와 무관한
        // transform 이라 컴포지터에서만 움직인다 (5.5턴: 그리기 비용은 무죄)
        function glideBelow(fromY, toY, fill) {
            if (reduceMotion || fromY === toY) return;
            belowGrid.forEach(function (el) {
                glides.push(el.animate(
                    [{ transform: "translateY(" + fromY + "px)" }, { transform: "translateY(" + toY + "px)" }],
                    { duration: GLIDE.duration, easing: GLIDE.easing, fill: fill }
                ));
            });
        }

        function releaseGlides() {
            glides.forEach(function (a) { a.cancel(); });
            glides = [];
        }

        // 문서 높이 유지: 측정의 동기 레이아웃이나 글라이드 transform 이
        // 스크롤 오버플로(보케 번짐 등)를 끌어올려 scrollHeight 가 잠깐이라도
        // 줄면, 그 레이아웃에서 scrollY 클램프·스크롤 앵커링이 발동해 화면이
        // 튄다 (최하단 실측). 전환 시작부터 해제까지 html 최소 높이로 받친다
        var docEl = document.documentElement;

        function holdDocHeight() {
            var se = document.scrollingElement || docEl;
            docEl.style.minHeight = se.scrollHeight + "px";
            docEl.style.overflowAnchor = "none";
        }

        function unholdDocHeight() {
            docEl.style.minHeight = "";
            docEl.style.overflowAnchor = "";
        }

        // 예약 해제: min-height 와 transform 을 같은 프레임에 상쇄해 이어 붙인다
        function releaseReservation() {
            songsGrid.style.minHeight = "";
            unholdDocHeight();
            releaseGlides();
        }

        // 접힘 완료 시 문서가 한 번에 줄면 최하단 근처에서는 브라우저가
        // scrollY 를 강제 클램프해 화면이 튄다. 해제가 스크롤을 건드리지
        // 않을 때(scrollY <= 해제 후 maxScroll)만 해제하고, 아니면 위로
        // 스크롤해 안전해질 때까지 예약을 유지한다. scrollY 는 읽기만 한다
        var pendingRelease = null;

        function cancelPendingRelease() {
            if (!pendingRelease) return;
            window.removeEventListener("scroll", pendingRelease);
            window.removeEventListener("resize", pendingRelease);
            pendingRelease = null;
        }

        function tryReleaseReservation(delta) {
            var se = document.scrollingElement || document.documentElement;
            // 접힌 문서가 뷰포트보다 짧으면 음수가 된다 — 그대로 두면 scrollY(≥0)가
            // 영영 조건을 못 넘어 해제가 교착된다. 최대 스크롤이 사라지는 경우는
            // 클램프 점프도 없으므로 0 을 바닥으로 깐다
            var maxScrollAfter = Math.max(0, se.scrollHeight - delta - se.clientHeight);
            if (window.scrollY <= maxScrollAfter + 1) {
                cancelPendingRelease();
                releaseReservation();
                return;
            }
            if (pendingRelease) return; // 이미 대기 중
            pendingRelease = function () { tryReleaseReservation(delta); };
            window.addEventListener("scroll", pendingRelease, { passive: true });
            window.addEventListener("resize", pendingRelease);
        }

        // easeOutExpo — 스크롤이 표(ease)를 앞서가는 선행 곡선. 가속·감속의
        // 대비가 가장 큰 ease-out 이라 "치고 나가서 부드럽게 정착"이 또렷하다.
        // 표준 ease-out 은 중반부터 ease 에 뒤처져(ease 는 절반 시점에 80% 진행)
        // 선행감이 없어 쓰지 않는다 (7턴)
        function easeOutExpo(t) {
            if (t <= 0) return 0;
            if (t >= 1) return 1;
            return 1 - Math.pow(2, -10 * t);
        }

        // 팔로우는 표(500ms)보다 길게 잡는다 — 표가 끝나는 시점에 이미 98%+
        // 도착해 있고, 표가 사라진 뒤 감속 꼬리만 홀로 재생되므로 어긋나
        // 보이지 않는다. 500ms 안에서는 감속을 음미할 꼬리가 짧아 "슉 탁"이
        // 된다 (7턴 피드백)
        var FOLLOW = { duration: 850 };

        var followRaf = null;
        var followCleanup = null;

        function cancelFollowScroll() {
            if (followRaf) cancelAnimationFrame(followRaf);
            followRaf = null;
            if (followCleanup) { followCleanup(); followCleanup = null; }
        }

        // 스크롤 팔로우: 표보다 한발 앞서 목적지에 도착해 같이 멈춘다.
        // 이 함수가 scrollY 를 쓰는 유일한 지점이다 — 관성 스크롤(Lenis 등)
        // 도입 시 여기만 lenis.scrollTo 로 교체한다. 사용자 입력(휠·터치·키)이
        // 들어오면 즉시 중단하고 양보한다 (이후는 지연 해제가 안전망)
        function followScroll(fromY, toY) {
            if (reduceMotion || toY >= fromY) return;
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
                var t = Math.min((ts - start) / FOLLOW.duration, 1);
                window.scrollTo(0, fromY + (toY - fromY) * easeOutExpo(t));
                if (t < 1) {
                    followRaf = requestAnimationFrame(step);
                } else {
                    cancelFollowScroll();
                }
            }
            followRaf = requestAnimationFrame(step);
        }

        // 컬랩스를 잠깐 강제로 펴거나 접어 그리드 최종 높이를 잰다.
        // 페인트 전에 원복하므로 화면에는 보이지 않는다
        function measureGridHeight(collapseEl, forcedDisplay) {
            var style = collapseEl.style;
            style.display = forcedDisplay;
            style.height = forcedDisplay === "block" ? "auto" : "";
            var h = songsGrid.offsetHeight;
            style.display = "";
            style.height = "";
            return h;
        }

        lastMonthCollapses.forEach(function (collapseEl) {
            var closeDelta = 0;
            var toggleBtn = document.querySelector('[data-bs-target="#' + collapseEl.id + '"]');

            // 펼침: 문서 높이를 받친 채(대기 중이던 예약이 있어도 안전하게)
            // 그리드 min-height 를 시작 프레임에 최종값으로 확정한다.
            // 아래 콘텐츠는 이전 위치(-delta)에서 제자리(0)로 내려온다.
            // 받침은 shown 의 해제까지 유지한다 (min 이므로 성장은 막지 않는다)
            collapseEl.addEventListener("show.bs.collapse", function () {
                cancelPendingRelease();
                cancelFollowScroll();
                holdDocHeight();
                songsGrid.style.minHeight = "";
                releaseGlides();
                var h0 = songsGrid.offsetHeight;
                var h1 = measureGridHeight(collapseEl, "block");
                songsGrid.style.minHeight = h1 + "px";
                glideBelow(h0 - h1, 0, "none");
            });

            // 펼침 완료: 펼친 상태의 자연 높이와 같으므로 해제해도 변화가 없다
            collapseEl.addEventListener("shown.bs.collapse", function () {
                cancelPendingRelease();
                releaseReservation();
            });

            // 접힘: 접히는 동안 문서 높이를 붙들고, 아래 콘텐츠는 패널을 따라
            // 위로(-delta) 올라간 채 대기한다 (fill: forwards).
            // html 받침은 hidden 의 (지연) 해제까지 유지한다
            collapseEl.addEventListener("hide.bs.collapse", function () {
                cancelPendingRelease();
                cancelFollowScroll();
                holdDocHeight();
                songsGrid.style.minHeight = "";
                releaseGlides();
                var h1 = songsGrid.offsetHeight;
                var h0 = measureGridHeight(collapseEl, "none");
                closeDelta = h1 - h0;
                songsGrid.style.minHeight = h1 + "px";
                glideBelow(0, h0 - h1, "forwards");

                // 스크롤 팔로우: 이대로 두면 해제가 지연될 위치(안전선 밖)라면
                // 접힘과 함께 화면을 끌어올려, 접힘 완료 후의 더보기 버튼이
                // 뷰포트 중앙에 오는 위치로 이동한다 (안전선·현재 위치 클램프) —
                // 끝나면 hidden 의 해제 조건이 스스로 충족된다
                var se = document.scrollingElement || docEl;
                var y0 = window.scrollY;
                var futureMax = se.scrollHeight - closeDelta - se.clientHeight;
                if (y0 > futureMax + 1 && toggleBtn) {
                    // 접힘 후 버튼 문서 Y = 현재 Y - 래퍼 높이 (래퍼가 margin 까지 가둔다)
                    var btnRect = toggleBtn.getBoundingClientRect();
                    var btnCenter = btnRect.top + btnRect.height / 2 + y0 - collapseEl.offsetHeight;
                    var centered = btnCenter - se.clientHeight / 2;
                    followScroll(y0, Math.max(0, Math.min(y0, futureMax, centered)));
                }
            });

            // 접힘 완료: 해제해도 scrollY 가 클램프되지 않을 때만 해제하고,
            // 최하단 근처면 안전해질 때까지 예약을 유지한다 (지연 해제)
            collapseEl.addEventListener("hidden.bs.collapse", function () {
                tryReleaseReservation(closeDelta);
            });
        });
    }

    // 검색 결과 컬랩스 예약: 원리는 6번과 같다 (12턴 실측 — 인플로우 레이아웃이
    // 프레임마다 움직이면 페인트 내용과 무관하게 GPU 가 포화된다). 컬랩스를 감싼
    // 유리 섹션에 min-height 를 예약해 섹션 밖 레이아웃을 시작 프레임에 확정하고,
    // 섹션 뒤의 인플로우 요소들은 형제 자동 수집으로 미끄러뜨린다 — 새 요소가
    // 끼어도 자동 편입되고, 수집에서 빠지면 그 요소만 순간이동할 뿐 성능은
    // 유지된다. 섹션 안쪽에서 컬랩스 뒤에 오는 소형 콘텐츠는 레이아웃대로
    // 움직이게 둔다 (6번의 더보기 버튼과 같은 취급 — 면적이 작아 무해).
    // followScroll 은 랜딩 전용 사정이라 이식하지 않는다.
    // data-glass-motion="off"(순정 회귀) 또는 data-glass-collapse(자체 컴포넌트가
    // 담당, 15턴)가 붙은 컬랩스는 이 구역을 통째로 건너뛴다
    var resultCollapse = document.getElementById("songSearchResultCollapse");
    if (resultCollapse && resultCollapse.dataset.glassMotion !== "off"
        && !resultCollapse.hasAttribute("data-glass-collapse")) {
        var rcReserve = resultCollapse.closest("section") || resultCollapse.parentElement;
        var rcReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var RC_GLIDE = { duration: 500, easing: "ease" }; // song-table.css .collapsing 과 같은 곡선
        var rcGlides = [];
        var rcDocEl = document.documentElement;
        var rcCloseDelta = 0;

        // 예약 섹션 뒤에 오는 인플로우 요소를 body 까지 조상을 오르며 수집한다.
        // 예약으로 레이아웃이 얼어 있는 요소만 대상이다 (섹션 안쪽 제외)
        function rcCollectBelow() {
            var els = [];
            var node = rcReserve;
            while (node && node !== document.body) {
                for (var sib = node.nextElementSibling; sib; sib = sib.nextElementSibling) {
                    var pos = getComputedStyle(sib).position;
                    if (pos !== "fixed" && pos !== "absolute") els.push(sib);
                }
                node = node.parentElement;
            }
            return els;
        }

        function rcGlideBelow(fromY, toY, fill) {
            if (rcReduceMotion || fromY === toY) return;
            rcCollectBelow().forEach(function (el) {
                rcGlides.push(el.animate(
                    [{ transform: "translateY(" + fromY + "px)" }, { transform: "translateY(" + toY + "px)" }],
                    { duration: RC_GLIDE.duration, easing: RC_GLIDE.easing, fill: fill }
                ));
            });
        }

        function rcReleaseGlides() {
            rcGlides.forEach(function (a) { a.cancel(); });
            rcGlides = [];
        }

        // 클립 가장자리 동기화: 예약이 레이아웃을 큰 쪽 높이로 얼리는 동안,
        // 유리판의 "보이는" 아래 가장자리만 clip-path 로 컬랩스와 같은 곡선으로
        // 여닫는다 — 이게 없으면 최종 위치로 먼저 가 있는 footer 가 전환 내내
        // 유리판 밑으로 미끄러져 들어가고(섹션이 z-index 1 이라 blur 뒤에 갇힘),
        // 펼침 시 유리판이 내용보다 먼저 최종 크기가 된다 (13턴).
        // 미지원 브라우저는 클립 없이 지금 동작으로 열화한다 (기능은 정상)
        var rcClipOk = window.CSS && CSS.supports && CSS.supports("clip-path", "inset(0 0 10px round 28px)");

        function rcClipEdge(fromPx, toPx, fill) {
            if (rcReduceMotion || !rcClipOk || fromPx === toPx) return;
            var r = getComputedStyle(rcReserve).borderRadius || "0px";
            rcGlides.push(rcReserve.animate(
                [{ clipPath: "inset(0 0 " + fromPx + "px round " + r + ")" },
                 { clipPath: "inset(0 0 " + toPx + "px round " + r + ")" }],
                { duration: RC_GLIDE.duration, easing: RC_GLIDE.easing, fill: fill }
            ));
        }

        // 6번과 같은 받침: 전환 중 scrollHeight 흔들림(보케 오버플로 등)이
        // 클램프·스크롤 앵커링을 발동시키지 않게 한다
        function rcHoldDoc() {
            var se = document.scrollingElement || rcDocEl;
            rcDocEl.style.minHeight = se.scrollHeight + "px";
            rcDocEl.style.overflowAnchor = "none";
        }

        function rcRelease() {
            rcReserve.style.minHeight = "";
            rcDocEl.style.minHeight = "";
            rcDocEl.style.overflowAnchor = "";
            rcReleaseGlides();
        }

        var rcPending = null;

        function rcCancelPending() {
            if (!rcPending) return;
            window.removeEventListener("scroll", rcPending);
            window.removeEventListener("resize", rcPending);
            rcPending = null;
        }

        // 접힘 해제가 scrollY 를 클램프하지 않을 때만 해제한다 (6번의 지연 해제).
        // 검색·애창곡은 접힌 페이지가 뷰포트보다 짧아 우변이 음수가 될 수 있다 —
        // 0 으로 클램프하지 않으면 해제가 교착되어 footer 가 유리 뒤에 갇힌다
        function rcTryRelease(delta) {
            var se = document.scrollingElement || rcDocEl;
            if (window.scrollY <= Math.max(0, se.scrollHeight - delta - se.clientHeight) + 1) {
                rcCancelPending();
                rcRelease();
                return;
            }
            if (rcPending) return; // 이미 대기 중
            rcPending = function () { rcTryRelease(delta); };
            window.addEventListener("scroll", rcPending, { passive: true });
            window.addEventListener("resize", rcPending);
        }

        // 컬랩스를 잠깐 강제 상태로 두고 예약 섹션의 최종 높이를 잰다 (페인트 전 원복)
        function rcMeasure(forcedDisplay) {
            var style = resultCollapse.style;
            style.display = forcedDisplay;
            style.height = forcedDisplay === "block" ? "auto" : "";
            var h = rcReserve.offsetHeight;
            style.display = "";
            style.height = "";
            return h;
        }

        resultCollapse.addEventListener("show.bs.collapse", function () {
            rcCancelPending();
            rcHoldDoc();
            rcReserve.style.minHeight = "";
            rcReleaseGlides();
            var h0 = rcReserve.offsetHeight;
            var h1 = rcMeasure("block");
            rcReserve.style.minHeight = h1 + "px";
            rcClipEdge(h1 - h0, 0, "none");
            rcGlideBelow(h0 - h1, 0, "none");
        });

        resultCollapse.addEventListener("shown.bs.collapse", function () {
            rcCancelPending();
            rcRelease();
        });

        resultCollapse.addEventListener("hide.bs.collapse", function () {
            rcCancelPending();
            rcHoldDoc();
            rcReserve.style.minHeight = "";
            rcReleaseGlides();
            var h1 = rcReserve.offsetHeight;
            var h0 = rcMeasure("none");
            rcCloseDelta = h1 - h0;
            rcReserve.style.minHeight = h1 + "px";
            // 클립은 해제(rcRelease)까지 잡아둬야 한다 — min-height 가 남아 있는 동안
            // 클립이 먼저 풀리면 빈 유리판이 다시 전체 높이로 드러난다
            rcClipEdge(0, h1 - h0, "forwards");
            rcGlideBelow(0, h0 - h1, "forwards");
        });

        resultCollapse.addEventListener("hidden.bs.collapse", function () {
            rcTryRelease(rcCloseDelta);
        });
    }

    } // init 끝
})();
