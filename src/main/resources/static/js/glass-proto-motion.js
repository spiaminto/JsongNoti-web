/* ==========================================================================
   glass-proto-motion.js — ui-rnd 프로토 모션 (임시 R&D JS, 5턴 채택분)

   glass-proto.css 의 모션 구획과 한 쌍이다:
   1) interaction glow — 유리 버튼 pointerdown 접점 좌표(--gx-x/--gx-y)를
      심고 .gx-glowing 을 토글한다. 발광 자체는 CSS(@property transition)
   2) scroll edge — 화면 상단 점진 블러 베일(.gx-scroll-veil)을 심고,
      scrollY > 8 에서 body.gx-scrolled 를 토글한다
   A 모드에선 프로토 CSS 가 꺼져 있어 여기서 심는 클래스·요소가 화면에
   아무 효과도 내지 않는다 (게이트 불요).
   index.html 에서만 로드하며, 본편 반영 시 glass-motion.js 로 이식하고
   파일째 제거한다.
   ========================================================================== */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- (1) interaction glow ---------- */
    document.addEventListener('pointerdown', function (e) {
        if (reduceMotion) return;
        var btn = e.target.closest('.btn, .glass-btn');
        if (!btn) return;
        var rect = btn.getBoundingClientRect();
        btn.style.setProperty('--gx-x', Math.round(e.clientX - rect.left) + 'px');
        btn.style.setProperty('--gx-y', Math.round(e.clientY - rect.top) + 'px');
        btn.classList.add('gx-glowing');
    });

    /* 어디서 떼든(버튼 밖 드래그 아웃 포함) 발광을 감쇠 국면으로 넘긴다 */
    function fadeGlow() {
        document.querySelectorAll('.gx-glowing').forEach(function (el) {
            el.classList.remove('gx-glowing');
        });
    }
    document.addEventListener('pointerup', fadeGlow);
    document.addEventListener('pointercancel', fadeGlow);

    /* ---------- (2) scroll edge 베일 ---------- */
    var veil = document.createElement('div');
    veil.className = 'gx-scroll-veil';
    veil.setAttribute('aria-hidden', 'true');
    document.body.appendChild(veil);

    function onScroll() {
        document.body.classList.toggle('gx-scrolled', window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
})();
