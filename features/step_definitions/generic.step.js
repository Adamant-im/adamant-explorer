const { defineSupportCode } = require('cucumber');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const {
  waitForElemAndCheckItsText,
  waitForElemAndCheckItsAttr,
  waitForElemAndClickIt,
  waitForElemAndSendKeys,
  checkAlertDialog,
  waitTime,
  urlChanged,
  elementOccursXTimes,
  scrollTo,
  checkTableContents,
  nameToSelector,
} = require('../support/util.js');

chai.use(chaiAsPromised);
const expect = chai.expect;
const EC = protractor.ExpectedConditions;
const baseURL = 'http://localhost:6040';

defineSupportCode(({ Given, When, Then, setDefaultTimeout }) => {
  setDefaultTimeout(20 * 1000);
  
  Given('I\'m on page "{pageAddess}"', (pageAddess, callback) => {
    browser.ignoreSynchronization = true;
    browser.driver.manage().window().setSize(1000, 1000);
    browser.driver.get('about:blank');
    browser.get(baseURL + pageAddess).then(callback);
  });

  Given('I should be on page "{pageAddess}"', (pageAddess, callback) => {
    const url = pageAddess.indexOf('http') === 0 ? pageAddess : baseURL + pageAddess;
    browser.wait(urlChanged(url), waitTime, `waiting for page ${pageAddess}`);
    expect(browser.getCurrentUrl()).to.eventually.equal(url)
      .and.notify(callback);
  });

  Given('I should be on page that matches "{pageAddessRegexp}"', (pageAddessRegexp, callback) => {
    const url = pageAddessRegexp.indexOf('http') === 0 ? pageAddessRegexp : baseURL + pageAddessRegexp;
    browser.wait(urlChanged(new RegExp(`^${url}$`)), waitTime, `waiting for page ${pageAddessRegexp}`);
    expect(browser.getCurrentUrl()).to.eventually.match(new RegExp(`^${url}$`))
      .and.notify(callback);
  });

  When('I fill in "{value}" to "{fieldName}" field', (value, fieldName, callback) => {
    const selector = nameToSelector(fieldName);
    waitForElemAndSendKeys(`input${selector}, textarea${selector}`, value, callback);
  });

  When('I hit "enter" in "{fieldName}" field', (fieldName, callback) => {
    const selector = nameToSelector(fieldName);
    waitForElemAndSendKeys(`input${selector}, textarea${selector}`, protractor.Key.ENTER, callback);
  });

  When('I scroll to "{elementName}"', (elementName, callback) => {
    const selector = nameToSelector(elementName);
    scrollTo(element(by.css(selector))).then(callback);
  });

  When('I click "{elementName}"', (elementName, callback) => {
    const selector = nameToSelector(elementName);
    waitForElemAndClickIt(selector, callback);
  });

  When('I click "{elementName}" no. {index}', (elementName, index, callback) => {
    const selector = nameToSelector(elementName);
    const elem = element.all(by.css(selector)).get(index - 1);
    elem.click().then(callback);
  });

  When('I click link on row no. {rowIndex} cell no. {cellIndex} of "{tableName}" table', (rowIndex, cellIndex, tableName, callback) => {
    const selector = `table.${tableName.replace(/\s+/g, '-')} tbody tr:nth-child(${rowIndex}) td:nth-child(${cellIndex}) a`;
    waitForElemAndClickIt(selector, callback);
  });

  When('I hover "{elementName}" no. {index}', (elementName, index, callback) => {
    const selector = nameToSelector(elementName);
    browser.wait(EC.presenceOf(element(by.css(selector))), waitTime, `waiting for element '${selector}'`);
    const elem = element.all(by.css(selector)).get(index - 1);
    browser.actions().mouseMove(elem).perform();
    browser.sleep(10).then(callback);
  });

  When('I click link on header cell no. {cellIndex} of "{tableName}" table', (cellIndex, tableName, callback) => {
    const selector = `table.${tableName.replace(/\s+/g, '-')} thead tr th:nth-child(${cellIndex}) a`;
    waitForElemAndClickIt(selector, callback);
  });

  Then('I should see "{text}" in "{elementName}" element', (text, elementName, callback) => {
    const selector = nameToSelector(elementName);
    waitForElemAndCheckItsText(selector, text, callback);
  });

  When('I wait {seconds} seconds', (seconds, callback) => {
    browser.sleep(seconds * 1000).then(callback);
  });

  Then('I should not see "{elementName}" element', (elementName, callback) => {
    const selector = nameToSelector(elementName);
    expect(element(by.css(selector)).isDisplayed()).to.eventually.equal(false)
      .and.notify(callback);
  });

  Then('I should see "{elementName}" element with content that matches:', (elementName, text, callback) => {
    const selector = nameToSelector(elementName);
    const elem = element(by.css(selector));
    browser.wait(EC.presenceOf(elem), waitTime, `waiting for element '${selector}'`);
    expect(elem.getText()).to.eventually.match(new RegExp(`^${text}$`), `inside element "${selector}"`)
      .and.notify(callback);
  });

  Then('I should see "{elementName}" element with content that does not match:', (elementName, text, callback) => {
    const selector = nameToSelector(elementName);
    const elem = element(by.css(selector));
    browser.wait(EC.presenceOf(elem), waitTime, `waiting for element '${selector}'`);
    expect(elem.getText()).to.eventually.not.match(new RegExp(`^${text}$`), `inside element "${selector}"`)
      .and.notify(callback);
  });

  Then('I should see "{elementName}" element that links to "{url}"', (elementName, url, callback) => {
    const selector = nameToSelector(elementName);
    waitForElemAndCheckItsAttr(selector, 'href', url, callback);
  });

  Then('I should see "{text}" in "{selector}" html element', (text, selector, callback) => {
    waitForElemAndCheckItsText(selector, text, callback);
  });

  Then('I should see "{text}" in "{selector}" html element no. {index}', (text, selector, index, callback) => {
  const elem = element.all(by.css(selector)).get(parseInt(index, 10) - 1);
  expect(elem.getText()).to.eventually.equal(text, `inside element "${selector}" no. ${index}`)
    .and.notify(callback || (() => {}));
  });

  Then('I should see table "{tableName}" with {rowCount} rows starting with:', (tableName, rowCount, data, callback) => {
    checkTableContents(tableName, data.rawTable, rowCount, callback);
  });

  Then('I should see table "{tableName}" containing:', (tableName, data, callback) => {
    checkTableContents(tableName, data.rawTable, undefined, callback);
  });
  
  Then('I should see table "{elementName}" with {rowCount} rows', (elementName, rowCount, callback) => {
    const selector = nameToSelector(elementName);
    browser.wait(elementOccursXTimes(`table${selector} tbody tr`, rowCount), waitTime * 6, `waiting for ${rowCount} instances of 'table${selector} tbody tr'`).then(() => {
      callback();
    });
  });
});

