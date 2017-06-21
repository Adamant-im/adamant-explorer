Feature: Delegate Monitor
  Scenario: should show delegates, last block, next forgers, ...
    Given I'm on page "/delegateMonitor"
    Then I should see table "votes" containing:
      | Voter          | Transaction          | Time          |
      |----------------|----------------------|---------------|
      | standby_301    | 11267727202420741572 | /\d+ \w+ ago/ |
      | gottavoteemall | 15390378815021944871 | /\d+ \w+ ago/ |
      | gottavoteemall | 18294919898268153226 | /\d+ \w+ ago/ |
      | gottavoteemall | 9211700107174373690  | /\d+ \w+ ago/ |
      | standby_301    | 11200707554079032663 | /\d+ \w+ ago/ |
    And I should see table "registrations" containing:
      | Delegate       | Transaction          | Time          |
      |----------------|----------------------|---------------|
      | gottavoteemall | 2535943083975103126  | /\d+ \w+ ago/ |
      | standby_256    | 16715526910305817229 | /\d+ \w+ ago/ |
      | standby_257    | 4154808905851929406  | /\d+ \w+ ago/ |
      | standby_258    | 13937166171748984472 | /\d+ \w+ ago/ |
      | standby_259    | 7779164661594604013  | /\d+ \w+ ago/ |
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
      \d{1,3}(\.\d\d)?%
      by genesis_\d{1,3}
      """
    And I should see table "active delegates" with 101 rows starting with:
      | Rank | Name              | Address   | Forged              | Forging time | Status | Productivity         | Approval            |
      |------|-------------------|-----------|---------------------|--------------|--------|----------------------|---------------------|
      | 1    | /genesis_\d{1,3}/ | /\d{19,20}L/ | /1,\d{3}.\d{8} LSK/ | /.+/         |        | /\d{2,3}(\.\d{2})?%/ |/\d{2,3}(\.\d{2})?%/ |
      | 2    | /genesis_\d{1,3}/ | /\d{19,20}L/ | /1,\d{3}.\d{8} LSK/ | /.+/         |        | /\d{2,3}(\.\d{2})?%/ |/\d{2,3}(\.\d{2})?%/ |
      | 3    | /genesis_\d{1,3}/ | /\d{19,20}L/ | /1,\d{3}.\d{8} LSK/ | /.+/         |        | /\d{2,3}(\.\d{2})?%/ |/\d{2,3}(\.\d{2})?%/ |
      | 4    | /genesis_\d{1,3}/ | /\d{19,20}L/ | /1,\d{3}.\d{8} LSK/ | /.+/         |        | /\d{2,3}(\.\d{2})?%/ |/\d{2,3}(\.\d{2})?%/ |
      | 5    | /genesis_\d{1,3}/ | /\d{19,20}L/ | /1,\d{3}.\d{8} LSK/ | /.+/         |        | /\d{2,3}(\.\d{2})?%/ |/\d{2,3}(\.\d{2})?%/ |
