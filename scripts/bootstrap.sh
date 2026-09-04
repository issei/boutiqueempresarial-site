#!/bin/bash
# Setup de projeto — roda em toda sessão (local e cloud) pelo hook SessionStart
# de .claude/settings.json. PLANO_MULTIAGENTE.md §9.3/§9.4.
#
# Regra: idempotente e sempre `exit 0`. Uma falha aqui não pode impedir a
# sessão de iniciar — o gate é quem reprova, não o bootstrap.

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/..}" || exit 0

[ -d node_modules ] || npm ci || true

# Os browsers do Playwright já vêm no VM cloud (/opt/pw-browsers), mas na linha
# 1.56 — o package.json pede 1.58, que procura outro build. PLAYWRIGHT_BROWSERS_PATH
# já aponta para lá, então isto grava o build correto ao lado do existente.
# Sem --with-deps: as libs de sistema já estão instaladas e o hook não roda como root.
if [ "$CLAUDE_CODE_REMOTE" = "true" ]; then
  npx playwright install chromium || true
fi

exit 0
