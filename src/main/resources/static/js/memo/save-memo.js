import MemoUtil from "./memo-util.js";

$(function () {
    $('#memoAddForm').submit(function (event) {
        event.preventDefault();
        // 데이터
        let songId = $(this).attr('data-song-id');
        let infoTextInputVal = $(this).find('#addInfoTextInput').val();
        let presentOrder = Number($('#currentPresentOrder').text()) - 1; // 순서가 0부터 시작
        let csrfToken = $('#csrfToken').val();

        // 전송
        $.ajax({
            type: "POST",
            url: "/memos",
            context: this,
            data: {
                songId: songId,
                infoText: infoTextInputVal,
                presentOrder: presentOrder,
                _csrf: csrfToken
            },
            success: function (data) {
                alert('메모가 저장되었습니다.');
                MemoUtil.refreshMemoTable($(this).attr('data-brand'));
            },
            error: function (xhr) {
                // console.log(xhr);
                let message = xhr.responseJSON.message;
                alert(message);
            }
        })
    })
})