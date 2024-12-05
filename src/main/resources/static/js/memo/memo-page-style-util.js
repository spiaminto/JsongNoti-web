$(function () {
    // 컬랩스 클릭 -> 회전
    $('.collapse-button').on('click', function () {
        if ($(this).hasClass('collapse-button-open')) {
            $(this).removeClass('collapse-button-open')
        } else {
            $(this).addClass('collapse-button-open')
        }
    })

// 사용방법 바로가기 버튼 클릭시 스크롤 이벤트
    $('.usage-Button').click(function () {
        $('html, body').animate({
            scrollTop: $('.showcase').offset().top - 32 // 2rem 여유
        }, 1); // fade in 걸린 요소 때문에 애니메이션 이상해져서 1ms 로 줄임
    });

});
