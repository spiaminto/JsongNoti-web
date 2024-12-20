import SongTableUtil from "../song-table-util.js";

class MemoUtil {

    // Table Utils ============================================================

    /**
     * 메모테이블 초기화
     * 브랜드에 따라 렌더링 여부 및 스타일 결정
     */
    initializeMemoTable() {
        let brand = $('#changeSettingForm').find('input[name=showMemoBrand]:checked').val();
        let $tjContainer = $('.song-table-container').first();
        let $kyContainer = $('.song-table-container').last();
        switch (brand) {
            case 'ALL':
                this.refreshMemoTable('TJ');
                this.refreshMemoTable('KY');
                $tjContainer.slideDown(500);
                $kyContainer.slideDown(500);
                $tjContainer.removeClass('expand-for-single-memo');
                $kyContainer.removeClass('expand-for-single-memo');
                break;
            case 'TJ':
                this.refreshMemoTable('TJ');
                $kyContainer.hide();
                $tjContainer.addClass('expand-for-single-memo');
                $kyContainer.removeClass('expand-for-single-memo');
                $tjContainer.slideDown(500);
                break;
            case 'KY':
                this.refreshMemoTable('KY');
                $tjContainer.hide();
                $tjContainer.removeClass('expand-for-single-memo');
                $kyContainer.addClass('expand-for-single-memo');
                $kyContainer.slideDown(500);
                break;
            default:
                break;
        }
    }

    /**
     * 메모테이블 갱신
     * @param brand 'TJ', 'KY'
     */
    refreshMemoTable(brand) {
        let dataList = this.getMemoTableData(brand); // 서버에서 데이터 가져옴
        let songTable = SongTableUtil.renderEmptySongTable(dataList); // 빈 테이블 복사후 데이터 채움

        // memoId, presentOrder 붙임
        let songRows = songTable.find('tbody tr');
        $.each(songRows, function (index, row) {
            $(row).find('.song-number').attr('data-memo-id', dataList[index].id);
            $(row).find('.song-number').attr('data-present-order', dataList[index].presentOrder);
        });

        // 테이블 바디 교체
        let targetSelector = brand === 'TJ' ? '.table-tj tbody' : '.table-ky tbody';
        $(targetSelector).replaceWith($(songTable).find('tbody'));
    }

    /**
     * 서버에서 메모테이블 데이터를 가져와 반환
     * @param brand 가져올 브랜드
     * @returns {*} SongMemo 리스트 (order by presentOrder ASC)
     */
    getMemoTableData(brand) {
        let memoData;
        let memoPresentType = $('#changeSettingForm input[name=memoPresentType]:checked').val();
        let userId = $('.memo-section-header').data('user-id');
        $.ajax({
            type: "GET",
            url: "/memos",
            async: false, // 결과 반환을 위해 동기화
            data: {
                userId: userId,
                brand: brand,
                memoPresentType: memoPresentType
            },
            success: function (data) {
                memoData = data.songMemos;
            },
            error: function (xhr) {
                console.log(xhr);
                memoData = null;
                // let message = xhr.responseJSON.message;
            }
        })
        return memoData;
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

    toggleDeleteMemoButton(command) {
        if (command === 'on') {
            $('.delete-memo-button').prop('disabled', false).show();
        } else if (command === 'off') {
            $('.delete-memo-button').prop('disabled', true).hide();
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

}

const memoUtil = new MemoUtil();
export default memoUtil;
