angular.module('lisk_explorer')
.filter('forgingTime', () => seconds => {
  if (seconds === 0) {
    return 'Now!';
  }
  const minutes = Math.floor(seconds / 60);
  seconds = seconds - (minutes * 60);
  if (minutes && seconds) {
    return `${minutes} min ${seconds} sec`;
  } else if (minutes) {
    return `${minutes} min `;
  } else {
    return `${seconds} sec`;
  }
});