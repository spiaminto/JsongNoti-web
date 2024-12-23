import SongTableUtil from "../song-table-util.js";

class FavoriteSongUtil {

    // Table Utils ============================================================

    /**
     * 애창곡 테이블 초기화
     * 브랜드에 따라 렌더링 여부 및 스타일 결정
     */
    initializeFavoriteSongTable() {
        let brand = $('#changeSettingForm').find('input[name=favoriteSongPresentBrand]:checked').val();
        let $tjContainer = $('.song-table-container').first();
        let $kyContainer = $('.song-table-container').last();
        switch (brand) {
            case 'ALL':
                this.refreshFavoriteSongTable('TJ');
                this.refreshFavoriteSongTable('KY');
                $tjContainer.slideDown(500);
                $kyContainer.slideDown(500);
                $tjContainer.removeClass('expand-for-single-favorite-song');
                $kyContainer.removeClass('expand-for-single-favorite-song');
                break;
            case 'TJ':
                this.refreshFavoriteSongTable('TJ');
                $kyContainer.hide();
                $tjContainer.addClass('expand-for-single-favorite-song');
                $kyContainer.removeClass('expand-for-single-favorite-song');
                $tjContainer.slideDown(500);
                break;
            case 'KY':
                this.refreshFavoriteSongTable('KY');
                $tjContainer.hide();
                $tjContainer.removeClass('expand-for-single-favorite-song');
                $kyContainer.addClass('expand-for-single-favorite-song');
                $kyContainer.slideDown(500);
                break;
            default:
                break;
        }
    }

    /**
     * 애창곡 테이블 갱신
     * @param brand 'TJ', 'KY'
     */
    refreshFavoriteSongTable(brand) {
        let dataList = this.getFavoriteSongTableData(brand); // 서버에서 데이터 가져옴
        let songTable = SongTableUtil.renderEmptySongTable(dataList); // 빈 테이블 복사후 데이터 채움

        // favoriteSongId, presentOrder 붙임
        let songRows = songTable.find('tbody tr');
        $.each(songRows, function (index, row) {
            $(row).find('.song-number').attr('data-favorite-song-id', dataList[index].id);
            $(row).find('.song-number').attr('data-present-order', dataList[index].presentOrder);
        });

        // 테이블 바디 교체
        let targetSelector = brand === 'TJ' ? '.table-tj tbody' : '.table-ky tbody';
        $(targetSelector).replaceWith($(songTable).find('tbody'));
    }

    /**
     * 서버에서 에창곡 데이터를 가져와 반환
     * @param brand 가져올 브랜드
     * @returns {*} SongFavoriteSong 리스트 (order by presentOrder ASC)
     */
    getFavoriteSongTableData(brand) {
        let favoriteSongData;
        let favoriteSongPresentType = $('#changeSettingForm input[name=favoriteSongPresentType]:checked').val();
        let userId = $('.favorite-song-section-header').data('user-id');
        $.ajax({
            type: "GET",
            url: "/favorite-songs",
            async: false, // 결과 반환을 위해 동기화
            data: {
                userId: userId,
                brand: brand,
                favoriteSongPresentType: favoriteSongPresentType
            },
            success: function (data) {
                favoriteSongData = data.favoriteSongs;
            },
            error: function (xhr) {
                // console.log(xhr);
                favoriteSongData = null;
                // let message = xhr.responseJSON.message;
            }
        })
        return favoriteSongData;
    }

    // Element Utils ==========================================================

    toggleSearchForm(command) {
        if (command === 'on') {
            $('#songSearchForm input').prop('disabled', false);
            $('#songSearchForm button').prop('disabled', false);
        } else if (command === 'off') {
            $('#songSearchForm input').prop('disabled', true);
            $('#songSearchForm button').prop('disabled', true);
        }
    }

    toggleDeleteFavoriteSongButton(command) {
        if (command === 'on') {
            $('.delete-favorite-song-button').prop('disabled', false).show();
        } else if (command === 'off') {
            $('.delete-favorite-song-button').prop('disabled', true).hide();
        }
    }

// 버튼 on off
    toggleSwitchOrderButton(command) {
        if (command === 'on') {
            $('.switch-order-button').prop('disabled', false).show();
        } else if (command === 'off') {
            $('.switch-order-button').prop('disabled', true).hide();
        }
    }

    toggleSaveFavoriteSongButton(command) {
        if (command === 'on') {
            $('#addSongButton').prop('disabled', false).show();
        } else if (command === 'off') {
            $('#addSongButton').prop('disabled', true).hide();
        }
    }

}

const favoriteSongUtil = new FavoriteSongUtil();
export default favoriteSongUtil;
