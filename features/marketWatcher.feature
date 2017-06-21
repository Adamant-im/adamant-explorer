Feature: Market Watcher
  Scenario: should show stats
    Given I'm on page "/marketWatcher"
    Then I should see "last price" element with content that matches:
      """
      LAST PRICE
      \d+\.\d+
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

