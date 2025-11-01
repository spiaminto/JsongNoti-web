$(function () {

    // 탈퇴 ================================================================================

// 유저 탈퇴 폼 전송
    $('#deleteUserForm').submit(function (event) {
        event.preventDefault();

        let email = $('#deleteUserEmailInput').val();
        let csrf = $('#csrfToken').val();
        let userId = $('.favorite-song-section-header').data('user-id');
        $.ajax({
            type: 'POST',
            url: '/users' + '/' + userId + '/delete',
            contentType: 'application/json',
            headers: {
                'X-CSRF-TOKEN': csrf
            },
            data: JSON.stringify({
                email: email
            }),
            success: function (data) {
                // console.log(data);
                let message = data.message;
                alert(message);
                if (!$("#verifyDeleteUserCollapse").hasClass("show")) {
                    $("#verifyDeleteUserCollapseButton").click();
                }
            },
            error: function (xhr) {
                // console.log(xhr);
                let message = xhr.responseJSON.message;
                alert(message);
            }
        });
    });

// 탈퇴 인증코드 전송
    $('#verifyDeleteUserForm').submit(function (event) {
        event.preventDefault();
        if (!confirm('정말 탈퇴 하시겠습니까?')) {
            return;
        }
        $(this).prop('disabled', true);

        let code = $('#verifyDeleteUserCodeInput').val();
        let csrf = $('#csrfToken').val();
        let userId = $('.favorite-song-section-header').data('user-id');
        $.ajax({
            type: 'POST',
            url: '/users' + '/' + userId + '/verify-delete',
            contentType: 'application/json',
            headers: {
                'X-CSRF-TOKEN': csrf
            },
            data: JSON.stringify({
                code: code
            }),
            success: function (data) {
                let message = data.message;
                // console.log(data);
                alert(message);
                localStorage.removeItem('isLoggedIn');

                $('#logoutForm').submit();
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