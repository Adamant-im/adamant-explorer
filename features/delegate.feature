Feature: Delegate page
  Scenario: should show title, summary
    Given I'm on page "/delegate/537318935439898807L"
    Then I should see "Delegate" in "h2" html element
    And I should see "Home Address Delegate" in "breadcrumb" element
    And I should see table "summary" containing:
      | Name          | genesis_17                |
      | Address       | 537318935439898807L       |
      | Uptime        | /\d{1,3}(\.\d\d)?%/       |
      | Rank / Status | 50 / Active               |
      | Approval      | /\d{1,3}(\.\d\d)?%/       |
      | Vote weight   | /99(,\d{3})*.\d{1,8} LSK/ |
      | Forged        | /1,172.\d{8} LSK/         |
      | Blocks        | /\d+ \(\d+ missed\)/      |

  Scenario: should allow to show voters
    Given I'm on page "/delegate/537318935439898807L"
    When I click "show voters button"
    Then I should see "gottavoteemall • 16313739661670634666L" in "voters" element
    
  Scenario: should link voters to address page
    Given I'm on page "/delegate/537318935439898807L"
    When I click "show voters button"
    And I click "voter link" no. 1
    Then I should be on page "/address/4401082358022424760L"

  Scenario: should allow to show votes
    Given I'm on page "/delegate/4401082358022424760L"
    When I click "show votes button"
    Then I should see "genesis_51 • genesis_60 • genesis_77 • genesis_79 • genesis_91 • genesis_54 • genesis_2 • genesis_88 • genesis_27 • genesis_14 • genesis_72 • genesis_21 • genesis_66 • genesis_93 • genesis_67 • genesis_74 • genesis_34 • genesis_97 • genesis_50 • genesis_16 • genesis_12 • genesis_85 • genesis_10 • genesis_3 • genesis_42 • genesis_40 • genesis_33 • genesis_5 • genesis_55 • genesis_26 • genesis_11 • genesis_4 • genesis_57 • genesis_49 • genesis_63 • genesis_9 • genesis_68 • genesis_80 • genesis_7 • genesis_82 • genesis_89 • genesis_13 • genesis_53 • genesis_64 • genesis_92 • genesis_73 • genesis_99 • genesis_32 • genesis_28 • genesis_17 • genesis_29 • genesis_101 • genesis_46 • genesis_18 • genesis_48 • genesis_35 • genesis_30 • genesis_45 • genesis_78 • genesis_65 • genesis_43 • genesis_58 • genesis_1 • genesis_86 • genesis_75 • genesis_22 • genesis_36 • genesis_6 • genesis_52 • genesis_100 • genesis_19 • genesis_96 • genesis_24 • genesis_62 • genesis_59 • genesis_39 • genesis_95 • genesis_8 • genesis_44 • genesis_76 • genesis_69 • genesis_31 • genesis_41 • genesis_84 • genesis_15 • genesis_25 • genesis_38 • genesis_20 • genesis_94 • genesis_90 • genesis_87 • genesis_47 • genesis_61 • genesis_83 • genesis_23 • genesis_98 • genesis_56 • genesis_81 • genesis_70 • genesis_71 • genesis_37" in "votes" element
    
  Scenario: should link votes to address page
    Given I'm on page "/delegate/4401082358022424760L"
    When I click "show votes button"
    And I click "vote link" no. 3
    Then I should be on page "/address/11004588490103196952L"

  Scenario: should link address to address page
    Given I'm on page "/delegate/4401082358022424760L"
    And I click link on row no. 2 cell no. 2 of "summary" table
    Then I should be on page "/address/4401082358022424760L"
