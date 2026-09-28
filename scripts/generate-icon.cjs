const fs = require('fs');
const path = require('path');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;

async function buildIcon() {
  try {
    const pngPath = path.join(__dirname, '../public/IMG_4612.png');
    const icoPath = path.join(__dirname, '../public/icon.ico');
    const buf = await pngToIco(pngPath);
    fs.writeFileSync(icoPath, buf);
    console.log('Successfully generated icon.ico at:', icoPath);
  } catch (err) {
    console.error('Error generating icon:', err);
    process.exit(1);
  }
}

buildIcon();
