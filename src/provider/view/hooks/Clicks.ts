import * as React from 'react';

/**
 * Prevents {@link ref|`element`} element from recieving `onClick` events when a click is initiated on a child
 * that prevents `onmousedown` from propagating and the mouse is moved on to the `element`.
 * Use the hook {@link usePreventMouseDownPropagating} to achieve this.
 * @param ref Target HTML element.
 */
export const useOnClickOnly = (ref: React.RefObject<HTMLElement>): [boolean, () => void] => {
    const [valid, setValid] = React.useState(false);
    React.useEffect(() => {
        if (ref && ref.current) {
            ref.current.addEventListener('mousedown', (event: MouseEvent) => {
                setValid(true);
            });
        }
    }, [ref]);
    return [valid, () => setValid(false)];
};

/**
 * Prevent `mousedown` from propagating up the DOM tree.
 * @param ref Target HTML element to capture `mousedown`.
 */
export const usePreventMouseDownPropagating = (ref: React.RefObject<HTMLElement>): void => {
    React.useEffect(() => {
        if (ref && ref.current) {
            ref.current.addEventListener('mousedown', (event) => {
                event.stopImmediatePropagation();
                event.stopPropagation();
                event.preventDefault();
            });
        }
    }, [ref]);
};
