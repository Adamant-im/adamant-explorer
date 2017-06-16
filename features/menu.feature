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
