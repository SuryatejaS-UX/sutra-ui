# Slide 1 — AGENT WORKFLOW

## Content

```mermaid
flowchart TD
    UserQuery([I want to create an<br>epic for application<br>login]) --> SupervisorAgent[Supervisor Agent<br>Decides the flow<br>based on user query.]
    SupervisorAgent --> RuleNode[Rule Node<br>Decides the flow<br>based on user query.]
    
    RuleNode --> EpicGen[Epic Generation Agent<br>Generates Epic details based on<br>context.<br>Tool used: get_time_context [to<br>get current time]]
    RuleNode --> FeatureGen[Feature Generation Agent<br>Generates Features based on<br>epic id .<br>Tool used: jira_get_epic [to get<br>epic details]]
    RuleNode --> UserStoryGen[User Stroy Generation Agent<br>Generates User Stories based<br>on feature id .<br>Tool used: jira_get_feature [to<br>get feature details]]
    RuleNode --> TestCaseGen[Test case Generation Agent<br>Generates User Stories based<br>on feature id .<br>Tool used: jira_get_feature [to<br>get feature details]]
    
    EpicGen --> EpicHITL{HITL}
    EpicHITL -- feedback --> EpicGen
    EpicHITL -- Approved --> EpicExec[Epic API execution Agent<br>Executes jira epic API using tool<br>Tool used:jira_create_epic[jira<br>API integration]]
    
    FeatureGen --> FeatureHITL{HITL}
    FeatureHITL -- feedback --> FeatureGen
    FeatureHITL -- Approved --> FeatureExec[Feature creation Agent<br>Executes jira features API.<br>Tool used:jira_create_features]
    
    UserStoryGen --> UserStoryHITL{HITL}
    UserStoryHITL -- feedback --> UserStoryGen
    UserStoryHITL -- Approved --> UserStoryExec[User story creation Agent<br>Executes jira user Story API.<br>Tool used:jira_create_user_story]
    
    TestCaseGen --> TestCaseHITL{HITL}
    TestCaseHITL -- feedback --> TestCaseGen
    TestCaseHITL -- Approved --> TestCaseExec[TestCase creation Agent<br>Executes jira test case API.<br>Tool<br>used:jira_create_test_case]
    
    EpicExec --> ResponseKeep[Response Keeping Agent<br>Responses are kept on state<br>variable for future response]
    FeatureExec --> ResponseKeep
    UserStoryExec --> ResponseKeep
    TestCaseExec --> ResponseKeep
    
    ResponseKeep --> EndNode([END])
```

# Slide 2 — AGENT WORKFLOW (Continued)

## Content

Base on users input supervisor agent will decide the flow like which jira artifact to be created.And the output from supervisor agent is compared in Rule node and flow will be passed to the respective agent like Epic generation agent,Feature generation agent...

Then the generated content is made available to user for validation from user in the HITL step. If user approved content will passed to creation agent which have access to jira api by using Tools . which will call the tool by passing available information to the tool, and response has been captured and shown to user.

A response keeper agent is created to keep the history of created jira artifacts.

# Slide 3 — TOOLS USED

## Content

**1.read_file**
To read user attached files in the agent.

**2.get_time_context**
Tool will return current time and date

**3.jira_create_epic**
tool will create epic in jira using jira API.

**4.jira_get_epic**
Tool will get epic details from jira using jira API.

**5.jira_create_features**
tool will create features in jira using jira API.

**6.jira_get_feature**
Tool will get feature details from jira using jira API.

**7.jira_create_user_story**
tool will create user story in jira using jira API.

**8. jira_get_user_story**
Tool will get user story details from jira using jira API.

**9.jira_create_test_case**
tool will create test case in jira using jira API.

# Slide 4 — USER GUIDE – BUSINESS ANALYSIS AGENT

## Content

**Introduction**

With the Business Analyst Agent, you can easily create epics, features, user stories, and test cases directly in Jira using simple conversational prompts.

For example, you can initiate the creation of an epic by stating, "I want to create an epic with below details ." The agent will guide you through the necessary details, ensuring that your project requirements are clearly defined and accurately captured.

**User Inputs**

Each jira Artifact creation would be a separate conversational flow. After creation of a Jira Artifact, agent will show Jira creation response in the conversational UI.

User can also attach a file to give more context to the artifact to be created.

If agent is finds anything is missing , it will come with a question for clarifications.

Note:Providing ‘workspaceName’ and ‘workAreaName’ is mandatory for the first input.

**Creating an Epic**
- Input: " In 'workspaceName 'A' and 'workAreaName 'B', I want to create an epic for below details "

**Creating Features**
- Input: "Create features for epic id:IN90 "
- Input: "Create features for below details "

**Creating a User Story**
- Input: "Create user stories for the feature id:FE12"
- Input: "Create user stories for below details"

**Creating Test Cases**
- Input: "Create test cases for the feature id:FE12"
- Input: "Create test cases for User story id :US102"
