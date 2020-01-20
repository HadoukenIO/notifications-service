import * as React from 'react';

import {ClassNameBuilder} from '../../../utils/ClassNameBuilder';

import * as Styles from './Toggle.module.scss';

interface Props {
    state: boolean;
    className?: string;
    id?: string;
    onChange?: (state: boolean) => void;
}

export const Toggle: React.FC<Props> = (props) => {
    const {state, onChange, id, className = ''} = props;
    const [toggleState, setToggleState] = React.useState(state);
    const toggleClassName = new ClassNameBuilder(Styles, 'toggle', ['on', toggleState], ['off', !toggleState]);
    toggleClassName.add(className, undefined);
    const handleToggle = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        setToggleState(!toggleState);
        if (onChange) {
            onChange(toggleState);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        event.stopPropagation();
        if (event.key === 'Enter') {
            setToggleState(!toggleState);
        }
    };

    return (
        <div id={id} className={toggleClassName.toString()} onClick={handleToggle} onKeyPress={handleKeyPress} tabIndex={0}>
            <div className={Styles['inner']}>
                <div className={Styles['knob']} ></div>
            </div>
        </div>
    );
};
