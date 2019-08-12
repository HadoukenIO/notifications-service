/**
 * List of available settings in the settings collection.
 */
export const enum SettingsMap {
    WINDOW_VISIBLE = 'windowVisible'
}

/**
 * Available keys on the Settings collection.
 */
export interface StoredSettings {
    id: SettingsMap,
    value: any;
}
