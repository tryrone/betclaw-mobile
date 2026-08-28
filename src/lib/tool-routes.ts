export const TOOL_ROUTES = {
  buildTicket: {
    activePath: '/build-ticket',
    href: '/(tabs)/build-ticket',
    screen: 'build-ticket',
  },
  convertTicket: {
    activePath: '/convert-ticket',
    href: '/(tabs)/convert-ticket',
    screen: 'convert-ticket',
  },
  fixTicket: {
    activePath: '/fix-ticket',
    href: '/(tabs)/fix-ticket',
    screen: 'fix-ticket',
  },
  minuteDraws: {
    activePath: '/minute-draws',
    href: '/(tabs)/minute-draws',
    screen: 'minute-draws',
  },
} as const;

export const TOOL_ACTIVE_PATHS = [
  '/tools',
  ...Object.values(TOOL_ROUTES).map((route) => route.activePath),
] as const;
