'use client'

type ViewMode = 'code' | 'visualization' | 'data'

export function SidebarTabs({ activeView, onViewChange }: {
  activeView: ViewMode
  onViewChange: (view: ViewMode) => void
}) {
  return (
    <div className="flex border-b">
      <button 
        className={`px-4 py-2 ${activeView === 'code' ? 'border-b-2 border-primary' : ''}`}
        onClick={() => onViewChange('code')}
      >
        Code
      </button>
      <button 
        className={`px-4 py-2 ${activeView === 'visualization' ? 'border-b-2 border-primary' : ''}`}
        onClick={() => onViewChange('visualization')}
      >
        Visualize
      </button>
      <button 
        className={`px-4 py-2 ${activeView === 'data' ? 'border-b-2 border-primary' : ''}`}
        onClick={() => onViewChange('data')}
      >
        Data
      </button>
    </div>
  )
}
