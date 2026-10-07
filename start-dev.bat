@echo off
REM Script para iniciar o servidor de desenvolvimento local
REM Projeto: Boutique Empresarial

echo ========================================
echo Iniciando servidor de desenvolvimento...
echo ========================================
echo.

REM Navega para o diretório do projeto
cd /d "%~dp0"

REM Verifica se node/npm estão instalados
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] npm não está instalado ou não está no PATH
    echo Instale Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

REM Instala dependências se node_modules não existir
if not exist "node_modules" (
    echo.
    echo Instalando dependências (primeira execução)...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha ao instalar dependências
        pause
        exit /b 1
    )
)

echo.
echo Servidor iniciando na porta 5173...
echo.
echo Acesse em seu navegador:
echo   http://localhost:5173
echo.
echo Pressione CTRL+C para parar o servidor
echo.
timeout /t 2 /nobreak

REM Inicia o servidor de desenvolvimento
call npm run dev

pause
