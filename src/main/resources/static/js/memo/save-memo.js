import MemoUtil from "./memo-util.js";
import CommonUtil from "../common-util.js";

$(function () {
    $('#memoAddForm').submit(function (event) {
        event.preventDefault();
        // 데이터
        let userId = $('.memo-section-header').data('user-id');
        let songId = $(this).attr('data-song-id');
        let infoTextInputVal = $(this).find('#addInfoTextInput').val();
        let presentOrder = Number($('#currentPresentOrder').text()) - 1; // 순서가 0부터 시작
        let csrfToken = $('#csrfToken').val();

        // 전송
        $.ajax({
            type: "POST",
            url: "/memos",
            context: this,
            contentType: "application/json",
            headers: {
                'X-CSRF-TOKEN': csrfToken
            },
            data: JSON.stringify({
                userId: userId,
                songId: songId,
                infoText: infoTextInputVal,
                presentOrder: presentOrder,
            }),
            success: function (data) {
                alert('메모가 저장되었습니다.');
                let brand = $(this).attr('data-brand');
                MemoUtil.refreshMemoTable(brand);
                let targetSelector = brand === 'TJ' ? '.table-tj' : '.table-ky';
                let $songTable = $(targetSelector);
                // 저장된 메모 하이라이트
                CommonUtil.blinkElement($songTable.find('.song-number[data-present-order=' + presentOrder + ']').closest('tr'));
            },
            error: function (xhr) {
                // console.log(xhr);
                let message = xhr.responseJSON.message;
                alert(message);
            }
        })
    })
})