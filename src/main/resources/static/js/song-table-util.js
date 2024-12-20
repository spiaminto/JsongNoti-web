
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
            row.find('.song-number span').text(song.number);
            row.find('.song-title-text').text(song.title);
            row.find('.song-info span').text(song.info);
            row.find('.song-singer').text(song.singer);
            firstRow.before(row); // after 가 아닌 before 로 붙여야 순서가 맞음
        });
        firstRow.remove();
        return resultTable;
    }
}

const songTableUtil = new SongTableUtil();
export default songTableUtil;