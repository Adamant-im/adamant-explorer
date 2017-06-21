Feature: Network Monitor
  Scenario: should show stats
    Given I'm on page "/networkMonitor"
    Then I should see "active nodes" element with content that matches:
      """
      CONNECTED PEERS
      \d+  /  \d+
      \d+ disconnected peers
      """
    And I should see "last block loaded" element with content that matches:
      """
      \d{18,20}
      0 LSK from 0 transactions
      a few seconds ago
      """
    And I should see "last block" element with content that matches:
      """
      LAST BLOCK
      \d{18,20}
      0 LSK from 0 transactions
      a few seconds ago
      """
    And I should see "best block" element with content that matches:
      """
      BEST BLOCK
      \d{18,20}
      (\d{1,3},)?\d{1,3}\.\d{1,8} LSK from \d+ transactions
      \d+ \w+ ago
      """
    And I should see "volume" element with content that matches:
      """
      VOLUME \(LSK\)
      (\d{1,3},)?\d{1,3}\.\d{1,8}
      transferred within \d+ minutes
      from \d+ transactions in \d+ / \d+ blocks
      """

