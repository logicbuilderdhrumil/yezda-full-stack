## ADDED Requirements
### Requirement: Conversation threads
The system SHALL provide APIs to list conversations and retrieve message threads.

#### Scenario: Retrieve conversation thread
- **WHEN** a user requests a conversation thread
- **THEN** the system returns the ordered messages for that conversation

### Requirement: Send messages
The system SHALL accept and persist messages and broadcast them to participants.

#### Scenario: Send message
- **WHEN** a user submits a message to a conversation
- **THEN** the system stores the message and broadcasts it to participants

### Requirement: Participant access control
The system SHALL enforce participant access checks for conversation and message endpoints.

#### Scenario: Non-participant access blocked
- **WHEN** a user requests a conversation they are not a participant of
- **THEN** the system denies access and records an audit event

### Requirement: Chat audit logging and retention
The system SHALL record audit events for chat access and apply retention policies.

#### Scenario: Chat access audit trail
- **WHEN** a user retrieves a conversation thread
- **THEN** the system records the actor, conversation identifier, and timestamp

### Requirement: Operational safeguards for chat delivery
The system SHALL apply rate limits for message send endpoints and publish availability and error SLO targets.

#### Scenario: Message send throttled
- **WHEN** a client exceeds configured request limits for sending messages
- **THEN** the system returns a throttled response and preserves service availability
