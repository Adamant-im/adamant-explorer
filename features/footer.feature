Feature: footer
  Scenario: links to Lisk website
    Given I'm on page "/"
    And I click "website link"
    Then I should be on page "https://lisk.io/"

  Scenario: links to Lisk forum
    Given I'm on page "/"
    And I click "forum link"
    Then I should be on page "https://forum.lisk.io/"

  Scenario: links to BTT thread
    Given I'm on page "/"
    And I click "btt thread link"
    Then I should be on page "https://bitcointalk.org/index.php?topic=1346646"

  Scenario: allows to show all 8 decimal places
    Given I'm on page "/"
    When I click "decimal places menu"
    And I click "show all 8"
    And I should see table "latest transactions" with 20 rows starting with:
      | Id                   | Timestamp                 | Sender      | Recipient             | Amount (LSK) | Fee (LSK) |
      |----------------------|---------------------------|-------------|-----------------------|--------------|-----------|
      | 292176566870988581   | /2017\/06\/19 \d\d:18:09/ | standby_301 | 18234943547133247982L | 123.45000000 | 0.1       |
      | 4629979183209290127  | /2017\/06\/19 \d\d:17:59/ | standby_301 | 18234943547133247982L | 100.00000000 | 0.1       |
      | 16747360986039780565 | /2017\/06\/19 \d\d:17:49/ | standby_301 | 18234943547133247982L | 100.12345678 | 0.1       |
      | 2799279669192005501  | /2017\/06\/19 \d\d:17:39/ | standby_301 | 18234943547133247982L |   0.12345600 | 0.1       |

  Scenario: allows to round to 4 decimal places
    Given I'm on page "/"
    When I click "decimal places menu"
    And I click "round to 4"
    And I should see table "latest transactions" with 20 rows starting with:
      | Id                   | Timestamp                 | Sender      | Recipient             | Amount (LSK) | Fee (LSK) |
      |----------------------|---------------------------|-------------|-----------------------|--------------|-----------|
      | 292176566870988581   | /2017\/06\/19 \d\d:18:09/ | standby_301 | 18234943547133247982L | 123.4500     | 0.1       |
      | 4629979183209290127  | /2017\/06\/19 \d\d:17:59/ | standby_301 | 18234943547133247982L | 100.0000     | 0.1       |
      | 16747360986039780565 | /2017\/06\/19 \d\d:17:49/ | standby_301 | 18234943547133247982L | 100.1235     | 0.1       |
      | 2799279669192005501  | /2017\/06\/19 \d\d:17:39/ | standby_301 | 18234943547133247982L |   0.1235     | 0.1       |

  Scenario: allows to trim floating points 
    Given I'm on page "/"
    When I click "decimal places menu"
    And I click "trim floating points"
    And I should see table "latest transactions" with 20 rows starting with:
      | Id                   | Timestamp                 | Sender      | Recipient             | Amount (LSK) | Fee (LSK) |
      |----------------------|---------------------------|-------------|-----------------------|--------------|-----------|
      | 292176566870988581   | /2017\/06\/19 \d\d:18:09/ | standby_301 | 18234943547133247982L | 123.45       | 0.1       |
      | 4629979183209290127  | /2017\/06\/19 \d\d:17:59/ | standby_301 | 18234943547133247982L | 100          | 0.1       |
      | 16747360986039780565 | /2017\/06\/19 \d\d:17:49/ | standby_301 | 18234943547133247982L | 100.12345678 | 0.1       |
      | 2799279669192005501  | /2017\/06\/19 \d\d:17:39/ | standby_301 | 18234943547133247982L |   0.123456   | 0.1       |

  Scenario: links to Lisk reddit 
    Given I'm on page "/"
    And I click "reddit link"
    Then I should be on page "https://www.reddit.com/r/Lisk/"

  Scenario: links to Lisk twitter 
    Given I'm on page "/"
    And I click "twitter link"
    Then I should be on page "https://twitter.com/LiskHQ"

  Scenario: links to Lisk Explorer Github 
    Given I'm on page "/"
    And I click "github link"
    Then I should be on page "https://github.com/LiskHQ/lisk-explorer"

