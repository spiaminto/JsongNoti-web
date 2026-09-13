
$(function () {

    // dark 토글 (ui-overhaul-3 D22): 초기값은 theme-init.js(head)가 이미 적용했다.
    // 저장값은 'true'(dark) / ''(cream 으로 끔) — 저장값이 없을 때만 시스템 설정을 따른다.
    // 프로스트(frost-baking.js)처럼 테마 색을 미리 구워 두는 쪽은 colorthemechange 를 듣고 다시 굽는다
    // 전환은 View Transition(ui-overhaul-4 4턴): 옛·새 화면 스냅샷을 크로스페이드해 토큰 전환과
    // 프로스트 교체가 한 동작이 된다. 콜백 안의 colorthemechange(synchronous: true)에
    // frost-baking.js 가 디바운스·페이드 없이 즉시 굽는다. 미지원 브라우저·모션 최소화는 즉시 전환
    $('.dark-mode-button').on('click', function (event) {
        event.preventDefault();
        let turnDark = $('html').attr('data-theme') !== 'dark';
        let switchTheme = function (synchronous) {
            window.applyColorTheme(turnDark);
            localStorage.setItem('darkMode', turnDark ? 'true' : '');
            document.dispatchEvent(new CustomEvent('colorthemechange', {detail: {dark: turnDark, synchronous: synchronous}}));
        };
        let reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (document.startViewTransition && !reduceMotion) {
            document.startViewTransition(function () { switchTheme(true); });
        } else {
            switchTheme(false);
        }
    });

    // 노래 표 행 클릭 (ui-overhaul-3 D12·D16): 행 어디를 눌러도 제목과 같은 동작.
    // 링크·버튼·입력을 직접 누른 경우는 제 동작대로 둔다.
    //  - 제목이 링크인 행(신곡 목록): 새 탭으로 연다
    //  - 검색 결과·순서 설정 모달 행, 삭제 모드의 애창곡 행: 제목 셀의 클릭
    //    핸들러(폼 채우기·순서 선택·삭제, song-search.js·favorite-song.js)로 넘긴다
    $(document).on('click', '.song-table tbody tr', function (event) {
        let $target = $(event.target);
        if ($target.closest('a, button, input, label').length) return;

        let $titleLink = $(this).find('a.song-title-text[href]');
        if ($titleLink.length) {
            window.open($titleLink.attr('href'), '_blank', 'noopener');
            return;
        }

        // 제목 셀을 직접 누른 클릭은 이미 그 핸들러가 받았다 — 다시 보내면 두 번 실행된다
        if ($target.closest('.song-title').length) return;
        if ($(this).closest('.table-hover, #choosePresentOrderTable').length || $(this).hasClass('song-row-deleting')) {
            $(this).find('.song-title').trigger('click');
        }
    });

    // 화살표 컬랩스 버튼 이벤트리스너
    $('.arrow-collapse-button').on('click', function () {
        $(this).toggleClass('arrow-collapse-button-open');
    })

    // aria-hidden = true 속성인 요소 (모달) 이 화면에서 사라졌을때 내부 요소 포커스 제거
    $('.modal').on('hide.bs.modal', function () {
        $(this).find('button, input').each(function () {
            $(this).blur();
        })
    });

    // 애창곡 버튼 클릭
    $('.favorite-song-link-button').on('click', function (e) {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            // 로그인 이력 존재
            $('#favoriteLoginModal').find('.favorite-login-button').attr('disabled', true)
            $('.login-modal-info').html('<b>자동 로그인 중입니다. 잠시만 기다려주세요.</b>' +
                '<div class="spinner-border spinner-border-sm text-primary ms-2" role="status">\n' +
                '  <span class="visually-hidden">로그인중</span>\n' +
                '</div>' +
                '<br> 10초이상 기다려도 로그인이 안될경우 로그인 버튼을 누르거나 새로고침해 주세요.');
            setTimeout(function () {
                $('#favoriteLoginModal').find('.favorite-login-button').attr('disabled', false)
            }, 5000);
            location.href = '/favorite-song';
        }
    });

    // 로그인 모달 내부 로그인 버튼 클릭
    $('.favorite-login-button').click(function () {
        location.href = '/favorite-song';
    })

})
