import MemoUtil from "./memo-util.js";
import memoUtil from "./memo-util.js";
$(function () {

    // 서버에 노래 검색 요청
    $("#songSearchForm").submit(function (event) {
        event.preventDefault();
        $.ajax({
            type: "GET",
            url: "/songs",
            data: $("#songSearchForm").serialize(),
            success: function (data) {
                songSearchPostProcess(data);
            },
            error: function (xhr) {
                console.log(xhr);
            }
        });
    });

    /**
     * 노래 검색 결과 후처리
     * @param data 서버에서 받은 Song 리스트
     */
    function songSearchPostProcess(data) {
        // 기존 검색 결과 초기화
        let $songSearchResultTableBody = $('#songSearchResultTableBody');
        $songSearchResultTableBody.empty();

        // 새로운 검색결과 테이블 생성 및 채우기
        let songTable = MemoUtil.renderEmptySongTable(data);

        // 검색결과 후처리 - 한글타이틀 기입, 클릭시 폼입력 이벤트바인딩, data-id (songId) 추가
        $.each(data, function (index, song) {
            let songTitleHint = song.titleKorean ? '<i class=\'song-title-korean ms-4\'>' + song.titleKorean + '</i>' : '';
            jQuery(songTable.find('.song-title-text')[index]).after(songTitleHint);
            jQuery(songTable.find('.song-title')[index]).on('click', fillMemoAddFormWithSearchResult);
            jQuery(songTable.find('.song-number')[index]).attr('data-id', song.id);
        });

        // 새로운 검색결과 테이블 바디에 아이디 붙이고 교체
        $songSearchResultTableBody.replaceWith(songTable.find('tbody').attr('id', 'songSearchResultTableBody'));

        // 검색결과 collapse 안보일경우 보이게
        if (!$("#songSearchResultCollapse").hasClass("show")) {
            $("#songSearchResultCollapseButton").click();
        }
    }

// 검색 결과 누르면 폼에 입력 -> 검색결과의 .song-title 에 이벤트 연결
    function fillMemoAddFormWithSearchResult(event) {
        let memoAddForm = $('#memoAddForm');
        $('#addInfoTextInput').val(''); // 메모 입력창 초기화 뒤에서 하면 거슬림

        // 클릭한 노래의 정보를 폼에 입력
        let songRow = $(this).closest('tr');
        memoAddForm.find('.song-number span').text(songRow.find('.song-number span').text());
        memoAddForm.find('.song-title-text').text(songRow.find('.song-title-text').text());
        memoAddForm.find('.song-info-text').text(songRow.find('.song-info span').text());
        memoAddForm.find('.song-singer').text(songRow.find('.song-singer').text());

        // 폼 data 에 songId, brand 저장
        let brand = $('#songSearchForm input[name=brand]:checked').val()
        memoAddForm.attr('data-brand', brand);
        memoAddForm.attr('data-song-id', songRow.find('.song-number').data('id'));

        // 메모 테이블 정보로 현재 순서 텍스트 갱신
        let songMemo = brand === 'TJ' ? $('.table-tj') : $('.table-ky');
        let lastPresentOrder = songMemo.find('tr:last-child .song-number').attr('data-present-order');
        $('#currentPresentOrder').text(Number(lastPresentOrder) + 2); // 순서가 0부터 시작

        // 메모 추가폼으로 스크롤
        $('html, body').animate({
            scrollTop: $('#memoAddForm').offset().top - 16 // 2rem 여유
        }, 500, function () {
            // 추가 텍스트 입력창 열기 및 포커스
            if (!$('#addInfoTextCollapse').hasClass('show')) {
                $('#addInfoTextCollapseButton').click();
            }
            $('#addInfoTextInput').focus();
            // 입력폼 하이라이트
            memoUtil.blinkElement($('.add-song-row'));
        });
    }
})