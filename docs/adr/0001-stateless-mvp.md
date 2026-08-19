# ADR 0001: Start with a stateless comparison MVP

- **Status:** Accepted
- **Date:** 2026-08-19

## Context

The initial product hypothesis is that Canadian homeowners want to compare renewal offers without creating an account or providing identifying information. Accounts, reminders and stored scenarios add security and privacy obligations before the comparison workflow has been validated.

## Decision

The first release accepts mortgage and offer details through a stateless Spring Boot endpoint and returns calculated scenarios. The Angular client does not persist inputs remotely. The service does not request names, addresses, lender credentials or credit information.

## Consequences

- A visitor can get value immediately with minimal privacy risk.
- The application is straightforward to deploy and scale horizontally.
- Saved scenarios, email reminders and product analytics are deferred.
- If persistence is introduced, consent, retention, deletion and threat-model documentation must be completed first.
