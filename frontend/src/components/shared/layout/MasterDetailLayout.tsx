import React from 'react';

interface MasterDetailLayoutProps {
  /** Left panel content (list view) - takes 60% of the width */
  masterPanel: React.ReactNode;
  /** Right panel content (detail view) - takes 40% of the width */
  detailPanel: React.ReactNode;
  /** Optional className for the container */
  className?: string;
  /** Whether to show the detail panel (for responsive behavior) */
  showDetail?: boolean;
  /** Optional minimum height for the layout */
  minHeight?: string;
}

/**
 * MasterDetailLayout Component
 *
 * Provides a foundation layout for split view interfaces with:
 * - 60% width for the master/list panel on the left
 * - 40% width for the detail panel on the right
 * - Responsive behavior for mobile devices
 * - Flexible content areas for any type of list/detail views
 *
 * Usage:
 * <MasterDetailLayout
 *   masterPanel={<IVRList />}
 *   detailPanel={<IVRDetail />}
 *   showDetail={selectedItem !== null}
 * />
 */
const MasterDetailLayout: React.FC<MasterDetailLayoutProps> = ({
  masterPanel,
  detailPanel,
  className = '',
  showDetail = true,
  minHeight = 'calc(100vh - 80px)'
}) => {
  // Debug logging
  console.log('🟠 [STEP 4] MasterDetailLayout - RENDER TRIGGERED');
  console.log('🟠 [STEP 4] showDetail prop received:', showDetail);
  console.log('🟠 [STEP 4] detailPanel exists:', !!detailPanel);
  console.log('🟠 [STEP 4] masterPanel exists:', !!masterPanel);
  console.log('🟠 [STEP 4] Will render detail panel?', showDetail && !!detailPanel);

  return (
    <div
      className={`flex ${className}`}
      style={{ minHeight }}
    >
      {/* Master Panel (List View) - Desktop: 60% width, Mobile: Full width when no detail */}
      <div
        className={`
          ${showDetail
            ? 'hidden md:block md:w-3/5' // Hidden on mobile when detail is shown, 60% on desktop
            : 'w-full' // Full width when no detail selected
          }
          bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0
        `}
        style={{
          transition: 'all 300ms ease-in-out'
        }}
      >
        {masterPanel}
      </div>

      {/* Detail Panel (Detail View) - Desktop: 40% width, Mobile: Full width overlay */}
      {showDetail && (
        <div
          className="
            w-full md:w-2/5
            bg-white overflow-y-auto flex-shrink-0
            fixed md:relative
            inset-0 md:inset-auto
            z-50 md:z-auto
          "
          style={{
            transition: 'all 300ms ease-in-out'
          }}
        >
          {console.log('🟠 [STEP 4] Detail panel DIV is rendering!')}
          {console.log('🟠 [STEP 4] Detail panel content:', !!detailPanel)}
          {detailPanel}
        </div>
      )}
      {!showDetail && console.log('🔴 [STEP 4] Detail panel NOT rendering - showDetail is false')}
    </div>
  );
};

export default MasterDetailLayout;