/**
 * Declare all injectable types/values here.
 *
 * This enum determines the keys that can be used within `@inject` tags. The mapping of these tags to default concrete types is defined in
 * `Injector.ts`. These mappings can be programmatically overridden by calling the methods of the {@link Injector} util.
 */
enum Injectable {
    API_HANDLER,
    CLIENT_EVENT_CONTROLLER,
    CLIENT_REGISTRY,
    DATABASE,
    ENVIRONMENT,
    EVENT_PUMP,
    EXPIRY_CONTROLLER,
    LAYOUTER,
    MONITOR_MODEL,
    NOTIFICATION_CENTER,
    PERSISTOR,
    STORE,
    TOAST_MANAGER,
    TRAY_ICON,
    WEB_WINDOW_FACTORY
}

/**
 * A map type to enforce that we specify a value for every injectable
 */
export type InjectableMap<V = object> = {
    [K in keyof typeof Injectable]: K extends string ? V : never;
};

type InjectableSelfMap = {
    [K in keyof typeof Injectable]: K extends string ? K : never;
};

/**
 * Create exported symbol map.
 *
 * These are used as the keys that control what will get injected into class members.
 */
export const Inject: InjectableSelfMap = Object.keys(Injectable).filter((k) => typeof k === 'string').reduce<InjectableSelfMap>((map, item) => {
    (map as any)[item] = item;
    return map;
}, {} as InjectableSelfMap);
