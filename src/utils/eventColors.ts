/** Event category → hex color for timeline dots */
export const EVENT_COLORS: Record<string, string> = {
  graph: '#7F77DD',      // purple  — graph lifecycle
  node: '#1D9E75',       // teal    — node lifecycle
  llm: '#BA7517',        // amber   — LLM calls
  tool: '#D85A30',       // coral   — tool calls
  state: '#378ADD',      // blue    — state/control
  control: '#378ADD',    // blue    — control events (alias)
  default: '#6B7280',    // gray    — unknown/unclassified
}

export function getEventColor(category: string): string {
  return EVENT_COLORS[category.toLowerCase()] ?? EVENT_COLORS.default
}
