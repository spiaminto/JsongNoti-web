
class CommonUtil {
    /**
     * jquery 객체를 받아서 해당 엘리먼트를 깜빡임
     */
    blinkElement(element) {
        $(element).css({
            transition: 'background-color 300ms linear',
            backgroundColor: '#fff3cd'
        });
        setTimeout(function () {
            $(element).css('background-color', '')
        }, 250);
        setTimeout(function () {
            $(element).css('transition', '')
        }, 500);
    }
}
const commonUtil = new CommonUtil();
export default commonUtil;
