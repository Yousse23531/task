const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\MSI\\Desktop\\TaskAndEventManager-Installer';
const projectDistInstaller = path.join(__dirname, '..', 'dist-installer');
const userDesktop = 'C:\\Users\\MSI\\OneDrive - POLYTECH INTL\\Desktop';
const installedAppResources = 'C:\\Users\\MSI\\AppData\\Local\\Programs\\ahmed-task-manager\\resources';

console.log('Copying build artifacts to target destinations...');

// 1. Copy to project/dist-installer
if (!fs.existsSync(projectDistInstaller)) {
  fs.mkdirSync(projectDistInstaller, { recursive: true });
}

const portableSrc = path.join(srcDir, 'TaskAndEventManager-Portable.exe');
const setupSrc = path.join(srcDir, 'TaskAndEventManager-Setup.exe');

if (fs.existsSync(portableSrc)) {
  fs.copyFileSync(portableSrc, path.join(projectDistInstaller, 'TaskAndEventManager-Portable.exe'));
  console.log('✓ Copied to project/dist-installer/TaskAndEventManager-Portable.exe');

  if (fs.existsSync(userDesktop)) {
    fs.copyFileSync(portableSrc, path.join(userDesktop, 'Task & Event Manager 1.1.0.exe'));
    console.log('✓ Copied to Desktop/Task & Event Manager 1.1.0.exe');
  }
}

if (fs.existsSync(setupSrc)) {
  fs.copyFileSync(setupSrc, path.join(projectDistInstaller, 'TaskAndEventManager-Setup.exe'));
  console.log('✓ Copied to project/dist-installer/TaskAndEventManager-Setup.exe');
}

// 2. Copy app.asar directly to installed app
const asarSrc = path.join(srcDir, 'win-unpacked', 'resources', 'app.asar');
if (fs.existsSync(asarSrc) && fs.existsSync(installedAppResources)) {
  try {
    fs.copyFileSync(asarSrc, path.join(installedAppResources, 'app.asar'));
    console.log('✓ Updated installed app.asar');
  } catch (err) {
    console.warn('Could not copy app.asar (app may be running):', err.message);
  }
}

console.log('All copy operations finished successfully!');
