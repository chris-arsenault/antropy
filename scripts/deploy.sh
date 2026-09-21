#!/usr/bin/env bash
set -euo pipefail

# Redeploy the published main branch; local files are never deployed by this command.
gh workflow run ci.yml --repo chris-arsenault/antropy --ref main
