## MODIFIED Requirements
### Requirement: Conversation threads
The system SHALL provide APIs and a UI to list conversations and display message threads.

#### Scenario: Retrieve conversation thread
- **WHEN** a user requests a conversation thread
- **THEN** the system returns the ordered messages for that conversation

#### Scenario: Open a conversation
- **WHEN** a user selects a conversation
- **THEN** the system displays the conversation messages in a thread view

### Requirement: Send messages
The system SHALL accept, persist, and display messages and broadcast them to participants.

#### Scenario: Send message
- **WHEN** a user submits a message to a conversation
- **THEN** the system stores the message and broadcasts it to participants

#### Scenario: Send message via UI
- **WHEN** a user submits a message
- **THEN** the message appears in the thread and is sent to other participants
