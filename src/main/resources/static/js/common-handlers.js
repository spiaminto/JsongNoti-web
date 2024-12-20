
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

    // 메모 버튼 클릭
    $('#memoButton').click(function () {
        let isLoggedIn = localStorage.getItem("isLoggedIn"); // null or 'true'
        if (!isLoggedIn) {
            if (!confirm("메모 기능 사용을 위해 구글 로그인이 필요합니다. \n " +
                "확인 버튼을 누르면 구글 로그인을 진행합니다.")) {
                return;
            }
        }
        location.href = '/memo';
    })
})