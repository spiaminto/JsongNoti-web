$(function () {
    // 요소 페이드 인
    let fadeElements = $('.fade-in-element');
    $(window).on('scroll', onScroll);
    onScroll(); // 초기체크

    function onScroll() {
        fadeElements.each(function () {
            checkElement(this);
        });

        // 모든 요소가 나타났다면 이벤트 해제
        fadeElements = fadeElements.filter(':not(.is-visible)');
        if (fadeElements.length === 0) {
            $(window).off('scroll', onScroll);
        }
    }

// 요소가 화면에 보이는지 여부 체크
    function checkElement(element) {
        // 뷰포트 90% 지점
        let viewportTop = $(window).scrollTop();
        let viewportBottom = viewportTop + $(window).height() * 0.9;

        let elementTop = $(element).offset().top;
        let elementBottom = elementTop + $(element).outerHeight();

        if (elementTop < viewportBottom && elementBottom > viewportTop) { // 화면아랫방향으로 / 화면윗방향으로
            $(element).addClass('is-visible');
        }
    }
})
