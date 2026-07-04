const appVersion = {
  version: '2.0.0',
  buildDate: '2026-07-01T14:08:12.151Z',
  name: '智能问卷系统',
};

export default function VersionBadge() {
  return React.createElement('div', {
    style: {
      position: 'fixed',
      bottom: '8px',
      right: '12px',
      fontSize: '11px',
      color: 'rgba(255,255,255,0.4)',
      fontFamily: 'monospace',
      zIndex: 9999
    }
  }, 'v' + appVersion.version);
}

export { appVersion };