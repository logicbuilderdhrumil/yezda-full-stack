/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import type {
  RenderResult,
  RenderOptions,
  queries,
  BoundFunctions,
} from '@testing-library/react';
import type { ReactNode } from 'react';

declare module 'vitest' {
  interface Assertion<T = unknown> extends TestingLibraryMatchers<T, void> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, void> {}
}

// Custom event init type that allows target property for testing
interface TestingEventInit extends Record<string, unknown> {
  target?: { value?: string; files?: File[] | FileList; innerHTML?: string; checked?: boolean };
  dataTransfer?: { files?: File[] | FileList };
}

// Augment @testing-library/react module with missing exports
declare module '@testing-library/react' {
  export const screen: BoundFunctions<typeof queries>;
  export const fireEvent: {
    (element: Document | Element | Window | Node, event: Event): boolean;
    change: (element: Document | Element | Window | Node, init?: TestingEventInit) => boolean;
    input: (element: Document | Element | Window | Node, init?: TestingEventInit) => boolean;
    click: (element: Document | Element | Window | Node, init?: MouseEventInit) => boolean;
    submit: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    focus: (element: Document | Element | Window | Node, init?: FocusEventInit) => boolean;
    blur: (element: Document | Element | Window | Node, init?: FocusEventInit) => boolean;
    keyDown: (element: Document | Element | Window | Node, init?: KeyboardEventInit) => boolean;
    keyUp: (element: Document | Element | Window | Node, init?: KeyboardEventInit) => boolean;
    keyPress: (element: Document | Element | Window | Node, init?: KeyboardEventInit) => boolean;
    mouseDown: (element: Document | Element | Window | Node, init?: MouseEventInit) => boolean;
    mouseUp: (element: Document | Element | Window | Node, init?: MouseEventInit) => boolean;
    mouseEnter: (element: Document | Element | Window | Node, init?: MouseEventInit) => boolean;
    mouseLeave: (element: Document | Element | Window | Node, init?: MouseEventInit) => boolean;
    mouseMove: (element: Document | Element | Window | Node, init?: MouseEventInit) => boolean;
    mouseOver: (element: Document | Element | Window | Node, init?: MouseEventInit) => boolean;
    mouseOut: (element: Document | Element | Window | Node, init?: MouseEventInit) => boolean;
    dblClick: (element: Document | Element | Window | Node, init?: MouseEventInit) => boolean;
    contextMenu: (element: Document | Element | Window | Node, init?: MouseEventInit) => boolean;
    drag: (element: Document | Element | Window | Node, init?: TestingEventInit) => boolean;
    dragEnd: (element: Document | Element | Window | Node, init?: TestingEventInit) => boolean;
    dragEnter: (element: Document | Element | Window | Node, init?: TestingEventInit) => boolean;
    dragExit: (element: Document | Element | Window | Node, init?: TestingEventInit) => boolean;
    dragLeave: (element: Document | Element | Window | Node, init?: TestingEventInit) => boolean;
    dragOver: (element: Document | Element | Window | Node, init?: TestingEventInit) => boolean;
    dragStart: (element: Document | Element | Window | Node, init?: TestingEventInit) => boolean;
    drop: (element: Document | Element | Window | Node, init?: TestingEventInit) => boolean;
    scroll: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    wheel: (element: Document | Element | Window | Node, init?: WheelEventInit) => boolean;
    copy: (element: Document | Element | Window | Node, init?: ClipboardEventInit) => boolean;
    cut: (element: Document | Element | Window | Node, init?: ClipboardEventInit) => boolean;
    paste: (element: Document | Element | Window | Node, init?: ClipboardEventInit) => boolean;
    select: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    touchStart: (element: Document | Element | Window | Node, init?: TouchEventInit) => boolean;
    touchEnd: (element: Document | Element | Window | Node, init?: TouchEventInit) => boolean;
    touchMove: (element: Document | Element | Window | Node, init?: TouchEventInit) => boolean;
    touchCancel: (element: Document | Element | Window | Node, init?: TouchEventInit) => boolean;
    pointerOver: (element: Document | Element | Window | Node, init?: PointerEventInit) => boolean;
    pointerEnter: (element: Document | Element | Window | Node, init?: PointerEventInit) => boolean;
    pointerDown: (element: Document | Element | Window | Node, init?: PointerEventInit) => boolean;
    pointerMove: (element: Document | Element | Window | Node, init?: PointerEventInit) => boolean;
    pointerUp: (element: Document | Element | Window | Node, init?: PointerEventInit) => boolean;
    pointerCancel: (element: Document | Element | Window | Node, init?: PointerEventInit) => boolean;
    pointerOut: (element: Document | Element | Window | Node, init?: PointerEventInit) => boolean;
    pointerLeave: (element: Document | Element | Window | Node, init?: PointerEventInit) => boolean;
    reset: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    invalid: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    focusIn: (element: Document | Element | Window | Node, init?: FocusEventInit) => boolean;
    focusOut: (element: Document | Element | Window | Node, init?: FocusEventInit) => boolean;
    compositionStart: (element: Document | Element | Window | Node, init?: CompositionEventInit) => boolean;
    compositionUpdate: (element: Document | Element | Window | Node, init?: CompositionEventInit) => boolean;
    compositionEnd: (element: Document | Element | Window | Node, init?: CompositionEventInit) => boolean;
    gotPointerCapture: (element: Document | Element | Window | Node, init?: PointerEventInit) => boolean;
    lostPointerCapture: (element: Document | Element | Window | Node, init?: PointerEventInit) => boolean;
    pointerLockChange: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    pointerLockError: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    animationStart: (element: Document | Element | Window | Node, init?: AnimationEventInit) => boolean;
    animationEnd: (element: Document | Element | Window | Node, init?: AnimationEventInit) => boolean;
    animationIteration: (element: Document | Element | Window | Node, init?: AnimationEventInit) => boolean;
    transitionEnd: (element: Document | Element | Window | Node, init?: TransitionEventInit) => boolean;
    abort: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    canPlay: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    canPlayThrough: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    durationChange: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    emptied: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    encrypted: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    ended: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    loadedData: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    loadedMetadata: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    loadStart: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    pause: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    play: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    playing: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    progress: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    rateChange: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    seeked: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    seeking: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    stalled: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    suspend: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    timeUpdate: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    volumeChange: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    waiting: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    load: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    error: (element: Document | Element | Window | Node, init?: EventInit) => boolean;
    doubleClick: (element: Document | Element | Window | Node, init?: MouseEventInit) => boolean;
  };
  export function waitFor<T>(
    callback: () => T | Promise<T>,
    options?: {
      container?: Element;
      timeout?: number;
      interval?: number;
      onTimeout?: (error: Error) => Error;
      mutationObserverOptions?: MutationObserverInit;
    }
  ): Promise<T>;
  export function render(
    ui: ReactNode,
    options?: RenderOptions
  ): RenderResult;
  export function cleanup(): void;
  export function act(callback: () => void | Promise<void>): Promise<void>;
}
