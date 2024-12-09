class MemoUtil {

    // Table Utils ============================================================
    /**
     * 메모테이블 갱신
     * @param brand 'TJ', 'KY'
     */
    refreshMemoTable(brand) {
        let dataList = this.getMemoTableData(brand); // 서버에서 데이터 가져옴
        let songTable = this.renderEmptySongTable(dataList); // 빈 테이블 복사후 데이터 채움

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
        let memoPresentType = $('#memoSettingForm input[name=memoPresentType]:checked').val();
        $.ajax({
            type: "GET",
            url: "/memos",
            async: false, // 결과 반환을 위해 동기화
            data: {
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

    /**
     * .empty-song-table 을 복사한 뒤 dataList 의 값으로 채움
     * @param dataList 서버에서 조회한 노래 데이터 리스트
     * @returns {*|jQuery} 데이터를 채운 테이블
     */
    renderEmptySongTable(dataList) {
        if (dataList == null) {
            console.log('dataList is null');
            return;
        }
        let emptySongTable = $('.empty-song-table');
        let resultTable = emptySongTable.clone();
        resultTable.removeClass('empty-song-table');

        let firstRow = resultTable.find('tbody tr:first-child');
        $.each(dataList, function (index, song) {
            let row = firstRow.clone();
            row.find('.song-number span').text(song.number);
            row.find('.song-title-text').text(song.title);
            row.find('.song-info span').text(song.info);
            row.find('.song-singer').text(song.singer);
            firstRow.before(row); // after 가 아닌 before 로 붙여야 순서가 맞음
        });
        firstRow.remove();
        return resultTable;
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

    /**
     * jquery 객체를 받아서 해당 엘리먼트를 깜빡임
     */
    blinkElement(element) {
        $(element).css({
            transition: 'background-color 300ms linear',
            backgroundColor: '#fff3cd'
        });
        setTimeout(function () {
            $(element).css('background-color', '')
        }, 250);
        setTimeout(function () {
            $(element).css('transition' , '')
        }, 500);
    }

}

const memoUtil = new MemoUtil();
export default memoUtil;
