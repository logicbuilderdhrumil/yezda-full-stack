# Invite Flows

# Organisation Accounts and Invite Flows

A staff member of YEZDA needs to be able to initialise a new organisation account and invite their team members to join the account. This document describes the invite flow for organisation accounts.

The flow for inviting organisation members to join an organisation account is as follows:
1. The staff member (the inviter) logs into their YEZDA account and navigates to the "Organisation" page.
2. On the "Organisation" page, the inviter clicks on the users tab and then sees that organisations tenant users. The inviter clicks on the "Invite User" button to start the invite process.
3. The inviter is presented with a form to enter the email address of the user they wish to invite. The inviter enters the email address and clicks on the "Send Invite" button.
4. The system sends an email invitation to the specified email address with a link to join the organisation account.
5. The invited user receives the email and clicks on the link to join the organisation account.


# Flow for inviting a candidate as a tenant organisation user.
A candidate can have connections to multiple organisations (openspec\specs\global-candidate-identity). However from the organisation's perspective they are inviting a new person and this connection must be percieved as a new invite flow from the organisation's perspective. The flow for inviting a candidate to go through a screening process is as follows:
1. The staff member (the inviter) logs into their YEZDA account and navigates to the "Candidates" page.
2. On the "Candidates" page, the inviter clicks on the "Invite Candidate" button to start the invite process.
3. The inviter is presented with a form to enter the email address of the candidate they wish to invite plus any additional information required for the screening process. The inviter enters the email address and clicks on the "Send Invite" button. (First Name, Last Name, phone number, DOB, National Insurance number.)
4. The system creates a new global candidate identity for the candidate and links it to the organisation. The system sends an email invitation to the specified email address with a link to start the screening process.


# Flow for inviting a new candidate as a YEZDA admin user.
A candidate can have connections to multiple organisations (openspec\specs\global-candidate-identity). A Yezda admin can invite a candidate and assign their global candidate identity to one or more organisations.

The flow for inviting a new candidate (one that does not yet have a global candidate identity) to go through a screening process is as follows:
1. The staff member (the inviter) logs into their YEZDA account and navigates to the organisation page of the organisation they want to assign the candidate to.
2. On the "Organisation" page, the inviter clicks on the Candidates tab which shows the candidates assigned to that organisation for screening by Yezda. The inviter clicks on the "Invite Candidate" button to start the invite process.
3. The inviter is presented with a form to enter the email address of the candidate they wish to invite. Validation checks that the global candidate identity doesn't exist yet. If it doesn't exist fields collecting following additional information required for the screening process appear. (First Name, Last Name, phone number, DOB, National Insurance number.). Then the inviter submits the form by clicking on the "Send Invite" button.
   1. If the global candidate identity already exists, the "Send Invite" button appears without the additional fields (as they are already associated with the global candidate identity). The inviter clicks on the "Send Invite" button.
4. The system creates a new global candidate identity for the candidate and links it to the organisation. The system sends an email invitation to the specified email address with a link to start the screening process.


