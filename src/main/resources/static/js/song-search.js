import SongTableUtil from "./song-table-util.js";
import CommonUtil from "./common-util.js";

$(function () {

    $("#songSearchForm input[name='searchType']").on('change', function () {
        let searchType = $("#songSearchForm input[name='searchType']:checked").val();
        if (searchType === 'SINGER') {
            $('#searchHintContainer').find('.singer-hint').show().end().find('.title-hint').hide();
            $('#searchSongInput').attr('placeholder', '아티스트명 입력 (최소 2자)');
        } else if (searchType === 'TITLE') {
            $('#searchHintContainer').find('.title-hint').show().end().find('.singer-hint').hide();
            $('#searchSongInput').attr('placeholder', '노래제목 입력 (최소 2자)');
        }

    })

    // 서버에 노래 검색 요청
    $("#songSearchForm").submit(function (event) {
        event.preventDefault();
        requestSongSearch(false);
    });

    // 추가 검색 요청
    $("#additionalSongSearchButton").click(function () {
        requestSongSearch(true);
    })

    function requestSongSearch(isAdditionalSearch) {
        let brand = $('#songSearchForm input[name=brand]:checked').val();
        let searchType = $('#songSearchForm input[name=searchType]:checked').val();
        let keyword = $('#songSearchForm input[name=keyword]').val();
        $.ajax({
            type: "GET",
            url: "/songs",
            data: {
                brand: brand,
                searchType: searchType,
                keyword: keyword,
                additionalSearch: isAdditionalSearch
            },
            success: function (data) {
                let searchResults = data.songs;
                songSearchPostProcess(searchResults);
            },
            error: function (xhr) {
                // console.log(xhr);
                let message = xhr.responseJSON.message;
                alert(message);
            }
        });
    }

    /**
     * 노래 검색 결과 후처리
     * @param data 서버에서 받은 Song 리스트
     */
    function songSearchPostProcess(data) {
        // 기존 검색 결과 초기화
        let $songSearchResultTableBody = $('#songSearchResultTableBody');
        $songSearchResultTableBody.empty();

        // 새로운 검색결과 테이블 생성 및 채우기
        let songTable = SongTableUtil.renderEmptySongTable(data);

        // 검색결과 후처리 - 한글타이틀 기입, 클릭시 폼입력 이벤트바인딩, data-id (songId) 추가
        $.each(data, function (index, song) {
            let songTitleHint = song.titleKorean ? '<i class=\'song-title-korean\'>' + song.titleKorean + '</i>' : '';
            $(songTable.find('.song-title-text')[index]).after(songTitleHint);
            $(songTable.find('.song-title')[index]).on('click', fillMemoAddFormWithSearchResult);
            $(songTable.find('.song-number')[index]).attr('data-id', song.id);
        });

        // 새로운 검색결과 테이블 바디에 아이디 붙이고 교체
        $songSearchResultTableBody.replaceWith(songTable.find('tbody').attr('id', 'songSearchResultTableBody'));

        // 검색결과 collapse 안보일경우 보이게, additional 검색 추가
        if (!$("#songSearchResultCollapse").hasClass("show")) {
            $("#songSearchResultCollapseButton").click();
        }
    }

// 검색 결과 누르면 폼에 입력 -> 검색결과의 .song-title 에 이벤트 연결
    function fillMemoAddFormWithSearchResult(event) {
        let favoriteSongAddForm = $('#favoriteSongAddForm');
        if (favoriteSongAddForm.length === 0) {
            return;
        } // 메모 추가폼이 없으면 리턴
        $('#addInfoTextInput').val(''); // 메모 입력창 초기화 뒤에서 하면 거슬림

        // 클릭한 노래의 정보를 폼에 입력
        let songRow = $(this).closest('tr');
        favoriteSongAddForm.find('.song-number span').text(songRow.find('.song-number span').text());
        favoriteSongAddForm.find('.song-title-text').text(songRow.find('.song-title-text').text());
        favoriteSongAddForm.find('.song-info-text').text(songRow.find('.song-info span').text());
        favoriteSongAddForm.find('.song-singer').text(songRow.find('.song-singer').text());

        // 폼 data 에 songId, brand 저장
        let brand = $('#songSearchForm input[name=brand]:checked').val()
        favoriteSongAddForm.attr('data-brand', brand);
        favoriteSongAddForm.attr('data-song-id', songRow.find('.song-number').data('id'));

        // 애창곡 테이블 정보로 현재 순서 텍스트 갱신
        let favoriteSongTable = brand === 'TJ' ? $('.table-tj') : $('.table-ky');
        let lastPresentOrder = favoriteSongTable.find('tr:last-child .song-number').attr('data-present-order');
        lastPresentOrder = lastPresentOrder ? lastPresentOrder : -1; // 애창곡이 없을 경우 -1
        $('#currentPresentOrder').text(Number(lastPresentOrder) + 2); // 순서가 0부터 시작


        // 메모 추가폼으로 스크롤
        $('html, body').animate({
            scrollTop: $('#favoriteSongAddForm').offset().top - 32 // 2rem 여유
        }, 500, function () {
            // 추가 텍스트 입력창 열기 및 포커스
            if (!$('#addInfoTextCollapse').hasClass('show')) {
                $('#addInfoTextCollapseButton').click();
            }
            $('#addInfoTextInput').focus();
            // 입력폼 하이라이트
            CommonUtil.blinkElement($('.add-song-row'), $('.add-song-row').css('background'));
        });
    }
})
