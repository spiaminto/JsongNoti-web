
$(function () {

    // 로드시 다크모드 확인 (html theme 적용은 인라인으로 대체 -> FOUC 문제)
    let isDarkMode = localStorage.getItem('darkMode');
    if (isDarkMode === 'true') {
        $('.dark-mode-element').show();
    }

    // 다크모드 설정
    $('.dark-mode-button').on('click', function (event) {
        event.preventDefault();
        let isDarkMode = $('html').attr('data-bs-theme') === 'dark';
        if (!isDarkMode) {
            transition([$('.inner-element'), $('.outer-element')]);
            $('html').attr('data-bs-theme', 'dark');
            $('.dark-mode-element').show();
            localStorage.setItem('darkMode', 'true');
        } else {
            transition([$('.inner-element'), $('.outer-element')]);
            $('html').attr('data-bs-theme', '');
            $('.dark-mode-element').hide();
            localStorage.setItem('darkMode', '');
        }
    });

    // 다크모드 트랜지션 효과
    function transition(elementArray) {
        $.each(elementArray, function (index, element) {
            $(element).css({
                'transitionDuration': '0.5s',
                'transitionProperty': 'background-color'
            });
            setTimeout(() => {
                $(element).css({
                    'transitionDuration': '',
                    'transitionProperty': ''
                });
            }, 500);
        });
    }

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

    $('#favoriteSongButton').on('click', function (e) {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            location.href = '/favorite-song';
        }
    });

    // 메모 버튼 클릭
    $('.favorite-login-button').click(function () {
        location.href = '/favorite-song';
    })
})