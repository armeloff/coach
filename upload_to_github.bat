@echo off
chcp 65001 > nul
echo ======================================================
echo  Автоматическая загрузка проекта на GitHub
echo ======================================================
echo.

:: Проверяем, установлен ли Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Git не установлен на вашем компьютере.
    echo Пожалуйста, скачайте и установите Git по ссылке: https://git-scm.com/download/win
    echo После установки перезапустите этот файл.
    echo.
    pause
    exit /b
)

:: Инициализируем репозиторий, если еще не сделано
if not exist .git (
    echo 1. Инициализация Git-репозитория...
    git init
    echo.
) else (
    echo [Информация] Репозиторий уже инициализирован.
    echo.
)

echo 2. Подготовка файлов проекта...
git add .
echo.

echo 3. Создание точки сохранения (коммит)...
git commit -m "Initial commit"
echo.

echo 4. Настройка главной ветки...
git branch -M main
echo.

:: Удаляем старый remote, если вдруг он был настроен некорректно
git remote remove origin >nul 2>&1

echo 5. Привязка к GitHub...
echo.
echo Откройте ваш браузер, создайте новый репозиторий на GitHub
echo и скопируйте ссылку на него (например: https://github.com/логин/репозиторий.git).
echo.
set /p repo_url="Вставьте скопированную ссылку на GitHub и нажмите Enter: "
echo.

if "%repo_url%"=="" (
    echo [ОШИБКА] Ссылка не может быть пустой. Попробуйте запустить файл снова.
    pause
    exit /b
)

git remote add origin %repo_url%

echo.
echo 6. Отправка файлов на GitHub...
echo (Если откроется окно браузера с просьбой войти в GitHub, войдите в свой аккаунт).
echo.
git push -u origin main

echo.
echo ======================================================
echo  ГОТОВО! Проверьте страницу вашего репозитория на GitHub.
echo ======================================================
echo.
pause
