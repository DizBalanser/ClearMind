Detailed Requirements for Thesis Milestones 1-4
Dear General,
 
Following my previous message regarding the extension, please find below the detailed technical requirements for each milestone. You are expected to adhere to these standards to ensure your thesis is accepted.
Milestone 1: Requirement Analysis & Design
Focus: Documentation and Planning
Deliverables:
Feasibility plan.
Functional and Non-functional specifications.
Use-Case Diagram: Must reflect the functional specification. Note: This is not a workflow diagram; it should show user-system relationships, not internal processes.
User Stories: Must be detailed enough for a non-programmer to perform manual testing. Include edge cases and error handling.
Class Diagram: Show public interfaces and relationships between types. (Private auxiliary procedures are not required).
UI Design: Wireframes/Mockups showing multiple screens and states (e.g., popups, menus).
Database Schema: (If applicable).
Optional but Recommended: Sequence diagrams for complex processes.
Milestone 2: Prototype 1 (approx. 30% Completion)
Focus: Partial Implementation & Architecture
Functionality:
Approx. 30% of use cases implemented.
Horizontal Coverage: Both Model and View layers must function for the implemented features.
Demo mode: Prepare a specific state to demonstrate functions easily.
Git Usage:
Use the Issue Board: Tasks must be tracked and assigned.
Proper branching and meaningful commit messages.
Correct use of .gitignore (no binary/obj files).
Documentation: Update the Wiki/Specs if implementation deviated from the original design.
Milestone 3: Prototype 2 (approx. 90% Completion)
Focus: Near-Complete Functionality & Testing
Functionality:
Basic tasks implemented entirely; sub-functions almost complete.
Visualization: UI must be rendered correctly (no graphical glitches, correct field alignment).
Error Handling: The program must provide clear feedback on incorrect user inputs.
Testing (Critical):
Unit Tests: Focus on the Model.
Coverage goal: >80% code coverage for the model.
Must include: Happy path, Error path, and Edge cases.
CI (Continuous Integration):
Pipeline must build the project and run tests automatically on every push to the master branch.
Milestone 4: Final Product
Focus: Full Functionality, Clean Code, & Final Docs
Functionality:
100% of required functions working.
Fault Tolerance: Application must handle all interactions without crashing.
Ergonomics: Follow standard software ergonomic principles (easy to use without reading source code).
Code Quality:
Adhere to SOLID principles.
No compiler warnings (Resolve all "null" warnings; do not just disable the check).
Uniform coding conventions throughout.
Documentation:
Finalize all specs and diagrams.
API Documentation: Generate HTML manuals for classes/methods (e.g., JavaDoc for Java, XML-doc for C#).
Please review the ELTE Department of Software Technology materials if you need examples of specific diagram types.
Best regards,
Walid
 
 detailed verison of ml3
 Milestone 3 Requirements: CI/CD, Test Coverage, and API Handling
Dear General,
As we approach the Milestone 3 deadline on March 25, please ensure you are wrapping up all the core features we discussed during our individual consultations.
As a reminder, this milestone requires a solid testing foundation and automated pipelines. Please pay close attention to the following:
CI/CD Pipeline: Your GitLab CI/CD must be fully set up to build your project and run your tests automatically on every push to the master branch.
Test Coverage: You must use a proper, standard library to calculate and display your test coverage percentage (aiming for that >80% model coverage). You do not need the most complex tools; stick to the reliable industry standards. Depending on your stack, use one of the main tools like pytest-cov (for Python), Jest (for JavaScript/TypeScript), JaCoCo (for Java), or Coverlet (for C#). Ensure the pipeline output clearly shows the coverage percentage.
Handling External APIs (e.g., Gemini, OpenAI, etc.): For those of you integrating external APIs, your automated tests must be stable. Do not make live API calls during your CI/CD pipeline runs. This leads to rate-limiting, unnecessary costs, and pipeline failures. Instead, you must use mocking (e.g., unittest.mock in Python, or Jest mocks in JS) to simulate the API requests and responses. This ensures your internal logic is properly tested without relying on external servers.
Best regards,
Walid
 