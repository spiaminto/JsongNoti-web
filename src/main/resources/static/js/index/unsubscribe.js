$(function () {
    // 구독 취소 폼 전송
    $('#unsubscribeForm').submit(function (event) {
        event.preventDefault();

        let email = $('#unsubscribeEmailInput').val();
        let csrf = $('#csrfToken').val();
        $.ajax({
            type: 'POST',
            url: '/subscriptions/delete',
            data: {
                email: email,
                _csrf: csrf
            },
            success: function (data) {
                // console.log(data);
                subscriptionId = data.subscriptionId;
                let message = data.message;
                alert(message);
                if (!$("#verifyDeleteCollapse").hasClass("show")) {
                    $("#verifyDeleteCollapseButton").click();
                }
            },
            error: function (xhr) {
                // console.log(xhr);
                let message = xhr.responseJSON.message;
                alert(message);
            }
        });
    });

// 구독 취소 인증코드 전송
    $('#verifyUnsubscriptionForm').submit(function (event) {
        event.preventDefault();
        if (!confirm('정말 구독을 취소하시겠습니까?')) {
            return;
        }
        $(this).prop('disabled', true);

        let code = $('#verifyDeleteCodeInput').val();
        let csrf = $('#csrfToken').val();
        $.ajax({
            type: 'POST',
            url: '/subscriptions' + '/' + subscriptionId + '/verify-delete',
            data: {
                code: code,
                _csrf: csrf
            },
            success: function (data) {
                let message = data.message;
                // console.log(data);
                alert(message);
                if ($("#verifyDeleteCollapse").hasClass("show")) {
                    $("#verifyDeleteCollapseButton").click();
                }
                $("#unsubscribeModalCloseButton").click();
            },
            error: function (xhr) {
                // console.log(xhr);
                let message = xhr.responseJSON.message;
                alert(message);
            },
            complete: function () {
                $(this).prop('disabled', false);
            }
        });
    });

})