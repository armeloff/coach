@echo off
chcp 65001 > nul
echo ======================================================
    echo  Подготовка и перенос базы данных на Yandex Cloud
echo ======================================================
echo.

:: Проверяем наличие Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не установлен на этом компьютере.
    echo Пожалуйста, установите Node.js с официального сайта: https://nodejs.org/
    pause
    exit /b
)

:: Шаг 1. Установка локальных зависимостей для миграции
echo 1. Установка библиотек для миграции данных...
cd yandex
cmd /c npm install
cd ..
echo.

:: Шаг 2. Запуск скрипта миграции данных
echo 2. Запуск миграции из Cloudflare в Yandex YDB...
node yandex/migrate.js
if %errorlevel% neq 0 (
    echo.
    echo [ОШИБКА] Произошла ошибка во время миграции данных.
    echo Проверьте соединение с интернетом и настройки YDB.
    pause
    exit /b
)
echo.

:: Шаг 3. Упаковка Cloud Function в ZIP-архив
echo 3. Создание архива function.zip для загрузки в Yandex Cloud...
powershell -Command "if (Test-Path yandex\function.zip) { Remove-Item yandex\function.zip -Force }"
powershell -Command "Compress-Archive -Path yandex\index.js, yandex\package.json -DestinationPath yandex\function.zip -Force"

if not exist yandex\function.zip (
    echo [ОШИБКА] Не удалось создать файл yandex\function.zip.
    pause
    exit /b
)

echo.
echo ======================================================
echo  ПОДГОТОВКА ЗАВЕРШЕНА!
echo.
echo  1. Таблицы в Yandex YDB созданы, данные скопированы.
echo  2. В папке yandex создан файл 'function.zip'.
echo.
echo  Следуйте инструкциям в чате для загрузки function.zip 
echo  в Yandex Cloud Functions и привязки его к сайту.
echo ======================================================
echo.
pause
