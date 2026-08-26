/* ==========================================================================
   glass-proto-panel.js — ui-rnd 노브 슬라이더 패널 (임시 R&D UI)

   glass-proto.css 의 :root 스칼라 노브를 Aether CSS 의 advanced 패널처럼
   슬라이더로 실시간 조작한다. 값은 html 인라인 스타일(setProperty)로
   덮으므로 프로토(B) 모드에서만 화면에 반영된다.
   - 값은 sessionStorage 에 유지 (새로고침 간 보존)
   - [복사]: 기본값에서 바뀐 노브만 CSS 선언 텍스트로 클립보드에 복사
   - [초기화]: 인라인 오버라이드 전부 제거
   index.html 에서만 로드하며, 본편 반영 시 파일째 제거한다.
   ========================================================================== */
(function () {
    'use strict';

    /* def(기본값)는 glass-proto.css :root 의 B(v0) 값과 수동 동기 유지 —
       computed 로 읽으면 A 모드(프로토 link off)로 로드했을 때 빈 값이 되고,
       C 프리셋이 켜져 있으면 C 값이 기본값으로 오염되므로 하드코딩한다 */
    var KNOBS = [
        { v: '--g-alpha',        label: '패널 알파',      def: .52, min: 0,   max: 1,   step: .01, unit: '' },
        { v: '--g-alpha-hero',   label: '히어로 알파',    def: .62, min: 0,   max: 1,   step: .01, unit: '' },
        { v: '--g-alpha-strong', label: '버튼 알파',      def: .66, min: 0,   max: 1,   step: .01, unit: '' },
        { v: '--g-alpha-input',  label: '입력 알파',      def: .55, min: 0,   max: 1,   step: .01, unit: '' },
        { v: '--g-alpha-modal',  label: '모달 알파',      def: .82, min: 0,   max: 1,   step: .01, unit: '' },
        { v: '--g-blur-panel',   label: '패널 블러',      def: 22,  min: 0,   max: 40,  step: 1,   unit: 'px' },
        { v: '--g-blur-btn',     label: '버튼 블러',      def: 16,  min: 0,   max: 40,  step: 1,   unit: 'px' },
        { v: '--g-blur-input',   label: '입력 블러',      def: 10,  min: 0,   max: 40,  step: 1,   unit: 'px' },
        { v: '--g-sat',          label: '채도 부스트',    def: 160, min: 100, max: 220, step: 5,   unit: '%' },
        { v: '--g-edge-a',       label: '림 보더 알파',   def: .72, min: 0,   max: 1,   step: .01, unit: '' },
        { v: '--g-inset-hi-a',   label: 'inset 상단 알파', def: .85, min: 0,  max: 1,   step: .01, unit: '' },
        { v: '--g-inset-lo-a',   label: 'inset 하단 알파', def: .25, min: 0,  max: 1,   step: .01, unit: '' },
        { v: '--g-drop-a',       label: '그림자 알파',    def: .12, min: 0,   max: .5,  step: .01, unit: '' },
        { v: '--g-radius',       label: '패널 라운드',    def: 28,  min: 0,   max: 48,  step: 1,   unit: 'px' }
    ];
    var STORE_KEY = 'glassKnobs';
    var root = document.documentElement;

    function fmt(k, val) {
        return (k.step < 1 ? (Math.round(val * 100) / 100) : Math.round(val)) + k.unit;
    }

    function loadStore() {
        try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
    }

    function saveStore(store) {
        try { sessionStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {}
    }

    /* ---------- 패널 스타일 (프로토 CSS 와 독립 — A 모드에서도 형태 유지) ---------- */
    var style = document.createElement('style');
    style.textContent =
        '#glassKnobPanel { position: fixed; left: 14px; bottom: 196px; z-index: 2000; width: 272px;' +
        '  max-height: min(62vh, 600px); overflow-y: auto; padding: .75rem .95rem .85rem; border-radius: 16px;' +
        '  background: #ffffff; color: #1b232b; border: 1px solid rgb(120 145 170 / .5);' +
        '  box-shadow: 0 10px 30px rgb(30 42 56 / .22); font-size: .74rem; display: none; }' +
        '#glassKnobPanel.open { display: block; }' +
        '#glassKnobPanel .gk-head { display: flex; align-items: center; gap: .4rem; margin-bottom: .35rem; }' +
        '#glassKnobPanel .gk-title { font-weight: 800; font-size: .8rem; margin-right: auto; }' +
        '#glassKnobPanel .gk-head button { font: inherit; font-weight: 800; color: #45515c; background: #f0f4f7;' +
        '  border: 1px solid rgb(120 145 170 / .4); border-radius: 8px; padding: .15rem .5rem; cursor: pointer; }' +
        '#glassKnobPanel .gk-row { margin-top: .45rem; }' +
        '#glassKnobPanel .gk-label { display: flex; justify-content: space-between; }' +
        '#glassKnobPanel .gk-label .gk-val { font-variant-numeric: tabular-nums; color: #45515c; }' +
        '#glassKnobPanel .gk-row.changed .gk-val { color: #2f5495; font-weight: 800; }' +
        '#glassKnobPanel input[type=range] { width: 100%; margin: .1rem 0 0; accent-color: #6d7d8d; }';
    document.head.appendChild(style);

    /* ---------- 패널 골격 ---------- */
    var panel = document.createElement('div');
    panel.id = 'glassKnobPanel';

    var head = document.createElement('div');
    head.className = 'gk-head';
    var title = document.createElement('span');
    title.className = 'gk-title';
    title.textContent = '재질 노브';
    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.textContent = '복사';
    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = '초기화';
    head.appendChild(title);
    head.appendChild(copyBtn);
    head.appendChild(resetBtn);
    panel.appendChild(head);

    KNOBS.forEach(function (k) {
        var row = document.createElement('div');
        row.className = 'gk-row';
        var labelWrap = document.createElement('div');
        labelWrap.className = 'gk-label';
        var name = document.createElement('span');
        name.textContent = k.label;
        name.title = k.v;
        var val = document.createElement('span');
        val.className = 'gk-val';
        var input = document.createElement('input');
        input.type = 'range';
        input.min = k.min;
        input.max = k.max;
        input.step = k.step;

        k.row = row; k.valEl = val; k.input = input;

        input.addEventListener('input', function () {
            setKnob(k, parseFloat(input.value), true);
        });

        labelWrap.appendChild(name);
        labelWrap.appendChild(val);
        row.appendChild(labelWrap);
        row.appendChild(input);
        panel.appendChild(row);
    });

    document.body.appendChild(panel);

    /* ---------- 열기 버튼: 토글 묶음(A/B·C·에지) 맨 위 ---------- */
    var opener = document.createElement('button');
    opener.id = 'glassKnobToggle';
    opener.type = 'button';
    opener.textContent = '노브';
    opener.style.cssText =
        'position: fixed; left: 14px; bottom: 152px; z-index: 2000;' +
        'padding: .45rem .95rem; border-radius: 999px;' +
        'border: 1px solid rgb(120 145 170 / .5); background: #ffffff; color: #1b232b;' +
        'font-weight: 800; font-size: .8rem; box-shadow: 0 6px 18px rgb(30 42 56 / .18); cursor: pointer;';
    opener.addEventListener('click', function () {
        panel.classList.toggle('open');
    });
    document.body.appendChild(opener);

    /* ---------- 값 적용·복원 ---------- */
    function setKnob(k, num, persist) {
        root.style.setProperty(k.v, num + k.unit);
        k.input.value = num;
        k.valEl.textContent = fmt(k, num);
        k.row.classList.toggle('changed', num !== k.def);
        if (persist) {
            var store = loadStore();
            if (num !== k.def) store[k.v] = num; else delete store[k.v];
            saveStore(store);
        }
    }

    function resetKnob(k) {
        root.style.removeProperty(k.v);
        k.input.value = k.def;
        k.valEl.textContent = fmt(k, k.def);
        k.row.classList.remove('changed');
    }

    resetBtn.addEventListener('click', function () {
        KNOBS.forEach(resetKnob);
        try { sessionStorage.removeItem(STORE_KEY); } catch (e) {}
    });

    copyBtn.addEventListener('click', function () {
        var lines = KNOBS.filter(function (k) { return parseFloat(k.input.value) !== k.def; })
            .map(function (k) { return k.v + ': ' + fmt(k, parseFloat(k.input.value)) + ';'; });
        var text = lines.length ? lines.join('\n') : '/* 기본값에서 바뀐 노브 없음 */';
        navigator.clipboard.writeText(text).then(function () {
            copyBtn.textContent = '복사됨';
            setTimeout(function () { copyBtn.textContent = '복사'; }, 1200);
        }, function () {
            window.prompt('클립보드 복사에 실패했습니다. 직접 복사하세요:', text);
        });
    });

    /* 초기 상태: 저장된 오버라이드 복원, 없으면 기본값 표시 */
    var stored = loadStore();
    KNOBS.forEach(function (k) {
        if (typeof stored[k.v] === 'number') setKnob(k, stored[k.v], false);
        else resetKnob(k);
    });
})();
