Feature: Network Monitor
  Scenario: should show stats
    Given I'm on page "/networkMonitor"
    Then I should see "active nodes" element with content that matches:
      """
      CONNECTED PEERS
      \d+  /  \d+
      \d+ disconnected peers
      """
    And I should see "Home Network Monitor" in "breadcrumb" element
    And I should see "last block loaded" element with content that matches:
      """
      \d{18,20}
      0 LSK from 0 transactions
      (\d+|a few|an|a) \w+ ago
      """
    And I should see "last block" element with content that matches:
      """
      LAST BLOCK
      \d{18,20}
      0 LSK from 0 transactions
      (\d+|a few|an|a) \w+ ago
      """
    And I should see "best block" element with content that matches:
      """
      BEST BLOCK
      \d{18,20}
      \d{1,3}(,\d{1,3})*(\.\d{1,8})? LSK from \d+ transactions
      (\d+|a few|an|a) \w+ ago
      """
    And I should see "volume" element with content that matches:
      """
      VOLUME \(LSK\)
      (\d{1,3},)?\d{1,3}\.\d{1,8}
      transferred within (\d+|a few|an|a) \w+
      from \d+ transactions in \d+ / \d+ blocks
      """
    And I should see "platforms block" element with content that matches:
      """
      PLATFORMS
      \d+
      \d+
      \d+
      \d+ Peers on other platforms.
      """
    And I should see "versions block" element with content that matches:
      """
      VERSIONS
      \d+ Peers on other versions.
      """
    And I should see "best heights block" element with content that matches:
      """
      BEST HEIGHTS
      \d+ • \d+% Peers at other heights
      """

  # so far there is no data for the following tests
  @ignore
  Scenario: should allow to find a peer position on the map of the world

  @ignore
  Scenario: should show table with connected peers

  @ignore
  Scenario: should allow to sort the table with connected peers

  @ignore
  Scenario: should allow to switch to table with disconnected peers

  @ignore
  Scenario: should allow to sort the table with disconnected peers
