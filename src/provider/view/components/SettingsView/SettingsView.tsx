import * as React from 'react';
import {connect} from 'react-redux';

import {RootState} from '../../../store/State';
import {ToggleCenterLocked, ToggleCenterMuted} from '../../../store/Actions';
import {usePreduxStore} from '../../utils/usePreduxStore';
import {ClassNameBuilder} from '../../utils/ClassNameBuilder';
import {Toggle} from '../Controls/Toggle/Toggle';

import * as Styles from './SettingsView.module.scss';

interface Props {
    centerLocked: boolean;
    centerMuted: boolean;
}

export const SettingsViewComponent: React.FC<Props> = (props) => {
    const {centerLocked, centerMuted} = props;
    const storeApi = usePreduxStore();

    return (
        <div className={ClassNameBuilder.join(Styles, 'settings-view')}>
            <div className={ClassNameBuilder.join(Styles, 'notifications', 'section')}>
                <ul>
                    <li>
                        <span>Auto-hide center</span>
                        <Toggle id="lock-link" state={!centerLocked} onChange={() => {
                            new ToggleCenterLocked().dispatch(storeApi);
                        }} />
                    </li>
                    <li>
                        <span>Do not disturb</span>
                        <Toggle id="mute-link" state={centerMuted} onChange={() => {
                            new ToggleCenterMuted().dispatch(storeApi);
                        }} />
                    </li>
                </ul>
            </div>
        </div>
    );
};

const mapStateToProps = (state: RootState) => ({
    centerLocked: state.centerLocked,
    centerMuted: state.centerMuted
});

export const SettingsView = connect(mapStateToProps)(SettingsViewComponent);
