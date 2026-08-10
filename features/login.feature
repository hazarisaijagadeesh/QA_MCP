Feature: Demo app login flow

  @demo
  Scenario: User logs in successfully
    Given I open the local demo app
    When I enter "admin" and "password"
    And I click the login button
    Then I should see the dashboard

  @demo
  Scenario: MCP assistant explains the login flow
    Given I open the local demo app
    When I enter "admin" and "password"
    And I click the login button
    Then I should see the dashboard
    When I ask the MCP assistant for analysis
    Then I should see the MCP summary

  @demo
  Scenario: Open Google, navigate to Salesforce sign-up, and submit a sample form
    Given I open Google
    When I search for "test.salesforce.com"
    And I open the Salesforce sign-up page
    Then I should see the Salesforce sign-up form
    When I enter sample Salesforce signup details
    And I click the Salesforce sign-up button
    Then I should see a signup response message
