import fs from 'fs';
import path from 'path';

const srcDir = 'd:/Semesters/SPM Project/Petrol-Pump/src';

const targets = [
  { from: /"\/logo\.png"/g, to: '"./logo.png"' },
  { from: /'\/logo\.png'/g, to: "'./logo.png'" },
  { from: /"\/logo\.jpg"/g, to: '"./logo.jpg"' },
  { from: /'\/logo\.jpg'/g, to: "'./logo.jpg'" },
  { from: /"\/login_background\.jpg"/g, to: '"./login_background.jpg"' },
  { from: /'\/login_background\.jpg'/g, to: "'./login_background.jpg'" },
  { from: /"\/dashboard_background\.jpg"/g, to: '"./dashboard_background.jpg"' },
  { from: /'\/dashboard_background\.jpg'/g, to: "'./dashboard_background.jpg'" },
  { from: /"\/meter_background\.jpg"/g, to: '"./meter_background.jpg"' },
  { from: /'\/meter_background\.jpg'/g, to: "'./meter_background.jpg'" },
  { from: /"\/sales_background\.jpg"/g, to: '"./sales_background.jpg"' },
  { from: /'\/sales_background\.jpg'/g, to: "'./sales_background.jpg'" },
  { from: /"\/diyal_emblem\.png"/g, to: '"./diyal_emblem.png"' },
  { from: /'\/diyal_emblem\.png'/g, to: "'./diyal_emblem.png'" }
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let changed = false;
      for (const t of targets) {
        if (t.from.test(content)) {
          content = content.replace(t.from, t.to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log('Updated:', fullPath);
      }
    }
  }
}

processDir(srcDir);
console.log('Done converting asset paths to relative ./');
