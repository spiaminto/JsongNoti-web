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
 *  6) 접힘 스크롤 팔로우: index 더보기를 최하단 근처에서 접으면 화면을
 *     토글 버튼이 중앙에 오는 위치로 감속 이동시킨다. followScroll 은
 *     window.glassMotion 으로 공개되어 검색 더보기 접힘과 애창곡 노래
 *     클릭 스크롤(song-search.js)도 쓴다
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

    function followScroll(fromY, toY) {
        if (followReduceMotion || toY >= fromY) {
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
            var t = Math.min((ts - start) / 850, 1);
            window.scrollTo(0, fromY + (toY - fromY) * easeOutExpo(t));
            if (t < 1) {
                followRaf = requestAnimationFrame(step);
            } else {
                cancelFollowScroll();
            }
        }
        followRaf = requestAnimationFrame(step);
    }

    ["tjLastMonthSongContentBorder", "kyLastMonthSongContentBorder"].forEach(function (id) {
        var collapseEl = document.getElementById(id);
        if (!collapseEl) return;
        var toggleBtn = document.querySelector('[data-bs-target="#' + id + '"]');

        collapseEl.addEventListener("hide.bs.collapse", function () {
            cancelFollowScroll();
            if (!toggleBtn) return;
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
            if (y0 <= futureMax + 1) {
                docEl.style.overflowAnchor = ""; // 팔로우 미발동 — 앵커링 원복
                return;
            }
            var centered = btnCenterAfter - se.clientHeight / 2;
            // followScroll 이 overflow-anchor 를 이어받아 종료·중단 시 복원한다
            followScroll(y0, Math.max(0, Math.min(y0, futureMax, centered)));
        });

        collapseEl.addEventListener("show.bs.collapse", cancelFollowScroll);
    });

    // 다른 스크립트(검색 더보기 등)도 같은 감속 팔로우를 쓸 수 있게 공개
    window.glassMotion = {
        followScroll: followScroll,
        cancelFollowScroll: cancelFollowScroll
    };

    } // init 끝
})();
