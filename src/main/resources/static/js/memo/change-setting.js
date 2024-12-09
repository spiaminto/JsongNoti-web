import MemoUtil from "./memo-util.js";

$(function () {
    $('#changeSettingForm').submit(function (event) {
        event.preventDefault();
        let memoPresentType = $('#changeSettingForm').find('input[name=memoPresentType]:checked').val();
        let showMemoBrand = $('#changeSettingForm').find('input[name=showMemoBrand]:checked').val();
        let userId = $('.memo-section-header').data('user-id');
        let csrfToken = $('#csrfToken').val();
        $.ajax({
            url: '/users/' + userId,
            type: 'PATCH',
            data: {
                memoPresentType: memoPresentType,
                showMemoBrand: showMemoBrand,
                _csrf: csrfToken
            },
            success: function (data) {
                console.log(data);
                alert(data.message);
                $('#changeSettingModalCloseButton').click();
                MemoUtil.initializeMemoTable();
            },
            error: function (xhr) {
                console.log(xhr.responseText);
            }
        })
    })
})