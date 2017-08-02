Feature: Top Accounts page
  Scenario: should show title, summary, and transactions
    Given I'm on page "/topAccounts"
    Then I should see "Top Accounts" in "h1" html element
    And I should see "Home Top Accounts" in "breadcrumb" element
    And I should see table "top accounts" with 50 rows starting with:
      | Rank | Address               | ~ Balance             | Supply       | Owner          |
      |------|-----------------------|-----------------------|--------------|----------------|
      | 1    | 16313739661670634666L | 99,675,450.108366 LSK | /99\.\d{2}%/ | N/A            |
      | 2    | 4401082358022424760L  | 9,971 LSK             | /0\.\d{2}%/  | gottavoteemall |
      | 3    | 18234943547133247982L | 6,229.88999424 LSK    | /0\.\d{2}%/  | N/A            |
      | 4    | 14895491440237132212L | 3,735.41000576 LSK    | /0\.\d{2}%/  | standby_301    |
      | 5    | 537318935439898807L   | /3,288.\d{8} LSK/     | /0\.\d{2}%/  | genesis_17     |

  Scenario: should link address to address page
    Given I'm on page "/topAccounts"
    And I click link on row no. 1 cell no. 2 of "top accounts" table
    Then I should be on page "/address/16313739661670634666L"

  @ignore
  Scenario: should allow to load more accounts
    Given I'm on page "/topAccounts"
    And I should see table "top accounts" with 50 rows
    When I scroll to "more button"
    And I click "more button"
    Then I should see table "top accounts" with 100 rows

  @ignore
  Scenario: should allow to load less accounts
    Given I'm on page "/topAccounts"
    And I should see table "top accounts" with 50 rows
    When I scroll to "more button"
    And I click "more button"
    And I should see table "top accounts" with 100 rows
    And I scroll to "less button"
    And I click "less button"
    Then I should see table "top accounts" with 50 rows

