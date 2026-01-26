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

import React, { useCallback, useMemo } from 'react';
import { usePhageStore } from '@phage-explorer/state';
import { BottomSheet } from '../mobile/BottomSheet';
import { useOverlay, type OverlayId } from '../overlays/OverlayProvider';
import { ActionIds, type ActionId } from '../../keyboard';
import {
  ACTION_DRAWER_SECTIONS,
  detectShortcutPlatform,
  formatActionShortcutForSurface,
  getActionFromRegistry,
} from '../../keyboard/actionSurfaces';
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
  IconAperture,
  IconDiff,
  IconZap,
  IconBeaker,
} from '../ui';

interface ActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function ActionDrawer({ isOpen, onClose }: ActionDrawerProps): React.ReactElement {
  const { open: openOverlay, toggle: toggleOverlay } = useOverlay();
  const shortcutPlatform = detectShortcutPlatform();
  const initialSnapPoint = useMemo(() => {
    if (typeof window === 'undefined') return 'half' as const;

    // Very small phones benefit from opening the drawer fully so key actions (Analysis row 2+)
    // are reachable without needing to scroll or expand the sheet first.
    if (window.innerWidth <= 380) return 'full' as const;

    return 'half' as const;
  }, []);

  // Store state
  const viewMode = usePhageStore((s) => s.viewMode);
  const toggleViewMode = usePhageStore((s) => s.toggleViewMode);
  const show3DModel = usePhageStore((s) => s.show3DModel);
  const toggle3DModel = usePhageStore((s) => s.toggle3DModel);
  const zoomScale = usePhageStore((s) => s.zoomScale) ?? 1.0;
  const zoomIn = usePhageStore((s) => s.zoomIn);
  const zoomOut = usePhageStore((s) => s.zoomOut);
  const hasPhage = usePhageStore((s) => s.currentPhage !== null);

  // View mode label - use full "Amino Acids" for clarity
  const viewModeLabel = viewMode === 'dna' ? 'DNA' : viewMode === 'aa' ? 'Amino Acids' : 'Dual';

  const actionIcons = useMemo(() => {
    const icons: Partial<Record<ActionId, React.ReactNode>> = {
      // View controls
      [ActionIds.ViewCycleMode]: <IconLayers size={20} />,
      [ActionIds.ViewToggle3DModel]: <IconCube size={20} />,
      [ActionIds.ViewZoomIn]: <IconZoomIn size={20} />,
      [ActionIds.ViewZoomOut]: <IconZoomOut size={20} />,
      // Sequence analysis
      [ActionIds.OverlayGCSkew]: <IconDna size={20} />,
      [ActionIds.OverlayComplexity]: <IconChartBar size={20} />,
      [ActionIds.OverlayBendability]: <IconAperture size={20} />,
      [ActionIds.OverlayRepeats]: <IconRepeat size={20} />,
      [ActionIds.OverlayPromoter]: <IconTarget size={20} />,
      [ActionIds.OverlayHilbert]: <IconAperture size={20} />,
      [ActionIds.OverlayCGR]: <IconDna size={20} />,
      [ActionIds.OverlayDotPlot]: <IconDiff size={20} />,
      // Analysis tools
      [ActionIds.OverlayPackagingPressure]: <IconTrendingUp size={20} />,
      [ActionIds.OverlaySynteny]: <IconGitCompare size={20} />,
      [ActionIds.OverlayCRISPR]: <IconTarget size={20} />,
      [ActionIds.OverlayHGT]: <IconMagnet size={20} />,
      [ActionIds.OverlayDefenseArmsRace]: <IconShield size={20} />,
      [ActionIds.OverlayGel]: <IconBeaker size={20} />,
      [ActionIds.OverlaySimulationHub]: <IconZap size={20} />,
      [ActionIds.OverlayAnalysisMenu]: <IconFlask size={20} />,
      // Tools
      [ActionIds.OverlaySearch]: <IconSearch size={20} />,
      [ActionIds.OverlayCommandPalette]: <IconCommand size={20} />,
      [ActionIds.OverlaySettings]: <IconSettings size={20} />,
      [ActionIds.OverlayHelp]: <IconHelp size={20} />,
    };

    return icons;
  }, []);

  const invokeAction = useCallback((actionId: ActionId, options?: { closeAfter?: boolean }) => {
    const closeAfter = options?.closeAfter ?? true;
    haptics.selection();

    const action = getActionFromRegistry(actionId);
    if (action?.overlayId && action.overlayAction) {
      const overlayId = action.overlayId as OverlayId;
      if (action.overlayAction === 'open') {
        openOverlay(overlayId);
      } else {
        toggleOverlay(overlayId);
      }

      if (closeAfter) onClose();
      return;
    }

    switch (actionId) {
      case ActionIds.ViewCycleMode:
        toggleViewMode();
        break;
      case ActionIds.ViewToggle3DModel:
        toggle3DModel();
        break;
      case ActionIds.ViewZoomIn:
        zoomIn();
        break;
      case ActionIds.ViewZoomOut:
        zoomOut();
        break;
      default:
        break;
    }

    if (closeAfter) onClose();
  }, [onClose, openOverlay, toggle3DModel, toggleOverlay, toggleViewMode, zoomIn, zoomOut]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Quick actions"
      showHandle={true}
      closeOnBackdropTap={true}
      swipeToDismiss={true}
      initialSnapPoint={initialSnapPoint}
      minHeight={35}
      maxHeight={85}
    >
      <div className="action-drawer" id="action-drawer">
        {ACTION_DRAWER_SECTIONS.map((category) => (
          <div key={category.id} className="action-drawer__category">
            <h3 className="action-drawer__category-label">{category.label}</h3>
            <div className="action-drawer__grid">
              {category.items.map((item) => {
                const action = getActionFromRegistry(item.actionId);
                if (!action) return null;

                const shortcut = formatActionShortcutForSurface(item.actionId, shortcutPlatform);
                const icon = actionIcons[item.actionId] ?? <IconCommand size={20} />;

                const label = item.labelStrategy === 'viewMode'
                  ? `Mode: ${viewModeLabel}`
                  : action.title;

                const closeAfter = item.closeAfter ?? true;

                const active = item.actionId === ActionIds.ViewToggle3DModel ? show3DModel : false;
                const disabled = !hasPhage && category.id !== 'tools';
                const zoomDisabled = item.actionId === ActionIds.ViewZoomIn
                  ? zoomScale >= 4.0
                  : item.actionId === ActionIds.ViewZoomOut
                    ? zoomScale <= 0.1
                    : false;

                const isDisabled = disabled || zoomDisabled;

                return (
                  <button
                    key={item.actionId}
                    type="button"
                    className={`action-drawer__item ${active ? 'action-drawer__item--active' : ''} ${isDisabled ? 'action-drawer__item--disabled' : ''}`}
                    onClick={() => invokeAction(item.actionId, { closeAfter })}
                    disabled={isDisabled}
                    aria-pressed={active}
                    data-action-id={item.actionId}
                  >
                    <span className="action-drawer__item-icon">{icon}</span>
                    <span className="action-drawer__item-label">{label}</span>
                    {shortcut && (
                      <kbd className="action-drawer__item-shortcut" aria-hidden="true">
                        {shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}

export default ActionDrawer;
