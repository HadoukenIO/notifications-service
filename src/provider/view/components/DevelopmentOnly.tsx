interface DevelopementOnlyProps {
    children?: React.ReactElement;
}

export function DevelopmentOnly(props: DevelopementOnlyProps): React.ReactElement | null {
    if (process.env.NODE_ENV === 'production') {
        return null;
    } else {
        console.log(props.children);
        return props.children ? props.children : null;
    }
}
