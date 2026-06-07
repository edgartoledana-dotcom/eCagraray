const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'src', 'routes', 'index.tsx');
let c = fs.readFileSync(filePath, 'utf8');
c = c.replace(/\r\n/g, '\n');
let changes = 0;

const oldSubtitle = 'Real-time data from the E-Cagraray platform.';
const newSubtitle = 'Milestones achieved on the E-Cagraray platform.';
if (c.includes(oldSubtitle)) {
  c = c.replace(oldSubtitle, newSubtitle);
  changes++;
  console.log('Updated subtitle');
}

const oldLabel2 = 'label: "Active Announcements", icon: Megaphone, color: ACCENT }';
const newLabel2 = 'label: "Updates Published", icon: Megaphone, color: ACCENT }';
if (c.includes(oldLabel2)) {
  c = c.replace(oldLabel2, newLabel2);
  changes++;
  console.log('Updated Announcements label');
}

const oldLabel3 = 'label: "Community Events", icon: Calendar, color: SUCCESS }';
const newLabel3 = 'label: "Events Hosted", icon: Calendar, color: SUCCESS }';
if (c.includes(oldLabel3)) {
  c = c.replace(oldLabel3, newLabel3);
  changes++;
  console.log('Updated Events label');
}

fs.writeFileSync(filePath, c.split('\n').join('\r\n'), 'utf8');
console.log('Done: ' + changes + ' changes');
