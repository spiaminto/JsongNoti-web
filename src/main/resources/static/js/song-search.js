import SongTableUtil from "./song-table-util.js";
import CommonUtil from "./common-util.js";

$(function () {

    const unifiedSearchResultLimit = 50;
    const searchTypeLabels = {
        TITLE: '노래제목',
        SINGER: '아티스트명',
        INFO: '작품명/정보'
    };
    let lastUnifiedSearchCond = null;

    $("#searchSongInput").on('invalid', function () {
        if (this.validity.tooShort) {
            this.setCustomValidity('두글자 이상 입력해주세요');
        }
    }).on('input', function () {
        this.setCustomValidity('');
    });

    $("#songSearchForm input[name='searchType']").on('change', function () {
        let searchType = $("#songSearchForm input[name='searchType']:checked").val();
        if (searchType === 'SINGER') {
            $('#searchHintContainer').find('.singer-hint').show().end()
                .find('.unified-hint, .title-hint, .info-hint').hide();
            $('#searchSongInput').attr('placeholder', '아티스트명 입력 (최소 2자)').attr('aria-label', '아티스트명 입력');
        } else if (searchType === 'INFO') {
            $('#searchHintContainer').find('.info-hint').show().end()
                .find('.unified-hint, .title-hint, .singer-hint').hide();
            $('#searchSongInput').attr('placeholder', '작품명 또는 정보 입력 (최소 2자)').attr('aria-label', '작품명 또는 정보 입력');
        } else if (searchType === 'TITLE') {
            $('#searchHintContainer').find('.title-hint').show().end()
                .find('.unified-hint, .singer-hint, .info-hint').hide();
            $('#searchSongInput').attr('placeholder', '노래제목 입력 (최소 2자)').attr('aria-label', '노래제목 입력');
        } else {
            $('#searchHintContainer').find('.unified-hint').show().end()
                .find('.title-hint, .singer-hint, .info-hint').hide();
            $('#searchSongInput').attr('placeholder', '검색어 입력 (최소 2자)').attr('aria-label', '통합검색어 입력');
        }
    });

    // 서버에 노래 검색 요청
    $("#songSearchForm").submit(function (event) {
        event.preventDefault();
        requestSongSearch(false);
    });

    // 단일 유형 추가 검색 요청
    $("#additionalSongSearchButton").click(function () {
        requestSongSearch(true);
    });

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
                let render = function () {
                    if (searchType === 'UNIFIED') {
                        lastUnifiedSearchCond = {brand: brand, keyword: keyword};
                        renderUnifiedSearchResults(data.groups || []);
                    } else {
                        renderSingleSearchResults(data.songs || [], data.message);
                    }
                };
                render();
                showSearchResultCollapse();
            },
            error: function (xhr) {
                let message = xhr.responseJSON.message;
                alert(message);
            }
        });
    }

    function renderSingleSearchResults(searchResults, message) {
        $('#unifiedSongSearchGroups').empty().addClass('d-none');
        $('#singleSongSearchResult').removeClass('d-none');

        let $songSearchMessage = $('#songSearchMessage');
        if (message) {
            $songSearchMessage.text(message).removeClass('d-none');
        } else {
            $songSearchMessage.text('').addClass('d-none');
        }

        let songTable = createSearchResultTable(searchResults);
        $('#songSearchResultTableBody').replaceWith(
            songTable.find('tbody').attr('id', 'songSearchResultTableBody')
        );
    }

    function renderUnifiedSearchResults(groups) {
        $('#singleSongSearchResult').addClass('d-none');
        let $groupsContainer = $('#unifiedSongSearchGroups');
        $groupsContainer.empty().removeClass('d-none');

        $.each(groups, function (index, group) {
            $groupsContainer.append(createUnifiedSearchGroup(group, index, false));
        });
    }

    function createUnifiedSearchGroup(group, groupIndex, additionalSearched) {
        let songs = (group.songs || []).slice(0, unifiedSearchResultLimit);
        let $group = $('<section>')
            .addClass('unified-search-group')
            .attr('data-search-type', group.searchType)
            .attr('data-group-index', groupIndex);
        let $header = $('<div>').addClass('unified-search-group-header');
        let $title = $('<h4>')
            .text(searchTypeLabels[group.searchType] || group.searchType)
            .append(
                $('<span>')
                    .addClass('unified-search-result-count ms-2')
                    .text(`총 ${group.totalCount || 0}곡`)
            );
        $header.append($title);
        $group.append($header);

        if (group.message) {
            $group.append(
                $('<div>')
                    .addClass('alert alert-info unified-search-group-message')
                    .attr({role: 'status', 'aria-live': 'polite'})
                    .text(group.message)
            );
        }

        if (songs.length > 0) {
            let $tableWrapper = createSongTableWrapper(songs);
            let $hiddenRows = $tableWrapper.find('tbody tr').slice(5).addClass('d-none');
            $group.append($tableWrapper);

            if (songs.length > 5) {
                let hiddenCount = songs.length - 5;
                let $moreWrapper = $('<div>')
                    .addClass('unified-search-more-wrapper');
                let $moreButton = $('<button>')
                    .addClass('btn btn-sm btn-outline-secondary')
                    .attr({
                        type: 'button',
                        'aria-expanded': 'false'
                    })
                    .text(`더보기 (${hiddenCount}곡)`);

                $moreButton.on('click', function () {
                    let expanded = $(this).attr('aria-expanded') === 'true';
                    $hiddenRows.toggleClass('d-none', expanded);
                    $(this)
                        .attr('aria-expanded', String(!expanded))
                        .text(expanded ? `더보기 (${hiddenCount}곡)` : '접기');
                });
                $group.append($moreWrapper.append($moreButton));
            }
        } else if (!group.message) {
            $group.append(
                $('<p>').addClass('unified-search-empty-message text-center text-muted').text('검색 결과가 없습니다.')
            );
        }

        if (!group.message && !additionalSearched) {
            let $additionalButton = $('<button>')
                .addClass('btn btn-sm btn-outline-primary')
                .attr('type', 'button')
                .text('추가 검색')
                .on('click', function () {
                    requestUnifiedAdditionalSearch($group, group.searchType, groupIndex, $(this));
                });
            $group.append(
                $('<div>').addClass('unified-search-additional-wrapper').append($additionalButton)
            );
        }

        return $group;
    }

    function requestUnifiedAdditionalSearch($group, searchType, groupIndex, $button) {
        if (!lastUnifiedSearchCond) {
            return;
        }
        $button.prop('disabled', true);
        $.ajax({
            type: "GET",
            url: "/songs",
            data: {
                brand: lastUnifiedSearchCond.brand,
                searchType: searchType,
                keyword: lastUnifiedSearchCond.keyword,
                additionalSearch: true
            },
            success: function (data) {
                let searchResults = data.songs || [];
                let refreshedGroup = {
                    searchType: searchType,
                    message: data.message,
                    totalCount: searchResults.length,
                    songs: searchResults.slice(0, unifiedSearchResultLimit)
                };
                $group.replaceWith(createUnifiedSearchGroup(refreshedGroup, groupIndex, true));
            },
            error: function (xhr) {
                $button.prop('disabled', false);
                let message = xhr.responseJSON.message;
                alert(message);
            }
        });
    }

    function createSongTableWrapper(songs) {
        return $('<div>')
            .addClass('song-table-border mt-2')
            .append(createSearchResultTable(songs));
    }

    function createSearchResultTable(searchResults) {
        let songTable = SongTableUtil.renderEmptySongTable(searchResults);
        songTable.addClass('table-hover');
        $.each(searchResults, function (index, song) {
            $(songTable.find('.song-title')[index]).on('click', fillMemoAddFormWithSearchResult);
            $(songTable.find('.song-number')[index])
                .attr('data-id', song.id)
                .attr('data-brand', song.brand);
        });
        return songTable;
    }

    function showSearchResultCollapse() {
        if (!$("#songSearchResultCollapse").hasClass("show")) {
            $("#songSearchResultCollapseButton").click();
        }
    }

    // 검색 결과 누르면 폼에 입력 -> 검색결과의 .song-title 에 이벤트 연결
    function fillMemoAddFormWithSearchResult() {
        let favoriteSongAddForm = $('#favoriteSongAddForm');
        if (favoriteSongAddForm.length === 0) {
            return;
        }
        $('#addInfoTextInput').val('');

        // 클릭한 노래의 정보를 폼에 입력
        let songRow = $(this).closest('tr');
        let songTitle = songRow.find('.song-title-text rb').text() || songRow.find('.song-title-text').text();
        let songInfo = songRow.find('.song-info').attr('data-info-original') || '';
        let songInfoKorean = songRow.find('.song-info').attr('data-info-korean') || '';
        favoriteSongAddForm.find('.song-number span').text(songRow.find('.song-number span').text());
        favoriteSongAddForm.find('.song-title-text').text(songTitle);
        favoriteSongAddForm.find('.song-info-text').text(songInfo);
        favoriteSongAddForm.find('.song-singer').text(songRow.find('.song-singer').text());
        favoriteSongAddForm.attr('data-info-original', songInfo);
        favoriteSongAddForm.attr('data-info-korean', songInfoKorean);
        $('#useDefaultInfoTextCheck').trigger('change');

        // 폼 data 에 songId, brand 저장
        let brand = songRow.find('.song-number').attr('data-brand') ||
            $('#songSearchForm input[name=brand]:checked').val();
        favoriteSongAddForm.attr('data-brand', brand);
        favoriteSongAddForm.attr('data-song-id', songRow.find('.song-number').data('id'));

        // 애창곡 테이블 정보로 현재 순서 텍스트 갱신
        let favoriteSongTable = brand === 'TJ' ? $('.table-tj') : $('.table-ky');
        let lastPresentOrder = favoriteSongTable.find('tr:last-child .song-number').attr('data-present-order');
        lastPresentOrder = lastPresentOrder ? lastPresentOrder : -1;
        $('#currentPresentOrder').text(Number(lastPresentOrder) + 2);

        // 메모 추가폼으로 스크롤
        $('html, body').animate({
            scrollTop: $('#favoriteSongAddForm').offset().top - 32
        }, 500, function () {
            if (!$('#addInfoTextCollapse').hasClass('show')) {
                $('#addInfoTextCollapseButton').click();
            }
            if (!$('#useDefaultInfoTextCheck').is(':checked')) {
                $('#addInfoTextInput').focus();
            }
            CommonUtil.blinkElement($('.add-song-row'), $('.add-song-row').css('background'));
        });
    }
});
