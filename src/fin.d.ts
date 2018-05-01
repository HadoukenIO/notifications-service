/**
 * @description Definition file for Fin object
 */
export type Fin = {
    desktop: {
        main: (fn: Function) => void
        Service: {
            register: () => any,
            connect: (arg: any) => any
        },
        System: any,
        Window: any,
        InterApplicationBus: any,
        Notification:any,
        Application: any
    },
    notifications: any
}