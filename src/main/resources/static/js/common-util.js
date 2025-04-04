
class CommonUtil {
    /**
     * jquery 객체를 받아서 해당 엘리먼트를 깜빡임 (background 속성값 조정)
     * (순서변경 또는 삭제시 빗금배경은 애니메이션 X)
     * @param element jquery 객체
     * @param originalBackground 다시 되돌릴 원본 background 속성값
     */
    blinkElement(element, originalBackground) {
        $(element).css({
            transitionProperty: 'background',
            transitionDuration: '0.5s',
        });
        setTimeout(function () {
            $(element).css('background', 'var(--bs-highlight-bg) none')
        }, 10);
        setTimeout(function () {
            $(element).css('background', originalBackground)
        }, 500);
        setTimeout(function () {
            $(element).css({
                transitionProperty: '',
                transitionDuration: '',
                background: ''
            });
        }, 1000);
    }
}
const commonUtil = new CommonUtil();
export default commonUtil;
