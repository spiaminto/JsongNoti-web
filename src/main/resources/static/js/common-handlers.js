
$(function () {

    // dark 토글 (ui-overhaul-3 D22): 초기값은 theme-init.js(head)가 이미 적용했다.
    // 저장값은 'true'(dark) / ''(cream 으로 끔) — 저장값이 없을 때만 시스템 설정을 따른다.
    // 프로스트(frost-baking.js)처럼 테마 색을 미리 구워 두는 쪽은 colorthemechange 를 듣고 다시 굽는다
    $('.dark-mode-button').on('click', function (event) {
        event.preventDefault();
        let turnDark = $('html').attr('data-theme') !== 'dark';
        window.applyColorTheme(turnDark);
        localStorage.setItem('darkMode', turnDark ? 'true' : '');
        document.dispatchEvent(new CustomEvent('colorthemechange', {detail: {dark: turnDark}}));
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
