function AgentProfileTab({ agentId, isAdmin }: { agentId: string; isAdmin: boolean }) {
  const { data: alertConfig } = useAlertConfig(agentId)
  const { data: baseline }    = useToolCallBaseline(agentId)
  const updateManifest  = useUpdateToolManifest(agentId)
  const updateMaxCalls  = useUpdateMaxToolCalls(agentId)
  const updateProfile   = useUpdateAgentProfile(agentId)

  const [manifestInput, setManifestInput] = useState('')
  const [maxCallsDraft, setMaxCallsDraft] = useState('')

  const manifest: string[] = Array.isArray(alertConfig?.tool_manifest) ? alertConfig!.tool_manifest : []

  function addToManifest() {
    const t = manifestInput.trim().replace(/,$/, '')
    if (!t || manifest.includes(t)) return
    updateManifest.mutate([...manifest, t])
    setManifestInput('')
  }

  function commitMaxCalls() {
    const n = parseInt(maxCallsDraft, 10)
    if (!isNaN(n) && n >= 1) { updateMaxCalls.mutate(n); setMaxCallsDraft('') }
  }

  const hasBaseline = baseline && baseline.sessionCount >= 2 && baseline.mean != null

  const [systemPromptDraft, setSystemPromptDraft] = useState('')
  const [workingDirDraft,   setWorkingDirDraft]   = useState('')
  const [writeNSDraft,      setWriteNSDraft]      = useState('')

  const [activeDays, setActiveDays] = useState<string[]>(['Mon','Tue','Wed','Thu','Fri'])
  const [hoursFrom,  setHoursFrom]  = useState('09:00')
  const [hoursTo,    setHoursTo]    = useState('18:00')

  useEffect(() => {
    if (!alertConfig) return
    if (alertConfig.system_prompt != null)     setSystemPromptDraft(alertConfig.system_prompt)
    if (alertConfig.working_directory != null) setWorkingDirDraft(alertConfig.working_directory)
    if (alertConfig.write_namespace != null)   setWriteNSDraft(alertConfig.write_namespace)
    if (alertConfig.operating_hours != null) {
      setActiveDays(alertConfig.operating_hours.days)
      setHoursFrom(alertConfig.operating_hours.from)
      setHoursTo(alertConfig.operating_hours.to)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertConfig?.system_prompt, alertConfig?.working_directory,
      alertConfig?.write_namespace, alertConfig?.operating_hours])

  const irreversible = alertConfig?.irreversible_tools ?? []
  const networkAllow = alertConfig?.network_allowlist  ?? []
  const sbom         = alertConfig?.sbom_allowlist     ?? []
  const mcpEndpoints = alertConfig?.mcp_endpoints      ?? []

  const tagColor  = 'border-violet-200 bg-white text-violet-700 dark:border-violet-800 dark:bg-zinc-800 dark:text-violet-400'
  const hostColor = 'border-blue-200 bg-white text-blue-700 dark:border-blue-800 dark:bg-zinc-800 dark:text-blue-400'
  const pkgColor  = 'border-teal-200 bg-white text-teal-700 dark:border-teal-800 dark:bg-zinc-800 dark:text-teal-400'
  const mcpColor  = 'border-slate-200 bg-white text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'

  return (
    <div className="space-y-4">
      {!isAdmin ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800">
          <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            View only — contact your tenant admin to modify agent profile settings.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-800 dark:bg-violet-900/20">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
          <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
            Declare what is <strong>normal</strong> for this agent. Fields marked{' '}
            <span className="rounded border border-amber-200 bg-amber-50 px-1 py-px text-[9px] font-medium text-amber-600 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">blind</span>
            {' '}cannot fire without a declared value.
            Fields marked{' '}
            <span className="rounded border border-slate-200 bg-white px-1 py-px text-[9px] font-medium text-slate-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">auto</span>
            {' '}use a heuristic — click <strong>how?</strong> to understand it.
            Once you declare a value it turns{' '}
            <span className="rounded border border-emerald-200 bg-emerald-50 px-1 py-px text-[9px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">manual</span>
            {' '}and the heuristic is bypassed. Use <strong>reset</strong> to revert.
          </p>
        </div>
      )}

      {/* ════════ SECTION 1 — Agent Identity ════════ */}
      <ProfileSection title="Agent Identity" icon={<Settings className="h-3.5 w-3.5" />}>

        <ProfileRow
          id="profile-system-prompt"
          label="System prompt"
          subChecks={['SPL-01a', 'SPL-01b', 'EA-02c']}
          tooltip="Paste the agent's exact system prompt. Without it SPL-01a, SPL-01b, and EA-02c cannot run."
          status={alertConfig?.system_prompt != null ? 'manual' : 'blind'}
          autoDesc="No system prompt declared — SPL-01a, SPL-01b, and EA-02c are blind. These checks cannot run without it."
          manualDesc={`System prompt declared (${alertConfig?.system_prompt?.length ?? 0} chars) — SPL-01a verbatim match, SPL-01b probe detection, and EA-02c self-modification diff are active.`}
          how="SPL-01a uses SequenceMatcher to detect verbatim segments of the declared prompt in LLM output. SPL-01b checks if the agent confirms its instructions when probed. EA-02c diffs the declared prompt against subsequent system messages to detect self-modification."
          onReset={() => { updateProfile.mutate({ system_prompt: null }); setSystemPromptDraft('') }}
        >
          {isAdmin && (
            <div className="space-y-2">
              <textarea
                rows={4}
                value={systemPromptDraft}
                onChange={e => setSystemPromptDraft(e.target.value)}
                placeholder="Paste the agent's system prompt here…"
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder-zinc-500 resize-none font-mono leading-relaxed"
              />
              <button type="button"
                onClick={() => updateProfile.mutate({ system_prompt: systemPromptDraft || null })}
                className="rounded border border-violet-200 bg-white px-2.5 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-50 transition-colors dark:border-violet-800 dark:bg-zinc-800 dark:text-violet-400 dark:hover:bg-violet-900/30">
                Save
              </button>
            </div>
          )}
        </ProfileRow>

        <ProfileRow
          id="profile-environment"
          label="Environment"
          subChecks={['TME-03b']}
          tooltip="Is this agent running in production or staging? Declaring 'production' suppresses TME-03b. Without a declaration the URL-pattern heuristic treats it as staging."
          status={alertConfig?.environment != null ? 'manual' : 'auto'}
          autoDesc="Assumed staging — URL pattern heuristic active. TME-03b fires if any tool call URL matches production patterns."
          manualDesc={alertConfig?.environment === 'production'
            ? 'Set to production — TME-03b suppressed (production agents hitting production URLs is expected).'
            : 'Set to staging — TME-03b active, any production-pattern URL fires.'}
          how="We match tool call URL parameters against regex patterns. Declaring 'production' suppresses TME-03b entirely for this agent."
          howPatterns={['prod\\.', 'production\\.', 'live\\.', '/api/v\\d+/']}
          onReset={() => updateProfile.mutate({ environment: null })}
        >
          {isAdmin && (
            <div className="flex gap-2">
              {(['staging', 'production'] as const).map(env => (
                <button key={env} type="button"
                  onClick={() => updateProfile.mutate({ environment: env })}
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors capitalize ${
                    alertConfig?.environment === env
                      ? env === 'production'
                        ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                  }`}
                >{env}</button>
              ))}
            </div>
          )}
        </ProfileRow>
      </ProfileSection>

      {/* ════════ SECTION 2 — Tool Scope ════════ */}
      <ProfileSection title="Tool Scope" icon={<Shield className="h-3.5 w-3.5" />}>

        <ProfileRow
          id="profile-tool-manifest"
          label="Tool manifest"
          subChecks={['EA-01a']}
          tooltip="Declare which tool names this agent is allowed to call. When set, the SDK blocks any unlisted tool call in real time. Without a manifest, EA-01a never fires."
          status={manifest.length > 0 ? 'manual' : 'blind'}
          autoDesc="No tool manifest declared — EA-01a is blind. Any tool name is permitted."
          manualDesc={`${manifest.length} tool${manifest.length === 1 ? '' : 's'} in manifest — EA-01a blocks unlisted tool calls in real time.`}
          how="EA-01a runs online in the SDK. When a tool name not in the declared manifest is invoked, the call is blocked immediately without waiting for session end."
          onReset={() => updateManifest.mutate([])}
        >
          {isAdmin && (
            <>
              <TagList
                tags={manifest}
                onRemove={t => updateManifest.mutate(manifest.filter(x => x !== t))}
                readOnly={false}
                emptyText="No tools declared — add tool names to enable EA-01a"
                colorClass={tagColor}
              />
              <div className="flex gap-2 mt-2">
                <input type="text" value={manifestInput}
                  onChange={e => setManifestInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addToManifest() } }}
                  placeholder="e.g. read_file, search_web …"
                  className="w-52 rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder-zinc-500"
                />
                <button type="button" onClick={addToManifest}
                  className="rounded border border-violet-200 bg-white px-2.5 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-50 transition-colors dark:border-violet-800 dark:bg-zinc-800 dark:text-violet-400 dark:hover:bg-violet-900/30">
                  Add
                </button>
              </div>
            </>
          )}
        </ProfileRow>

        <ProfileRow
          id="profile-max-tool-calls"
          label="Max tool calls per session"
          subChecks={['EA-02b']}
          tooltip="Set a hard cap on total tool calls per session. Without a manual cap, EA-02b uses statistical anomaly detection on the 7-day baseline."
          status={alertConfig?.max_tool_calls_per_session != null ? 'manual' : 'auto'}
          autoDesc={hasBaseline
            ? `Statistical baseline: ~${Math.round(baseline!.mean!)} calls/session (7-day mean, ${baseline!.sessionCount} sessions) — EA-02b fires when a session exceeds mean + 1σ.`
            : 'Statistical baseline warming up — need ≥2 sessions in the last 7 days for EA-02b to be active.'}
          manualDesc={`Hard cap: ${alertConfig?.max_tool_calls_per_session} calls/session — EA-02b fires immediately when exceeded.`}
          how="We compute a 7-day rolling mean and standard deviation of tool_start event counts per session. When the current session's count exceeds mean + 1σ, EA-02b fires. A manual cap provides a hard ceiling independent of the baseline."
          onReset={() => updateMaxCalls.mutate(null)}
        >
          {isAdmin && (
            <div className="flex items-center gap-3">
              <input type="number" min={1} value={maxCallsDraft}
                onChange={e => setMaxCallsDraft(e.target.value)}
                onBlur={commitMaxCalls}
                onKeyDown={e => { if (e.key === 'Enter') commitMaxCalls() }}
                placeholder={alertConfig?.max_tool_calls_per_session != null
                  ? String(alertConfig.max_tool_calls_per_session)
                  : 'Set hard cap…'}
                className="w-44 rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 placeholder-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder-zinc-500"
              />
            </div>
          )}
        </ProfileRow>

        <ProfileRow
          id="profile-irreversible-tools"
          label="Irreversible / destructive tools"
          subChecks={['EA-02a', 'TME-03a']}
          tooltip="Which of this agent's tools perform actions that cannot be undone? EA-02a fires when one is called without a confirm-gate event. Without a declaration, a name-pattern heuristic is used."
          status={alertConfig?.irreversible_tools != null ? 'manual' : 'auto'}
          autoDesc="Name-pattern heuristic active — EA-02a and TME-03a flag tools matching write/delete/send/deploy patterns."
          manualDesc={`${irreversible.length} tool${irreversible.length === 1 ? '' : 's'} declared — EA-02a and TME-03a use this exact list (heuristic patterns bypassed).`}
          how="Two regex patterns are applied to every tool_start event tool name. Declaring an explicit list narrows detection to only tools you consider irreversible, reducing false positives."
          howPatterns={['write|create|insert|update|delete|remove|send|post|put|patch|drop|exec', 'payment|charge|transfer|purchase|deploy|publish']}
          onReset={() => updateProfile.mutate({ irreversible_tools: null })}
        >
          {isAdmin && (
            <>
              <TagList
                tags={irreversible}
                onRemove={t => updateProfile.mutate({ irreversible_tools: irreversible.filter(x => x !== t) })}
                readOnly={false}
                emptyText="No tools declared — heuristic patterns active"
                colorClass="border-red-200 bg-white text-red-700 dark:border-red-800 dark:bg-zinc-800 dark:text-red-400"
              />
              <InlineTagInput
                onAdd={t => { if (!irreversible.includes(t)) updateProfile.mutate({ irreversible_tools: [...irreversible, t] }) }}
                placeholder="e.g. delete_record, send_email …"
              />
            </>
          )}
        </ProfileRow>
      </ProfileSection>

      {/* ════════ SECTION 3 — Network & Filesystem ════════ */}
      <ProfileSection title="Network & Filesystem" icon={<Globe className="h-3.5 w-3.5" />}>

        <ProfileRow
          id="profile-network-allowlist"
          label="Network allowlist"
          subChecks={['EA-03b']}
          tooltip="Which hosts is this agent allowed to contact? EA-03b fires on any tool call targeting a host not on this list. Without a list, EA-03b cannot fire."
          status={alertConfig?.network_allowlist != null ? 'manual' : 'blind'}
          autoDesc="No host allowlist declared — EA-03b is blind. All outbound hosts are implicitly permitted."
          manualDesc={`${networkAllow.length} host${networkAllow.length === 1 ? '' : 's'} in allowlist — EA-03b active, any unlisted outbound host fires.`}
          how="EA-03b requires an explicit allowlist. Without one, every outbound call is implicitly allowed and the check produces no findings. Declaring a list is the only way to enable host-based egress control."
          onReset={() => updateProfile.mutate({ network_allowlist: null })}
        >
          {isAdmin && (
            <>
              <TagList
                tags={networkAllow}
                onRemove={t => updateProfile.mutate({ network_allowlist: networkAllow.filter(x => x !== t) })}
                readOnly={false}
                emptyText="Add hosts to enable egress control"
                colorClass={hostColor}
              />
              <InlineTagInput
                onAdd={t => { if (!networkAllow.includes(t)) updateProfile.mutate({ network_allowlist: [...networkAllow, t] }) }}
                placeholder="e.g. api.openai.com, *.internal.example.com …"
              />
            </>
          )}
        </ProfileRow>

        <ProfileRow
          id="profile-working-directory"
          label="Working directory"
          subChecks={['EA-03a']}
          tooltip="Declare the filesystem path the agent should stay within. EA-03a fires when file-read tool calls reference paths outside this prefix. Without it, EA-03a cannot fire."
          status={alertConfig?.working_directory != null ? 'manual' : 'blind'}
          autoDesc="No working directory declared — EA-03a is blind. File-read paths cannot be validated."
          manualDesc={`Boundary set to ${alertConfig?.working_directory} — EA-03a fires on any file-read outside this path.`}
          how="EA-03a checks every file-read tool call's path argument against the declared prefix. There is no heuristic fallback — without a declared directory, the check produces no findings."
          onReset={() => { updateProfile.mutate({ working_directory: null }); setWorkingDirDraft('') }}
        >
          {isAdmin && (
            <div className="flex items-center gap-2">
              <input type="text" value={workingDirDraft}
                onChange={e => setWorkingDirDraft(e.target.value)}
                onBlur={() => updateProfile.mutate({ working_directory: workingDirDraft || null })}
                onKeyDown={e => { if (e.key === 'Enter') updateProfile.mutate({ working_directory: workingDirDraft || null }) }}
                placeholder="e.g. /app/workspace"
                className="w-72 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-mono text-slate-700 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder-zinc-500"
              />
              {alertConfig?.working_directory && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Saved</span>
              )}
            </div>
          )}
        </ProfileRow>

        <ProfileRow
          id="profile-write-namespace"
          label="Write namespace"
          subChecks={['EA-01c']}
          tooltip="Declare the path or namespace prefix this agent is permitted to write to. EA-01c fires when write calls target outside it. Without a declaration, a read-intent heuristic is used."
          status={alertConfig?.write_namespace != null ? 'manual' : 'auto'}
          autoDesc="Read-intent heuristic active — EA-01c fires when a session's opening prompt signals read-intent but a write-named tool is called."
          manualDesc={`Write namespace declared (${alertConfig?.write_namespace}) — EA-01c uses this boundary (heuristic bypassed).`}
          how="We check the session's initial_input against a read-intent regex. If it matches AND a write-named tool is subsequently called, EA-01c fires. Declaring a namespace lets the scorer be more precise."
          howPatterns={['show|list|get|find|search|lookup|read|view|fetch|retrieve  (read intent)', 'write|create|insert|update|delete|remove|send|post|put|patch|drop|exec  (write tools)']}
          onReset={() => { updateProfile.mutate({ write_namespace: null }); setWriteNSDraft('') }}
        >
          {isAdmin && (
            <div className="flex items-center gap-2">
              <input type="text" value={writeNSDraft}
                onChange={e => setWriteNSDraft(e.target.value)}
                onBlur={() => updateProfile.mutate({ write_namespace: writeNSDraft || null })}
                onKeyDown={e => { if (e.key === 'Enter') updateProfile.mutate({ write_namespace: writeNSDraft || null }) }}
                placeholder="e.g. /app/output or s3://my-bucket/agent/"
                className="w-80 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-mono text-slate-700 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder-zinc-500"
              />
              {alertConfig?.write_namespace && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Saved</span>
              )}
            </div>
          )}
        </ProfileRow>
      </ProfileSection>

      {/* ════════ SECTION 4 — Operating Schedule ════════ */}
      <ProfileSection title="Operating Schedule" icon={<Clock className="h-3.5 w-3.5" />}>
        <ProfileRow
          id="profile-operating-hours"
          label="Operating hours"
          subChecks={['RA-01b']}
          tooltip="Declare the days and UTC time window when this agent should be active. Sessions starting outside this window fire RA-01b. Without a schedule, RA-01b cannot fire."
          status={alertConfig?.operating_hours != null ? 'manual' : 'blind'}
          autoDesc="No schedule declared — RA-01b is blind. The agent is assumed to be active 24/7."
          manualDesc={`Schedule: ${activeDays.join(', ')} · ${hoursFrom}–${hoursTo} UTC — RA-01b fires on sessions starting outside this window.`}
          how="RA-01b requires a declared operating window to compare session start times against. Without one, every session start time is implicitly within-schedule and the check produces no findings."
          onReset={() => updateProfile.mutate({ operating_hours: null })}
        >
          {isAdmin && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map(day => (
                  <button key={day} type="button"
                    onClick={() => setActiveDays(
                      activeDays.includes(day) ? activeDays.filter(d => d !== day) : [...activeDays, day]
                    )}
                    className={`rounded border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer hover:opacity-80 ${
                      activeDays.includes(day)
                        ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400'
                        : 'border-slate-200 bg-white text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500'
                    }`}
                  >{day}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-zinc-400">
                <span className="text-slate-400">From</span>
                <input type="time" value={hoursFrom} onChange={e => setHoursFrom(e.target.value)}
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" />
                <span className="text-slate-400">to</span>
                <input type="time" value={hoursTo} onChange={e => setHoursTo(e.target.value)}
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" />
                <span className="text-slate-400">(UTC)</span>
              </div>
              <button type="button"
                onClick={() => updateProfile.mutate({ operating_hours: { days: activeDays, from: hoursFrom, to: hoursTo } })}
                className="rounded border border-violet-200 bg-white px-2.5 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-50 transition-colors dark:border-violet-800 dark:bg-zinc-800 dark:text-violet-400 dark:hover:bg-violet-900/30">
                Save schedule
              </button>
            </div>
          )}
        </ProfileRow>
      </ProfileSection>

      {/* ════════ SECTION 5 — Supply Chain ════════ */}
      <ProfileSection title="Supply Chain" icon={<Package className="h-3.5 w-3.5" />}>

        <ProfileRow
          id="profile-sbom"
          label="Approved packages (SBOM)"
          subChecks={['ASCV-02b', 'ASCV-04a']}
          tooltip="List the package names this agent is allowed to install. ASCV-04a fires on any install command. ASCV-02b additionally fires when the package is not on your declared SBOM."
          status={alertConfig?.sbom_allowlist != null ? 'manual' : 'auto'}
          autoDesc="No SBOM declared — ASCV-04a fires on every package install command; ASCV-02b (unknown package check) is blind without a declared allowlist."
          manualDesc={`${sbom.length} approved package${sbom.length === 1 ? '' : 's'} declared — ASCV-02b active for unlisted packages; ASCV-04a still fires on all installs.`}
          how="We scan tool_start event inputs for install commands. Any match fires ASCV-04a unconditionally. ASCV-02b additionally fires when the installed package is NOT in your declared SBOM."
          howPatterns={['pip install', 'npm install', 'yarn add', 'gem install', 'cargo install']}
          onReset={() => updateProfile.mutate({ sbom_allowlist: null })}
        >
          {isAdmin && (
            <>
              <TagList
                tags={sbom}
                onRemove={t => updateProfile.mutate({ sbom_allowlist: sbom.filter(x => x !== t) })}
                readOnly={false}
                emptyText="No approved packages — ASCV-04a fires on all installs"
                colorClass={pkgColor}
              />
              <InlineTagInput
                onAdd={t => { if (!sbom.includes(t)) updateProfile.mutate({ sbom_allowlist: [...sbom, t] }) }}
                placeholder="e.g. requests, langchain, numpy …"
              />
            </>
          )}
        </ProfileRow>

        <ProfileRow
          id="profile-mcp-endpoints"
          label="Declared MCP server endpoints"
          subChecks={['ASCV-01a', 'ASCV-01b', 'ASCV-01c']}
          tooltip="Register the MCP server URLs this agent is authorised to connect to. Without a declaration, ASCV-01a, ASCV-01b, and ASCV-01c cannot fire."
          status={alertConfig?.mcp_endpoints != null ? 'manual' : 'blind'}
          autoDesc="No MCP endpoints declared — ASCV-01a, ASCV-01b, and ASCV-01c are blind."
          manualDesc={`${mcpEndpoints.length} endpoint${mcpEndpoints.length === 1 ? '' : 's'} registered — ASCV-01a URL anomaly, ASCV-01b TLS change, and ASCV-01c schema change detection are active.`}
          how="ASCV-01a fires when a tool call targets an MCP server URL not on the declared list. ASCV-01b fires when the TLS certificate fingerprint changes. ASCV-01c fires when the tool schema changes without a version bump."
          onReset={() => updateProfile.mutate({ mcp_endpoints: null })}
        >
          {isAdmin && (
            <>
              <TagList
                tags={mcpEndpoints}
                onRemove={t => updateProfile.mutate({ mcp_endpoints: mcpEndpoints.filter(x => x !== t) })}
                readOnly={false}
                emptyText="No endpoints declared — add at least one to enable detection"
                colorClass={mcpColor}
              />
              <InlineTagInput
                onAdd={t => { if (!mcpEndpoints.includes(t)) updateProfile.mutate({ mcp_endpoints: [...mcpEndpoints, t] }) }}
                placeholder="e.g. https://mcp.internal/tools …"
              />
            </>
          )}
        </ProfileRow>
      </ProfileSection>
    </div>
  )
}
