import { NavigationPath } from '../types';

interface SidebarProps {
  currentPath: NavigationPath;
  onNavigate: (path: NavigationPath) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  collapsed,
  onToggleCollapse
}) => {
  const cognitiveItems: Array<{ path: NavigationPath; label: string; icon: string }> = [
    { path: 'brain', label: 'Organizational Brain', icon: 'neurology' },
    { path: 'ask', label: 'Organizational Memory', icon: 'forum' },
    { path: 'projects', label: 'Projects', icon: 'folder_open' },
    { path: 'knowledge', label: 'Knowledge Explorer', icon: 'menu_book' },
    { path: 'ingest', label: 'Ingest RAG Reference', icon: 'upload_file' },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between select-none transition-all duration-300 border-r border-outline-variant/20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header Bar */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-outline-variant/15">
          <div
            className="flex items-center gap-space-xs cursor-pointer min-w-0"
            onClick={() => onNavigate('brain')}
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-on-primary">OB</div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface truncate">
                  Organizational
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant -mt-1 truncate">
                  Brain
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {collapsed ? 'dock_to_right' : 'dock_to_left'}
            </span>
          </button>
        </div>

        {!collapsed ? (
          <div className="px-space-md py-space-xs">
            <div className="flex items-center gap-space-xs rounded-xl bg-surface-container-low px-space-sm py-space-xs">
              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary-container text-xs font-bold text-on-primary-container">N</div>
              <div className="min-w-0"><div className="truncate font-label-md text-label-md font-semibold text-on-surface">Organizational Brain</div><div className="truncate font-label-sm text-label-sm text-outline">Current knowledge + hindsight</div></div>
            </div>
          </div>
        ) : (
          <div className="py-2 flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs">
              N
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <nav className="flex-1 px-space-xs py-space-xs flex flex-col gap-space-2xs overflow-y-auto">
          {!collapsed && (
            <div className="px-space-sm py-space-2xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                Cognitive Workspace
              </span>
            </div>
          )}

          {cognitiveItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`flex items-center ${
                  collapsed ? 'justify-center px-0 py-2' : 'justify-between px-space-sm py-space-xs'
                } rounded-lg transition-all ${
                  isActive
                    ? 'bg-surface-container-high text-primary font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-space-sm min-w-0">
                  <span className="material-symbols-outlined text-[18px] shrink-0">
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="font-label-md text-label-md truncate">{item.label}</span>
                  )}
                </div>
              </button>
            );
          })}

        </nav>
      </div>

      {/* Footer Area with Real-time RAG Mesh status & User profile */}
      <div className="p-space-xs flex flex-col gap-space-xs bg-surface-container-lowest border-t border-outline-variant/10">
        {!collapsed ? (
          <div className="flex items-center justify-between px-space-sm py-space-xs rounded-lg bg-surface-container-low">
            <div className="flex items-center gap-space-xs min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-container opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary-container"></span>
              </span>
              <span className="font-mono-code text-[11px] text-tertiary truncate">
                Knowledge + Hindsight
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1" title="Hindsight Memory Lab">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-container opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary-container"></span>
            </span>
          </div>
        )}

        <div className="flex items-center justify-between p-space-xs rounded-xl">
          <div className="flex items-center gap-space-xs min-w-0">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-container-high font-mono-code text-xs text-on-surface">D</div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                  Demo workspace
                </span>
                <span className="font-label-sm text-label-sm text-outline truncate">
                  Synthetic records only
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
