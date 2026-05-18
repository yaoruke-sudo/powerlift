/**
 * Generate Android launcher icons and vivo store icon from one square master asset.
 *
 * Source background: assets/icon-background.png
 * Outputs:
 * - store-assets/vivo/icon.png (512x512, straight corners, no transparent/white edge)
 * - android/app/src/main/res/mipmap density folders
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');

const root = __dirname;
const resBase = path.join(root, 'android', 'app', 'src', 'main', 'res');
const backgroundPath = path.join(root, 'assets', 'icon-background.png');
const storeIconPath = path.join(root, 'store-assets', 'vivo', 'icon.png');

function createWordMarkSvg(size) {
    const fontSize = Math.round(size * 0.45);
    const strokeWidth = Math.max(4, Math.round(size * 0.026));
    const shadowBlur = Math.max(6, Math.round(size * 0.018));

    return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="${Math.round(size * 0.018)}" stdDeviation="${shadowBlur}" flood-color="#000000" flood-opacity="0.68"/>
    </filter>
  </defs>
  <circle cx="${size / 2}" cy="${size / 2}" r="${Math.round(size * 0.235)}" fill="#0b0f12" opacity="0.66"/>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle"
        font-family="Microsoft YaHei, SimHei, PingFang SC, Noto Sans SC, sans-serif"
        font-weight="900" font-size="${fontSize}" fill="#ff7a18"
        stroke="#120700" stroke-width="${strokeWidth}" paint-order="stroke fill" filter="url(#shadow)">练</text>
</svg>`);
}

async function buildIcon(size, outPath) {
    const background = await sharp(backgroundPath)
        .resize(size, size, { fit: 'cover', position: 'center' })
        .png()
        .toBuffer();

    await sharp(background)
        .composite([{ input: createWordMarkSvg(size), blend: 'over' }])
        .removeAlpha()
        .png({ compressionLevel: 9 })
        .toFile(outPath);
}

async function main() {
    await fs.access(backgroundPath);

    const densityMap = {
        mdpi: { icon: 48, fg: 108 },
        hdpi: { icon: 72, fg: 162 },
        xhdpi: { icon: 96, fg: 216 },
        xxhdpi: { icon: 144, fg: 324 },
        xxxhdpi: { icon: 192, fg: 432 },
    };

    await fs.mkdir(path.dirname(storeIconPath), { recursive: true });
    await buildIcon(512, storeIconPath);
    console.log('✓ store-assets/vivo/icon.png (512x512)');

    for (const [density, sizes] of Object.entries(densityMap)) {
        const dir = path.join(resBase, `mipmap-${density}`);
        await fs.mkdir(dir, { recursive: true });

        await buildIcon(sizes.icon, path.join(dir, 'ic_launcher.png'));
        await buildIcon(sizes.icon, path.join(dir, 'ic_launcher_round.png'));
        await buildIcon(sizes.fg, path.join(dir, 'ic_launcher_foreground.png'));

        console.log(`✓ mipmap-${density}/ic_launcher*.png`);
    }

    console.log('\nAll icons generated from assets/icon-background.png');
}

main().catch(err => {
    console.error('Icon generation failed:', err);
    process.exit(1);
});
