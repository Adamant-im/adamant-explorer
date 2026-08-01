const TOOLTIP_ID = 'app-tooltip';
const VIEWPORT_PADDING = 10;
const TOOLTIP_GAP = 10;
const HIDE_DELAY = 100;
const TOUCH_DURATION = 2400;
const PLACEMENTS = new Set(['top', 'right', 'bottom', 'left']);
const TONES = new Set([
  'default',
  'blue',
  'green',
  'orange',
  'red',
  'violet',
  'grey',
  'online',
  'degraded',
  'critical',
  'connecting',
  'delayed',
]);

const elementStates = new WeakMap();
let activeElement = null;
let tooltipElement = null;
let hideTimer = null;
let touchTimer = null;

/**
 * Normalizes a tooltip directive value.
 *
 * A string uses the default visual treatment. Object values may select a
 * semantic tone and preferred placement while keeping unsupported values
 * constrained to safe defaults.
 *
 * @param {string|Object|null|undefined} value Directive binding value
 * @returns {{content: string, tone: string, placement: string}} Tooltip settings
 */
export function normalizeTooltip(value) {
  const settings = typeof value === 'object' && value !== null ? value : { content: value };
  const content = settings.content == null ? '' : String(settings.content).trim();

  return {
    content,
    tone: TONES.has(settings.tone) ? settings.tone : 'default',
    placement: PLACEMENTS.has(settings.placement) ? settings.placement : 'top',
  };
}

/** Creates the single body-level tooltip used by every directive instance. */
function getTooltipElement() {
  if (tooltipElement) {
    return tooltipElement;
  }

  tooltipElement = document.createElement('div');
  tooltipElement.id = TOOLTIP_ID;
  tooltipElement.className = 'app-tooltip';
  tooltipElement.setAttribute('role', 'tooltip');
  // Tapping the tooltip dismisses it; on touch devices the auto-hide
  // timer is not always reliable, so this is the guaranteed way out.
  tooltipElement.addEventListener('pointerdown', () => hideTooltip());
  document.body.append(tooltipElement);

  return tooltipElement;
}

/**
 * Selects a fallback side when the preferred side has too little room.
 * @param {string} preferred Preferred placement
 * @param {DOMRect} anchorRect Anchor element bounds
 * @param {DOMRect} tooltipRect Tooltip bounds
 * @returns {string} Resolved placement
 */
function resolvePlacement(preferred, anchorRect, tooltipRect) {
  if (preferred === 'top' && anchorRect.top < tooltipRect.height + TOOLTIP_GAP) {
    return 'bottom';
  }
  if (
    preferred === 'bottom' &&
    window.innerHeight - anchorRect.bottom < tooltipRect.height + TOOLTIP_GAP
  ) {
    return 'top';
  }
  if (preferred === 'left' && anchorRect.left < tooltipRect.width + TOOLTIP_GAP) {
    return 'right';
  }
  if (
    preferred === 'right' &&
    window.innerWidth - anchorRect.right < tooltipRect.width + TOOLTIP_GAP
  ) {
    return 'left';
  }

  return preferred;
}

/**
 * Places the floating tooltip beside its active anchor and clamps it to the viewport.
 * @param {HTMLElement} element Active anchor element
 * @param {string} preferred Preferred placement
 */
function positionTooltip(element, preferred) {
  if (activeElement !== element || !tooltipElement) {
    return;
  }

  const anchorRect = element.getBoundingClientRect();
  const tooltipRect = tooltipElement.getBoundingClientRect();
  const placement = resolvePlacement(preferred, anchorRect, tooltipRect);
  let top;
  let left;

  if (placement === 'bottom') {
    top = anchorRect.bottom + TOOLTIP_GAP;
    left = anchorRect.left + (anchorRect.width - tooltipRect.width) / 2;
  } else if (placement === 'left') {
    top = anchorRect.top + (anchorRect.height - tooltipRect.height) / 2;
    left = anchorRect.left - tooltipRect.width - TOOLTIP_GAP;
  } else if (placement === 'right') {
    top = anchorRect.top + (anchorRect.height - tooltipRect.height) / 2;
    left = anchorRect.right + TOOLTIP_GAP;
  } else {
    top = anchorRect.top - tooltipRect.height - TOOLTIP_GAP;
    left = anchorRect.left + (anchorRect.width - tooltipRect.width) / 2;
  }

  top = Math.min(
    Math.max(top, VIEWPORT_PADDING),
    window.innerHeight - tooltipRect.height - VIEWPORT_PADDING,
  );
  left = Math.min(
    Math.max(left, VIEWPORT_PADDING),
    window.innerWidth - tooltipRect.width - VIEWPORT_PADDING,
  );

  tooltipElement.dataset.placement = placement;
  tooltipElement.style.top = `${Math.round(top)}px`;
  tooltipElement.style.left = `${Math.round(left)}px`;

  const arrowOffset =
    placement === 'top' || placement === 'bottom'
      ? anchorRect.left + anchorRect.width / 2 - left
      : anchorRect.top + anchorRect.height / 2 - top;

  tooltipElement.style.setProperty('--tooltip-arrow-offset', `${Math.round(arrowOffset)}px`);
  tooltipElement.classList.add('visible');
}

/** Repositions the active tooltip after page movement or viewport changes. */
function repositionActiveTooltip() {
  const state = activeElement && elementStates.get(activeElement);

  if (state) {
    positionTooltip(activeElement, state.settings.placement);
  }
}

/**
 * Opens a tooltip for an element.
 * @param {HTMLElement} element Anchor element
 */
function showTooltip(element) {
  const state = elementStates.get(element);

  if (!state?.settings.content) {
    return;
  }

  clearTimeout(hideTimer);
  const tooltip = getTooltipElement();

  if (activeElement && activeElement !== element) {
    activeElement.removeAttribute('aria-describedby');
  }

  activeElement = element;
  tooltip.textContent = state.settings.content;
  tooltip.dataset.tone = state.settings.tone;
  tooltip.classList.remove('visible');
  tooltip.style.removeProperty('display');
  element.setAttribute('aria-describedby', TOOLTIP_ID);

  window.requestAnimationFrame(() => positionTooltip(element, state.settings.placement));
}

/**
 * Closes the active tooltip.
 * @param {HTMLElement} [element] Optional anchor; ignored when another tooltip is active
 */
function hideTooltip(element) {
  if (element && element !== activeElement) {
    return;
  }

  clearTimeout(touchTimer);
  const previousElement = activeElement;
  activeElement = null;
  previousElement?.removeAttribute('aria-describedby');
  tooltipElement?.classList.remove('visible');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (!activeElement && tooltipElement) {
      tooltipElement.style.display = 'none';
    }
  }, HIDE_DELAY);
}

/**
 * Keeps focus behavior aligned with whether the trigger has tooltip content.
 * @param {HTMLElement} element Directive host
 * @param {Object} state Stored directive state
 */
function syncTriggerAccessibility(element, state) {
  const enabled = Boolean(state.settings.content);

  element.classList.toggle('tooltip-trigger', enabled);

  if (!state.isNaturallyFocusable && enabled && !state.addedTabIndex) {
    element.setAttribute('tabindex', '0');
    state.addedTabIndex = true;
  } else if (state.addedTabIndex && !enabled) {
    element.removeAttribute('tabindex');
    state.addedTabIndex = false;
  }
}

/**
 * Registers hover, keyboard-focus, and touch interactions for one anchor.
 * @param {HTMLElement} element Directive host
 * @param {Object} binding Vue directive binding
 */
function mountTooltip(element, binding) {
  const isNaturallyFocusable = element.matches(
    'a[href], button, input, select, textarea, summary, [tabindex]',
  );
  const state = {
    settings: normalizeTooltip(binding.value),
    isNaturallyFocusable,
    addedTabIndex: false,
    onPointerEnter: (event) => {
      if (event.pointerType !== 'touch') {
        showTooltip(element);
      }
    },
    onPointerLeave: (event) => {
      if (event.pointerType !== 'touch') {
        hideTooltip(element);
      }
    },
    onFocus: () => showTooltip(element),
    onBlur: () => hideTooltip(element),
    onPointerDown: (event) => {
      if (event.pointerType === 'touch') {
        showTooltip(element);
        clearTimeout(touchTimer);
        touchTimer = setTimeout(() => hideTooltip(element), TOUCH_DURATION);
      }
    },
    onKeyDown: (event) => {
      if (event.key === 'Escape') {
        hideTooltip(element);
      }
    },
    onHide: () => hideTooltip(element),
  };

  syncTriggerAccessibility(element, state);
  elementStates.set(element, state);
  element.addEventListener('pointerenter', state.onPointerEnter);
  element.addEventListener('pointerleave', state.onPointerLeave);
  element.addEventListener('focus', state.onFocus);
  element.addEventListener('blur', state.onBlur);
  element.addEventListener('pointerdown', state.onPointerDown);
  element.addEventListener('keydown', state.onKeyDown);
  element.addEventListener('tooltip:hide', state.onHide);
}

/**
 * Global Vue directive for body-level, unclipped explorer tooltips.
 *
 * The tooltip opens on hover or keyboard focus, remains usable on touch
 * screens, and follows its anchor while the page scrolls.
 */
export const tooltipDirective = {
  mounted: mountTooltip,
  updated(element, binding) {
    const state = elementStates.get(element);

    if (!state) {
      return;
    }

    state.settings = normalizeTooltip(binding.value);
    syncTriggerAccessibility(element, state);

    if (activeElement === element) {
      if (state.settings.content) {
        showTooltip(element);
      } else {
        hideTooltip(element);
      }
    }
  },
  unmounted(element) {
    const state = elementStates.get(element);

    if (!state) {
      return;
    }

    if (activeElement === element) {
      hideTooltip(element);
    }

    element.removeEventListener('pointerenter', state.onPointerEnter);
    element.removeEventListener('pointerleave', state.onPointerLeave);
    element.removeEventListener('focus', state.onFocus);
    element.removeEventListener('blur', state.onBlur);
    element.removeEventListener('pointerdown', state.onPointerDown);
    element.removeEventListener('keydown', state.onKeyDown);
    element.removeEventListener('tooltip:hide', state.onHide);
    element.classList.remove('tooltip-trigger');

    if (state.addedTabIndex) {
      element.removeAttribute('tabindex');
    }

    elementStates.delete(element);
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', repositionActiveTooltip, true);
  window.addEventListener('resize', repositionActiveTooltip);
}
