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
 *
 * 컬랩스에는 관여하지 않는다 — 전 페이지 순정 부트스트랩 collapse 를 쓴다.
 * (과거 6·7번 높이 예약 구역은 body 그라디언트가 문서 높이에 묶여 있던
 *  시절의 렉 우회였고, 배경을 뷰포트 고정으로 분리하며 제거했다)
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

    } // init 끝
})();
