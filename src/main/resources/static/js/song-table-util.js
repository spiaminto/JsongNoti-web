class SongTableUtil {
    /**
     * .empty-song-table 을 복사한 뒤 dataList 의 값으로 채움
     * @param dataList 서버에서 조회한 노래 데이터 리스트
     * @returns {*|jQuery} 데이터를 채운 테이블
     */
    renderEmptySongTable(dataList) {
        if (dataList == null) {
            // console.log('dataList is null');
            return;
        }
        let emptySongTable = $('.empty-song-table');
        let resultTable = emptySongTable.clone();
        resultTable.removeClass('empty-song-table');

        let firstRow = resultTable.find('tbody tr:first-child');
        $.each(dataList, function (index, song) {
            let row = firstRow.clone();
            row.find('.song-number span').text(song.songNumber);
            const jpRangeRegex = /[\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF\uFF65-\uFF9F\u4E00-\u9FFF]/;
            const koreanRegex = /[\uAC00-\uD7A3]/;
            // 루비(원본값 위에 대표값)는 원본값이 일본어일 때만 (4기 9턴 A4). 일본어 원본값에는 lang="ja"
            // 를 붙여 한자 자형·발음이 일본어를 따르게 한다
            const titleJapanese = jpRangeRegex.test(song.title);
            row.find('.song-title-text').replaceWith(
                $('<ruby>')
                    .addClass('song-title-text')
                    .append($('<rb>').text(song.title).attr('lang', titleJapanese ? 'ja' : null))
                    .append($('<rp>').text('('))
                    .append($('<rt>').text(song.titleKorean && titleJapanese ? song.titleKorean : ''))
                    .append($('<rp>').text(')'))
            )
            let songInfo = song.info || '';
            let songInfoContainer = row.find('.song-info');
            let songInfoText = songInfoContainer.find('span');
            songInfoContainer.attr('data-info-original', songInfo);
            songInfoContainer.attr('data-info-korean', song.infoKorean || '');
            if (song.infoKorean && jpRangeRegex.test(songInfo)) {
                songInfoText.empty().append(
                    $('<ruby>')
                        .append($('<rb>').text(songInfo).attr('lang', 'ja'))
                        .append($('<rp>').text('('))
                        .append($('<rt>').text(song.infoKorean))
                        .append($('<rp>').text(')'))
                );
            } else {
                songInfoText.text(songInfo);
            }
            // 아티스트는 루비 대신 같은 줄 병기 (4기 9턴 A1): 원본값이 일본어이고 대표값이 한글이며 다를 때만.
            // 검색 응답에는 아직 singerKorean 이 없어 원본값만 남는다
            const singerJapanese = jpRangeRegex.test(song.singer || '');
            let $singer = row.find('.song-singer').empty()
                .append($('<span>').addClass('song-singer-original').text(song.singer).attr('lang', singerJapanese ? 'ja' : null));
            if (singerJapanese && song.singerKorean && koreanRegex.test(song.singerKorean) && song.singerKorean !== song.singer) {
                $singer.append(' ', $('<span>').addClass('song-singer-korean').text(song.singerKorean));
            }
            firstRow.before(row); // after 가 아닌 before 로 붙여야 순서가 맞음
        });
        firstRow.remove();
        return resultTable;
    }
}

const songTableUtil = new SongTableUtil();
export default songTableUtil;
