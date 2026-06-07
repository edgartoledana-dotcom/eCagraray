const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'src', 'routes', 'index.tsx');
let c = fs.readFileSync(filePath, 'utf8');
c = c.replace(/\r\n/g, '\n');
let changes = 0;

// Fix officials card to enhance captain and have hierarchy
// Find: the div with class containing "flex flex-col items-center text-center" after the officials section
// and replace the standard card with hierarchy-aware versions

// Enhanced captain card - replace the officials card rendering block
// Find the official card container that matches our template
const oldCaptainDiv = `flex flex-col items-center text-center">\n                    {(role === "captain") && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#0F4C81] via-[#2563EB] to-[#38BDF8]" />\n                    <div\n                      className={'h-24 w-24' rounded-2xl flex items-center justify-center font-display 'text-3xl' font-bold text-white shadow-lg transition-transform group-hover:scale-105"\n                      style={{\n                        background: \`linear-gradient(135deg, \${tone}, \${SECONDARY})\`,\n                      }}\n                    >`;

// The previous script left a broken partial replacement. Let me find the actual current state.
// Let's find a unique string near the officials cards and work from there.
const idx = c.indexOf('flex flex-col items-center text-center');
if (idx >= 0) {
  const context = c.substring(idx, idx + 300);
  console.log('Found context at idx', idx, ':', JSON.stringify(context.substring(0, 200)));
}

// Let's do a simpler replacement - just enhance the captain card styling
// by making the captain's image bigger and adding a badge
const oldBadge = `                      {roleLabels[role] || o.role}\n                    </p>\n                    {role === "captain" && (\n                      <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider border border-primary/20">\n                        Head Official\n                      </span>\n                    )}`;
// Check if this already exists from the partial replacement
if (c.includes(oldBadge)) {
  console.log('Captain badge already applied');
} else {
  // Try the original pattern
  const origBadge = `{roleLabels[role] || o.role}\n                    </p>`;
  const newBadgeWithCaptain = `{roleLabels[role] || o.role}\n                    </p>\n                    {(o.role || "").toLowerCase() === "captain" && (\n                      <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider border border-primary/20">\n                        Head Official\n                      </span>\n                    )}`;
  // Try to find the exact location
  const badgeIdx = c.indexOf(origBadge);
  if (badgeIdx >= 0) {
    const ctx = c.substring(badgeIdx, badgeIdx + 100);
    console.log('Found original badge pattern:', JSON.stringify(ctx));
  }
}

// Better approach: just find and fix the text directly
// Remove any broken partial replacements from previous script run
// Then do clean replacements

// Remove broken partial
const brokenPart = `flex flex-col items-center text-center">\n                    {(role === "captain") && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#0F4C81] via-[#2563EB] to-[#38BDF8]" />\n                    <div\n                      className={'h-24 w-24' rounded-2xl flex items-center justify-center font-display 'text-3xl' font-bold text-white shadow-lg transition-transform group-hover:scale-105"`;
const cleanPart = `flex flex-col items-center text-center">\n                    <div\n                      className="h-20 w-20 rounded-2xl flex items-center justify-center font-display text-2xl font-bold text-white shadow-lg transition-transform group-hover:scale-105"`;
if (c.includes(brokenPart)) {
  c = c.replace(brokenPart, cleanPart);
  changes++;
  console.log('Fixed broken captain card template');
}

// Now apply clean enhancements:
// 1. Make captain card bigger with banner
const oldCardContent = `flex flex-col items-center text-center">
                    <div
                      className="h-20 w-20 rounded-2xl flex items-center justify-center font-display text-2xl font-bold text-white shadow-lg transition-transform group-hover:scale-105"
                      style={{
                        background: \`linear-gradient(135deg, \${tone}, \${SECONDARY})\`,
                      }}
                    >
                      {initials(o.name) || "?"}
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                      {o.name}
                    </h3>
                    <p
                      className="mt-1 text-xs font-bold uppercase tracking-wider"
                      style={{ color: tone }}
                    >
                      {roleLabels[role] || o.role}
                    </p>`;

// Enhanced version that checks role
const newCardContent = `flex flex-col items-center text-center">
                    {(o.role || "").toLowerCase() === "captain" && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#0F4C81] via-[#2563EB] to-[#38BDF8]" />}
                    <div
                      className={(o.role || "").toLowerCase() === "captain" ? "h-24 w-24" : "h-20 w-20"} rounded-2xl flex items-center justify-center font-display {(o.role || "").toLowerCase() === "captain" ? "text-3xl" : "text-2xl"} font-bold text-white shadow-lg transition-transform group-hover:scale-105"
                      style={{
                        background: \`linear-gradient(135deg, \${tone}, \${SECONDARY})\`,
                      }}
                    >
                      {initials(o.name) || "?"}
                    </div>
                    {(o.role || "").toLowerCase() === "captain" && (
                      <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                        Punong Barangay
                      </span>
                    )}
                    <h3 className={"mt-2 font-display " + ((o.role || "").toLowerCase() === "captain" ? "text-xl" : "text-lg") + " font-bold text-foreground"}>
                      {o.name}
                    </h3>
                    <p
                      className="mt-1 text-xs font-bold uppercase tracking-wider"
                      style={{ color: tone }}
                    >
                      {roleLabels[role] || o.role}
                    </p>`;

if (c.includes(oldCardContent)) {
  c = c.replace(oldCardContent, newCardContent);
  changes++;
  console.log('Applied enhanced captain card with hierarchy');
} else {
  console.log('Card content NOT matched - trying alternate');
  // Check what the file actually looks like at the officials section
  const officialsIdx = c.indexOf('Leadership');
  if (officialsIdx >= 0) {
    const afterOfficials = c.substring(officialsIdx + 200, officialsIdx + 1000);
    console.log('Officials section excerpt:', JSON.stringify(afterOfficials.substring(0, 400)));
  }
}

// Write back
const output = c.split('\n').join('\r\n');
fs.writeFileSync(filePath, output, 'utf8');
console.log('\n=== DONE: ' + changes + ' changes ===');
