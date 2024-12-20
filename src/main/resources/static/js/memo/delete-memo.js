import MemoUtil from "./memo-util.js";

$(function () {

// 삭제하기 버튼 클릭 이벤트리스너
    let isMemoDeleting = false;
    $('.delete-memo-button').on('click', function (event) {
        if (isMemoDeleting) {
            return;
        } // 순서 변경중에 누르면 이 이벤트 무시
        isMemoDeleting = true;
        let brand = $(this).closest('.song-table-container').find('h2 span').text().indexOf('TJ') >= 0 ? 'TJ' : 'KY';
        startDeleteMemo(brand, event.target);
    })

// 삭제하기 버튼 클릭 이벤트
    function startDeleteMemo(brand, target) {
        let songTable = brand === 'TJ' ? $('.table-tj') : $('.table-ky');
        let songRows = songTable.find('tbody tr');

        $.each(songRows, function (index, row) {
            // 삭제 이벤트 연결
            $(row).find('.song-title').on('click', function (event) {
                event.preventDefault();
                deleteMemoEvent(brand, event.target);
            });
            $(row).addClass('song-row-deleting');
        });

        $(target).siblings('.delete-memo-complete-button').show();
        MemoUtil.toggleSwitchOrderButton('off');
        MemoUtil.toggleSaveMemoButton('off');
        MemoUtil.toggleSearchForm('off');
    }

// 실제 노래 삭제 버튼 클릭 이벤트
    function deleteMemoEvent(brand, target) {
        let $target = $(target);
        let songTitle = $target.find('.song-title-text').text();
        if (!confirm('확인을 누르면 다음 곡이 삭제됩니다.\n' + songTitle)) return false; // 취소시 리턴

        let memoId = $target.closest('tr').find('.song-number').data('memo-id')
        let userId = $('.memo-section-header').data('user-id');
        let csrfToken = $('#csrfToken').val();

        $.ajax({
            type: "DELETE",
            url: "/memos/" + memoId,
            contentType: "application/json",
            headers:{
                'X-CSRF-TOKEN': csrfToken
            },
            data: JSON.stringify({
                userId: userId,
            }),
            success: function (data) {
                $target.closest('tr').remove();
            },
            error: function (xhr) {
                // console.log(xhr);
            }
        })
    }

// 삭제완료 버튼 클릭 이벤트
    $('.delete-memo-complete-button').on('click', function (event) {
        let brand = $(this).closest('.song-table-container').find('h2 span').text().indexOf('TJ') >= 0 ? 'TJ' : 'KY';
        endDeleteMemo(brand, event.target);
    })

    function endDeleteMemo(brand, target) {
        // let $songTable = brand === 'TJ' ? $('.table-tj') : $('.table-ky');
        MemoUtil.refreshMemoTable(brand);
        // $songTable.find('tbody tr').removeClass('song-row-deleting');

        let $target = $(target);
        $target.siblings('.delete-memo-button').click(); // 컬랩스 hide
        $target.hide();

        isMemoDeleting = false;
        MemoUtil.toggleSwitchOrderButton('on');
        MemoUtil.toggleSearchForm('on');
        MemoUtil.toggleSaveMemoButton('on');
    }
});
