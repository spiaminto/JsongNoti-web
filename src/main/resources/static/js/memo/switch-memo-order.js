import MemoUtil from "./memo-util.js";
import CommonUtil from "../common-util.js";

$(function () {

    // 순서 변경 버튼 클릭 이벤트
    let isOrderSwitching = false;
    $('.switch-order-button').on('click', function () {
        if (isOrderSwitching) {
            return; // 순서 변경중에 누르면 이 이벤트 무시
        }
        isOrderSwitching = true;
        let brand = $(this).closest('.song-table-container').find('h2 span').text().indexOf('TJ') >= 0 ? 'TJ' : 'KY';
        startSwitchOrder(brand, this);
    })

    function startSwitchOrder(brand, target) {
        let targetSelector = brand === 'TJ' ? '.table-tj' : '.table-ky';
        let $songTable = $(targetSelector);
        let $songRows = $songTable.find('tbody tr');
        $.each($songRows, function (index, row) {
            $(row).addClass('song-row-will-switch song-row-switching'); // 대상지정용, 배경빗금
        });

        let $target = $(target);
        $target.siblings('.switch-order-complete-button').show();
        MemoUtil.toggleDeleteMemoButton('off');
        MemoUtil.toggleSearchForm('off');
        MemoUtil.toggleSaveMemoButton('off');

        // 빈 '첫번째 요소로 추가' 행 추가
        let $firstRow = $songTable.find("tbody tr:first-child");
        let $emptyFirstRow = $firstRow.clone();
        $emptyFirstRow.find('.song-number').data('memo-id', '').data('present-order', '').end().find('.song-number span').text('').end().find('.song-title-text').text('첫번째 순서로 추가').end().find('.song-info span').text('첫번째 순서로 추가하려면 클릭').end().find('.song-singer').text('');
        $firstRow.before($emptyFirstRow);
    }

// 순서 변경 할 tr 클릭 이벤트 (첫번째 클릭)
    $('.memo-section .song-table').on('click', '.song-row-will-switch', function () {
        if ($(this).find('.song-number span').text() === '') {
            return;
        } // 첫클릭에서 첫번째 행은 무시함
        $(this).addClass('song-row-will-switch-selected');
        $(this).siblings().removeClass('song-row-will-switch').addClass('song-row-be-switched');
    });

// 순서 변경 당할 tr 클릭 이벤트 (두번째 클릭)
    $('.memo-section .song-table').on('click', '.song-row-be-switched', function () {
        $(this).addClass('song-row-be-switched-selected');
        let $willSwitchRow = $('.song-row-will-switch-selected');
        let $beSwitchedRow = $('.song-row-be-switched-selected');
        $beSwitchedRow.after($willSwitchRow);

        // 클래스 초기화
        $('.table-tj').find('tbody tr')
            .removeClass('song-row-be-switched song-row-be-switched-selected song-row-will-switch song-row-will-switch-selected')
            .addClass('song-row-will-switch');

        // 하이라이트
        CommonUtil.blinkElement($willSwitchRow, $willSwitchRow.css('background'));
    });

// 메모 순서변경 완료 버튼 클릭 이벤트 타겟 테이블을 h2 의 span 으로 찾음.
    $('.switch-order-complete-button').on('click', function (event) {
        let brand = $(this).closest('.song-table-container').find('h2 span').text().indexOf('TJ') >= 0 ? 'TJ' : 'KY';
        endSwitchOrder(brand, event.target);
        isOrderSwitching = false;
    })

// 순서 변경 완료 버튼 클릭 이벤트
    function endSwitchOrder(brand, target) {
        let targetSelector = brand === 'TJ' ? '.table-tj' : '.table-ky';
        let $songTable = $(targetSelector);
        let $songRows = $songTable.find('tbody tr');
        let memoIds = new Array();
        let userId = $('.memo-section-header').data('user-id');
        $.each($songRows, function (index, row) {
            memoIds.push($(row).find('.song-number').data('memo-id')); // 곡의 number 모음
        });
        memoIds = memoIds.filter(Boolean) // 빈값 제거 (첫번째 행으로 추가 제거)

        $.ajax({
            type: "POST",
            async: false,
            url: "/memos/reorder",
            contentType: "application/json",
            headers: {
                'X-CSRF-TOKEN': $('#csrfToken').val()
            },
            data: JSON.stringify({
                userId: userId,
                brand: brand,
                memoIds: memoIds,
            }),
            success: function (data) {
                // console.log(data)
                let message = data.message;
                alert(message);
            },
            error: function (xhr) {
                // console.log(xhr);
            }
        })

        // 후처리
        // $.each($songRows, function (index, row) {
        //     $(row).removeClass('song-row-will-switch song-row-switching');
        // });
        // $songTable.find('tbody tr:first-child').remove(); // 첫번째 요소로 추가 자움
        MemoUtil.refreshMemoTable(brand);

        let $target = $(target);
        $target.hide();
        $target.siblings('.switch-order-button').click(); // 컬랩스 hide
        MemoUtil.toggleSearchForm('on');
        MemoUtil.toggleSaveMemoButton('on');
        MemoUtil.toggleDeleteMemoButton('on');
    }
})
