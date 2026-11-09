# Security policy

FutFusion is a browser extension that can place and save SBC squads, purchase cards,
move them to the club and list them for sale in user-started workflows. It does not
submit SBCs. Account isolation, unintended transactions and data exposure are in scope.

## Reporting a vulnerability

Report it through GitHub's private vulnerability reporting:
https://github.com/leongrphc/futfusion/security/advisories/new

You can also open the repository's **Security** tab and choose **Report a vulnerability**.
Please don't open a public issue, pull request or discussion for a security problem.

Include:

- what you found and what an attacker could do with it,
- the steps to reproduce it,
- the FutFusion version (from `manifest.json`) and your Chrome version.

## What happens next

Reports are reviewed by the maintainer. Disclosure is coordinated after a fix is available.
Response and resolution times are not guaranteed.

## Supported versions

Only the latest version on the `main` branch is supported. Fixes are not backported.

## Scope

In scope: the extension in this repository and the website in `store/futfox-site`.
Out of scope: EA's Web App and services, and issues that need a compromised browser or
computer.
