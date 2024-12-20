$(function () {
    // 노래 순서 모달 버튼 클릭
    $('#presentOrderModalButton').click(function () {
        // 순서 설정 테이블로 붙일 테이블 결정
        let brand = $('#memoAddForm').attr('data-brand');
        let memoTable = brand === 'TJ' ? $('.table-tj') : $('.table-ky');

        // 순서 설정 테이블 초기화 후 붙임
        let $choosePresentOrderTable = $('#choosePresentOrderTable');
        $choosePresentOrderTable.find('tbody').empty().append(memoTable.find('tbody').html());

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
})
