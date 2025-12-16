/**
 * ActionDrawer - Categorized Quick Action Menu
 *
 * A mobile-optimized action drawer that provides quick access to common actions
 * grouped by category. Uses BottomSheet for gesture physics and smooth animations.
 *
 * Categories:
 * - VIEW: View mode toggles, 3D, zoom controls
 * - ANALYSIS: Quick access to analysis tools
 * - TOOLS: Settings, help, search, command palette
 */

import React, { useCallback } from 'react';
import { usePhageStore } from '@phage-explorer/state';
import { BottomSheet } from '../mobile/BottomSheet';
import { useOverlay, type OverlayId } from '../overlays/OverlayProvider';
import { haptics } from '../../utils/haptics';
import {
  IconLayers,
  IconCube,
  IconZoomIn,
  IconZoomOut,
  IconChartBar,
  IconDna,
  IconFlask,
  IconTrendingUp,
  IconTarget,
  IconSettings,
  IconSearch,
  IconHelp,
  IconCommand,
  IconGitCompare,
  IconRepeat,
  IconMagnet,
  IconShield,
} from '../ui';

// =============================================================================
// Types
// =============================================================================

interface ActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  active?: boolean;
  disabled?: boolean;
}

interface ActionCategory {
  id: string;
  label: string;
  items: ActionItem[];
}

// =============================================================================
// Component
// =============================================================================

export function ActionDrawer({ isOpen, onClose }: ActionDrawerProps): JSX.Element {
  const { open: openOverlay } = useOverlay();

  // Store state
  const viewMode = usePhageStore((s) => s.viewMode);
  const toggleViewMode = usePhageStore((s) => s.toggleViewMode);
  const show3DModel = usePhageStore((s) => s.show3DModel);
  const toggle3DModel = usePhageStore((s) => s.toggle3DModel);
  const zoomLevel = usePhageStore((s) => s.zoomLevel);
  const setZoomLevel = usePhageStore((s) => s.setZoomLevel);

  // Handlers with haptic feedback
  const handleAction = useCallback(
    (action: () => void) => {
      haptics.selection();
      action();
      onClose();
    },
    [onClose]
  );

  const handleOverlay = useCallback(
    (overlayId: OverlayId) => {
      haptics.selection();
      openOverlay(overlayId);
      onClose();
    },
    [openOverlay, onClose]
  );

  const handleZoomIn = useCallback(() => {
    haptics.selection();
    setZoomLevel(Math.min(zoomLevel + 0.5, 10));
  }, [setZoomLevel, zoomLevel]);

  const handleZoomOut = useCallback(() => {
    haptics.selection();
    setZoomLevel(Math.max(zoomLevel - 0.5, 0.5));
  }, [setZoomLevel, zoomLevel]);

  // View mode label
  const viewModeLabel = viewMode === 'dna' ? 'DNA' : viewMode === 'aa' ? 'AA' : 'Both';

  // Action categories
  const categories: ActionCategory[] = [
    {
      id: 'view',
      label: 'View',
      items: [
        {
          id: 'viewMode',
          label: `Mode: ${viewModeLabel}`,
          icon: <IconLayers size={20} />,
          action: () => handleAction(toggleViewMode),
        },
        {
          id: '3d',
          label: '3D Model',
          icon: <IconCube size={20} />,
          action: () => handleAction(toggle3DModel),
          active: show3DModel,
        },
        {
          id: 'zoomIn',
          label: 'Zoom In',
          icon: <IconZoomIn size={20} />,
          action: handleZoomIn,
          disabled: zoomLevel >= 10,
        },
        {
          id: 'zoomOut',
          label: 'Zoom Out',
          icon: <IconZoomOut size={20} />,
          action: handleZoomOut,
          disabled: zoomLevel <= 0.5,
        },
      ],
    },
    {
      id: 'analysis',
      label: 'Analysis',
      items: [
        {
          id: 'complexity',
          label: 'Complexity',
          icon: <IconChartBar size={20} />,
          action: () => handleOverlay('complexity'),
        },
        {
          id: 'gcSkew',
          label: 'GC Skew',
          icon: <IconDna size={20} />,
          action: () => handleOverlay('gcSkew'),
        },
        {
          id: 'pressure',
          label: 'Selection',
          icon: <IconTrendingUp size={20} />,
          action: () => handleOverlay('pressure'),
        },
        {
          id: 'repeats',
          label: 'Repeats',
          icon: <IconRepeat size={20} />,
          action: () => handleOverlay('repeats'),
        },
        {
          id: 'synteny',
          label: 'Synteny',
          icon: <IconGitCompare size={20} />,
          action: () => handleOverlay('synteny'),
        },
        {
          id: 'crispr',
          label: 'CRISPR',
          icon: <IconTarget size={20} />,
          action: () => handleOverlay('crispr'),
        },
        {
          id: 'hgt',
          label: 'HGT',
          icon: <IconMagnet size={20} />,
          action: () => handleOverlay('hgt'),
        },
        {
          id: 'defenseArms',
          label: 'Defense',
          icon: <IconShield size={20} />,
          action: () => handleOverlay('defenseArmsRace'),
        },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [
        {
          id: 'search',
          label: 'Search',
          icon: <IconSearch size={20} />,
          action: () => handleOverlay('search'),
        },
        {
          id: 'commands',
          label: 'Commands',
          icon: <IconCommand size={20} />,
          action: () => handleOverlay('commandPalette'),
        },
        {
          id: 'analysisMenu',
          label: 'All Analysis',
          icon: <IconFlask size={20} />,
          action: () => handleOverlay('analysisMenu'),
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: <IconSettings size={20} />,
          action: () => handleOverlay('settings'),
        },
        {
          id: 'help',
          label: 'Help',
          icon: <IconHelp size={20} />,
          action: () => handleOverlay('help'),
        },
      ],
    },
  ];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      showHandle={true}
      closeOnBackdropTap={true}
      swipeToDismiss={true}
      initialSnapPoint="half"
      minHeight={35}
      maxHeight={85}
    >
      <div className="action-drawer" id="action-drawer" role="menu">
        {categories.map((category) => (
          <div key={category.id} className="action-drawer__category">
            <h3 className="action-drawer__category-label">{category.label}</h3>
            <div className="action-drawer__grid">
              {category.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={`action-drawer__item ${item.active ? 'action-drawer__item--active' : ''} ${item.disabled ? 'action-drawer__item--disabled' : ''}`}
                  onClick={item.action}
                  disabled={item.disabled}
                  aria-pressed={item.active}
                >
                  <span className="action-drawer__item-icon">{item.icon}</span>
                  <span className="action-drawer__item-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}

export default ActionDrawer;
