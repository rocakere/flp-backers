#!/bin/bash
cd /mnt/d/flpwe3/flp-backers
echo "== authors =="
git log -3 --format='%an <%ae>'
echo "== config =="
git config --get user.name; git config --get user.email
echo "(empty above means unset)"
