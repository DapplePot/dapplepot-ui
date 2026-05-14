import { readFileSync, writeFileSync } from 'fs'

const src  = readFileSync('src/pages/AgentConfig.tsx', 'utf8')
const repl = readFileSync('scripts/profile-tab-replacement.tsx', 'utf8')

const startMarker = 'function AgentProfileTab({ agentId, isAdmin }: { agentId: string; isAdmin: boolean }) {'
const endMarker   = '// ─── Main page ────────────────────────────────────────────────────────────────'

const startIdx = src.indexOf(startMarker)
const endIdx   = src.indexOf(endMarker)

if (startIdx === -1 || endIdx === -1) {
  console.error('markers not found', startIdx, endIdx)
  process.exit(1)
}

const result = src.slice(0, startIdx) + repl + '\n' + src.slice(endIdx)
writeFileSync('src/pages/AgentConfig.tsx', result)
console.log('done, length:', result.length)
