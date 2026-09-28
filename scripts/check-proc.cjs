const { execSync } = require('child_process');
try {
  const out = execSync('powershell "Get-CimInstance Win32_Process | Where-Object { $_.Name -like \'*Task*\' -or $_.Name -like \'*electron*\' } | Select-Object ProcessId, Name, ExecutablePath, CommandLine | Format-List"').toString();
  console.log(out);
} catch (e) {
  console.error(e);
}
