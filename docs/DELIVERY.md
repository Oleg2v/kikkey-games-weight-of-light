# GitHub Pages publication

The user selected GitHub Pages for `Oleg2v/kikkey-games-weight-of-light`. This game is published as a separate project site; nothing changes on kikkey.com, its routes, DNS, or contacts.

`.github/workflows/pages.yml` runs on pushes to `main` and manual dispatch. It installs locked dependencies with Node.js 24, runs the unit tests, builds Vite, uploads only `dist`, and deploys the artifact to the `github-pages` environment. Blender source files and build tooling are not published. Vite's relative asset base supports the repository subpath.

In the repository's **Settings → Pages → Build and deployment**, the source must be **GitHub Actions**. Once the workflow succeeds, use the URL reported by the deployment, and verify that the game and model assets load there. The expected project path is `https://oleg2v.github.io/kikkey-games-weight-of-light/`; this is an expected destination, not a claim of a completed deployment.

## Current network prerequisite

Git read access and the GitHub repository web page work. Requests to `api.github.com` and `oleg2v.github.io` fail at the network proxy (`CONNECT 403`). Retrying the read-only GitHub API call outside the shell sandbox produced the same failure. Therefore neither Pages configuration nor repository API permissions has yet been verified. This is a network restriction; it does not establish that credentials lack permission.

Allow `api.github.com` and `oleg2v.github.io` in the cloud environment's network settings, preserving existing rules and package-manager presets. Then retry the existing platform authentication. Do not request or copy a new token unless a permitted API request establishes that additional authorization is actually needed.

Cloud environment publication snapshots tools and files; it does not itself publish this website. A loopback development URL is not a public test link. No website publication should be reported complete before the workflow and public URL have been verified.
