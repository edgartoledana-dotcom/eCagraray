const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'src', 'routes', 'index.tsx');
let c = fs.readFileSync(filePath, 'utf8');
c = c.replace(/\r\n/g, '\n');
let changes = 0;

// === 1. Replace Stats function signature and body ===
const oldStats = `function Stats({
  total,
  households,
  volunteers,
  projects,
}: {
  total: number;
  households: number;
  volunteers: number;
  projects: number;
}) {
  const { ref, inView } = useInViewTrigger<HTMLDivElement>();
  const t1 = useCountUp(total, 1800, inView);
  const t2 = useCountUp(households, 1800, inView);
  const t3 = useCountUp(volunteers, 1800, inView);
  const t4 = useCountUp(projects, 1800, inView);

  const items = [
    { n: t1, suffix: "+", label: "Registered Residents", icon: Users, color: SECONDARY },
    { n: t2, suffix: "+", label: "Households", icon: Home, color: ACCENT },
    { n: t3, suffix: "+", label: "Active Volunteers", icon: HeartHandshake, color: SUCCESS },
    { n: t4, suffix: "+", label: "Community Projects", icon: Award, color: WARNING },
  ];`;

const newStats = `function Stats({
  documentsIssued,
  announcements,
  communityEvents,
  communityProjects,
}: {
  documentsIssued: number;
  announcements: number;
  communityEvents: number;
  communityProjects: number;
}) {
  const { ref, inView } = useInViewTrigger<HTMLDivElement>();
  const t1 = useCountUp(documentsIssued, 1800, inView);
  const t2 = useCountUp(announcements, 1800, inView);
  const t3 = useCountUp(communityEvents, 1800, inView);
  const t4 = useCountUp(communityProjects, 1800, inView);

  const items = [
    { n: t1, suffix: "+", label: "Documents Issued", icon: FileText, color: SECONDARY },
    { n: t2, suffix: "", label: "Active Announcements", icon: Megaphone, color: ACCENT },
    { n: t3, suffix: "", label: "Community Events", icon: Calendar, color: SUCCESS },
    { n: t4, suffix: "+", label: "Community Projects", icon: Award, color: WARNING },
  ];`;

if (c.includes(oldStats)) {
  c = c.replace(oldStats, newStats);
  changes++;
  console.log('1. Updated Stats function for milestone metrics');
} else console.log('1. Stats function NOT matched');

// === 2. Update call site ===
const oldCallSite = `        <Stats
          total={stats.residents || 0}
          households={stats.households || 0}
          volunteers={stats.volunteers || 0}
          projects={projects}
        />`;

// Compute documentsIssued in the parent scope
const newCallSite = `        <Stats
          documentsIssued={documentsIssued}
          announcements={(announcements || []).length}
          communityEvents={(events || []).length}
          communityProjects={projects}
        />`;

if (c.includes(oldCallSite)) {
  c = c.replace(oldCallSite, newCallSite);
  changes++;
  console.log('2. Updated Stats call site');
} else console.log('2. Stats call site NOT matched');

// === 3. Add documentsIssued to the return object in the loader ===
// Find where the return object is constructed and add documentsIssued
const oldReturn = `      officials: (officials || []) as any[],
      projects: Math.max(45, projectCount, stats.events || 0),
    };`;

const newReturn = `      officials: (officials || []) as any[],
      projects: Math.max(45, projectCount, stats.events || 0),
      documentsIssued: (documents || []).filter((d: any) => d.status === "approved" || d.status === "completed").length,
    };`;

if (c.includes(oldReturn)) {
  c = c.replace(oldReturn, newReturn);
  changes++;
  console.log('3. Added documentsIssued to loader return');
} else console.log('3. Loader return NOT matched');

// === 4. Add destructuring for documentsIssued in the component ===
// Find the destructuring of the loader data
const oldDestructure = /const\s*\{[^}]*projects[^}]*\}\s*=\s*state\s*\|\|\s*\{[^}]*projects:\s*0[^}]*\};/;
const match = c.match(oldDestructure);
if (match) {
  console.log('Found destructure:', match[0].substring(0, 80) + '...');
}

// Look for where the state is destructured
const destructureIdx = c.indexOf('} = state || {');
if (destructureIdx >= 0) {
  const before = c.lastIndexOf('const {', destructureIdx);
  if (before >= 0) {
    const destructureLine = c.substring(before, destructureIdx + 20);
    console.log('Found destructure:', destructureLine.substring(0, 200));
  }
}

// Let's look at the Landing component to find the destructure
const landingIdx = c.indexOf('function Landing(');
if (landingIdx >= 0) {
  // Find the destructuring of state
  const stateIdx = c.indexOf('} = state', landingIdx);
  if (stateIdx >= 0) {
    const startIdx = c.lastIndexOf('const {', stateIdx);
    if (startIdx >= 0 && startIdx > landingIdx) {
      const fullDestructure = c.substring(startIdx, stateIdx + 10);
      console.log('Landing component destructure:', fullDestructure.substring(0, 300));
    }
  }
}

fs.writeFileSync(filePath, c.split('\n').join('\r\n'), 'utf8');
console.log('\n=== DONE: ' + changes + ' changes ===');
