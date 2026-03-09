/**
 * 使用 sharp 将 SVG 转换为各密度的 PNG 图标
 * 前提：npm install sharp
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const resBase = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

/**
 * 生成完整图标 SVG（深色背景 + 橙色「练」字）
 * 使用 108dp 基准尺寸，保持与 adaptive icon 配合
 */
function createIconSvg(size) {
    const fontSize = Math.round(size * 0.52);
    return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#16213e"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif"
        font-weight="900" font-size="${fontSize}" fill="#f26c0d">练</text>
</svg>`);
}

/**
 * 生成前景层 SVG（透明背景 + 橙色「练」字）
 */
function createForegroundSvg(size) {
    const fontSize = Math.round(size * 0.38);
    return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif"
        font-weight="900" font-size="${fontSize}" fill="#f26c0d">练</text>
</svg>`);
}

async function main() {
    const densityMap = {
        mdpi: { icon: 48, fg: 108 },
        hdpi: { icon: 72, fg: 162 },
        xhdpi: { icon: 96, fg: 216 },
        xxhdpi: { icon: 144, fg: 324 },
        xxxhdpi: { icon: 192, fg: 432 },
    };

    for (const [density, sizes] of Object.entries(densityMap)) {
        const dir = path.join(resBase, `mipmap-${density}`);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // ic_launcher.png
        const iconSvg = createIconSvg(sizes.icon);
        await sharp(iconSvg).png().toFile(path.join(dir, 'ic_launcher.png'));
        console.log(`✓ mipmap-${density}/ic_launcher.png (${sizes.icon}x${sizes.icon})`);

        // ic_launcher_round.png（相同内容，Android 系统会自动裁剪为圆形）
        await sharp(iconSvg).png().toFile(path.join(dir, 'ic_launcher_round.png'));
        console.log(`✓ mipmap-${density}/ic_launcher_round.png`);

        // ic_launcher_foreground.png
        const fgSvg = createForegroundSvg(sizes.fg);
        await sharp(fgSvg).png().toFile(path.join(dir, 'ic_launcher_foreground.png'));
        console.log(`✓ mipmap-${density}/ic_launcher_foreground.png (${sizes.fg}x${sizes.fg})`);
    }

    console.log('\n所有图标已生成！');
}

main().catch(err => {
    console.error('生成失败:', err);
    process.exit(1);
});
