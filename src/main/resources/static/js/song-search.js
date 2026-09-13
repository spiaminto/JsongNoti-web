import SongTableUtil from "./song-table-util.js";

$(function () {

    const unifiedSearchResultLimit = 50;
    const moreReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

        // 재검색(키워드·유형 변경): 떠 있는 결과 — 통합 그룹들이든 단일 표든 —
        // 를 placeholder 로 바꾸고 기다린다. 에러 시 원복할 수 있게 기존 표는
        // detach 로 떼어 두고, 응답이 오면 되살린 뒤 새 결과로 렌더한다
        // (동기 실행이라 되살린 표가 화면에 비치지는 않는다)
        let restorePairs = [];
        function convertToPlaceholder($scope, $oldWrapper) {
            if ($oldWrapper.length === 0) return;
            if ($oldWrapper.find('.placeholder-wave').length > 0) return; // 이미 placeholder (연타)
            if ($oldWrapper.find('tbody tr').length === 0) return; // 빈 표 (최초 상태)
            let $visibleRows = $oldWrapper.find('tbody tr:not(.d-none)');
            // 상한 10: 모바일 등 긴 화면에서 5개는 placeholder 영역이 어중간하다
            let rowHeights = $visibleRows.slice(0, 10).map(function () {
                return this.getBoundingClientRect().height;
            }).get();
            let $ph = createPlaceholderTableWrapper(Math.min($visibleRows.length, 10) || 3, rowHeights);
            $ph.insertAfter($oldWrapper);
            $oldWrapper.detach();
            restorePairs.push({$old: $oldWrapper, $ph: $ph, $scope: $scope});
        }
        $('#unifiedSongSearchGroups .unified-search-group').each(function () {
            let $g = $(this);
            $g.find('.unified-search-more-wrapper button, .unified-search-additional-wrapper button')
                .prop('disabled', true);
            convertToPlaceholder($g, $g.find('.song-table-border'));
        });
        let $single = $('#singleSongSearchResult');
        if (!$single.hasClass('d-none')) {
            convertToPlaceholder($single, $single.find('.song-table-border'));
        }

        function restorePlaceholders() {
            restorePairs.forEach(function (pair) {
                pair.$old.insertBefore(pair.$ph);
                pair.$ph.remove();
                pair.$scope.find('.unified-search-more-wrapper button, .unified-search-additional-wrapper button')
                    .prop('disabled', false);
            });
        }

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
                    // 원래 구조를 되살려야 렌더 대상(#songSearchResultTableBody 등)이
                    // 문서 안에 존재한다 — 직후 렌더가 갈아치우므로 화면에는 안 비친다
                    restorePlaceholders();
                    if (searchType === 'UNIFIED') {
                        lastUnifiedSearchCond = {brand: brand, keyword: keyword};
                        renderUnifiedSearchResults(data.groups || []);
                        if (restorePairs.length > 0) {
                            $('#unifiedSongSearchGroups .unified-search-group').each(function () {
                                applyRowReveal($(this));
                            });
                        }
                    } else {
                        renderSingleSearchResults(data.songs || [], data.message);
                        if (restorePairs.length > 0) {
                            applyRowReveal($('#singleSongSearchResult'));
                        }
                    }
                    showSearchResultCollapse();
                };
                // 공개는 wave 사이클 경계에 맞춘다 — 스침·중간 절단 없이
                // 항상 온전한 스위프 배수만 보인다
                if (restorePairs.length > 0) {
                    revealOnWaveBoundary(document.querySelector('#songSearchResultCollapse tr.placeholder-wave'), render);
                } else {
                    render();
                }
            },
            error: function (xhr) {
                restorePlaceholders();
                let message = xhr.responseJSON.message;
                alert(message);
            }
        });
    }

    // 갱신 결과의 보이는 행을 더보기 리빌과 같은 어휘로 하나씩 띄운다.
    // 표 통짜 fade(table-in)는 끄고 스태거가 단독으로 맡는다.
    // 계단은 index 지난달 컬랩스와 동일(첫 행 50ms + 행당 70ms, 상한 1030ms)
    function applyRowReveal($group) {
        $group.find('.song-table').addClass('no-table-in');
        $group.find('tbody tr:not(.d-none)').addClass('more-reveal').each(function (i) {
            this.style.setProperty('--rd', Math.min(50 + i * 70, 1030) + 'ms');
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
            // 숨은 행에는 떠오름 리빌(.more-reveal, glass.css)과 계단
            // 딜레이(--rd)를 미리 실어 둔다 — 펼칠 때 d-none 해제만으로
            // 애니메이션이 처음부터 재생된다. 계단은 index 와 동일
            let $hiddenRows = $tableWrapper.find('tbody tr').slice(5).addClass('d-none more-reveal');
            $hiddenRows.each(function (i) {
                this.style.setProperty('--rd', Math.min(50 + i * 70, 1030) + 'ms');
            });
            $group.append($tableWrapper);

            if (songs.length > 5) {
                let hiddenCount = songs.length - 5;
                let $moreWrapper = $('<div>')
                    .addClass('unified-search-more-wrapper');
                let $moreButton = $('<button>')
                    .addClass('btn')
                    .attr({
                        type: 'button',
                        'aria-expanded': 'false'
                    })
                    .text(`더보기 (${hiddenCount}곡)`);

                $moreButton.on('click', function () {
                    let expanded = $(this).attr('aria-expanded') === 'true';
                    toggleMoreRows($tableWrapper, $hiddenRows, !expanded, $(this));
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
                .addClass('btn')
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

    // 검색 대기 중 표 자리에 세우는 placeholder (bootstrap placeholders).
    // 즉시 보여야 하므로 table-in 통짜 떠오름은 끈다 (.no-table-in).
    // wave 는 tbody 통짜가 아니라 행(tr)마다 건다 — 통짜 마스크는 표 높이에
    // 비례해 늘어나, 키 큰 표에서 대각 띠가 아래쪽 행들을 사이클 내내 덮어
    // "아래 행만 바랜" 모습이 된다. 행마다 걸면 띠가 행 높이 안에서만
    // 지나가고, 같은 프레임에 시작해 전 행이 동기로 반짝인다. 헤더(번호/노래)
    // 제외는 그대로다.
    // rowHeights: 실제 표에서 행별로 실측한 높이 배열 — 행마다 높이가 달라
    // (정보 줄 수 차이) 결과↔placeholder 전환 시 화면이 꿈틀대지 않도록
    // 각 행에 그대로 입힌다
    function createPlaceholderTableWrapper(rowCount, rowHeights) {
        let $tbody = $('<tbody>');
        for (let i = 0; i < rowCount; i++) {
            let rowHeight = rowHeights && rowHeights[i];
            $tbody.append(
                $('<tr>').addClass('placeholder-wave')
                    .css('height', rowHeight ? rowHeight + 'px' : '').append(
                    $('<td>').addClass('song-number').append($('<span>').addClass('placeholder col-7')),
                    $('<td>').addClass('song-title').append(
                        $('<div>').append($('<span>').addClass('placeholder col-5')),
                        $('<div>').addClass('song-meta').append(
                            $('<div>').addClass('song-info').append($('<span>').addClass('placeholder col-3'))
                        )
                    )
                )
            );
        }
        let $table = $('<table>').addClass('song-table no-table-in')
            .append($('<thead>').append($('<tr>').append($('<th>').text('번호'), $('<th>').text('노래'))))
            .append($tbody);
        return $('<div>').addClass('song-table-border mt-2').append($table);
    }

    // placeholder 공개를 wave 한 사이클 경계(animationiteration)에 맞춘다 —
    // 응답이 언제 오든 온전한 스위프 배수만 보이고, 띠가 중간에 잘린 채
    // 교체되지 않는다. 애니메이션이 안 도는 환경은 fallback 타이머로 공개.
    // 반환값은 취소 함수 (연타 시 이전 공개 예약을 물릴 때 쓴다)
    function revealOnWaveBoundary(waveEl, reveal) {
        if (!waveEl) {
            reveal();
            return null;
        }
        let fallback = null;
        let onIteration = function (e) {
            if (e.animationName && e.animationName.indexOf('placeholder-wave') === -1) return;
            waveEl.removeEventListener('animationiteration', onIteration);
            clearTimeout(fallback);
            reveal();
        };
        waveEl.addEventListener('animationiteration', onIteration);
        // fallback 은 wave 주기(1.2s)보다 길어야 한다 — 짧으면 경계 이벤트보다
        // 먼저 터져 정렬이 무효가 된다. 애니메이션이 안 도는 환경 전용 보험
        fallback = setTimeout(function () {
            waveEl.removeEventListener('animationiteration', onIteration);
            reveal();
        }, 1500);
        return function () {
            waveEl.removeEventListener('animationiteration', onIteration);
            clearTimeout(fallback);
        };
    }

    function requestUnifiedAdditionalSearch($group, searchType, groupIndex, $button) {
        if (!lastUnifiedSearchCond) {
            return;
        }
        $button.prop('disabled', true);
        $group.find('.unified-search-more-wrapper button').prop('disabled', true);
        // 기존 표를 placeholder 로 바꾼다. 원복(에러) 시 행 클릭 이벤트가
        // 살아 있도록 replaceWith(이벤트 소거) 대신 detach 로 떼어 둔다
        let $oldWrapper = $group.find('.song-table-border');
        let $visibleRows = $oldWrapper.find('tbody tr:not(.d-none)');
        let $phWrapper = createPlaceholderTableWrapper(
            Math.min($visibleRows.length, 10) || 3,
            $visibleRows.slice(0, 10).map(function () {
                return this.getBoundingClientRect().height;
            }).get()
        );
        if ($oldWrapper.length > 0) {
            $phWrapper.insertAfter($oldWrapper);
            $oldWrapper.detach();
        } else {
            $group.append($phWrapper);
        }
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
                // 공개는 wave 사이클 경계에 맞춘다
                revealOnWaveBoundary($phWrapper.find('tr.placeholder-wave')[0], function () {
                    let $newGroup = createUnifiedSearchGroup(refreshedGroup, groupIndex, true);
                    applyRowReveal($newGroup);
                    $group.replaceWith($newGroup);
                });
            },
            error: function (xhr) {
                // placeholder 를 물리고 원래 표를 되살린다
                $phWrapper.length && $oldWrapper.length && $oldWrapper.insertBefore($phWrapper);
                $phWrapper.remove();
                $button.prop('disabled', false);
                $group.find('.unified-search-more-wrapper button').prop('disabled', false);
                let message = xhr.responseJSON.message;
                alert(message);
            }
        });
    }

    // 더보기 행 펼침·접힘 (ADR 0004): 래퍼(.song-table-border) 높이를 실측해
    // 두고 WAAPI 로 높이를 전환한다. 표의 일부 행만 여닫는 구조라 bootstrap
    // Collapse 를 쓸 수 없어 index 지난달 컬랩스와 같은 박자를 직접 건다 —
    // 펼침 .35s ease, 접힘은 150ms 뒤 1s cubic-bezier(.16,1,.3,1) 감속
    // (glass.css .closing 과 동일). 판이 불투명 프로스트라 높이 전환에
    // 재래스터 비용이 없다 (2기 FLIP 안무는 유리 판 시절의 우회였다).
    // 접힘 팔로우는 index 와 같은 track(glassMotion.followTrackButton) —
    // 매 프레임 버튼 실위치에서 스크롤을 유도해 화면 중앙으로 포착·고정한다.
    // 전환 중 재클릭하면 현재 높이에서 이어서 반전한다
    function toggleMoreRows($wrapper, $hiddenRows, show, $moreButton) {
        let wrapper = $wrapper[0];
        if (moreReduceMotion || !wrapper.animate) {
            $hiddenRows.toggleClass('d-none', !show);
            return;
        }
        if (window.glassMotion) window.glassMotion.cancelFollowScroll();

        // 진행 중인 전환이 있으면 지금 보이는 높이에서 이어받는다
        let runningTransition = $wrapper.data('moreHeightTransition');
        let startHeight = wrapper.getBoundingClientRect().height;
        if (runningTransition) runningTransition.cancel();

        if (show) {
            // d-none 해제가 리빌 애니메이션(row-in)을 처음부터 재생시킨다
            $hiddenRows.removeClass('d-none more-settled more-hide');
        } else {
            // 접힘과 동시에 행 다발을 .3s 로 지운다 (2기 4턴, 사용자 지시 —
            // 스태거 없이 한 번에). more-settled(리빌 애니 해제, 기저 opacity 1)를
            // 리플로우로 확정한 뒤에 more-hide 를 붙여야 전환이 발동한다 —
            // 한 프레임에 같이 붙이면 애니메이션이 잡고 있던 값에서 0 으로
            // 즉시 건너뛴다. more-settled 는 접힘 끝 d-none 과 이후 복귀가
            // 리빌을 재시작시키지 않게 하는 핀이기도 하다
            $hiddenRows.addClass('more-settled');
            if ($hiddenRows[0]) void $hiddenRows[0].offsetWidth;
            $hiddenRows.addClass('more-hide');
        }

        let heights = measureMoreHeights($wrapper, $hiddenRows);
        let endHeight = show ? heights.expanded : heights.collapsed;
        let docEl = document.documentElement;
        // 접힘 중 문서가 위쪽에서 줄어들 때 스크롤 앵커링이 y 를 덮어써
        // 카메라 팔로우를 삼키지 않도록 전환 동안만 끈다
        docEl.style.overflowAnchor = 'none';
        wrapper.style.overflow = 'hidden';
        let heightTransition = wrapper.animate(
            [{height: startHeight + 'px'}, {height: endHeight + 'px'}],
            show
                ? {duration: 350, easing: 'ease', fill: 'both'}
                : {duration: 1000, easing: 'cubic-bezier(.16, 1, .3, 1)', delay: 150, fill: 'both'}
        );
        $wrapper.data('moreHeightTransition', heightTransition);
        heightTransition.onfinish = function () {
            $wrapper.removeData('moreHeightTransition');
            if (!show) $hiddenRows.addClass('d-none');
            // 애니메이션을 거두면 자연 높이(= 끝 높이)가 그대로 적용된다 —
            // fill 로 붙들어 두면 이후 표 내용이 바뀌어도 높이가 굳는다
            heightTransition.cancel();
            wrapper.style.overflow = '';
            docEl.style.overflowAnchor = '';
            if (!show && window.glassMotion) window.glassMotion.settleFollowTrack();
        };

        // 접기 카메라: 버튼이 화면 위·아래에 있으면 뷰포트 중앙으로 포착한다.
        // 접힘 딜레이(150ms)에 맞춰 출발한다 — 그 사이 재클릭으로 전환이
        // 바뀌었으면 출발하지 않는다. 버튼이 이미 중앙 근처면 이탈량이 0 에
        // 가까워 사실상 움직이지 않고, 사용자 입력(휠·터치·키)이 들어오면
        // 팔로우가 스스로 물러난다 (glass-motion.js)
        if (!show && window.glassMotion) {
            setTimeout(function () {
                if ($wrapper.data('moreHeightTransition') !== heightTransition) return;
                window.glassMotion.followTrackButton($moreButton[0]);
            }, 150);
        }
    }

    // 펼침·접힘 자연 높이는 폭이 안 바뀌는 한 불변이므로 래퍼마다 최초 1회만
    // 실측해 캐시한다. 실측 중 문서가 잠깐 줄어드는 동안 스크롤 앵커링이
    // y 를 끌어올리지 않도록 min-height 받침 + overflow-anchor 해제를 한
    // 쌍으로 건다 (2기 17턴에서 실측된 함정). 접힘 때는 행에 more-settled 가
    // 먼저 붙어 있어 display 토글이 리빌을 재시작시키지 않는다
    function measureMoreHeights($wrapper, $hiddenRows) {
        let cached = $wrapper.data('moreHeights');
        if (cached && cached.viewportWidth === window.innerWidth) return cached;

        let wrapper = $wrapper[0];
        let docEl = document.documentElement;
        let scrollingEl = document.scrollingElement || docEl;
        let wasHidden = $hiddenRows.first().hasClass('d-none');
        docEl.style.minHeight = scrollingEl.scrollHeight + 'px';
        docEl.style.overflowAnchor = 'none';
        $hiddenRows.removeClass('d-none');
        let expandedHeight = wrapper.getBoundingClientRect().height;
        $hiddenRows.addClass('d-none');
        let collapsedHeight = wrapper.getBoundingClientRect().height;
        $hiddenRows.toggleClass('d-none', wasHidden);
        docEl.style.minHeight = '';
        docEl.style.overflowAnchor = '';

        let heights = {expanded: expandedHeight, collapsed: collapsedHeight, viewportWidth: window.innerWidth};
        $wrapper.data('moreHeights', heights);
        return heights;
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
    let fillRevealTimer = null;
    let fillRevealCancel = null;

    function fillMemoAddFormWithSearchResult() {
        let favoriteSongAddForm = $('#favoriteSongAddForm');
        if (favoriteSongAddForm.length === 0) {
            return;
        }
        $('#addInfoTextInput').val('');

        // 클릭한 노래의 정보 추출
        let songRow = $(this).closest('tr');
        let songTitle = songRow.find('.song-title-text rb').text() || songRow.find('.song-title-text').text();
        let songInfo = songRow.find('.song-info').attr('data-info-original') || '';
        let songInfoKorean = songRow.find('.song-info').attr('data-info-korean') || '';
        let songNumber = songRow.find('.song-number span').text();
        let songSinger = songRow.find('.song-singer').text();

        // 폼 data 와 컬랩스 내부(아직 안 보이는) 상태는 즉시 채운다
        favoriteSongAddForm.attr('data-info-original', songInfo);
        favoriteSongAddForm.attr('data-info-korean', songInfoKorean);
        $('#useDefaultInfoTextCheck').trigger('change');
        let brand = songRow.find('.song-number').attr('data-brand') ||
            $('#songSearchForm input[name=brand]:checked').val();
        favoriteSongAddForm.attr('data-brand', brand);
        favoriteSongAddForm.attr('data-song-id', songRow.find('.song-number').data('id'));

        // 애창곡 테이블 정보로 현재 순서 텍스트 갱신
        let favoriteSongTable = brand === 'TJ' ? $('.table-tj') : $('.table-ky');
        let lastPresentOrder = favoriteSongTable.find('tr:last-child .song-number').attr('data-present-order');
        lastPresentOrder = lastPresentOrder ? lastPresentOrder : -1;
        $('#currentPresentOrder').text(Number(lastPresentOrder) + 2);

        // 보이는 노래 행은 활강 동안 placeholder 로 가리고, 도착 시 실제 값을
        // 공개하며 떠오른다 (기존 노란 blink 대체). 높이는 현재 값으로 고정해
        // placeholder 전환에 화면이 꿈틀대지 않게 한다
        let $addRow = favoriteSongAddForm.find('.add-song-row');
        let fillAddRow = function () {
            favoriteSongAddForm.find('.song-number span').text(songNumber);
            favoriteSongAddForm.find('.song-title-text').text(songTitle);
            favoriteSongAddForm.find('.song-info-text').text(songInfo);
            favoriteSongAddForm.find('.song-singer').text(songSinger);
        };
        let revealAddRow;
        clearTimeout(fillRevealTimer);
        if (fillRevealCancel) { fillRevealCancel(); fillRevealCancel = null; }
        if (!moreReduceMotion) {
            $addRow.css('height', $addRow[0].getBoundingClientRect().height + 'px');
            $addRow.addClass('placeholder-wave');
            // 지금 내용이 있는 칸에만 막대를 세운다 — 빈 칸(예: 초기 상태의
            // 아티스트)에 막대를 꽂으면 줄이 늘어 고정해 둔 높이를 뚫는다
            [['.song-number span', 7], ['.song-title-text', 6], ['.song-info-text', 4], ['.song-singer', 3]]
                .forEach(function (field) {
                    let $el = favoriteSongAddForm.find(field[0]);
                    if ($el.text().trim() !== '') {
                        $el.html('<span class="placeholder col-' + field[1] + '"></span>');
                    }
                });
            revealAddRow = function () {
                fillAddRow();
                $addRow.removeClass('placeholder-wave');
                $addRow.css('height', '');
                // 공개하며 row-in 재생 — 데이터 갱신 지점으로 시선을 끈다.
                // 행의 row-in 은 스크롤 리빌([data-lift].is-lit)이 준 것이라
                // animation 을 잠깐 none 으로 껐다 되살려 처음부터 재생시킨다
                $addRow.css('animation', 'none');
                void $addRow[0].offsetWidth;
                $addRow.css({animation: '', 'animation-delay': '0s'});
            };
        } else {
            fillAddRow();
            revealAddRow = function () {};
        }

        // 메모 추가폼으로 스크롤 — index·검색 접힘과 같은 감속 활강
        // (glass-motion followScroll: 850ms easeOutExpo, 사용자 입력 시 즉시 양보).
        // 도착 시점에 행 공개 + 폼 펼침 (활강이 중단돼도 실행된다).
        // 상단 fixed 유리 nav 가 내용을 덮으므로 도착 여유는 nav 아래 + 16px 로
        // 실측해 잡고, 앵커는 폼이 아니라 유리 패널(섹션) 상단 — 제목까지 보인다
        let $anchor = $('#favoriteSongAddForm').closest('section');
        if ($anchor.length === 0) $anchor = $('#favoriteSongAddForm');
        let navbar = document.querySelector('.navbar');
        let topClearance = (navbar ? navbar.getBoundingClientRect().bottom : 0) + 16;
        let targetY = Math.max(0, $anchor.offset().top - topClearance);
        let openAddForm = function () {
            revealAddRow();
            if (!$('#addInfoTextCollapse').hasClass('show')) {
                $('#addInfoTextCollapseButton').click();
            }
            if (!$('#useDefaultInfoTextCheck').is(':checked')) {
                document.getElementById('addInfoTextInput').focus({preventScroll: true});
            }
        };
        if (window.glassMotion && targetY < window.scrollY) {
            window.glassMotion.cancelFollowScroll();
            window.glassMotion.followScroll(window.scrollY, targetY);
            if (!moreReduceMotion) {
                // 공개·펼침을 wave 사이클 경계(1.2s)에 맞춘다 — 활강(850ms)
                // 도착 후 첫 경계까지 placeholder 를 잠시 더 보여 준다.
                // 띠가 중간에 잘린 채 공개되지 않는다
                fillRevealCancel = revealOnWaveBoundary($addRow[0], openAddForm);
            } else {
                fillRevealTimer = setTimeout(openAddForm, 870);
            }
        } else {
            // 하강 등 예외 경로는 기존 방식 유지
            $('html, body').animate({scrollTop: targetY}, 500, openAddForm);
        }
    }
});
