$(function () {
    // 요소 페이드 인
    let fadeElements = $('.fade-in-element');
    $(window).on('scroll', onScroll);
    onScroll(); // 초기체크

    function onScroll() {
        fadeElements.each(function () {
            checkElement.call(this);
        });

        // 모든 요소가 나타났는지 확인
        fadeElements = fadeElements.filter(':not(.is-visible)');
        if (fadeElements.length === 0) {
            // $(window).off('scroll', onScroll);
        }
    }

// 요소가 화면에 보이는지 여부 체크
    function checkElement() {
        // 뷰포트 88% 지점
        var viewportTop = $(window).scrollTop() * 1.12;
        var viewportBottom = viewportTop + $(window).height() * 0.88;

        var elementTop = $(this).offset().top;
        var elementBottom = elementTop + $(this).outerHeight();

        if (elementTop < viewportBottom && elementBottom > viewportTop) { // 화면아랫방향으로 / 화면윗방향으로
            $(this).addClass('is-visible');
            // 요소가 나타나면 fadeElements 배열에서 제거
            // fadeElements = fadeElements.not($(this));
        }
    }
})
