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
      return `${count}` === `${actualCount}`;
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
}

function checkTableContents(selector, data, rowCount, callback) {
  const hasHeader = data[1] && data[1].join('').match(/^-+$/g);
  if (!rowCount) {
    rowCount = data.length - (hasHeader ? 2 : 0);
  }
  browser.wait(elementOccursXTimes(`table.${selector} tbody tr`, rowCount), waitTime, `waiting for ${rowCount} instances of 'table.${selector} tbody tr'`);
  if (hasHeader) {
    checkRowsContents(`table.${selector} thead`, [data[0]]);
    checkRowsContents(`table.${selector} tbody`, data.slice(2), callback);
  } else {
    checkRowsContents(`table.${selector} tbody`, data, callback);
  }
}

function checkRowsContents(selector, data, callback) {
  let rowCount = data.length;
  if (rowCount > 0) {
    let counter = 0;
    const cellCount = data.length * data[0].length;
    for (var i = 0; i < data.length; i++) {
      for (var j = 0; j < data[i].length; j++) {
        waitForElemAndCheckItsText(`${selector} tr:nth-child(${i + 1}) td:nth-child(${j + 1}), ${selector} tr:nth-child(${i + 1}) th:nth-child(${j + 1})`, data[i][j], () => {
          counter++;
          if (counter == cellCount && callback) {
            callback();
          }
        });
      }
    }
  }
}

module.exports = {
  waitForElemAndCheckItsText,
  waitForElemAndClickIt,
  waitForElemAndSendKeys,
  waitTime,
  urlChanged,
  elementOccursXTimes,
  scrollTo,
  checkTableContents,
};
