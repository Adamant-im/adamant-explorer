Feature: Activity Graph
  Scenario: should display table with statistics
    Given I'm on page "/activityGraph"
    Then I should see "Activity Graph" in "h1" html element
    And I should see "Home Activity Graph" in "breadcrumb" element
    And I should see table "statistics" containing:
      | Txs      | 0             |
      | Volume   | 0 LSK         |
      | Blocks   | 1             |
      | Timespan | a few seconds |
      | Accounts | 1             |

  # I have no idea how to test the graph as it is <canvas>
  @ignore
  Scenario: should display a graph that visualizes what is going on in the blockchain

  @ignore
  Scenario: should allow to reset camera viewport on the graph
