Feature: Delegate Monitor
  Scenario: should show delegates, last block, next forgers, ...
    Given I'm on page "/delegateMonitor"
    Then I should see table "votes" containing:
      | Voter          | Transaction          | Time              |
      |----------------|----------------------|-------------------|
      | standby_301    | 11267727202420741572 | /(\d+\|a) \w+ ago/ |
      | gottavoteemall | 15390378815021944871 | /(\d+\|a) \w+ ago/ |
      | gottavoteemall | 18294919898268153226 | /(\d+\|a) \w+ ago/ |
      | gottavoteemall | 9211700107174373690  | /(\d+\|a) \w+ ago/ |
      | standby_301    | 11200707554079032663 | /(\d+\|a) \w+ ago/ |
    And I should see table "registrations" containing:
      | Delegate          | Transaction          | Time              |
      |-------------------|----------------------|-------------------|
      | gottavoteemall    | 2535943083975103126  | /(\d+\|a) \w+ ago/ |
      | /standby_\d{1,3}/ | 16715526910305817229 | /(\d+\|a) \w+ ago/ |
      | /standby_\d{1,3}/ | 4154808905851929406  | /(\d+\|a) \w+ ago/ |
      | /standby_\d{1,3}/ | 13937166171748984472 | /(\d+\|a) \w+ ago/ |
      | /standby_\d{1,3}/ | 7779164661594604013  | /(\d+\|a) \w+ ago/ |
    And I should see "Home Delegate Monitor" in "breadcrumb" element
    And I should see "delegates" element with content that matches:
      """
      DELEGATES
      403
      101 active delegates
      302 delegates on standby
      """
    And I should see "last block" element with content that matches:
      """
      LAST BLOCK BY
      genesis_\d{1,3}
      \d{18,20}
      \d+ LSK forged from \d+ transactions
      """
    And I should see "next forgers" element with content that matches:
      """
      NEXT FORGERS
      genesis_\d{1,3}
      (genesis_\d{1,3} • ){8}genesis_\d{1,3}
      """
    And I should see "total forged" element with content that matches:
      """
      TOTAL FORGED \(LSK\)
      \d{1,3},\d{3}\.\d{8}
      between 101 active delegates
      """
    And I should see "best forger" element with content that matches:
      """
      BEST FORGER
      genesis_\d{1,3}
      \d{1,3},\d{3}\.\d{8} LSK forged
      since registration
      """
    And I should see "best productivity" element with content that matches:
      """
      BEST PRODUCTIVITY
      100%
      by genesis_\d{1,3}
      """
    And I should see "worst productivity" element with content that matches:
      """
      WORST PRODUCTIVITY
      \d{1,3}(\.\d\d?)?%
      by genesis_\d{1,3}
      """
    And I should see table "active delegates" with 101 rows starting with:
      | Rank | Name              | Address      | Forged              | Forging time | Status | Productivity         | Approval            |
      |------|-------------------|--------------|---------------------|--------------|--------|----------------------|---------------------|
      | 1    | /genesis_\d{1,3}/ | /\d{10,20}L/ | /1,\d{3}.\d{8} LSK/ | /.+/         |        | /\d{2,3}(\.\d{2})?%/ |/\d{2,3}(\.\d{2})?%/ |
      | 2    | /genesis_\d{1,3}/ | /\d{10,20}L/ | /1,\d{3}.\d{8} LSK/ | /.+/         |        | /\d{2,3}(\.\d{2})?%/ |/\d{2,3}(\.\d{2})?%/ |
      | 3    | /genesis_\d{1,3}/ | /\d{10,20}L/ | /1,\d{3}.\d{8} LSK/ | /.+/         |        | /\d{2,3}(\.\d{2})?%/ |/\d{2,3}(\.\d{2})?%/ |
      | 4    | /genesis_\d{1,3}/ | /\d{10,20}L/ | /1,\d{3}.\d{8} LSK/ | /.+/         |        | /\d{2,3}(\.\d{2})?%/ |/\d{2,3}(\.\d{2})?%/ |
      | 5    | /genesis_\d{1,3}/ | /\d{10,20}L/ | /1,\d{3}.\d{8} LSK/ | /.+/         |        | /\d{2,3}(\.\d{2})?%/ |/\d{2,3}(\.\d{2})?%/ |

  Scenario: should allow to sort active delegates
    Given I'm on page "/delegateMonitor"
    When I click link on header cell no. 2 of "active delegates" table
    Then I should see table "active delegates" with 101 rows starting with:
      | Rank      | Name      | Address      | Forged              | Forging time | Status | Productivity         | Approval            |
      |-----------|-----------|--------------|---------------------|--------------|--------|----------------------|---------------------|
      | /\d{1,3}/ | genesis_1 | /\d{10,20}L/ | /1,\d{3}.\d{8} LSK/ | /.+/         |        | /\d{2,3}(\.\d{2})?%/ |/\d{2,3}(\.\d{2})?%/ |
      | /\d{1,3}/ | genesis_2 | /\d{10,20}L/ | /1,\d{3}.\d{8} LSK/ | /.+/         |        | /\d{2,3}(\.\d{2})?%/ |/\d{2,3}(\.\d{2})?%/ |
      | /\d{1,3}/ | genesis_3 | /\d{10,20}L/ | /1,\d{3}.\d{8} LSK/ | /.+/         |        | /\d{2,3}(\.\d{2})?%/ |/\d{2,3}(\.\d{2})?%/ |
      | /\d{1,3}/ | genesis_4 | /\d{10,20}L/ | /1,\d{3}.\d{8} LSK/ | /.+/         |        | /\d{2,3}(\.\d{2})?%/ |/\d{2,3}(\.\d{2})?%/ |
      | /\d{1,3}/ | genesis_5 | /\d{10,20}L/ | /1,\d{3}.\d{8} LSK/ | /.+/         |        | /\d{2,3}(\.\d{2})?%/ |/\d{2,3}(\.\d{2})?%/ |

  Scenario: should allow show delegate status tooltip
    Given I'm on page "/delegateMonitor"
    When I hover "forging status" no. 1
    Then I should see "tooltip" element with content that matches:
      """
      \w+( \w+)*
      Last block forged @ \d+
      (\d+|a few|an|a) \w+ ago
      """

  Scenario: latest votes should link to voter
    Given I'm on page "/delegateMonitor"
    When I click link on row no. 1 cell no. 1 of "votes" table
    Then I should be on page "/delegate/14895491440237132212L"

  Scenario: latest votes should link to transaction
    Given I'm on page "/delegateMonitor"
    When I click link on row no. 1 cell no. 2 of "votes" table
    Then I should be on page "/tx/11267727202420741572"

  Scenario: newest delegates should link to delegate
    Given I'm on page "/delegateMonitor"
    When I click link on row no. 1 cell no. 1 of "registrations" table
    Then I should be on page "/delegate/4401082358022424760L"

  Scenario: newest delegates should link to transaction
    Given I'm on page "/delegateMonitor"
    When I click link on row no. 1 cell no. 2 of "registrations" table
    Then I should be on page "/tx/2535943083975103126"

  Scenario: active delegates should link to delegate
    Given I'm on page "/delegateMonitor"
    And I click link on row no. 5 cell no. 2 of "active delegates" table
    Then I should be on page that matches "/delegate/\d{10,20}L"

  Scenario: allows to see standby delegates
    Given I'm on page "/delegateMonitor"
    When I click "standby delegates tab"
    Then I should see table "standby delegates" with 20 rows starting with:
      | Rank | Name              | Address      | Productivity | Approval |
      |------|-------------------|--------------|--------------|----------|
      | 102  | /standby_\d{1,3}/ | /\d{10,20}L/ | 0%           | 0%       |
      | 103  | /standby_\d{1,3}/ | /\d{10,20}L/ | 0%           | 0%       |
      | 104  | /standby_\d{1,3}/ | /\d{10,20}L/ | 0%           | 0%       |
      | 105  | /standby_\d{1,3}/ | /\d{10,20}L/ | 0%           | 0%       |
      | 106  | /standby_\d{1,3}/ | /\d{10,20}L/ | 0%           | 0%       |

  Scenario: allows to go to next page of standby delegates
    Given I'm on page "/delegateMonitor"
    When I click "standby delegates tab"
    And I click "next page button"
    Then I should see table "standby delegates" with 20 rows starting with:
      | Rank | Name              | Address      | Productivity | Approval |
      |------|-------------------|--------------|--------------|----------|
      | 122  | /standby_\d{1,3}/ | /\d{10,20}L/ | 0%           | 0%       |
      | 123  | /standby_\d{1,3}/ | /\d{10,20}L/ | 0%           | 0%       |
      | 124  | /standby_\d{1,3}/ | /\d{10,20}L/ | 0%           | 0%       |
      | 125  | /standby_\d{1,3}/ | /\d{10,20}L/ | 0%           | 0%       |
      | 126  | /standby_\d{1,3}/ | /\d{10,20}L/ | 0%           | 0%       |

  Scenario: allows to go to previous page of standby delegates
    Given I'm on page "/delegateMonitor"
    When I click "standby delegates tab"
    And I click "next page button"
    And I click "previous page button"
    Then I should see table "standby delegates" with 20 rows starting with:
      | Rank | Name              | Address      | Productivity | Approval |
      |------|-------------------|--------------|--------------|----------|
      | 102  | /standby_\d{1,3}/ | /\d{10,20}L/ | 0%           | 0%       |
      | 103  | /standby_\d{1,3}/ | /\d{10,20}L/ | 0%           | 0%       |
      | 104  | /standby_\d{1,3}/ | /\d{10,20}L/ | 0%           | 0%       |
      | 105  | /standby_\d{1,3}/ | /\d{10,20}L/ | 0%           | 0%       |
      | 106  | /standby_\d{1,3}/ | /\d{10,20}L/ | 0%           | 0%       |

  Scenario: standby delegates should link to delegate
    Given I'm on page "/delegateMonitor"
    When I click "standby delegates tab"
    And I click link on row no. 1 cell no. 2 of "standby delegates" table
    Then I should be on page that matches "/delegate/\d{10,20}L"
