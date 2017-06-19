const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const expect = chai.expect;
const EC = protractor.ExpectedConditions;
const waitTime = 4000;

function waitForElemAndCheckItsText(selector, text, callback) {
  const elem = element(by.css(selector));
  browser.wait(EC.presenceOf(elem), waitTime, `waiting for element '${selector}'`);
  expect(elem.getText()).to.eventually.equal(text, `inside element "${selector}"`)
    .and.notify(callback || (() => {}));
}

function waitForElemAndClickIt(selector, callback) {
  const elem = element(by.css(selector));
  browser.wait(EC.presenceOf(elem), waitTime, `waiting for element '${selector}'`);
  elem.click().then(() => {
    if (callback) callback();
  });
}

function waitForElemAndSendKeys(selector, keys, callback) {
  const elem = element(by.css(selector));
  browser.wait(EC.presenceOf(elem), waitTime, `waiting for element '${selector}'`);
  elem.sendKeys(keys).then(() => {
    if (callback) callback();
  });
}

function urlChanged(url) {
  return function () {
    return browser.getCurrentUrl().then(function(actualUrl) {
      return url !== actualUrl;
    });
  };
}

function elementOccursXTimes(selector, count) {
  return function () {
    return element.all(by.css(selector)).count().then((actualCount) => {
      console.log(selector, count, actualCount);
      return count === actualCount;
    });
  };
}

/**
 * Vertically scroll top-left corner of the given element (y-direction) into viewport.
 * @param scrollToElement element to be scrolled into visible area
 */
function scrollTo(scrollToElement) {
  const wd = browser.driver;
  return scrollToElement.getLocation().then(function (loc) {
      return wd.executeScript('window.scrollTo(0,arguments[0]);', loc.y);
  });
};

module.exports = {
  waitForElemAndCheckItsText,
  waitForElemAndClickIt,
  waitForElemAndSendKeys,
  waitTime,
  urlChanged,
  elementOccursXTimes,
  scrollTo,
};
