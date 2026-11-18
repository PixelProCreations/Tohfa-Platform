const { execSync, spawn } = require('child_process');
const path = require('path');
const os = require('os');

function getOnlineDevices() {
  try {
    const out = execSync('adb devices', { encoding: 'utf8' });
    const lines = out.split('\n').map(l => l.trim()).filter(Boolean);
    const devices = [];
    for (const line of lines.slice(1)) {
      const [id, state] = line.split(/\s+/);
      if (state === 'device') devices.push(id);
    }
    return devices;
  } catch {
    return [];
  }
}

function ensureDevice() {
  let devices = getOnlineDevices();
  if (devices.length > 0) {
    console.log(`[Tohfa] Online device ready: ${devices[0]}`);
    return devices[0];
  }

  console.log('[Tohfa] No online device found. Launching Pixel_7 emulator...');
  const sdkPath = process.env.ANDROID_HOME || path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk');
  const emulatorBin = path.join(sdkPath, 'emulator', os.platform() === 'win32' ? 'emulator.exe' : 'emulator');

  spawn(emulatorBin, ['-avd', 'Pixel_7'], {
    detached: true,
    stdio: 'ignore',
  }).unref();

  console.log('[Tohfa] Waiting for emulator to boot up...');
  execSync('adb wait-for-device', { stdio: 'inherit' });

  // Poll until boot completed
  let booted = false;
  const start = Date.now();
  while (!booted && Date.now() - start < 120000) {
    try {
      const res = execSync('adb shell getprop sys.boot_completed', { encoding: 'utf8' }).trim();
      if (res === '1') {
        booted = true;
        break;
      }
    } catch {}
    execSync('node -e "setTimeout(() => {}, 1000)"');
  }

  // Wait until package manager service is responsive
  let pmReady = false;
  while (!pmReady && Date.now() - start < 150000) {
    try {
      execSync('adb shell pm path android', { stdio: 'ignore' });
      pmReady = true;
      break;
    } catch {}
    execSync('node -e "setTimeout(() => {}, 1500)"');
  }

  devices = getOnlineDevices();
  console.log(`[Tohfa] Emulator online: ${devices[0] || 'emulator-5554'}`);
  return devices[0] || 'emulator-5554';
}

function run() {
  ensureDevice();

  console.log('[Tohfa] Setting up adb reverse tcp:8081...');
  try {
    execSync('adb reverse tcp:8081 tcp:8081', { stdio: 'inherit' });
  } catch (e) {
    console.warn('[Tohfa] adb reverse warning:', e.message);
  }

  console.log('[Tohfa] Installing debug APK on device...');
  const androidDir = path.resolve(__dirname, 'android');
  const gradlew = os.platform() === 'win32' ? '.\\gradlew.bat' : './gradlew';
  try {
    execSync(`${gradlew} app:installDebug -PreactNativeDevServerPort=8081`, {
      cwd: androidDir,
      stdio: 'inherit',
      shell: true,
    });
  } catch {
    console.warn('[Tohfa] First install attempt encountered broken pipe, waiting for package manager and retrying...');
    execSync('node -e "setTimeout(() => {}, 3000)"');
    execSync(`${gradlew} app:installDebug -PreactNativeDevServerPort=8081`, {
      cwd: androidDir,
      stdio: 'inherit',
      shell: true,
    });
  }

  console.log('[Tohfa] Launching app on device...');
  execSync('adb shell am start -n in.tohfa.mobile/.MainActivity', { stdio: 'inherit' });
  console.log('[Tohfa] Done! App running on emulator.');
}

run();
