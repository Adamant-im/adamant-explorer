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

  When('I fill in "{value}" to "{fieldName}" field', (value, fieldName, callback) => {
    const selectorClass = `.${fieldName.replace(/ /g, '-')}`;
    waitForElemAndSendKeys(`input${selectorClass}, textarea${selectorClass}`, value, callback);
  });

  When('I hit "enter" in "{fieldName}" field', (fieldName, callback) => {
    const selectorClass = `.${fieldName.replace(/ /g, '-')}`;
    waitForElemAndSendKeys(`input${selectorClass}, textarea${selectorClass}`, protractor.Key.ENTER, callback);
  });

  When('I scroll to "{elementName}"', (elementName, callback) => {
    const selector = `.${elementName.replace(/\s+/g, '-')}`;
    scrollTo(element(by.css(selector))).then(callback);
  });

  When('I click "{elementName}"', (elementName, callback) => {
    const selector = `.${elementName.replace(/\s+/g, '-')}`;
    waitForElemAndClickIt(selector, callback);
  });

  When('I click "{elementName}" no. {index}', (elementName, index, callback) => {
    const selector = `.${elementName.replace(/\s+/g, '-')}`;
    const elem = element.all(by.css(selector)).get(index - 1);
    elem.click().then(callback);
  });

  When('I click link on row no. {rowIndex} cell no. {cellIndex} of "{tableName}" table', (rowIndex, cellIndex, tableName, callback) => {
    const selector = `table.${tableName.replace(/\s+/g, '-')} tbody tr:nth-child(${rowIndex}) td:nth-child(${cellIndex}) a`;
    waitForElemAndClickIt(selector, callback);
  });

  Then('I should see "{text}" in "{elementName}" element', (text, elementName, callback) => {
    const selector = `.${elementName.replace(/\s+/g, '-')}`;
    waitForElemAndCheckItsText(selector, text, callback);
  });

  Then('I should see "{elementName}" element with content that matches:', (elementName, text, callback) => {
    const selector = `.${elementName.replace(/\s+/g, '-')}`.replace(/.(\d)/, '.\\3$1 ');
    const elem = element(by.css(selector));
    expect(elem.getText()).to.eventually.match(new RegExp(`^${text}$`), `inside element "${selector}"`)
      .and.notify(callback);
  });

  Then('I should see "{elementName}" element that links to "{url}"', (elementName, url, callback) => {
    const selector = `.${elementName.replace(/\s+/g, '-')}`;
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
    const selector = `.${elementName.replace(/\s+/g, '-')}`;
    browser.wait(elementOccursXTimes(`table${selector} tbody tr`, rowCount), waitTime * 6, `waiting for ${rowCount} instances of 'table${selector} tbody tr'`).then(() => {
      callback();
    });
  });
});

