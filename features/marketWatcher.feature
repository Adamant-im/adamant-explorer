Feature: Market Watcher
  Scenario: should show statistics
    Given I'm on page "/marketWatcher"
    Then I should see "Market Watcher" in "h1" html element
    And I should see "Home Market Watcher" in "breadcrumb" element
    And I should see "last price" element with content that matches:
      """
      LAST PRICE
      \d+\.\d+
      """
    And I should see "last price" element with content that does not match:
      """
      LAST PRICE
      0\.0+
      """
    And I should see "24 hour high" element with content that matches:
      """
      24HR HIGH
      \d+\.\d+
      """
    And I should see "24 hour low" element with content that matches:
      """
      24HR LOW
      \d+\.\d+
      """
    And I should see "btc volume" element with content that matches:
      """
      BTC VOLUME
      \d+\.\d+
      """
    And I should see "lisk volume" element with content that matches:
      """
      LSK VOLUME
      \d+\.\d+
      """
    And I should see "num trades" element with content that matches:
      """
      NUM TRADES
      \d+
      """

  Scenario: should allow to switch to Bittrex 
    Given I'm on page "/marketWatcher"
    When I click "bittrex tab"
    Then I should see "last price" element with content that matches:
      """
      LAST PRICE
      \d+\.\d+
      """
    And I should see "last price" element with content that does not match:
      """
      LAST PRICE
      0\.0+
      """

  Scenario: should allow to hide statistics
    Given I'm on page "/marketWatcher"
    When I click "toggle statistics button"
    And I wait 1 seconds
    Then I should not see "statistics" element

  @ignore
  Scenario: should show stock chart

  @ignore
  Scenario: should allow to switch stock chart interval to minutes

  @ignore
  Scenario: should allow to switch stock chart interval to hours

  @ignore
  Scenario: should allow to switch stock chart interval to days

  @ignore
  Scenario: should allow to change stock chart from/to

  @ignore
  Scenario: should allow to change stock chart zoom

  @ignore
  Scenario: should allow to switch to depth chart

  Scenario: should allow to switch to Order Book
    Given I'm on page "/marketWatcher"
    When I click "order book tab"
    Then I should see table "bids" with 100 rows starting with:
      | Bid (BTC)                | Amount (LSK)             | Total (BTC)              |
      |--------------------------|--------------------------|--------------------------|
      | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ |
      | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ |
      | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ |
      | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ |
      | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ |
    And I should see table "asks" with 100 rows starting with:
      | Ask (BTC)                | Amount (LSK)             | Total (BTC)              |
      |--------------------------|--------------------------|--------------------------|
      | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ |
      | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ |
      | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ |
      | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ |
      | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ | /\d{1,3}(,\d{3})*.\d{8}/ |
