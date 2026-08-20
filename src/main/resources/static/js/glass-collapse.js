/**
 * glass-collapse.js — 유리 패널 컬랩스 컴포넌트 (부트스트랩 collapse 대체)
 *
 * 원리: 전환 중 인플로우 레이아웃을 움직이지 않는다 (ui-overhaul 12턴 실측 —
 * 인플로우 이동은 이동 영역 전체를 매 프레임 재래스터시켜 GPU 를 포화시킨다).
 * 시작 프레임에 유리판(reserve)의 min-height 를 큰 쪽 높이로 예약해 레이아웃을
 * 1회에 확정하고, 보이는 가장자리는 clip-path 로, 아래 콘텐츠는 transform 으로
 * 같은 곡선을 따라 움직인다 — 셋 다 텍스처 재사용 경로라 재래스터가 없다.
 *
 * markup 계약:
 *   <button data-gc-toggle="#collapseId">    ← 토글 버튼 (aria-expanded 를 관리해 준다)
 *   <div class="collapse" id="collapseId" data-glass-collapse>내용</div>
 *     - display 는 부트스트랩 CSS(.collapse / .collapse.show)를 그대로 빌려 쓰고,
 *       부트스트랩 JS 플러그인은 쓰지 않는다 (버튼에 data-bs-toggle 을 두지 말 것).
 *     - 유리판(예약·클립 대상)은 가장 가까운 section. 다른 조상을 쓰려면
 *       data-gc-reserve="셀렉터" 로 지정한다.
 *
 * JS API: GlassCollapse.of(elOrSelector) → { show, hide, toggle, swap(renderFn), isOpen }
 *   swap 은 펼쳐진 채 내용을 갈아끼울 때 높이 모핑과 함께 애니메이션한다.
 */
(function () {
    "use strict";

    var DURATION = 500;          // song-table.css .collapsing 과 같은 곡선
    var EASING = "ease";
    var SHADOW_PAD = 100;        // 클립을 위·좌·우로 넓혀 외곽 그림자(0 24px 60px)가 잘리지 않게 한다.
                                 // 움직이는 아래 가장자리만 전환 동안 그림자가 없다 (14턴 1번)
    var FOLLOW_DURATION = 850;   // 접힘 팔로우 스크롤 — 표보다 길게 잡아 감속 꼬리를 남긴다 (7턴)

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var waapiOk = !!Element.prototype.animate;
    var clipOk = window.CSS && CSS.supports &&
        CSS.supports("clip-path", "inset(-10px -10px 5px -10px round 28px)");

    function GlassCollapse(el) {
        var reserveSel = el.getAttribute("data-gc-reserve");
        this.el = el;
        this.reserve = (reserveSel && el.closest(reserveSel)) || el.closest("section") || el.parentElement;
        this.buttons = [];
        this.anims = [];
        this.pending = null;      // 지연 해제 대기 리스너
        this.endTimer = null;
        this.followRaf = null;
        this.followCleanup = null;
        el.__glassCollapse = this;
    }

    GlassCollapse.prototype = {

        isOpen: function () {
            return this.el.classList.contains("show");
        },

        toggle: function () {
            this.isOpen() ? this.hide() : this.show();
        },

        show: function () {
            if (this.isOpen()) return;
            var v0 = this._visualHeight();   // 중단된 전환이면 현재 가장자리에서 이어간다
            var e0 = this.el.getBoundingClientRect().height;
            this._prep();
            this.el.classList.add("show");
            this._aria(true);
            this._run(v0, this.reserve.offsetHeight, e0, this.el.offsetHeight, null);
        },

        hide: function () {
            if (!this.isOpen()) return;
            var v0 = this._visualHeight();
            var e0 = this.el.getBoundingClientRect().height;
            this._prep();
            this.el.classList.remove("show");           // 접힌 최종 높이를 잰다
            var h1 = this.reserve.offsetHeight;
            this.el.style.display = "block";            // 전환 동안은 내용을 보이게 둔다
            this._aria(false);
            var self = this;
            this._run(v0, h1, e0, 0, function () { self.el.style.display = ""; });
        },

        // 펼쳐진 채 내용 교체: renderFn 이 DOM 을 바꾸면 새 높이로 모핑한다 (14턴 4번)
        swap: function (renderFn) {
            if (!this.isOpen()) {
                renderFn();
                this.show();
                return;
            }
            var v0 = this._visualHeight();
            var e0 = this.el.getBoundingClientRect().height;
            this._prep();
            renderFn();
            if (waapiOk && !reduceMotion) {
                this.anims.push(this.el.animate(
                    [{ opacity: 0 }, { opacity: 1 }],
                    { duration: 250, easing: "ease-out" }
                ));
            }
            this._run(v0, this.reserve.offsetHeight, e0, this.el.offsetHeight, null);
        },

        // ---------- 내부 ----------

        // 현재 "보이는" 유리판 높이 — 전환 중이면 클립된 가장자리 기준.
        // 전환 시작점을 여기서 잡아, 중단·재시작 시에도 가장자리가 튀지 않는다
        _visualHeight: function () {
            var h = this.reserve.getBoundingClientRect().height;
            var clip = getComputedStyle(this.reserve).clipPath;
            var m = clip && clip.match(/inset\(\s*[^ ]+\s+[^ ]+\s+(-?[\d.]+)px/);
            return m ? h - parseFloat(m[1]) : h;
        },

        // 전환 준비: 진행 중이던 예약·애니·대기를 정리하고 문서 높이를 받친다.
        // html 받침은 측정·글라이드가 scrollHeight 를 흔들어 클램프·앵커링이
        // 발동하는 것을 막는다 (6턴-1) — 해제까지 유지된다
        _prep: function () {
            if (this.endTimer) { clearTimeout(this.endTimer); this.endTimer = null; }
            this._cancelPending();
            this._cancelFollow();
            var se = document.scrollingElement || document.documentElement;
            document.documentElement.style.minHeight = se.scrollHeight + "px";
            document.documentElement.style.overflowAnchor = "none";
            this._cancelAnims();
            this.reserve.style.minHeight = "";
            this.el.style.display = "";
            this.el.style.overflow = "";
        },

        // 핵심 전환: 레이아웃은 max(h0,h1) 로 1회 확정하고, 컬랩스 요소 자신의
        // height(e0→e1, overflow:hidden), 섹션 가장자리(clip-path), 아래 형제
        // (translateY)를 같은 곡선의 WAAPI 로 재생한다. clip·transform 은
        // 컴포지터가 자기 시계로 돌리므로 그냥 두면 메인 스레드의 height 와
        // 시작이 어긋나 "내용만 줄고 가장자리·footer 는 멈춘" 빈 유리 띠가
        // 화면에 나타날 수 있다(15턴 실증 — 계산값 계측에는 안 잡히는 화면 전용
        // 결함). 그래서 생성 직후 모든 애니메이션에 같은 startTime 을 박는다 —
        // 컴포지터가 늦게 합류해도 경과 위치로 시킹하므로 어긋나지 않는다.
        // (매 프레임 스타일을 직접 쓰는 단일 시계안은 클립 갱신이 메인 스레드
        // 페인트를 매 프레임 발화시켜 show 에 25~50ms 스톨을 만들어 기각)
        _run: function (h0, h1, e0, e1, finalize) {
            var self = this;
            var delta = h0 - h1;   // 양수면 접힘(문서가 줄어드는 방향)

            if (!waapiOk || reduceMotion || h0 === h1) {
                this._finish(finalize, delta);
                return;
            }

            var max = Math.max(h0, h1);
            this.reserve.style.minHeight = max + "px";
            var L = this.reserve.offsetHeight;   // 실제 레이아웃 앵커

            this.el.style.overflow = "hidden";
            this.anims.push(this.el.animate(
                [{ height: e0 + "px" }, { height: e1 + "px" }],
                { duration: DURATION, easing: EASING, fill: "forwards" }
            ));

            if (clipOk) {
                var r = getComputedStyle(this.reserve).borderRadius || "0px";
                var pad = SHADOW_PAD;
                this.anims.push(this.reserve.animate(
                    [{ clipPath: "inset(" + -pad + "px " + -pad + "px " + (L - h0) + "px " + -pad + "px round " + r + ")" },
                     { clipPath: "inset(" + -pad + "px " + -pad + "px " + (L - h1) + "px " + -pad + "px round " + r + ")" }],
                    { duration: DURATION, easing: EASING, fill: "forwards" }
                ));
            }

            this._collectBelow().forEach(function (sib) {
                self.anims.push(sib.animate(
                    [{ transform: "translateY(" + (h0 - L) + "px)" },
                     { transform: "translateY(" + (h1 - L) + "px)" }],
                    { duration: DURATION, easing: EASING, fill: "forwards" }
                ));
            });

            // 시계 통일: 전부 지금 이 순간을 t0 으로 재생한다
            var t0 = document.timeline.currentTime;
            this.anims.forEach(function (a) { a.startTime = t0; });

            // 접힘이 스크롤 안전선 밖이면 화면을 버튼 쪽으로 끌어올린다 (14턴 2번 —
            // 이게 없으면 사용자가 빈 배경에 고립된 채 전환이 끝난다)
            if (delta > 0) this._followScroll(delta);

            this.endTimer = setTimeout(function () {
                self.endTimer = null;
                self._finish(finalize, delta);
            }, DURATION + 20);
        },

        _finish: function (finalize, delta) {
            if (finalize) finalize();
            if (delta > 0) this._tryRelease(delta);
            else this._release();
        },

        // 예약 해제: min-height·받침·클립·글라이드를 같은 프레임에 상쇄해 이어 붙인다
        _release: function () {
            this._cancelAnims();
            this.el.style.overflow = "";
            this.reserve.style.minHeight = "";
            document.documentElement.style.minHeight = "";
            document.documentElement.style.overflowAnchor = "";
        },

        // 지연 해제: 해제가 scrollY 를 클램프하지 않을 때만 해제한다.
        // 접힌 문서가 뷰포트보다 짧으면 우변이 음수가 되므로 0 을 바닥으로
        // 깔아야 교착하지 않는다 (13턴)
        _tryRelease: function (delta) {
            var se = document.scrollingElement || document.documentElement;
            if (window.scrollY <= Math.max(0, se.scrollHeight - delta - se.clientHeight) + 1) {
                this._cancelPending();
                this._release();
                return;
            }
            if (this.pending) return;
            var self = this;
            this.pending = function () { self._tryRelease(delta); };
            window.addEventListener("scroll", this.pending, { passive: true });
            window.addEventListener("resize", this.pending);
        },

        _cancelPending: function () {
            if (!this.pending) return;
            window.removeEventListener("scroll", this.pending);
            window.removeEventListener("resize", this.pending);
            this.pending = null;
        },

        _cancelAnims: function () {
            this.anims.forEach(function (a) { a.cancel(); });
            this.anims = [];
        },

        // 예약 요소 뒤의 인플로우 형제를 body 까지 조상을 오르며 수집한다.
        // 빠뜨림의 벌칙은 성능 회귀가 아니라 그 요소의 순간이동뿐이다 (12턴)
        _collectBelow: function () {
            var els = [];
            var node = this.reserve;
            while (node && node !== document.body) {
                for (var sib = node.nextElementSibling; sib; sib = sib.nextElementSibling) {
                    var pos = getComputedStyle(sib).position;
                    if (pos !== "fixed" && pos !== "absolute") els.push(sib);
                }
                node = node.parentElement;
            }
            return els;
        },

        // 접힘 팔로우: 해제가 지연될 위치라면 접힘과 함께 화면을 끌어올려
        // 토글 버튼을 뷰포트 중앙으로 되돌린다. scrollY 를 쓰는 유일한 지점이며
        // 사용자 입력(휠·터치·키)이 들어오면 즉시 중단하고 양보한다 (지연 해제가 안전망)
        _followScroll: function (delta) {
            if (reduceMotion) return;
            var se = document.scrollingElement || document.documentElement;
            var y0 = window.scrollY;
            var futureMax = Math.max(0, se.scrollHeight - delta - se.clientHeight);
            var anchor = this.buttons[0];
            if (y0 <= futureMax + 1 || !anchor) return;

            var rect = anchor.getBoundingClientRect();
            var centered = rect.top + rect.height / 2 + y0 - se.clientHeight / 2;
            var toY = Math.max(0, Math.min(y0, futureMax, centered));
            if (toY >= y0) return;

            var self = this;
            var start = null;
            var abort = function () { self._cancelFollow(); };
            window.addEventListener("wheel", abort, { passive: true });
            window.addEventListener("touchstart", abort, { passive: true });
            window.addEventListener("keydown", abort);
            this.followCleanup = function () {
                window.removeEventListener("wheel", abort);
                window.removeEventListener("touchstart", abort);
                window.removeEventListener("keydown", abort);
            };
            function easeOutExpo(t) {
                return t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
            }
            function step(ts) {
                if (start === null) start = ts;
                var t = Math.min((ts - start) / FOLLOW_DURATION, 1);
                window.scrollTo(0, y0 + (toY - y0) * easeOutExpo(t));
                if (t < 1) self.followRaf = requestAnimationFrame(step);
                else self._cancelFollow();
            }
            this.followRaf = requestAnimationFrame(step);
        },

        _cancelFollow: function () {
            if (this.followRaf) cancelAnimationFrame(this.followRaf);
            this.followRaf = null;
            if (this.followCleanup) { this.followCleanup(); this.followCleanup = null; }
        },

        _aria: function (open) {
            this.buttons.forEach(function (btn) {
                btn.setAttribute("aria-expanded", open ? "true" : "false");
            });
        }
    };

    function of(elOrSel) {
        var el = typeof elOrSel === "string" ? document.querySelector(elOrSel) : elOrSel;
        return (el && el.__glassCollapse) || null;
    }

    function init() {
        document.querySelectorAll("[data-glass-collapse]").forEach(function (el) {
            var gc = new GlassCollapse(el);
            document.querySelectorAll('[data-gc-toggle]').forEach(function (btn) {
                var target = document.querySelector(btn.getAttribute("data-gc-toggle"));
                if (target !== el) return;
                gc.buttons.push(btn);
                btn.addEventListener("click", function () { gc.toggle(); });
            });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.GlassCollapse = { of: of };
})();
