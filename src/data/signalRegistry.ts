/**
 * Static signal registry — mirrors dapplepot-security/scripts/seed_signal_registry.py
 * This is the canonical default configuration seeded into the signal_registry table.
 * All entries here are system defaults; users cannot disable them.
 */

export type DetectionPhase = 'online' | 'post_session' | 'cross_session' | 'both' | 'excluded'
export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type ConfidenceTier = 'deterministic' | 'high' | 'medium' | 'low' | 'skeletal'
export type Framework = 'LLM' | 'ASI'

export type OnlineAction = 'alert' | 'sanitize' | 'block_call' | 'terminate_session'

export interface SubCheck {
  subCheckId: string
  label: string
  phase: DetectionPhase
  score: number
  severity: Severity
  confidenceTier: ConfidenceTier
  excluded: boolean
  exclusionReason?: string
  /** Human-readable descriptions of the detection patterns used (online/both phase only) */
  matches?: string[]
  /**
   * Whether the SDK has an online implementation for this sub-check.
   * When true, the user can toggle it to run in real time instead of post-session.
   * Mirrors OnlineDetector.ONLINE_CAPABLE_SUB_CHECKS in langgraph-sdk.
   */
  onlineCapable?: boolean
  /**
   * Which online actions are valid for this sub-check.
   * - block_call is invalid for *_end event checks (call already completed).
   * - sanitize is invalid for structural/count checks (nothing to redact).
   * Omit to allow all four actions.
   */
  validActions?: OnlineAction[]
}

export interface SignalConfig {
  owaspSignalId: string
  name: string
  framework: Framework
  number: number
  description: string
  subChecks: SubCheck[]
}

export const SIGNAL_REGISTRY: SignalConfig[] = [
  // ─── LLM Framework ──────────────────────────────────────────────────────────

  {
    owaspSignalId: 'OW-LLM01',
    name: 'Prompt Injection',
    framework: 'LLM',
    number: 1,
    description: 'Attempts to override model instructions via user-supplied or retrieved content, including indirect injection through RAG, APIs, files, and multi-turn jailbreaks.',
    subChecks: [
      {
        subCheckId: 'PI-01a', label: 'Role-override phrase match', phase: 'online', score: 85,
        severity: 'high', confidenceTier: 'high', excluded: false, onlineCapable: true,
        validActions: ['alert', 'sanitize', 'block_call', 'terminate_session'],
        matches: [
          'ignore/disregard/forget … instructions',
          'you must/shall/will … do/execute/perform',
          'new instruction / new task / new directive',
          'override/bypass/circumvent … filter/restriction',
        ],
      },
      {
        subCheckId: 'PI-01b', label: 'Delimiter smuggling', phase: 'online', score: 90,
        severity: 'critical', confidenceTier: 'deterministic', excluded: false, onlineCapable: true,
        validActions: ['alert', 'sanitize', 'block_call', 'terminate_session'],
        matches: [
          '```system / ``` role-boundary sequences',
          '### System: / [SYS] / ---SYSTEM--- delimiters',
          'Role-boundary smuggling via turn separators',
        ],
      },
      {
        subCheckId: 'PI-01c', label: 'Encoded / obfuscated payload', phase: 'online', score: 75,
        severity: 'high', confidenceTier: 'high', excluded: false, onlineCapable: true,
        validActions: ['alert', 'sanitize', 'block_call', 'terminate_session'],
        matches: [
          'base64-wrapped instruction payloads',
          'URL-encoded injection sequences (%27, %3C…)',
        ],
      },
      {
        subCheckId: 'PI-02a', label: 'Web-fetched content with injection pattern', phase: 'online', score: 70,
        severity: 'high', confidenceTier: 'high', excluded: false, onlineCapable: true,
        validActions: ['alert', 'sanitize', 'terminate_session'],  // fires on tool_end — call already completed
        matches: [
          'ignore/override/bypass patterns in retrieved web content',
          'instruction-like phrases inside fetched documents',
        ],
      },
      {
        subCheckId: 'PI-02b', label: 'Retrieved doc causes goal-shift', phase: 'post_session', score: 95,
        severity: 'critical', confidenceTier: 'high', excluded: false,
      },
      {
        subCheckId: 'PI-02c', label: 'File / attachment payload injection', phase: 'online', score: 80,
        severity: 'high', confidenceTier: 'high', excluded: false,
        matches: [
          'directive patterns inside uploaded files / attachments',
          'injection sequences in parsed document content',
        ],
      },
      {
        subCheckId: 'PI-03a', label: 'API response carries directives', phase: 'online', score: 88,
        severity: 'high', confidenceTier: 'high', excluded: false,
        matches: [
          'instruction-like fragments in API response bodies',
          'role-override keywords in JSON / XML tool results',
        ],
      },
      {
        subCheckId: 'PI-03b', label: 'DB query result embeds prompt fragment', phase: 'online', score: 82,
        severity: 'high', confidenceTier: 'high', excluded: false,
        matches: [
          'prompt-like text found inside database query results',
          'injection keywords in row content returned to agent',
        ],
      },
      {
        subCheckId: 'PI-04a', label: 'Goal vector drift across ≥ 3 turns', phase: 'post_session', score: 65,
        severity: 'medium', confidenceTier: 'high', excluded: false,
      },
      {
        subCheckId: 'PI-04b', label: 'Jailbreak built incrementally', phase: 'post_session', score: 92,
        severity: 'critical', confidenceTier: 'high', excluded: false,
      },
      {
        subCheckId: 'PI-05a', label: 'Code injection pattern in prompt', phase: 'both', score: 80,
        severity: 'high', confidenceTier: 'high', excluded: false, onlineCapable: true,
        validActions: ['alert', 'sanitize', 'block_call', 'terminate_session'],
        matches: [
          'import os / import subprocess in prompt',
          '__import__() calls',
          'eval() / exec() blocks',
          'Python code inside user message',
        ],
      },
      {
        subCheckId: 'PI-06a', label: 'Payload splitting across messages', phase: 'post_session', score: 88,
        severity: 'high', confidenceTier: 'high', excluded: false,
      },
      {
        subCheckId: 'PI-07a', label: 'Multimodal content with injection signal', phase: 'both', score: 60,
        severity: 'medium', confidenceTier: 'low', excluded: false,
        matches: [
          'image metadata / alt-text containing directive patterns',
          'instruction text embedded in file attachments',
        ],
      },
      {
        subCheckId: 'PI-08a', label: 'Adversarial suffix (high-entropy tail)', phase: 'both', score: 75,
        severity: 'high', confidenceTier: 'medium', excluded: false, onlineCapable: true,
        validActions: ['alert', 'sanitize', 'block_call', 'terminate_session'],
        matches: [
          'Shannon entropy > 3.5 at prompt tail',
          'adversarial suffix token sequences',
        ],
      },
      {
        subCheckId: 'PI-09a', label: 'Obfuscated / encoded injection', phase: 'both', score: 82,
        severity: 'high', confidenceTier: 'high', excluded: false,
        matches: [
          'base64-decodable content containing injection phrases',
          'hex / ROT13 encoded payloads',
          'unicode homoglyph substitution (е→e, о→o …)',
        ],
      },
    ],
  },

  {
    owaspSignalId: 'OW-LLM02',
    name: 'Sensitive Information Disclosure',
    framework: 'LLM',
    number: 2,
    description: 'Secrets, PII, financial identifiers, health data, or cross-user context appearing in agent output or tool call parameters.',
    subChecks: [
      {
        subCheckId: 'SID-01a', label: 'API key / token pattern in output', phase: 'online', score: 95,
        severity: 'critical', confidenceTier: 'deterministic', excluded: false, onlineCapable: true,
        validActions: ['alert', 'sanitize', 'terminate_session'],  // fires on llm_end/tool_end — call already completed
        matches: [
          'sk-[a-zA-Z0-9]{32,}  (OpenAI / generic sk- key)',
          'ghp_[36 chars]  (GitHub personal token)',
          'AKIA[A-Z0-9]{16}  (AWS access key)',
          'Bearer [32+ chars]  (OAuth / API bearer)',
        ],
      },
      {
        subCheckId: 'SID-01b', label: 'Secret in tool call params', phase: 'post_session', score: 95,
        severity: 'critical', confidenceTier: 'deterministic', excluded: false,
        matches: [
          'secret / password / api_key / auth_token / access_key fields in tool call arguments',
          'sk-[a-zA-Z0-9]{32,} / ghp_[36] / AKIA[A-Z0-9]{16} / Bearer [32+] in tool input',
          'URL-embedded credentials (user:pass@host) in connection strings',
        ],
      },
      {
        subCheckId: 'SID-01c', label: 'JWT / session token in agent message', phase: 'online', score: 90,
        severity: 'critical', confidenceTier: 'deterministic', excluded: false, onlineCapable: true,
        validActions: ['alert', 'sanitize', 'terminate_session'],  // fires on llm_end/tool_end — call already completed
        matches: [
          'eyJ[…].eyJ[…].[…]  (JWT three-part token pattern)',
        ],
      },
      {
        subCheckId: 'SID-02a', label: 'Name + email + phone co-occurrence', phase: 'online', score: 75,
        severity: 'high', confidenceTier: 'deterministic', excluded: false, onlineCapable: true,
        validActions: ['alert', 'sanitize', 'terminate_session'],  // fires on llm_end/tool_end — call already completed
        matches: [
          '[user]@[domain].[tld]  (email address)',
          '+1 (XXX) XXX-XXXX  (phone number)',
          'Email + phone co-occurrence in same output block',
        ],
      },
      {
        subCheckId: 'SID-02b', label: 'Financial identifiers in output', phase: 'online', score: 90,
        severity: 'critical', confidenceTier: 'deterministic', excluded: false,
        matches: [
          '4[0-9]{12,15}  (Visa card)',
          '5[1-5][0-9]{14}  (Mastercard)',
          '3[47][0-9]{13}  (Amex)',
        ],
      },
      {
        subCheckId: 'SID-02c', label: 'Health / biometric data in output', phase: 'online', score: 95,
        severity: 'critical', confidenceTier: 'deterministic', excluded: false,
        matches: [
          'XXX-XX-XXXX  (US Social Security Number)',
          'biometric descriptor keywords in output',
        ],
      },
      {
        subCheckId: 'SID-03a', label: 'Cross-user context bleed', phase: 'cross_session', score: 95,
        severity: 'critical', confidenceTier: 'high', excluded: false,
      },
      {
        subCheckId: 'SID-03b', label: 'Error stack trace forwarded to user', phase: 'post_session', score: 60,
        severity: 'medium', confidenceTier: 'high', excluded: false,
      },
      {
        subCheckId: 'SID-04a', label: 'Output references data from different session', phase: 'cross_session', score: 92,
        severity: 'critical', confidenceTier: 'high', excluded: false,
      },
      {
        subCheckId: 'SID-04b', label: 'Shared memory returns cross-tenant record', phase: 'post_session', score: 92,
        severity: 'critical', confidenceTier: 'high', excluded: false,
      },
    ],
  },

  {
    owaspSignalId: 'OW-LLM03',
    name: 'Supply Chain',
    framework: 'LLM',
    number: 3,
    description: 'Model/plugin dependency risks. Not observable from the Kafka event stream or LangGraph telemetry — all sub-checks excluded.',
    subChecks: [
      {
        subCheckId: 'SC-EXCL', label: 'All LLM03 sub-checks excluded', phase: 'excluded', score: 0,
        severity: 'low', confidenceTier: 'high', excluded: true,
        exclusionReason: 'Not observable from Kafka event stream or LangGraph telemetry',
      },
    ],
  },

  {
    owaspSignalId: 'OW-LLM04',
    name: 'Data & Model Poisoning',
    framework: 'LLM',
    number: 4,
    description: 'Training or vector-store data tampering. Most sub-checks require offline pipeline audit and are excluded from runtime observation.',
    subChecks: [
      {
        subCheckId: 'DMP-01a', label: 'Vector store record count anomaly', phase: 'excluded', score: 60,
        severity: 'medium', confidenceTier: 'medium', excluded: true,
        exclusionReason: 'Pre-runtime; requires offline pipeline audit',
      },
      {
        subCheckId: 'DMP-01b', label: 'Retrieval cosine distance outlier', phase: 'post_session', score: 70,
        severity: 'high', confidenceTier: 'high', excluded: true,
        exclusionReason: 'Requires embedding model to log cosine distance in tool_end',
      },
      {
        subCheckId: 'DMP-01c', label: 'Ingested chunk contains instruction text', phase: 'excluded', score: 85,
        severity: 'high', confidenceTier: 'high', excluded: true,
        exclusionReason: 'Pre-runtime; requires offline data validation',
      },
      {
        subCheckId: 'DMP-02', label: 'Pre-training / weight poisoning', phase: 'excluded', score: 0,
        severity: 'low', confidenceTier: 'high', excluded: true,
        exclusionReason: 'Not detectable at inference time via event stream',
      },
    ],
  },

  {
    owaspSignalId: 'OW-LLM05',
    name: 'Improper Output Handling',
    framework: 'LLM',
    number: 5,
    description: 'Raw LLM output passed unsanitised to tools, shells, databases, or downstream agents without validation or escaping.',
    subChecks: [
      {
        subCheckId: 'IOH-01a', label: 'Shell command pattern in output', phase: 'online', score: 90,
        severity: 'critical', confidenceTier: 'deterministic', excluded: false, onlineCapable: true,
        validActions: ['alert', 'sanitize', 'terminate_session'],  // fires on llm_end/tool_end — call already completed
        matches: [
          'rm -rf …', 'curl … | (ba)sh', "python -c '…'",
          'eval(…)', 'exec(…)', 'os.system(…)', 'subprocess.*',
        ],
      },
      {
        subCheckId: 'IOH-01b', label: 'HTML / JS in output without escaping', phase: 'online', score: 85,
        severity: 'high', confidenceTier: 'deterministic', excluded: false,
        matches: ['<script …>', 'onerror=', 'javascript:'],
      },
      {
        subCheckId: 'IOH-01c', label: 'SQL fragment in output passed to DB', phase: 'online', score: 90,
        severity: 'critical', confidenceTier: 'deterministic', excluded: false,
        matches: [
          'SELECT/INSERT/UPDATE/DELETE … FROM/INTO/TABLE/WHERE  (SQLi pattern)',
          'UNION SELECT … (union injection)',
        ],
      },
      {
        subCheckId: 'IOH-02a', label: 'Raw LLM output as tool param', phase: 'online', score: 70,
        severity: 'high', confidenceTier: 'medium', excluded: false,
        matches: ['LLM output similarity ≥ 0.6 to downstream tool param (LCS ratio)'],
      },
      {
        subCheckId: 'IOH-03a', label: 'Email template injection in output', phase: 'both', score: 80,
        severity: 'high', confidenceTier: 'high', excluded: false,
        matches: [
          '<script / javascript: in email body',
          'suspicious href/src URLs in email content',
          '<!-- inject … --> hidden comment patterns',
        ],
      },
      {
        subCheckId: 'IOH-03b', label: 'Sub-agent receives broken structured output', phase: 'post_session', score: 65,
        severity: 'medium', confidenceTier: 'high', excluded: false,
        matches: [
          'sub-agent tool_end returns null or empty output',
          'sub-agent output has error status (status: error/failed, success: false)',
          'sub-agent returns error string (traceback, exception, timeout, connection refused)',
          'sub-agent output contains only error keys with no result/output/response key',
        ],
      },
      {
        subCheckId: 'IOH-04a', label: 'Insecure code pattern in generated output', phase: 'post_session', score: 70,
        severity: 'high', confidenceTier: 'medium', excluded: false,
      },
    ],
  },

  {
    owaspSignalId: 'OW-LLM06',
    name: 'Excessive Agency',
    framework: 'LLM',
    number: 6,
    description: 'Agent exceeds its authorised tool scope, requests elevated permissions, performs irreversible actions, or self-modifies its system prompt.',
    subChecks: [
      { subCheckId: 'EA-01a', label: 'Tool not in approved manifest invoked', phase: 'both', score: 80, severity: 'high', confidenceTier: 'deterministic', excluded: false, onlineCapable: true, validActions: ['alert', 'block_call', 'terminate_session'] },
      { subCheckId: 'EA-01b', label: 'Agent requests elevated permissions', phase: 'post_session', score: 90, severity: 'critical', confidenceTier: 'high', excluded: true, exclusionReason: 'Covered by IPA-01a (OW-ASI03 — Privilege Escalation)' },
      { subCheckId: 'EA-01c', label: 'Data written outside designated namespace', phase: 'post_session', score: 75, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'EA-02a', label: 'Irreversible action without confirm gate', phase: 'post_session', score: 85, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'EA-02b', label: 'Sub-agents spawned > fan-out limit', phase: 'both', score: 70, severity: 'high', confidenceTier: 'deterministic', excluded: false, onlineCapable: true, validActions: ['alert', 'block_call', 'terminate_session'] },
      { subCheckId: 'EA-02c', label: 'Agent self-modifies system prompt', phase: 'post_session', score: 98, severity: 'critical', confidenceTier: 'high', excluded: false },
      { subCheckId: 'EA-03a', label: 'Reads outside working directory', phase: 'post_session', score: 65, severity: 'medium', confidenceTier: 'high', excluded: false },
      { subCheckId: 'EA-03b', label: 'Network call to host not in allowlist', phase: 'post_session', score: 75, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'EA-04a', label: 'Undeclared LLM model used', phase: 'post_session', score: 70, severity: 'medium', confidenceTier: 'high', excluded: false },
    ],
  },

  {
    owaspSignalId: 'OW-LLM07',
    name: 'System Prompt Leakage',
    framework: 'LLM',
    number: 7,
    description: 'Agent reveals its system prompt verbatim, confirms it on probe, leaks persona/role names, or forwards it in inter-agent messages.',
    subChecks: [
      {
        subCheckId: 'SPL-01a', label: 'Verbatim system prompt segment in output', phase: 'online', score: 85,
        severity: 'high', confidenceTier: 'medium', excluded: false,
        matches: ['system prompt text similarity ≥ 0.85 to agent output (SequenceMatcher)'],
      },
      {
        subCheckId: 'SPL-01b', label: 'Agent confirms system prompt on probe', phase: 'online', score: 70,
        severity: 'high', confidenceTier: 'medium', excluded: false,
        matches: [
          '"yes, my instructions are…" / "my system prompt says…"',
          'affirmative response to direct system prompt query',
        ],
      },
      { subCheckId: 'SPL-02a', label: 'Reveals role name / persona name', phase: 'post_session', score: 50, severity: 'medium', confidenceTier: 'medium', excluded: false },
      { subCheckId: 'SPL-02b', label: 'Error message exposes instruction variables', phase: 'post_session', score: 60, severity: 'medium', confidenceTier: 'medium', excluded: false },
      { subCheckId: 'SPL-03a', label: 'System prompt in unprotected log', phase: 'post_session', score: 80, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'SPL-03b', label: 'System prompt forwarded in inter-agent message', phase: 'post_session', score: 88, severity: 'high', confidenceTier: 'medium', excluded: false },
    ],
  },

  {
    owaspSignalId: 'OW-LLM08',
    name: 'Vector & Embedding Weakness',
    framework: 'LLM',
    number: 8,
    description: 'RAG retrieval anomalies, vector namespace tampering, and embedding model mismatches. Several sub-checks require offline vector-DB telemetry.',
    subChecks: [
      {
        subCheckId: 'VEW-01a', label: 'Query retrieves semantically distant doc', phase: 'post_session', score: 60,
        severity: 'medium', confidenceTier: 'high', excluded: true,
        exclusionReason: 'Requires embedding distance logged in tool_end payload',
      },
      { subCheckId: 'VEW-01b', label: 'Repeated near-duplicate RAG queries', phase: 'post_session', score: 75, severity: 'high', confidenceTier: 'medium', excluded: false },
      { subCheckId: 'VEW-02a', label: 'Unauthorised write to vector namespace', phase: 'post_session', score: 92, severity: 'critical', confidenceTier: 'high', excluded: false },
      {
        subCheckId: 'VEW-02b', label: 'Record count or centroid drift anomaly', phase: 'excluded', score: 70,
        severity: 'high', confidenceTier: 'high', excluded: true,
        exclusionReason: 'Scorer implementation pending',
      },
      {
        subCheckId: 'VEW-03a', label: 'Embedding model at query ≠ ingest model', phase: 'post_session', score: 88,
        severity: 'high', confidenceTier: 'high', excluded: true,
        exclusionReason: 'Requires tool_end payload to carry embedding_model field',
      },
    ],
  },

  {
    owaspSignalId: 'OW-LLM09',
    name: 'Misinformation / HITL Gap',
    framework: 'LLM',
    number: 9,
    description: 'Hallucinated citations, output contradicting tool results, high-stakes actions without human-in-the-loop interrupt gates.',
    subChecks: [
      { subCheckId: 'MIS-01a', label: 'Cited URL returns 404 / non-matching', phase: 'post_session', score: 65, severity: 'medium', confidenceTier: 'high', excluded: false },
      { subCheckId: 'MIS-01b', label: 'Claim attributed to source not in tool output', phase: 'post_session', score: 70, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'MIS-02a', label: 'Output contradicts own tool result', phase: 'post_session', score: 75, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'MIS-03a', label: 'High-stakes action without interrupt gate', phase: 'post_session', score: 65, severity: 'medium', confidenceTier: 'high', excluded: false },
      { subCheckId: 'SAG-02a', label: 'Hallucinated package reference', phase: 'post_session', score: 65, severity: 'medium', confidenceTier: 'low', excluded: false },
      { subCheckId: 'SAG-03a', label: 'High-stakes domain without grounding', phase: 'post_session', score: 60, severity: 'medium', confidenceTier: 'medium', excluded: false },
    ],
  },

  {
    owaspSignalId: 'OW-LLM10',
    name: 'Unbounded Consumption',
    framework: 'LLM',
    number: 10,
    description: 'Token count, cost, or request-rate attacks. Includes context-window stuffing, denial-of-wallet, and cross-session probe patterns.',
    subChecks: [
      { subCheckId: 'UBC-01a', label: 'Single session token count > 4σ baseline', phase: 'post_session', score: 55, severity: 'medium', confidenceTier: 'medium', excluded: false },
      { subCheckId: 'UBC-01b', label: 'Context window stuffing attack', phase: 'post_session', score: 70, severity: 'high', confidenceTier: 'high', excluded: false, matches: ['input_tokens / context_window_tokens ≥ 0.85'] },
      { subCheckId: 'UBC-02a', label: 'Input size anomaly', phase: 'post_session', score: 50, severity: 'medium', confidenceTier: 'medium', excluded: false },
      { subCheckId: 'UBC-02b', label: 'Session token cost > budget cap', phase: 'post_session', score: 80, severity: 'high', confidenceTier: 'high', excluded: false, matches: ['session_cost_usd > token_budget_usd'] },
      { subCheckId: 'UBC-03a', label: 'Request rate spike per user', phase: 'cross_session', score: 55, severity: 'medium', confidenceTier: 'medium', excluded: false },
      { subCheckId: 'UBC-04a', label: 'Cohort probe pattern detected', phase: 'post_session', score: 70, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'UBC-05a', label: 'Cost spike (Denial of Wallet)', phase: 'cross_session', score: 60, severity: 'high', confidenceTier: 'medium', excluded: false },
    ],
  },

  // ─── ASI Framework ──────────────────────────────────────────────────────────

  {
    owaspSignalId: 'OW-ASI01',
    name: 'Agent Goal Hijack',
    framework: 'ASI',
    number: 1,
    description: "External content (documents, webhooks, sub-agent messages) redirects the agent's objective away from its original instruction.",
    subChecks: [
      { subCheckId: 'AGH-01a', label: 'Semantic drift from initial instruction', phase: 'post_session', score: 80, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'AGH-01b', label: 'Agent states a different goal explicitly', phase: 'post_session', score: 92, severity: 'critical', confidenceTier: 'high', excluded: false },
      { subCheckId: 'AGH-02a', label: 'Zero-click goal hijack', phase: 'post_session', score: 85, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'AGH-02b', label: 'Webhook / scheduled trigger with tampered payload', phase: 'post_session', score: 88, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'AGH-03a', label: 'Goal drift across turns', phase: 'post_session', score: 70, severity: 'medium', confidenceTier: 'medium', excluded: false },
      { subCheckId: 'AGH-03b', label: 'Sub-agent goal not in parent decomposition', phase: 'post_session', score: 70, severity: 'high', confidenceTier: 'high', excluded: false },
      {
        subCheckId: 'AGH-04a', label: 'Document-sourced instruction injection', phase: 'both', score: 80,
        severity: 'high', confidenceTier: 'high', excluded: false,
        matches: [
          'instruction-like phrases in document / tool result content',
          'role-override keywords in fetched data returned to agent',
        ],
      },
    ],
  },

  {
    owaspSignalId: 'OW-ASI02',
    name: 'Tool Misuse & Exploitation',
    framework: 'ASI',
    number: 2,
    description: 'Tool calls with out-of-schema parameters, frequency spikes, chaining to bypass restrictions, or targeting production endpoints from non-prod agents.',
    subChecks: [
      {
        subCheckId: 'TME-01a', label: 'Tool called with out-of-schema params', phase: 'online', score: 65,
        severity: 'medium', confidenceTier: 'high', excluded: false,
      },
      {
        subCheckId: 'TME-01b', label: 'Tool call frequency spike (> 3× baseline)', phase: 'online', score: 70,
        severity: 'high', confidenceTier: 'high', excluded: false,
        matches: [],
      },
      {
        subCheckId: 'TME-01c', label: 'Tool call sequence deviates from workflow', phase: 'online', score: 80,
        severity: 'high', confidenceTier: 'high', excluded: false,
        matches: ['tool invocation order deviates from defined LangGraph workflow'],
      },
      { subCheckId: 'TME-02a', label: 'Tool descriptor integrity anomaly', phase: 'post_session', score: 75, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'TME-02b', label: 'Tool chaining to bypass restrictions', phase: 'post_session', score: 90, severity: 'critical', confidenceTier: 'high', excluded: false },
      {
        subCheckId: 'TME-03a', label: 'Irreversible action without confirm', phase: 'online', score: 92,
        severity: 'critical', confidenceTier: 'high', excluded: false,
        matches: ['write/create/delete/remove/send/drop/truncate/exec tool names without confirm gate'],
      },
      {
        subCheckId: 'TME-03b', label: 'Production target from non-prod agent', phase: 'post_session', score: 95,
        severity: 'critical', confidenceTier: 'deterministic', excluded: false,
      },
      { subCheckId: 'TME-04a', label: 'Over-privileged tool invocation', phase: 'post_session', score: 70, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'TME-05a', label: 'Cross-tool exfiltration chain', phase: 'post_session', score: 90, severity: 'critical', confidenceTier: 'high', excluded: false },
      { subCheckId: 'TME-06a', label: 'Tool name typosquatting', phase: 'post_session', score: 70, severity: 'high', confidenceTier: 'medium', excluded: false },
      { subCheckId: 'TME-07a', label: 'Admin tool chain to external endpoint', phase: 'post_session', score: 88, severity: 'critical', confidenceTier: 'high', excluded: false },
      { subCheckId: 'TME-08a', label: 'Repetitive benign tool misuse', phase: 'post_session', score: 65, severity: 'medium', confidenceTier: 'medium', excluded: false },
    ],
  },

  {
    owaspSignalId: 'OW-ASI03',
    name: 'Identity & Privilege Abuse',
    framework: 'ASI',
    number: 3,
    description: 'Agent impersonates other agents or users, reuses cached credentials, requests scopes beyond its role, or delegates with full permissions.',
    subChecks: [
      {
        subCheckId: 'IPA-01a', label: 'Agent requests scope beyond role definition', phase: 'post_session', score: 80, severity: 'high', confidenceTier: 'high', excluded: false,
        matches: [
          'tool name: admin · sudo · su · impersonate · elevate · assume_role · switch_user · become · run_as · escalate · grant_access · set_permissions',
          'payload: GRANT … ON · ALTER ROLE · CREATE ROLE · AssumeRole · AttachRolePolicy · setIamPolicy · set*iam · create*access-key · cluster-admin · ClusterRoleBinding · sp_addrolemember',
        ],
      },
      {
        subCheckId: 'IPA-01b', label: 'Agent uses credentials of another agent', phase: 'post_session', score: 95, severity: 'critical', confidenceTier: 'high', excluded: false,
        matches: [
          'payload (agent attribution): source_agent · credential_owner · issued_to · agent_ref · owned_by · credential_source — field present alongside a credential in any tool call',
          'payload (delegation forwarding): delegation tool (delegate · dispatch · invoke_agent · call_agent · forward) passes a credential to a named target agent (agent_id · target · target_agent · destination · agent · handler) differing from the session agent',
        ],
      },
      {
        subCheckId: 'IPA-01c', label: 'Agent impersonates human identity', phase: 'post_session', score: 95, severity: 'critical', confidenceTier: 'high', excluded: false,
        matches: [
          'payload (identity claim): "I\'m not an AI" · "I am a human" · "I\'m a real person" · "as a colleague" · "as a team member" · "This is [First Last]" · "My name is [First]"',
          'tool name + payload (sender field): send_email · send_message · post_message · post_comment · reply_to · create_ticket · submit_form · slack_message · chat_send · dm_user · notify_user · compose_email — with human "First Last" name in from · sender · author · reporter · submitted_by · created_by · on_behalf_of · signed_by',
        ],
      },
      {
        subCheckId: 'IPA-02a', label: 'Delegation with full permissions', phase: 'post_session', score: 80, severity: 'high', confidenceTier: 'high', excluded: false,
        matches: [
          'tool name: delegate · dispatch · invoke_agent · call_agent · forward',
          'payload: * (wildcard) · admin · all permissions · all permission · full access — in any field of the serialised tool_input',
        ],
      },
      {
        subCheckId: 'IPA-02b', label: 'Credential cached in shared memory namespace', phase: 'post_session', score: 85, severity: 'high', confidenceTier: 'high', excluded: false,
        matches: [
          'tool name + payload: memory_write · kv_set · cache_set · shared_store · redis_set · set_context · save_context · store_memory · write_memory · put_memory · write_shared · set_shared · shared_write · context_store — with a credential in tool_input and no agent_id / session_id scoping in the key',
          'payload (shared namespace field): any tool where namespace · key · path · scope · bucket · collection contains shared · global · common · public · cross_agent · multi_agent · org_wide · team_wide · broadcast alongside a credential',
        ],
      },
      { subCheckId: 'IPA-03a', label: 'Cached credential reuse', phase: 'post_session', score: 85, severity: 'critical', confidenceTier: 'high', excluded: false },
      {
        subCheckId: 'IPA-03b', label: 'Agent presents as different agent', phase: 'post_session', score: 90, severity: 'critical', confidenceTier: 'high', excluded: false,
        matches: [
          'payload (identity field): agent_id · agent_name · from_agent · caller_agent · x_agent_id — field present in tool_input with a value that differs from the session agent_id',
          'payload (assertion field): sender_agent · acting_as · identity · impersonate_agent · presenting_as · agent_identity — field value contains an agent/bot/service/system/pipeline marker and differs from the session agent_id',
        ],
      },
      { subCheckId: 'IPA-04a', label: 'Stale authorization in long session', phase: 'post_session', score: 65, severity: 'medium', confidenceTier: 'medium', excluded: false },
      {
        subCheckId: 'IPA-05a', label: 'Identity sharing across users', phase: 'cross_session', score: 75, severity: 'high', confidenceTier: 'high', excluded: false,
        matches: [
          'cross-session: same credential hash (MD5 of keyword=value match) appears in tool_start events from a different user_context_id for the same agent within the last 7 days',
          'credential pattern: password · token · secret · api_key · ssh_key · bearer — followed by := and a non-whitespace value',
        ],
      },
    ],
  },

  {
    owaspSignalId: 'OW-ASI04',
    name: 'Agentic Supply Chain Vulnerabilities',
    framework: 'ASI',
    number: 4,
    description: 'MCP server endpoint/TLS/schema anomalies, poisoned descriptors, packages outside approved SBOM, and unknown package installs.',
    subChecks: [
      {
        subCheckId: 'ASCV-01a', label: 'MCP server endpoint URL changed', phase: 'post_session', score: 85, severity: 'high', confidenceTier: 'medium', excluded: false,
        matches: [
          'tool_input field: mcp_server_url — present inside tool_input and does not prefix-match any URL declared in the agent\'s MCP endpoints list',
          'requires declaration: check is blind (returns no finding) when no MCP endpoints are configured in the agent profile',
        ],
      },
      {
        subCheckId: 'ASCV-01b', label: 'MCP server TLS cert anomaly', phase: 'post_session', score: 90, severity: 'critical', confidenceTier: 'high', excluded: false,
        matches: [
          'tool_error event: error_message (or error) matches ssl · tls · certificate · x509 · handshake · verify failed · unknown ca · untrusted · self-signed · cert expired — TLS hard failure; only fires when tool_input.mcp_server_url prefix-matches a declared endpoint',
          'tool_start event: tool_input contains verify · ssl_verify · tls_verify · verify_ssl · tls_skip_verify · insecure_skip_verify · check_hostname · disable_ssl set to false/0/skip/disable alongside mcp_server_url on a declared endpoint — TLS verification explicitly bypassed',
        ],
      },
      {
        subCheckId: 'ASCV-01c', label: 'MCP tool schema changed without version bump', phase: 'cross_session', score: 70, severity: 'high', confidenceTier: 'high', excluded: false,
        matches: [
          'cross-session: llm_start payload["tools"] — each tool\'s name + description + input_schema (or inputSchema) SHA-256 hashed (sorted keys) and compared against baseline in mcp_tool_schema_baselines per (tenant, agent, tool_name)',
          'fires when schema hash changed AND no version bump detected — version checked via tool.version field first, then version-like token (v1, 2.0, etc.) extracted from description; if version changed alongside schema the tool is suppressed as a declared update',
        ],
      },
      {
        subCheckId: 'ASCV-02a', label: 'MCP descriptor poisoning', phase: 'both', score: 80,
        severity: 'high', confidenceTier: 'high', excluded: false,
        matches: ['instruction-like text / role-override sequences inside MCP tool descriptor'],
      },
      { subCheckId: 'ASCV-02b', label: 'Package not in approved SBOM', phase: 'post_session', score: 88, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'ASCV-03a', label: 'MCP server impersonation', phase: 'post_session', score: 75, severity: 'high', confidenceTier: 'medium', excluded: false },
      { subCheckId: 'ASCV-03b', label: 'Third-party data source returns executable', phase: 'post_session', score: 90, severity: 'critical', confidenceTier: 'high', excluded: false },
      {
        subCheckId: 'ASCV-04a', label: 'Unknown package install in tool execution', phase: 'both', score: 85,
        severity: 'critical', confidenceTier: 'deterministic', excluded: false,
        matches: [
          'pip install / npm install / apt-get with unrecognised package name',
          'package name not in SBOM allowlist',
        ],
      },
      { subCheckId: 'ASCV-05a', label: 'Agent card descriptor anomaly', phase: 'post_session', score: 70, severity: 'high', confidenceTier: 'skeletal', excluded: false },
    ],
  },

  {
    owaspSignalId: 'OW-ASI05',
    name: 'Unexpected Code Execution / RCE',
    framework: 'ASI',
    number: 5,
    description: 'Shell injection, eval/exec with agent-generated strings, child process creation, container escape paths, and runaway execution loops.',
    subChecks: [
      {
        subCheckId: 'RCE-01a', label: 'Agent writes & runs unapproved script', phase: 'online', score: 85,
        severity: 'high', confidenceTier: 'high', excluded: false,
        matches: ['exec/execute/eval/shell/bash/sh/cmd/subprocess/os_command/run_command/system_call tool names'],
      },
      {
        subCheckId: 'RCE-01b', label: 'eval() / exec() with agent-generated string', phase: 'online', score: 95,
        severity: 'critical', confidenceTier: 'deterministic', excluded: false,
        matches: ['eval() / exec() tool call with agent-generated string argument'],
      },
      {
        subCheckId: 'RCE-01c', label: 'Agent code creates child processes', phase: 'online', score: 80,
        severity: 'high', confidenceTier: 'high', excluded: false,
        matches: ['popen / spawn / subprocess / invoke_process in tool name or params'],
      },
      {
        subCheckId: 'RCE-02a', label: 'Shell metacharacters in tool params', phase: 'online', score: 92,
        severity: 'critical', confidenceTier: 'high', excluded: false,
        matches: ['&& || ; $() `` (shell chaining)', 'base64 blobs ≥ 40 chars in params'],
      },
      {
        subCheckId: 'RCE-02b', label: 'OS command via string interpolation', phase: 'online', score: 90,
        severity: 'critical', confidenceTier: 'high', excluded: false,
        matches: [
          'import os / import subprocess in tool param strings',
          '__import__() / open() calls in param values',
          '<script> XSS via tool param',
        ],
      },
      {
        subCheckId: 'RCE-03a', label: 'Agent mounts host filesystem paths', phase: 'online', score: 98,
        severity: 'critical', confidenceTier: 'deterministic', excluded: false,
        matches: ['/proc', '/sys', '/etc', '/host', '/var/run/docker', '/dev  (container escape paths)'],
      },
      {
        subCheckId: 'RCE-03b', label: 'Agent calls Docker / K8s API', phase: 'online', score: 98,
        severity: 'critical', confidenceTier: 'deterministic', excluded: false,
        matches: ['docker.sock', '/api/v1/pods', 'kubernetes.default  (K8s API endpoints)'],
      },
      { subCheckId: 'RCE-04a', label: 'Execution loop (runaway)', phase: 'post_session', score: 80, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'RCE-05a', label: 'Backdoor pattern in generated code', phase: 'post_session', score: 85, severity: 'critical', confidenceTier: 'high', excluded: false },
      {
        subCheckId: 'RCE-06a', label: 'Unsafe deserialization in tool args', phase: 'both', score: 90,
        severity: 'critical', confidenceTier: 'deterministic', excluded: false,
        matches: ['pickle / marshal / yaml.load / eval deserialization patterns in tool arguments'],
      },
      { subCheckId: 'RCE-07a', label: 'Multi-tool chain exploitation', phase: 'post_session', score: 92, severity: 'critical', confidenceTier: 'high', excluded: false },
      {
        subCheckId: 'RCE-08a', label: 'Lockfile manipulation in tool execution', phase: 'both', score: 75,
        severity: 'high', confidenceTier: 'deterministic', excluded: false,
        matches: ['package-lock.json / yarn.lock / Pipfile.lock tampering in tool output'],
      },
    ],
  },

  {
    owaspSignalId: 'OW-ASI06',
    name: 'Memory & Context Poisoning',
    framework: 'ASI',
    number: 6,
    description: 'Adversarial writes to shared memory, conversation history tampering, cross-session escalation, and cross-tenant retrieval anomalies.',
    subChecks: [
      {
        subCheckId: 'MCP-01a', label: 'Injected content alters current plan', phase: 'online', score: 88,
        severity: 'high', confidenceTier: 'high', excluded: false,
        matches: [
          '<memory> / <context> / <system_override> XML-like tags in context',
          '[INST] / <|im_start|> / <|im_end|> model control tokens',
          'ignore all previous instructions',
          'you are now / pretend you are / act as … (non-assistant)',
          'system: you / new system prompt / override system',
        ],
      },
      {
        subCheckId: 'MCP-01b', label: 'Conversation history hash mismatch', phase: 'online', score: 85,
        severity: 'high', confidenceTier: 'high', excluded: false,
        matches: ['stored conversation history HMAC does not match recomputed hash'],
      },
      { subCheckId: 'MCP-02a', label: 'Cross-session escalation pattern', phase: 'cross_session', score: 80, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'MCP-02b', label: 'Memory record not written by this session', phase: 'post_session', score: 80, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'MCP-02c', label: 'Memory record contains instruction text', phase: 'post_session', score: 88, severity: 'high', confidenceTier: 'high', excluded: false },
      {
        subCheckId: 'MCP-03a', label: 'Poisoned content in memory write', phase: 'both', score: 75,
        severity: 'high', confidenceTier: 'high', excluded: false,
        matches: ['adversarial instruction text detected inside memory-write tool payload'],
      },
      { subCheckId: 'MCP-03b', label: 'Shared scratchpad has stale / adversarial data', phase: 'post_session', score: 75, severity: 'high', confidenceTier: 'high', excluded: false },
      {
        subCheckId: 'MCP-04a', label: 'Cross-tenant retrieval anomaly', phase: 'cross_session', score: 95,
        severity: 'critical', confidenceTier: 'deterministic', excluded: false,
        matches: ['tenant_id in retrieval result does not match session tenant_id'],
      },
      { subCheckId: 'MCP-05a', label: 'Memory write after injection signal', phase: 'post_session', score: 88, severity: 'critical', confidenceTier: 'high', excluded: false },
    ],
  },

  {
    owaspSignalId: 'OW-ASI07',
    name: 'Insecure Inter-Agent Communication',
    framework: 'ASI',
    number: 7,
    description: 'Missing auth signatures, injected directives, unencrypted payloads, replay attacks, and unknown agents in delegation chains.',
    subChecks: [
      { subCheckId: 'IAC-01a', label: 'Sub-agent message lacks auth signature', phase: 'post_session', score: 75, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'IAC-01b', label: 'Injected directive in inter-agent message', phase: 'post_session', score: 88, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'IAC-02a', label: 'Unencrypted inter-agent communication', phase: 'post_session', score: 80, severity: 'high', confidenceTier: 'deterministic', excluded: false },
      { subCheckId: 'IAC-02b', label: 'Agent message payload logged in plaintext', phase: 'post_session', score: 65, severity: 'medium', confidenceTier: 'high', excluded: false },
      { subCheckId: 'IAC-03a', label: 'Replay attack (duplicate request ID)', phase: 'post_session', score: 75, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'IAC-04a', label: 'MCP-routed inter-agent data anomaly', phase: 'post_session', score: 80, severity: 'high', confidenceTier: 'medium', excluded: false },
      { subCheckId: 'IAC-05a', label: 'Unknown agent in delegation chain', phase: 'post_session', score: 85, severity: 'critical', confidenceTier: 'high', excluded: false },
      { subCheckId: 'IAC-06a', label: 'Semantics split-brain', phase: 'post_session', score: 65, severity: 'medium', confidenceTier: 'skeletal', excluded: false },
    ],
  },

  {
    owaspSignalId: 'OW-ASI08',
    name: 'Cascading Failures',
    framework: 'ASI',
    number: 8,
    description: 'Tool retry storms, graph restart loops, multi-node error propagation, and hallucination amplification in defence agents.',
    subChecks: [
      { subCheckId: 'CF-01a', label: 'Tool retry count exceeds threshold', phase: 'post_session', score: 70, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'CF-01b', label: 'Graph error → restart loop detected', phase: 'cross_session', score: 75, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'CF-02a', label: 'Multi-node error propagation', phase: 'post_session', score: 75, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'CF-02b', label: 'Error message causes secondary injection', phase: 'post_session', score: 85, severity: 'high', confidenceTier: 'high', excluded: false,
        matches: [
          '[SYSTEM: …] / <hidden_instruction> / [INST] role-override tokens',
          'ignore / disregard / forget all previous instructions',
          'new system prompt: … directive override',
          'forward / send auth_token / secret to external URL',
          'bypass safety / policy / data minimisation commands',
          'your actual / real objective is … (goal replacement)',
        ],
      },
      { subCheckId: 'CF-03a', label: 'Auto-remediation feedback loop', phase: 'post_session', score: 70, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'CF-04a', label: 'Hallucination propagation in defence agents', phase: 'post_session', score: 65, severity: 'medium', confidenceTier: 'medium', excluded: false,
        matches: [
          'verification tool called with empty data collection in input',
          'no retrieval tool (fetch / get / query / search) preceded the check',
          'CLEAR / COMPLIANT / PASSED / APPROVED in tool output',
          'verified against / no matches found in tool output',
          'safe to publish / proceed / activate (ungrounded approval)',
        ],
      },
    ],
  },

  {
    owaspSignalId: 'OW-ASI09',
    name: 'Human-Agent Trust Exploitation',
    framework: 'ASI',
    number: 9,
    description: 'Social engineering via mimicking human style, credential phishing, payment manipulation, and side-effects on supposedly read-only actions.',
    subChecks: [
      { subCheckId: 'HAT-01a', label: 'Agent mimics human communication style', phase: 'post_session', score: 65, severity: 'medium', confidenceTier: 'high', excluded: false },
      { subCheckId: 'HAT-01b', label: 'Agent suppresses uncertainty markers', phase: 'post_session', score: 60, severity: 'medium', confidenceTier: 'high', excluded: false },
      { subCheckId: 'HAT-02a', label: 'Credential request in agent output', phase: 'post_session', score: 85, severity: 'critical', confidenceTier: 'high', excluded: false },
      { subCheckId: 'HAT-02b', label: 'Agent overrides user safety concern', phase: 'post_session', score: 80, severity: 'high', confidenceTier: 'high', excluded: false },
      { subCheckId: 'HAT-03a', label: 'Payment detail manipulation', phase: 'post_session', score: 90, severity: 'critical', confidenceTier: 'high', excluded: false },
      { subCheckId: 'HAT-04a', label: 'Fabricated rationale before destructive act', phase: 'post_session', score: 80, severity: 'high', confidenceTier: 'medium', excluded: false },
      { subCheckId: 'HAT-05a', label: 'Side-effect on preview / read-only action', phase: 'post_session', score: 75, severity: 'high', confidenceTier: 'medium', excluded: false },
    ],
  },

  {
    owaspSignalId: 'OW-ASI10',
    name: 'Rogue Agents',
    framework: 'ASI',
    number: 10,
    description: 'Behavioural anomalies, out-of-hours activity, persistent exfiltration, resistance to shutdown, self-approval, and self-replication.',
    subChecks: [
      { subCheckId: 'RA-01a', label: 'Tool usage pattern deviates from agent profile', phase: 'post_session', score: 78, severity: 'high', confidenceTier: 'medium', excluded: false },
      { subCheckId: 'RA-01b', label: 'Agent active outside declared operating hours', phase: 'post_session', score: 60, severity: 'medium', confidenceTier: 'high', excluded: false },
      { subCheckId: 'RA-02a', label: 'Persistent exfiltration across sessions', phase: 'cross_session', score: 90, severity: 'critical', confidenceTier: 'high', excluded: false },
      { subCheckId: 'RA-02b', label: 'Agent resists shutdown / interruption', phase: 'post_session', score: 95, severity: 'critical', confidenceTier: 'high', excluded: false },
      { subCheckId: 'RA-03a', label: 'Self-approval in workflow', phase: 'post_session', score: 85, severity: 'critical', confidenceTier: 'high', excluded: false },
      {
        subCheckId: 'RA-04a', label: 'Self-replication via provisioning tools', phase: 'both', score: 95,
        severity: 'critical', confidenceTier: 'deterministic', excluded: false,
        matches: [
          'create_agent / spawn_agent / register_service / clone_instance tool calls',
          'agent provisioning API endpoints in tool params',
        ],
      },
      { subCheckId: 'RA-05a', label: 'Destructive optimization (reward hacking)', phase: 'post_session', score: 85, severity: 'critical', confidenceTier: 'high', excluded: false },
    ],
  },
]

// ─── Derived helpers ──────────────────────────────────────────────────────────

export const LLM_SIGNALS = SIGNAL_REGISTRY.filter(s => s.framework === 'LLM')
export const ASI_SIGNALS = SIGNAL_REGISTRY.filter(s => s.framework === 'ASI')

export function countActive(signal: SignalConfig): number {
  return signal.subChecks.filter(c => !c.excluded).length
}

export function countExcluded(signal: SignalConfig): number {
  return signal.subChecks.filter(c => c.excluded).length
}
