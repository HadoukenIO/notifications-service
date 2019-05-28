import {createStandardAction, createCustomAction} from 'typesafe-actions';

export const toggleCenterWindowVisibility = createCustomAction(
    '@@ui/TOGGLE_CENTER_WINDOW',
    type => {
        return (visible?: boolean) => ({
            type,
            payload: {
                visible
            }
        });
    }
);


export const changeToastDirection = createCustomAction(
    '@@ui/CHANGE_TOAST_DIRECTION',
    type => {
        return (direction: readonly [number, number]) => ({
            type,
            payload: {
                direction
            }
        });
    }
);
