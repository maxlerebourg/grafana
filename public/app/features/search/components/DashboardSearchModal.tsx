import { css } from '@emotion/css';
import { useDialog } from '@react-aria/dialog';
import { FocusScope } from '@react-aria/focus';
import { OverlayContainer, useOverlay } from '@react-aria/overlays';
import React, { useRef, useState } from 'react';
import CSSTransition from 'react-transition-group/CSSTransition';
import { useLocalStorage } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { IconButton, useStyles2 } from '@grafana/ui';

import { SEARCH_PANELS_LOCAL_STORAGE_KEY } from '../constants';
import { useKeyNavigationListener } from '../hooks/useSearchKeyboardSelection';
import { useSearchQuery } from '../hooks/useSearchQuery';
import { SearchView } from '../page/components/SearchView';

const ANIMATION_DURATION = 200;

export interface Props {
  isOpen: boolean;
}

export function DashboardSearchModal({ isOpen }: Props) {
  const styles = useStyles2(getStyles);
  const animStyles = useStyles2((theme) => getAnimStyles(theme, ANIMATION_DURATION));
  const { query, onQueryChange, onCloseSearch } = useSearchQuery({});
  const ref = useRef<HTMLDivElement>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  const { overlayProps, underlayProps } = useOverlay({ isOpen, onClose: onCloseSearch }, ref);

  const { dialogProps } = useDialog({}, ref);

  let [includePanels, setIncludePanels] = useLocalStorage<boolean>(SEARCH_PANELS_LOCAL_STORAGE_KEY, true);
  if (!config.featureToggles.panelTitleSearch) {
    includePanels = false;
  }

  const onSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(e.currentTarget.value);
  };

  const { onKeyDown, keyboardEvents } = useKeyNavigationListener();

  return (
    <OverlayContainer>
      <CSSTransition appear in timeout={ANIMATION_DURATION} classNames={animStyles.underlay}>
        <div onClick={onCloseSearch} className={styles.underlay} {...underlayProps} />
      </CSSTransition>
      <CSSTransition
        onEntered={() => setAnimationComplete(true)}
        appear
        in
        timeout={ANIMATION_DURATION}
        classNames={animStyles.overlay}
      >
        <div ref={ref} className={styles.overlay} {...overlayProps} {...dialogProps}>
          <FocusScope contain autoFocus>
            <div className={styles.searchField}>
              <div>
                <input
                  type="text"
                  placeholder={includePanels ? 'Search dashboards and panels by name' : 'Search dashboards by name'}
                  value={query.query ?? ''}
                  onChange={onSearchQueryChange}
                  onKeyDown={onKeyDown}
                  tabIndex={0}
                  spellCheck={false}
                  className={styles.input}
                  autoFocus
                />
              </div>

              <div className={styles.closeBtn}>
                <IconButton name="times" onClick={onCloseSearch} size="xl" tooltip="Close search" />
              </div>
            </div>
            {animationComplete && (
              <div className={styles.search}>
                <SearchView
                  showManage={false}
                  includePanels={includePanels!}
                  setIncludePanels={setIncludePanels}
                  keyboardEvents={keyboardEvents}
                />
              </div>
            )}
          </FocusScope>
        </div>
      </CSSTransition>
    </OverlayContainer>
  );
}

const getAnimStyles = (theme: GrafanaTheme2, animationDuration: number) => {
  const commonTransition = {
    transitionDuration: `${animationDuration}ms`,
    transitionTimingFunction: theme.transitions.easing.easeInOut,
  };

  const underlayTransition = {
    [theme.breakpoints.up('md')]: {
      ...commonTransition,
      transitionProperty: 'opacity',
    },
  };

  const underlayClosed = {
    [theme.breakpoints.up('md')]: {
      opacity: 0,
    },
  };

  const underlayOpen = {
    [theme.breakpoints.up('md')]: {
      opacity: 1,
    },
  };

  const overlayTransition = {
    [theme.breakpoints.up('md')]: {
      ...commonTransition,
      transitionProperty: 'height, width',
      overflow: 'hidden',
    },
  };

  const overlayClosed = {
    height: '100%',
    width: '100%',
    [theme.breakpoints.up('md')]: {
      height: '32px',
      width: '50%',
    },
  };

  const overlayOpen = {
    height: '100%',
    width: '100%',
    [theme.breakpoints.up('md')]: {
      height: '90%',
      width: '75%',
    },
  };

  return {
    overlay: {
      appear: css(overlayClosed),
      appearActive: css(overlayTransition, overlayOpen),
      appearDone: css(overlayOpen),
    },
    underlay: {
      appear: css(underlayClosed),
      appearActive: css(underlayTransition, underlayOpen),
      appearDone: css(underlayOpen),
    },
  };
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    underlay: css`
      background-color: ${theme.components.overlay.background};
      backdrop-filter: blur(1px);
      bottom: 0;
      left: 0;
      padding: 0;
      position: fixed;
      right: 0;
      top: 0;
      z-index: ${theme.zIndex.modalBackdrop};
    `,
    overlay: css`
      background: ${theme.colors.background.primary};
      border: 1px solid ${theme.components.panel.borderColor};
      display: flex;
      flex-direction: column;
      margin: 0 auto;
      padding: ${theme.spacing(1)};
      position: fixed;
      height: 100%;
      z-index: ${theme.zIndex.modal};

      ${theme.breakpoints.up('md')} {
        border-radius: ${theme.shape.borderRadius(2)};
        box-shadow: ${theme.shadows.z3};
        left: 0;
        margin: ${theme.spacing(0.5, 'auto', 0)};
        padding: ${theme.spacing(1)};
        right: 0;
      }
    `,
    closeBtn: css`
      right: -5px;
      top: 0px;
      z-index: 1;
      position: absolute;
    `,
    searchField: css`
      position: relative;
    `,
    search: css`
      display: flex;
      flex-direction: column;
      overflow: hidden;
      height: 100%;
      padding: ${theme.spacing(2, 0, 3, 0)};
    `,
    input: css`
      box-sizing: border-box;
      outline: none;
      background-color: transparent;
      background: transparent;
      border-bottom: 1px solid ${theme.colors.border.medium};
      font-size: 16px;
      line-height: 30px;
      width: 100%;

      &::placeholder {
        color: ${theme.colors.text.disabled};
      }
    `,
  };
};
