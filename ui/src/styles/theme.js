/**
 * Single source of truth for visual constants.
 * If you re-skin the UI, edit this file — every component reads from it.
 */

export const THEME = {
  bg:         '#0D1117',
  surface:    '#161B22',
  border:     'rgba(255, 255, 255, 0.08)',

  text1:      '#E6EDF3',
  text2:      '#8B949E',

  states: {
    IDLE:        '#30363D',
    LISTENING:   '#00D9F5',
    PROCESSING:  '#A78BFA',
    EXECUTING:   '#F59E0B',
    SPEAKING:    '#3FB950',
  },

  fonts: {
    ui:   "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Consolas', 'Menlo', monospace",
  },
};

export function stateColor(state) {
  return THEME.states[state] || THEME.states.IDLE;
}
