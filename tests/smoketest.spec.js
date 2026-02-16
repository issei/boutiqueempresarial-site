import { test, expect } from '@playwright/test';

test.describe('Smoketest - Dynamic Crawl & Asset Validation', () => {
    // Use sets to store visited URLs to avoid infinite loops
    const visited = new Set();
    const validAssets = new Set(); // Cache valid assets to avoid redundant requests

    // Storage for failures
    const brokenLinks = [];
    const brokenAssets = [];

    test('Crawl website, validate internal links and check assets', async ({ page, request, baseURL }) => {
        // 1. Setup Base URL (Fallback to localhost:5173 if not defined)
        // Note: Use baseURL from config or default
        const baseUrl = baseURL || 'http://localhost:5173';

        // Queue for crawling: [{ url: '/foo', referrer: '/' }]
        const queue = [{ url: '/', referrer: 'START' }];

        // Helper to validate assets on the current page
        const validateAsset = async (assetUrl, sourcePage) => {
            if (!assetUrl) return;

            // Resolve relative URLs
            const absoluteAssetUrl = new URL(assetUrl, page.url()).href;

            if (validAssets.has(absoluteAssetUrl)) return; // Already checked

            try {
                const response = await request.get(absoluteAssetUrl);
                if (response.status() === 404) {
                    console.error(`❌ Broken Asset: ${assetUrl} on ${sourcePage}`);
                    brokenAssets.push({ page: sourcePage, asset: assetUrl, status: 404 });
                } else if (response.status() === 200) {
                    validAssets.add(absoluteAssetUrl);
                }
            } catch (e) {
                console.warn(`⚠️ Warning: Could not validate asset ${assetUrl}: ${e.message}`);
                // We can choose to fail or warn here. For smoke test, usually 404 is the main error.
            }
        };

        console.log(`🚀 Starting Smoketest Crawl from: ${baseUrl}`);

        // Limit depth or count if necessary, but "all internal links" is requested.
        while (queue.length > 0) {
            const { url, referrer } = queue.shift();

            // Normalize: ensure it starts with / and remove hashes
            // We assume 'url' in queue is relative like '/about'
            const currentPath = url.split('#')[0];

            if (visited.has(currentPath)) continue;
            visited.add(currentPath);

            console.log(`📍 Visiting: ${currentPath} (via ${referrer})`);

            // 2. Navigate
            const absoluteNavUrl = new URL(currentPath, baseUrl).href;
            const response = await page.goto(absoluteNavUrl, { waitUntil: 'domcontentloaded' });

            if (!response) {
                brokenLinks.push({ source: referrer, target: currentPath, error: 'No Response' });
                continue;
            }

            if (response.status() !== 200) {
                console.error(`❌ Broken Link: ${currentPath} returned ${response.status()}`);
                brokenLinks.push({ source: referrer, target: currentPath, status: response.status() });
                continue;
            }

            // 3. Asset Verification (Images + Favicon)
            const assetPromises = [];

            // Check Favicon (Standard locations)
            const favicons = await page.locator('link[rel="icon"]').all();
            if (favicons.length > 0) {
                for (const icon of favicons) {
                    const href = await icon.getAttribute('href');
                    if (href) assetPromises.push(validateAsset(href, currentPath));
                }
            } else {
                assetPromises.push(validateAsset('/favicon.ico', currentPath));
            }

            // Check Images
            const images = await page.locator('img').all();
            for (const img of images) {
                const src = await img.getAttribute('src');
                if (src) assetPromises.push(validateAsset(src, currentPath));
            }

            await Promise.all(assetPromises);

            // 4. Harvest Internal Links
            const anchors = await page.locator('a').all();
            for (const anchor of anchors) {
                const href = await anchor.getAttribute('href');
                if (!href) continue;

                // Construct absolute URL to check origin
                try {
                    const absoluteUrl = new URL(href, page.url()).href;

                    // Allow crawling only on same origin
                    if (absoluteUrl.startsWith(baseUrl)) {
                        const relativePath = absoluteUrl.replace(baseUrl, '') || '/';
                        if (!visited.has(relativePath.split('#')[0]) &&
                            !queue.some(q => q.url === relativePath)) {
                            queue.push({ url: relativePath, referrer: currentPath });
                        }
                    }
                } catch (e) {
                    // Ignore invalid URLs
                }
            }
        }

        // 5. Final Report
        if (brokenLinks.length > 0) {
            console.log('🚨 BROKEN LINKS FOUND:');
            console.table(brokenLinks);
        }

        if (brokenAssets.length > 0) {
            console.log('🚨 BROKEN ASSETS FOUND:');
            console.table(brokenAssets);
        }

        expect(brokenLinks.length, 'Found broken internal links').toBe(0);
        expect(brokenAssets.length, 'Found broken assets (404)').toBe(0);
    });
});
