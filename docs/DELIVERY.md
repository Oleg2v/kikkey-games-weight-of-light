# GitHub Pages publication

The user selected GitHub Pages for `Oleg2v/kikkey-games-weight-of-light`. This game is published as a separate project site; nothing changes on kikkey.com, its routes, DNS, or contacts.

`.github/workflows/pages.yml` runs on pushes to `main` and manual dispatch. It installs locked dependencies with Node.js 24, runs the unit tests, builds Vite, uploads only `dist`, and deploys the artifact to the `github-pages` environment. Blender source files and build tooling are not published. Vite's relative asset base supports the repository subpath.

In the repository's **Settings → Pages → Build and deployment**, the source must be **GitHub Actions**. Once the workflow succeeds, use the URL reported by the deployment, and verify that the game and model assets load there. The expected project path is `https://oleg2v.github.io/kikkey-games-weight-of-light/`; this is an expected destination, not a claim of a completed deployment.

## Current network prerequisite

Git read access and the GitHub repository web page work. Requests to `api.github.com` and `oleg2v.github.io` fail at the network proxy (`CONNECT 403`). Retrying the read-only GitHub API call outside the shell sandbox produced the same failure. Therefore neither Pages configuration nor repository API permissions has yet been verified. This is a network restriction; it does not establish that credentials lack permission.

Allow `api.github.com` and `oleg2v.github.io` in the cloud environment's network settings, preserving existing rules and package-manager presets. Then retry the existing platform authentication. Do not request or copy a new token unless a permitted API request establishes that additional authorization is actually needed.

Cloud environment publication snapshots tools and files; it does not itself publish this website. A loopback development URL is not a public test link. No website publication should be reported complete before the workflow and public URL have been verified.

## Verified publication attempt

Source commit `82e94b6` was pushed to `origin/main`. GitHub Actions run [43947341898](https://github.com/Oleg2v/kikkey-games-weight-of-light/actions/runs/43947341898) built successfully and uploaded the 774 KB `github-pages` artifact. Deployment failed during `actions/configure-pages@v5` with `Get Pages site failed ... Not Found`: Pages is not enabled for this repository.

To finish, open [Settings → Pages](https://github.com/Oleg2v/kikkey-games-weight-of-light/settings/pages), choose **Build and deployment → Source: GitHub Actions**, then choose **Re-run failed jobs** on that run. The user has already authorized this publication; the remaining issue is configuration capability, not missing publication consent. Adding `enablement: true` to the workflow is insufficient with the default `GITHUB_TOKEN`; the official action requires a separate token with adequate administration permissions for automatic enablement. No additional credential was requested.

No public deployment or successful request to the Pages URL has been verified yet. This report must be updated after successful deployment and live-site checks.
