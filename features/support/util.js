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

function waitForElemAndCheckItsAttr(selector, attr, value, callback) {
  const elem = element(by.css(selector));
  browser.wait(EC.presenceOf(elem), waitTime, `waiting for element '${selector}'`);
  expect(elem.getAttribute(attr)).to.eventually.equal(value, `in attribute "${attr}" of element "${selector}"`)
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
      if (url instanceof RegExp) {
        return actualUrl.match(url);
      } else {
        return url === actualUrl;
      }
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

function checkTableContents(tableName, data, rowCount, callback) {
  const selector = tableName.replace(/\s+/g, '-');
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

function checkRowsContents(tableSelector, data, callback) {
  let rowCount = data.length;
  if (rowCount > 0) {
    let counter = 0;
    const cellCount = data.length * data[0].length;
    for (var i = 0; i < data.length; i++) {
      for (var j = 0; j < data[i].length; j++) {
        const value = data[i][j];
        const selector = `${tableSelector} tr:nth-child(${i + 1}) td:nth-child(${j + 1}), ${tableSelector} tr:nth-child(${i + 1}) th:nth-child(${j + 1})`;
        const elem = element(by.css(selector));
        elem.getText().then((text) => {
          text = text.trim();
          if (value.startsWith('/') && value.endsWith('/')) {
            expect(text).to.match(new RegExp(`^${value.slice(1, -1)}$`), `inside element "${selector}"`);
          } else {
            expect(text).to.equal(value, `inside element "${selector}"`);
          }
          counter++;
          if (counter == cellCount && callback) {
            callback();
          }
        });
      }
    }
  }
}

function nameToSelector(elementName) {
  return `.${elementName.replace(/\s+/g, '-')}`.replace(/\.(\d)/, '.\\3$1 ');
}

module.exports = {
  waitForElemAndCheckItsText,
  waitForElemAndCheckItsAttr,
  waitForElemAndClickIt,
  waitForElemAndSendKeys,
  waitTime,
  urlChanged,
  elementOccursXTimes,
  scrollTo,
  checkTableContents,
  nameToSelector,
};
