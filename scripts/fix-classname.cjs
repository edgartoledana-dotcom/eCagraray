const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'src', 'routes', 'index.tsx');
let c = fs.readFileSync(filePath, 'utf8');
c = c.replace(/\r\n/g, '\n');

// Find the broken className
const broken = 'className={(o.role || "").toLowerCase() === "captain" ? "h-24 w-24" : "h-20 w-20"} rounded-2xl flex items-center justify-center font-display {(o.role || "").toLowerCase() === "captain" ? "text-3xl" : "text-2xl"} font-bold text-white shadow-lg transition-transform group-hover:scale-105"';

const fixed = 'className={`${(o.role || "").toLowerCase() === "captain" ? "h-24 w-24" : "h-20 w-20"} rounded-2xl flex items-center justify-center font-display ${(o.role || "").toLowerCase() === "captain" ? "text-3xl" : "text-2xl"} font-bold text-white shadow-lg transition-transform group-hover:scale-105`}';

if (c.includes(broken)) {
  c = c.replace(broken, fixed);
  console.log('Fixed broken className');
} else {
  console.log('Broken className NOT found - trying alternate matching');
  // Try partial matching
  if (c.includes('{(o.role || "").toLowerCase() === "captain" ? "h-24 w-24" : "h-20 w-20"} rounded-2xl')) {
    console.log('Found partial match');
  }
}

fs.writeFileSync(filePath, c.split('\n').join('\r\n'), 'utf8');
console.log('Done');
