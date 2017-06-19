Feature: Transaction page
  Scenario: should show title, summary, and details
    Given I'm on page "/tx/1465651642158264047"
    Then I should see "Transaction 1465651642158264047" in "h1" html element
    And I should see table "summary" containing:
      | Sender        | 1085993630748340485L  |
      | Recipient     | 16313739661670634666L |
      | Confirmations | 12141                 |
      | Amount        | 100,000,000 LSK       |
      | Fee           | 0 LSK                 |
      | Timestamp     | 2016/05/24 19:00:00   | 
      | Block         | 6524861224470851795   |
    And I should see header of table "details" containing:
      | Transaction ID | Date | Sender | Recipient | Amount | Fee | Confirmations |
    And I should see table "details" containing:
      | 1465651642158264047 | 2016/05/24 19:00:00 | 1085993630748340485L | 16313739661670634666L | 100,000,000 LSK | 0 LSK | Confirmed |
