#!/bin/bash
set -e
cd /mnt/d/flpwe3/flp-backers
git add lib/launch.ts .gitignore
git -c user.name=rocakere -c user.email=rocakere@users.noreply.github.com \
  commit -q -m "fix(launch): let DBC create the base mint" \
  -m "DBC initialize_virtual_pool_with_token2022 creates and initializes the base mint inside the handler (create_token_2022_base_mint), so the mint must not exist on chain before the pool tx. Pre-creating it made DBC system-allocate fail with already in use (custom error 0x0). Reorder: pool creation first, then init_token_config/record_launch. Keep self-minted fallback when no dbcConfig. decimals/1% fee/maxFee/metadata now come from the DBC config."
git log --oneline -1
git status --short
