Feature: Address page
  Scenario: should show title, summary, and transactions
    Given I'm on page "/address/16313739661670634666L"
    Then I should see "Address Summary " in "h2" html element
    And I should see "Home Address" in "breadcrumb" element
    And I should see table "summary" containing:
      | Address       | 16313739661670634666L                                            |
      | Public Key    | c094ebee7ec0c50ebee32918655e089f6e1a604b83bcaa760293c61e0f18ab6f |
      | Total balance | 99,675,450.108366 LSK                                            |
      | Transactions  | 2 1329                                                           |

    And I should see table "transactions" with 50 rows starting with:
      | Transaction ID | Date                      | Sender                | Recipient                | Amount    | Fee     | Confirmations |
      |----------------|---------------------------|-----------------------|--------------------------|-----------|---------|---------------|
      | /\d{18,20}/    | /2017\/06\/16 \d\d:09:08/ | 16313739661670634666L | /standby_\d{3}\|\d{20}L/ | 1,000 LSK | 0.1 LSK | Confirmed     |
      | /\d{18,20}/    | /2017\/06\/16 \d\d:09:08/ | 16313739661670634666L | /standby_\d{3}\|\d{20}L/ | 1,000 LSK | 0.1 LSK | Confirmed     |
      | /\d{18,20}/    | /2017\/06\/16 \d\d:09:08/ | 16313739661670634666L | /standby_\d{3}\|\d{20}L/ | 1,000 LSK | 0.1 LSK | Confirmed     |
      | /\d{18,20}/    | /2017\/06\/16 \d\d:09:08/ | 16313739661670634666L | /standby_\d{3}\|\d{20}L/ | 1,000 LSK | 0.1 LSK | Confirmed     |
      | /\d{18,20}/    | /2017\/06\/16 \d\d:09:08/ | 16313739661670634666L | /standby_\d{3}\|\d{20}L/ | 1,000 LSK | 0.1 LSK | Confirmed     |

  Scenario: should link transaction id to transaction page
    Given I'm on page "/address/16313739661670634666L"
    And I click link on row no. 1 cell no. 1 of "transactions" table
    Then I should be on page "/tx/16295820046284152875"

  Scenario: should link sender address to address page
    Given I'm on page "/address/16313739661670634666L"
    And I click link on row no. 1 cell no. 3 of "transactions" table
    Then I should be on page "/address/16313739661670634666L"

  Scenario: should link recipient delegate name to address page
    Given I'm on page "/address/16313739661670634666L"
    And I click link on row no. 1 cell no. 4 of "transactions" table
    Then I should be on page "/address/14706379298538803272L"

  @ignore
  Scenario: should allow to load more transactions
    Given I'm on page "/address/16313739661670634666L"
    When I scroll to "more button"
    And I click "more button"
    Then I should see table "transactions" with 100 rows

  @ignore
  Scenario: should allow to load less transactions
    Given I'm on page "/address/16313739661670634666L"
    When I scroll to "more button"
    And I click "more button"
    And I should see table "transactions" with 100 rows
    And I scroll to "less button"
    And I click "less button"
    Then I should see table "transactions" with 50 rows

  Scenario: should allow to show only sent transactions
    Given I'm on page "/address/16313739661670634666L"
    When I click "sent tab"
    And I should see table "transactions" with 50 rows starting with:
      | Transaction ID | Date                      | Sender                | Recipient                | Amount    | Fee     | Confirmations |
      |----------------|---------------------------|-----------------------|--------------------------|-----------|---------|---------------|
      | /\d{18,20}/    | /2017\/06\/16 \d\d:09:08/ | 16313739661670634666L | /standby_\d{3}\|\d{20}L/ | 1,000 LSK | 0.1 LSK | Confirmed     |
      | /\d{18,20}/    | /2017\/06\/16 \d\d:09:08/ | 16313739661670634666L | /standby_\d{3}\|\d{20}L/ | 1,000 LSK | 0.1 LSK | Confirmed     |
      | /\d{18,20}/    | /2017\/06\/16 \d\d:09:08/ | 16313739661670634666L | /standby_\d{3}\|\d{20}L/ | 1,000 LSK | 0.1 LSK | Confirmed     |
      | /\d{18,20}/    | /2017\/06\/16 \d\d:09:08/ | 16313739661670634666L | /standby_\d{3}\|\d{20}L/ | 1,000 LSK | 0.1 LSK | Confirmed     |


  Scenario: should allow to show only received transactions
    Given I'm on page "/address/16313739661670634666L"
    And I click "received tab"
    Then I should see table "transactions" containing:
      | Transaction ID      | Date                      | Sender               | Recipient             | Amount          | Fee   | Confirmations |
      |---------------------|---------------------------|----------------------|-----------------------|-----------------|-------|---------------|
      | 1465651642158264047 | /2016\/05\/24 \d\d:00:00/ | 1085993630748340485L | 16313739661670634666L | 100,000,000 LSK | 0 LSK | Confirmed     |

  Scenario: should allow to show votes
    Given I'm on page "/address/16313739661670634666L"
    When I click "show votes button"
    Then I should see "genesis_51 • genesis_60 • genesis_77 • genesis_79 • genesis_91 • genesis_54 • genesis_2 • genesis_88 • genesis_27 • genesis_14 • genesis_72 • genesis_21 • genesis_66 • genesis_93 • genesis_67 • genesis_74 • genesis_34 • genesis_97 • genesis_50 • genesis_16 • genesis_12 • genesis_85 • genesis_10 • genesis_3 • genesis_42 • genesis_40 • genesis_33 • genesis_5 • genesis_55 • genesis_26 • genesis_11 • genesis_4 • genesis_57 • genesis_49 • genesis_63 • genesis_9 • genesis_68 • genesis_80 • genesis_7 • genesis_82 • genesis_89 • genesis_13 • genesis_53 • genesis_64 • genesis_92 • genesis_73 • genesis_99 • genesis_32 • genesis_28 • genesis_17 • genesis_29 • genesis_101 • genesis_46 • genesis_18 • genesis_48 • genesis_35 • genesis_30 • genesis_45 • genesis_78 • genesis_65 • genesis_43 • genesis_58 • genesis_1 • genesis_86 • genesis_75 • genesis_22 • genesis_36 • genesis_6 • genesis_52 • genesis_100 • genesis_19 • genesis_96 • genesis_24 • genesis_62 • genesis_59 • genesis_39 • genesis_95 • genesis_8 • genesis_44 • genesis_76 • genesis_69 • genesis_31 • genesis_41 • genesis_84 • genesis_15 • genesis_25 • genesis_38 • genesis_20 • genesis_94 • genesis_90 • genesis_87 • genesis_47 • genesis_61 • genesis_83 • genesis_23 • genesis_98 • genesis_56 • genesis_81 • genesis_70 • genesis_71 • genesis_37" in "votes" element

  Scenario: should link votes to address page
    Given I'm on page "/address/16313739661670634666L"
    When I click "show votes button"
    And I click "vote link" no. 1
    Then I should be on page "/address/2581762640681118072L"

