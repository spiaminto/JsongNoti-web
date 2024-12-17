$(function () {
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