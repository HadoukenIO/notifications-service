declare module '*.module.scss' {
    interface ClassNames {
        [className: string]: string;
    }
    const classNames: ClassNames;
    export = classNames;
}

declare module '*.svg' {
    const content: string;
    export default content;
}
