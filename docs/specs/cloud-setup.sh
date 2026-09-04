#!/bin/bash
# Cópia canônica do setup script do ambiente cloud — PLANO_MULTIAGENTE.md §9.3.
#
# O diálogo de ambiente em claude.ai NÃO lê o repositório: cole o conteúdo deste
# arquivo no campo "Setup script". Esta cópia existe para o script não se perder;
# se você editar um lado, edite o outro.
#
# Roda como root no VM Ubuntu 24.04, ANTES do Claude Code, só quando não há cache.
# Constraints: precisa sair 0, e terminar em ~5 min.
#
# ATENÇÃO — o que este script NÃO consegue fazer, e por quê (§9.5, verificado):
#   rtk  não instala. Asset de release de repositório não anexado dá 403; o
#        install.sh dá 404; brew não existe; e `cargo install rtk` traz o
#        Rust Type Kit, outro projeto. Não há caminho viável — não insista.
#
# Tudo aqui é otimização. O gate roda sem nada disto.

# caveman: única das três ferramentas de custo com chance real no VM, porque a
# CLI vem do npm. O `setup --install` baixa binários Go de fora do npm e pode
# falhar — daí o `|| true` em cada linha.
npm install -g @caveman-ai/cli || true
caveman setup --install || true

exit 0
