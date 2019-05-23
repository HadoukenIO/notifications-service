import {createStandardAction, createCustomAction} from 'typesafe-actions';

// export const toggleCenterWindowVisibility = createStandardAction('@@ui/TOGGLE_WINDOW')<boolean | undefined>();

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

type DirectionPayload = {direction: [number, number]};

export const changeActionDirection = createStandardAction('@@ui/CHANGE_ACTION_DIRECTION')<DirectionPayload>();

export const changeBannerDirection = createStandardAction('@@ui/CHANGE_BANNER_DIRECTION')<DirectionPayload>();
