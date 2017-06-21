Feature: Top menu
  Scenario: should allow to find a block by id
    Given I'm on page "/"
    When  I fill in "6524861224470851795" to "search" field
    And I hit "enter" in "search" field
    Then I should be on page "/block/6524861224470851795"

  Scenario: should allow to find a transaction by id
    Given I'm on page "/"
    When  I fill in "1465651642158264047" to "search" field
    And I hit "enter" in "search" field
    Then I should be on page "/tx/1465651642158264047"

  Scenario: should allow to find an account by address
    Given I'm on page "/"
    When  I fill in "16313739661670634666L" to "search" field
    And I hit "enter" in "search" field
    Then I should be on page "/address/16313739661670634666L"

  Scenario: should allow to find a delegate by username
    Given I'm on page "/"
    When  I fill in "genesis_17" to "search" field
    And I hit "enter" in "search" field
    Then I should be on page "/address/537318935439898807L"

  Scenario: should show an error message on invalid input
    Given I'm on page "/"
    When  I fill in "invalid" to "search" field
    And I hit "enter" in "search" field
    Then I should see "No matching records found!" in "text danger" element

  Scenario: should allow to switch currency to BTC
    Given I'm on page "/"
    When I click "LSK menu"
    And I click "BTC"
    And I should see table "latest transactions" with 20 rows starting with:
      | Id                 | Timestamp                 | Sender      | Recipient             | Amount (BTC)           | Fee (BTC)     |
      |--------------------|---------------------------|-------------|-----------------------|------------------------|---------------|
      | 292176566870988581 | /2017\/06\/19 \d\d:18:09/ | standby_301 | 18234943547133247982L | /\d+(,\d{3})?(\.\d+)?/ | /\d+(\.\d+)?/ |

  Scenario: should allow to switch currency to CNY
    Given I'm on page "/"
    When I click "LSK menu"
    And I click "CNY"
    And I should see table "latest transactions" with 20 rows starting with:
      | Id                 | Timestamp                 | Sender      | Recipient             | Amount (CNY)           | Fee (CNY)     |
      |--------------------|---------------------------|-------------|-----------------------|------------------------|---------------|
      | 292176566870988581 | /2017\/06\/19 \d\d:18:09/ | standby_301 | 18234943547133247982L | /\d+(,\d{3})?(\.\d+)?/ | /\d+(\.\d+)?/ |

  Scenario: should allow to switch currency to USD
    Given I'm on page "/"
    When I click "LSK menu"
    And I click "USD"
    And I should see table "latest transactions" with 20 rows starting with:
      | Id                 | Timestamp                 | Sender      | Recipient             | Amount (USD)           | Fee (USD)     |
      |--------------------|---------------------------|-------------|-----------------------|------------------------|---------------|
      | 292176566870988581 | /2017\/06\/19 \d\d:18:09/ | standby_301 | 18234943547133247982L | /\d+(,\d{3})?(\.\d+)?/ | /\d+(\.\d+)?/ |

  Scenario: should allow to switch currency to EUR
    Given I'm on page "/"
    When I click "LSK menu"
    And I click "EUR"
    And I should see table "latest transactions" with 20 rows starting with:
      | Id                 | Timestamp                 | Sender      | Recipient             | Amount (EUR)           | Fee (EUR)     |
      |--------------------|---------------------------|-------------|-----------------------|------------------------|---------------|
      | 292176566870988581 | /2017\/06\/19 \d\d:18:09/ | standby_301 | 18234943547133247982L | /\d+(,\d{3})?(\.\d+)?/ | /\d+(\.\d+)?/ |

  Scenario: should allow to switch currency to RUB
    Given I'm on page "/"
    When I click "LSK menu"
    And I click "RUB"
    And I should see table "latest transactions" with 20 rows starting with:
      | Id                 | Timestamp                 | Sender      | Recipient             | Amount (RUB)           | Fee (RUB)     |
      |--------------------|---------------------------|-------------|-----------------------|------------------------|---------------|
      | 292176566870988581 | /2017\/06\/19 \d\d:18:09/ | standby_301 | 18234943547133247982L | /\d+(,\d{3})?(\.\d+)?/ | /\d+(\.\d+)?/ |
  Scenario: should allow to switch currency to LSK
    Given I'm on page "/"
    When I click "LSK menu"
    And I click "LSK"
    And I should see table "latest transactions" with 20 rows starting with:
      | Id                 | Timestamp                 | Sender      | Recipient             | Amount (LSK)           | Fee (LSK)     |
      |--------------------|---------------------------|-------------|-----------------------|------------------------|---------------|
      | 292176566870988581 | /2017\/06\/19 \d\d:18:09/ | standby_301 | 18234943547133247982L | /\d+(,\d{3})?(\.\d+)?/ | /\d+(\.\d+)?/ |
