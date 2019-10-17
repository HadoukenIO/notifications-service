import React from 'react';
import {CSSTransition} from 'react-transition-group';

import {CircleButton, IconType} from '../CircleButton/CircleButton';
import './ClearAllPrompt.scss';

interface Props {
    centerVisible: boolean;
    onAccept: () => void;
    onCancel?: () => void;
}

export function ClearAllPrompt(props: Props) {
    const {onAccept, onCancel, centerVisible} = props;
    const [clearAllPromptVisible, setClearAllPromptVisible] = React.useState(false);
    const [mouseDown, setMouseDown] = React.useState(false);
    const divRef = React.createRef<HTMLDivElement>();

    const togglePrompt = (visibility?: boolean, action?: () => void) => {
        setClearAllPromptVisible(visibility || !clearAllPromptVisible);
        if (action) {
            action();
        }
    };

    const handleBlur = () => {
        if (!mouseDown) {
            togglePrompt(false);
        }
    };

    React.useEffect(() => {
        if (!centerVisible) {
            setClearAllPromptVisible(false);
        }
        if (clearAllPromptVisible) {
            divRef.current!.focus();
        }
    }, [clearAllPromptVisible, centerVisible]);

    // Blur and click event both fire when trying to close the prompt by clicking "Clear All".
    // To prevent this we have to track if the mouse is down and ignore the blur.
    // Events are ordered: MouseDown, Blur, MouseUp, Click
    return (
        <span className="clear detail"
            onMouseDown={() => setMouseDown(true)}
            onMouseUp={() => setMouseDown(false)}
            onClick={() => togglePrompt()}
        >
            Clear all
            <CSSTransition
                in={clearAllPromptVisible}
                timeout={200}
                classNames="animate"
                unmountOnExit
            >
                <div tabIndex={0} className="prompt" ref={divRef} onBlur={handleBlur}>
                    <CircleButton type={IconType.CANCEL} onClick={() => togglePrompt(false, onCancel)} alt="Cancel" />
                    <CircleButton type={IconType.ACCEPT} onClick={() => togglePrompt(false, onAccept)} alt="Accept" />
                </div>
            </CSSTransition>
        </span>
    );
}
