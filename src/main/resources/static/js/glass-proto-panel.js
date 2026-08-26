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

    /* def 는 초기 fallback(모드 B 확정 기본값, glass-proto.css 와 수동 동기) —
       실제 기준값은 syncDefs() 가 현재 모드의 computed 값으로 갱신한다.
       A 모드처럼 computed 를 읽을 수 없을 때만 이 fallback 이 남는다 */
    var KNOBS = [
        { v: '--g-alpha',        label: '패널 알파',      def: .6,  min: 0,   max: 1,   step: .01, unit: '' },
        { v: '--g-alpha-hero',   label: '히어로 알파',    def: .55, min: 0,   max: 1,   step: .01, unit: '' },
        { v: '--g-alpha-strong', label: '버튼 알파',      def: .66, min: 0,   max: 1,   step: .01, unit: '' },
        { v: '--g-alpha-input',  label: '입력 알파',      def: .55, min: 0,   max: 1,   step: .01, unit: '' },
        { v: '--g-alpha-modal',  label: '모달 알파',      def: .82, min: 0,   max: 1,   step: .01, unit: '' },
        { v: '--g-blur-panel',   label: '패널 블러',      def: 22,  min: 0,   max: 40,  step: 1,   unit: 'px' },
        { v: '--g-blur-btn',     label: '버튼 블러',      def: 16,  min: 0,   max: 40,  step: 1,   unit: 'px' },
        { v: '--g-blur-input',   label: '입력 블러',      def: 10,  min: 0,   max: 40,  step: 1,   unit: 'px' },
        { v: '--g-sat',          label: '채도 부스트',    def: 175, min: 100, max: 220, step: 5,   unit: '%' },
        { v: '--g-edge-a',       label: '림 보더 알파',   def: .72, min: 0,   max: 1,   step: .01, unit: '' },
        { v: '--g-inset-hi-a',   label: 'inset 상단 알파', def: 1,   min: 0,  max: 1,   step: .01, unit: '' },
        { v: '--g-inset-lo-a',   label: 'inset 하단 알파', def: .75, min: 0,  max: 1,   step: .01, unit: '' },
        { v: '--g-drop-a',       label: '그림자 알파',    def: .12, min: 0,   max: .5,  step: .01, unit: '' },
        { v: '--g-radius',       label: '패널 라운드',    def: 28,  min: 0,   max: 48,  step: 1,   unit: 'px' },
        { v: '--g-bokeh',        label: '보케 존재감',    def: 1,   min: 0,   max: 1,   step: .05, unit: '' }
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
        if (!panel.classList.contains('open')) syncDefs(); // 열 때 현재 프리셋 기준으로 동기화
        panel.classList.toggle('open');
    });
    document.body.appendChild(opener);

    /* ---------- 기준값 동기화 ----------
       슬라이더 오버라이드를 잠시 걷어낸 상태의 computed 값 = 현재 모드
       (B 확정 기본값, C 는 모션 실험이라 재질 값 동일)를 읽어 def·표시를
       갱신한다. 오버라이드한 노브는 슬라이더 값을 유지하고, 새 기준과
       같아졌으면 강조만 풀린다 */
    function syncDefs() {
        var saved = {};
        KNOBS.forEach(function (k) {
            var cur = root.style.getPropertyValue(k.v);
            if (cur !== '') { saved[k.v] = cur; root.style.removeProperty(k.v); }
        });
        var cs = getComputedStyle(root);
        KNOBS.forEach(function (k) {
            var raw = parseFloat(cs.getPropertyValue(k.v));
            if (!isNaN(raw)) k.def = raw; // 읽기 실패(A 모드)면 기존 def 유지
        });
        KNOBS.forEach(function (k) {
            if (saved[k.v] !== undefined) root.style.setProperty(k.v, saved[k.v]);
        });
        KNOBS.forEach(function (k) {
            var overridden = saved[k.v] !== undefined;
            var val = overridden ? parseFloat(k.input.value) : k.def;
            k.input.value = val;
            k.valEl.textContent = fmt(k, val);
            k.row.classList.toggle('changed', overridden && val !== k.def);
        });
    }

    /* 모드 버튼(A·B·C)이 눌리면 기준값을 다시 읽는다 —
       A→B/C 의 link 재활성화가 한 프레임 뒤에 반영되므로 rAF 두 번 뒤에 */
    ['glassModeA', 'glassModeB', 'glassModeC'].forEach(function (id) {
        var btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('click', function () {
            requestAnimationFrame(function () { requestAnimationFrame(syncDefs); });
        });
    });

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

    /* 초기 상태: 저장된 오버라이드 복원 후, 현재 프리셋 기준으로 동기화 */
    var stored = loadStore();
    KNOBS.forEach(function (k) {
        if (typeof stored[k.v] === 'number') setKnob(k, stored[k.v], false);
        else resetKnob(k);
    });
    syncDefs();
})();
