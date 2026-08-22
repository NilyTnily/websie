@echo off
cd /d C:\Users\User\Desktop\AI-Income-Kit\Websie

echo Scraping remaining brands...

start "Omega" cmd /k npx ts-node scripts/scraper-playwright.ts omega
timeout /t 5

start "Tudor" cmd /k npx ts-node scripts/scraper-playwright.ts tudor
timeout /t 5

start "Breitling" cmd /k npx ts-node scripts/scraper-playwright.ts breitling
timeout /t 5

start "Audemars" cmd /k npx ts-node scripts/scraper-playwright.ts audemars-piguet
timeout /t 5

start "JLC" cmd /k npx ts-node scripts/scraper-playwright.ts jaeger-lecoultre
timeout /t 5

start "Panerai" cmd /k npx ts-node scripts/scraper-playwright.ts panerai
timeout /t 5

start "VC" cmd /k npx ts-node scripts/scraper-playwright.ts vacheron-constantin
timeout /t 5

start "Cartier" cmd /k npx ts-node scripts/scraper-playwright.ts cartier
timeout /t 5

start "RM" cmd /k npx ts-node scripts/scraper-playwright.ts richard-mille
timeout /t 5

start "Zenith" cmd /k npx ts-node scripts/scraper-playwright.ts zenith
timeout /t 5

start "IWC" cmd /k npx ts-node scripts/scraper-playwright.ts iwc-schaffhausen
timeout /t 5

start "Hublot" cmd /k npx ts-node scripts/scraper-playwright.ts hublot
timeout /t 5

start "Breguet" cmd /k npx ts-node scripts/scraper-playwright.ts breguet
timeout /t 5

start "Piaget" cmd /k npx ts-node scripts/scraper-playwright.ts piaget
timeout /t 5

start "Chopard" cmd /k npx ts-node scripts/scraper-playwright.ts chopard
timeout /t 5

echo All scrapers started in separate windows.
echo Check each window for progress.
pause