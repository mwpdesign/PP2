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
  return (
    <div
      className={`flex ${className}`}
      style={{ minHeight }}
    >
      {/* Master Panel (List View) - 60% width */}
      <div
        className={`
          ${showDetail ? 'w-3/5' : 'w-full'}
          bg-white
          border-r
          border-gray-200
          overflow-y-auto
          transition-all
          duration-300
          ease-in-out
          flex-shrink-0
        `}
      >
        {masterPanel}
      </div>

      {/* Detail Panel (Detail View) - 40% width - Desktop */}
      {showDetail && (
        <div
          className="
            w-2/5
            bg-white
            overflow-y-auto
            transition-all
            duration-300
            ease-in-out
            flex-shrink-0
            hidden
            md:block
          "
        >
          {detailPanel}
        </div>
      )}

      {/* Mobile Detail Panel (Full Width Overlay) - Only on mobile */}
      {showDetail && (
        <div
          className="
            fixed
            inset-0
            bg-white
            z-50
            overflow-y-auto
            block
            md:hidden
            transition-transform
            duration-300
            ease-in-out
          "
        >
          {detailPanel}
        </div>
      )}
    </div>
  );
};

export default MasterDetailLayout;