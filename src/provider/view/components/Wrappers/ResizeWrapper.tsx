import React from 'react';

interface Props {
    onSize?: (dimensions: {x: number; y: number}) => void;
}

const style: React.CSSProperties = {
    margin: '0',
    display: 'inline-block',
    userSelect: 'none',
    cursor: 'pointer',
    overflow: 'hidden! important'
};

export function ResizeWrapper(props: React.PropsWithChildren<Props>) {
    const {children, onSize} = props;
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Get the size of the container ref
    const updateWindowDimensions = () => {
        if (containerRef && containerRef.current) {
            const {width, height} = containerRef.current.getBoundingClientRect();
            if (width && height) {
                if (onSize) {
                    onSize({x: width, y: height});
                }
            }
        }
    };

    React.useEffect(() => {
        if (containerRef.current === null) {
            return;
        }
        updateWindowDimensions();
    });

    return (
        <div ref={containerRef} style={style}>
            {
                React.Children.only(children)
            }
        </div>
    );
}
