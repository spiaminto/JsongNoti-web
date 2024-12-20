$(function () {
    // 구독하기 폼 전송
    let subscriptionId = 0;
    $('#subscribeForm').submit(function (event) {
        event.preventDefault();
        $(this).prop('disabled', true);

        let email = $('#emailInput').val();
        let csrf = $('#csrfToken').val();
        let agreement = $('#flexCheckDefault').is(':checked');
        if (!agreement) {
            alert('이메일 수집에 동의해주세요.');
            return;
        }
        $.ajax({
            type: 'POST',
            url: '/subscriptions',
            data: {
                email: email,
                _csrf: csrf
            },
            success: function (data) {
                // console.log(data);
                subscriptionId = data.subscriptionId;
                let message = data.message;
                alert(message);
                if (!$("#verifyEmailCollapse").hasClass("show")) {
                    $("#verifyEmailCollapseButton").click();
                }
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

//  구독하기 인증코드 전송
    $('#verifySubscriptionForm').submit(function (event) {
        event.preventDefault();
        $(this).prop('disabled', true);

        let code = $('#verifyCodeInput').val();
        let csrf = $('#csrfToken').val();
        $.ajax({
            type: 'POST',
            url: '/subscriptions' + '/' + subscriptionId + '/verify-add',
            data: {
                code: code,
                _csrf: csrf
            },
            success: function (data) {
                let message = data.message;
                // console.log(data);
                alert(message);
                if ($("#verifyEmailCollapse").hasClass("show")) {
                    $("#verifyEmailCollapseButton").click();
                }
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