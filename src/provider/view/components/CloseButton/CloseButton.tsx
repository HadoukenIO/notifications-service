import * as React from 'react';

interface CloseButtonProps {
    onClick: () => void;
}

export function CloseButton(props: CloseButtonProps) {
    const {onClick} = props;

    const handleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        onClick();
    };

    return (
        <div className="close" onClick={handleClick}>
            <img
                src="image/shapes/notifications-x.png"
                alt="Clear notification"
            />
        </div>
    );
}
