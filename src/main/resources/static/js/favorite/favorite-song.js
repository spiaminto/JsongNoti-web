import FavoriteSongUtil from "./favorite-song-util.js";
import CommonUtil from "../common-util.js";

$(function () {

    // 저장 =====================================================================================

// 노래 순서 모달 버튼 클릭
    $('#presentOrderModalButton').click(function () {
        // 순서 설정 테이블로 붙일 테이블 결정
        let brand = $('#favoriteSongAddForm').attr('data-brand');
        let favoriteSongTable = brand === 'TJ' ? $('.table-tj') : $('.table-ky');

        // 순서 설정 테이블 초기화 후 붙임
        let $choosePresentOrderTable = $('#choosePresentOrderTable');
        $choosePresentOrderTable.find('tbody').empty().append(favoriteSongTable.find('tbody').html());

        // 빈 '첫번째 요소로 추가' 행 추가
        let $firstRow = $choosePresentOrderTable.find("tbody tr:first-child");
        let $emptyFirstRow = $firstRow.clone();
        $emptyFirstRow.find('.song-number').attr('data-present-order', '-1').end().find('.song-number span').text('').end().find('.song-title-text').text('첫번째 순서로 추가').end().find('.song-info span').text('첫번째 순서로 추가하려면 클릭').end().find('.song-singer').text('');
        $firstRow.before($emptyFirstRow);
    })

// 노래 순서 모달 노래 클릭
    $('#choosePresentOrderTable').on('click', '.song-title', function (e) {
        e.preventDefault();
        let presentOrder = $(this).closest('tr').find('.song-number').attr('data-present-order');
        $('#choosePresentOrderTable tr').removeClass('selected');
        $(this).closest('tr').addClass('selected');
    })

// 노래 순서 모달 확인 클릭
    $('#presentOrderModal .modal-footer button').click(function () {
        let selectedRow = $('#choosePresentOrderTable tr.selected');
        let presentOrder = selectedRow.find('.song-number').attr('data-present-order');
        if (presentOrder) {
            $('#currentPresentOrder').text(Number(presentOrder) + 2); // 순서가 0부터 시작
        }
    })

    $('#useDefaultInfoTextCheck').change(function () {
        $(this).is(':checked') ? $('#addInfoTextInput').prop('disabled', true) : $('#addInfoTextInput').prop('disabled', false);
    })

// 애창곡 저장
    $('#favoriteSongAddForm').submit(function (event) {
        event.preventDefault();
        // 데이터
        let userId = $('.favorite-song-section-header').data('user-id');
        let songId = $(this).attr('data-song-id');
        let infoTextInputVal = $(this).find('#addInfoTextInput').val();
        let useDefaultInfoText = $(this).find('#useDefaultInfoTextCheck').is(':checked');
        let presentOrder = Number($('#currentPresentOrder').text()) - 1; // 순서가 0부터 시작
        let csrfToken = $('#csrfToken').val();

        // 전송
        $.ajax({
            type: "POST",
            url: "/favorite-songs",
            context: this,
            contentType: "application/json",
            headers: {
                'X-CSRF-TOKEN': csrfToken
            },
            data: JSON.stringify({
                userId: userId,
                songId: songId,
                infoText: infoTextInputVal,
                useDefaultInfoText:  useDefaultInfoText,
                presentOrder: presentOrder,
            }),
            success: function (data) {
                alert(data.message);
                let brand = $(this).attr('data-brand');
                FavoriteSongUtil.refreshFavoriteSongTable(brand);
                let targetSelector = brand === 'TJ' ? '.table-tj' : '.table-ky';
                let $songTable = $(targetSelector);

                // 저장된 메모 하이라이트
                let $savedFavoriteSong = $songTable.find('.song-number[data-present-order=' + presentOrder + ']').closest('tr');
                CommonUtil.blinkElement($savedFavoriteSong, $savedFavoriteSong.css('background'));
            },
            error: function (xhr) {
                // console.log(xhr);
                let message = xhr.responseJSON.message;
                alert(message);
            }
        })
    })

    // 순서변경 ======================================================================================

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
        FavoriteSongUtil.toggleSwitchOrderButton('off');
        FavoriteSongUtil.toggleDeleteFavoriteSongButton('off');
        FavoriteSongUtil.toggleSearchForm('off');
        FavoriteSongUtil.toggleSaveFavoriteSongButton('off');

        // 빈 '첫번째 요소로 추가' 행 추가
        let $firstRow = $songTable.find("tbody tr:first-child");
        let $emptyFirstRow = $firstRow.clone();
        $emptyFirstRow.find('.song-number').data('favorite-song-id', '').data('present-order', '').end().find('.song-number span').text('').end().find('.song-title-text').text('첫번째 순서로 추가').end().find('.song-info span').text('첫번째 순서로 추가하려면 클릭').end().find('.song-singer').text('');
        $firstRow.before($emptyFirstRow);
    }

// 순서 변경 할 tr 클릭 이벤트 (첫번째 클릭)
    $('.favorite-song-section .song-table').on('click', '.song-row-will-switch', function () {
        if ($(this).find('.song-number span').text() === '') {
            return;
        } // 첫클릭에서 첫번째 행은 무시함
        $(this).addClass('song-row-will-switch-selected');
        $(this).siblings().removeClass('song-row-will-switch').addClass('song-row-be-switched');
    });

// 순서 변경 당할 tr 클릭 이벤트 (두번째 클릭)
    $('.favorite-song-section .song-table').on('click', '.song-row-be-switched', function () {
        $(this).addClass('song-row-be-switched-selected');
        let $willSwitchRow = $('.song-row-will-switch-selected');
        let $beSwitchedRow = $('.song-row-be-switched-selected');
        $beSwitchedRow.after($willSwitchRow);

        // 클래스 초기화
        $(this).closest('.song-table').find('tbody tr')
            .removeClass('song-row-be-switched song-row-be-switched-selected song-row-will-switch song-row-will-switch-selected')
            .addClass('song-row-will-switch');

        // 하이라이트
        CommonUtil.blinkElement($willSwitchRow, $willSwitchRow.css('background'));
    });

// 메모 순서변경 완료 버튼 클릭 이벤트 타겟 테이블을 h2 의 span 으로 찾음.
    $('.switch-order-complete-button').on('click', function (event) {
        let brand = $(this).closest('.song-table-container').find('h2 span').text().indexOf('TJ') >= 0 ? 'TJ' : 'KY';
        endSwitchOrder(brand, event.target);
    })

// 순서 변경 완료 버튼 클릭 이벤트
    function endSwitchOrder(brand, target) {
        if ($('.favorite-song-section .collapsing').length > 0) { return; } // 컬랩스 애니메이션 중에는 이벤트 무시
        let targetSelector = brand === 'TJ' ? '.table-tj' : '.table-ky';
        let $songTable = $(targetSelector);
        let $songRows = $songTable.find('tbody tr');
        let favoriteSongIds = new Array();
        let userId = $('.favorite-song-section-header').data('user-id');
        $.each($songRows, function (index, row) {
            favoriteSongIds.push($(row).find('.song-number').data('favorite-song-id')); // 곡의 number 모음
        });
        favoriteSongIds = favoriteSongIds.filter(Boolean) // 빈값 제거 (첫번째 행으로 추가 제거)

        $.ajax({
            type: "POST",
            async: false,
            url: "/favorite-songs/reorder",
            contentType: "application/json",
            headers: {
                'X-CSRF-TOKEN': $('#csrfToken').val()
            },
            data: JSON.stringify({
                userId: userId,
                brand: brand,
                favoriteSongIds: favoriteSongIds,
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
        FavoriteSongUtil.toggleSearchForm('on');
        FavoriteSongUtil.toggleSaveFavoriteSongButton('on');
        FavoriteSongUtil.toggleDeleteFavoriteSongButton('on');
        FavoriteSongUtil.toggleSwitchOrderButton('on');
        $(target).siblings('.switch-order-button').click().end().hide(); // 컬랩스, 완료버튼 hide
        isOrderSwitching = false; // .switch-order-button 클릭시 이벤트 재실행을 막기위해 클릭 이후 변경

        FavoriteSongUtil.refreshFavoriteSongTable(brand);
    }

    // 삭제 ======================================================================================

// 삭제하기 버튼 클릭 이벤트리스너
    let isFavoriteSongDeleting = false;
    $('.delete-favorite-song-button').on('click', function (event) {
        if (isFavoriteSongDeleting) {
            return;
        } // 순서 변경중에 누르면 이 이벤트 무시
        isFavoriteSongDeleting = true;
        let brand = $(this).closest('.song-table-container').find('h2 span').text().indexOf('TJ') >= 0 ? 'TJ' : 'KY';
        startDeleteFavoriteSong(brand, event.target);
    })

// 삭제하기 버튼 클릭 이벤트
    function startDeleteFavoriteSong(brand, target) {
        let songTable = brand === 'TJ' ? $('.table-tj') : $('.table-ky');
        let songRows = songTable.find('tbody tr');

        $.each(songRows, function (index, row) {
            // 삭제 이벤트 연결
            $(row).find('.song-title').on('click', function (event) {
                event.preventDefault();
                deleteFavoriteSongEvent(brand, event.currentTarget);
            });
            $(row).addClass('song-row-deleting');
        });

        $(target).siblings('.delete-favorite-song-complete-button').show();
        FavoriteSongUtil.toggleDeleteFavoriteSongButton('off');
        FavoriteSongUtil.toggleSwitchOrderButton('off');
        FavoriteSongUtil.toggleSaveFavoriteSongButton('off');
        FavoriteSongUtil.toggleSearchForm('off');
    }

// 실제 노래 삭제 버튼 클릭 이벤트
    function deleteFavoriteSongEvent(brand, target) {
        let $target = $(target);
        let songTitle = $target.find('.song-title-text').text();
        let songSinger = $target.closest('tr').find('.song-singer').text();
        console.log($target)
        console.log(songTitle);
        if (!confirm('확인을 누르면 다음 곡이 삭제됩니다.\n' + songSinger + ' - ' + songTitle)) return false; // 취소시 리턴

        let favoriteSongId = $target.closest('tr').find('.song-number').data('favorite-song-id')
        let userId = $('.favorite-song-section-header').data('user-id');
        let csrfToken = $('#csrfToken').val();

        $.ajax({
            type: "DELETE",
            url: "/favorite-songs/" + favoriteSongId,
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
    $('.delete-favorite-song-complete-button').on('click', function (event) {
        let brand = $(this).closest('.song-table-container').find('h2 span').text().indexOf('TJ') >= 0 ? 'TJ' : 'KY';
        endDeleteFavoriteSong(brand, event.target);
    })

    function endDeleteFavoriteSong(brand, target) {
        if ($('.favorite-song-section .collapsing').length > 0) { return; } // 컬랩스 애니메이션 중에는 이벤트 무시

        FavoriteSongUtil.toggleDeleteFavoriteSongButton('on');
        FavoriteSongUtil.toggleSwitchOrderButton('on');
        FavoriteSongUtil.toggleSearchForm('on');
        FavoriteSongUtil.toggleSaveFavoriteSongButton('on');
        $(target).hide(); // 완료 버튼 숨기기
        $(target).siblings('.delete-favorite-song-button').click().end().hide(); // 컬랩스, 완료버튼 hide
        isFavoriteSongDeleting = false; // .delete-favorite-song-button 클릭시 이벤트 재실행을 막기위해 클릭 이후에 변경

        FavoriteSongUtil.refreshFavoriteSongTable(brand); // 테이블 갱신
    }
});
