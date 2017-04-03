angular.module('lisk_explorer')
.filter('timestamp', epochStampFilter => timestamp => {
    const stamp     = epochStampFilter(timestamp);
    let month = stamp.getMonth() + 1;

    if (month < 10) {
        month = `0${month}`;
    }

    let day = stamp.getDate();

    if (day < 10) {
        day = `0${day}`;
    }

    let hours = stamp.getHours();
    let minutes = stamp.getMinutes();
    let seconds = stamp.getSeconds();

    /**
     * @todo use zeroFill istead
     */
    if (hours < 10) {
        hours = `0${hours}`;
    }

    if (minutes < 10) {
        minutes = `0${minutes}`;
    }

    if (seconds < 10) {
        seconds = `0${seconds}`;
    }

    return `${stamp.getFullYear()}/${month}/${day} ${hours}:${minutes}:${seconds}`;
});