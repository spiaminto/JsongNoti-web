import FavoriteSongUtil from "./favorite-song-util.js";

$(function () {
    $('#changeSettingForm').submit(function (event) {
        event.preventDefault();
        let favoriteSongPresentType = $('#changeSettingForm').find('input[name=favoriteSongPresentType]:checked').val();
        let favoriteSongPresentBrand = $('#changeSettingForm').find('input[name=favoriteSongPresentBrand]:checked').val();
        let userId = $('.favorite-song-section-header').data('user-id');
        let csrfToken = $('#csrfToken').val();
        $.ajax({
            url: '/users/' + userId,
            type: 'PATCH',
            contentType: 'application/json',
            headers: {
                'X-CSRF-TOKEN': csrfToken
            },
            data: JSON.stringify({
                favoriteSongPresentType: favoriteSongPresentType,
                favoriteSongPresentBrand: favoriteSongPresentBrand
            }),
            success: function (data) {
                alert(data.message);
                $('#changeSettingModalCloseButton').click();
                FavoriteSongUtil.initializeFavoriteSongTable();
            },
            error: function (xhr) {
                // console.log(xhr.responseText);
            }
        })
    })
})
