/**
 * theme-init.js — dark 초기값 적용 (ui-overhaul-3 D22)
 *
 * <head> 의 스타일시트 링크보다 앞에 일반 <script> 로 동기 로드한다 —
 * 첫 페인트 전에 html 속성이 붙어야 cream 으로 번쩍였다가 dark 로 바뀌는
 * 현상(FOUC)이 없다. jQuery 보다 먼저 실행되므로 순수 JS 로 쓴다.
 *
 * 스위치 두 개를 함께 세팅한다:
 *   html[data-theme="dark"]    — glass.css 의 3기 색 토큰(잉크·패널·배경) 스위치
 *   html[data-bs-theme="dark"] — Bootstrap 기본 컴포넌트(모달·폼) 색
 *
 * 초기값 규칙: localStorage 'darkMode' 가 'true' 면 dark, '' 면 cream(사용자가 끈 것),
 * 저장값이 없으면(null) 시스템 설정(prefers-color-scheme)을 따른다.
 * 토글(푸터 버튼)은 common-handlers.js 가 아래 applyColorTheme 으로 처리한다.
 */
(function () {
    var root = document.documentElement;

    // isDark: true 면 dark, false 면 cream
    window.applyColorTheme = function (isDark) {
        if (isDark) {
            root.setAttribute('data-theme', 'dark');
            root.setAttribute('data-bs-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
            root.removeAttribute('data-bs-theme');
        }
    };

    var savedDarkMode = null;
    try {
        savedDarkMode = localStorage.getItem('darkMode');
    } catch (ignored) {
        // 저장소 접근이 막힌 환경(프라이빗 모드 등)은 시스템 설정으로
    }
    var systemPrefersDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var startDark = savedDarkMode === 'true' || (savedDarkMode === null && systemPrefersDark);
    if (startDark) window.applyColorTheme(true);

    // [임시 비교 스위치] 크롬 유리의 상태 전환 방식. ?glass=fade 면 상태마다 틴트·그림자 층을 두고
    // opacity 로 교차 페이드한다(html.glass-fade, glass.css 재질 절). ?glass=props 면 원래대로
    // 등록 변수(--glass-*)를 전환한다. 고른 값은 탭을 닫을 때까지 sessionStorage 가 기억한다
    try {
        var glassMode = new URLSearchParams(location.search).get('glass');
        if (glassMode === 'fade') sessionStorage.setItem('glassMode', 'fade');
        if (glassMode === 'props') sessionStorage.removeItem('glassMode');
        if (sessionStorage.getItem('glassMode') === 'fade') root.classList.add('glass-fade');
    } catch (ignored) {
        // 저장소 접근이 막힌 환경은 원래 방식으로
    }
})();
