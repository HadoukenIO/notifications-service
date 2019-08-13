/**
 * List of available settings in the settings collection.
 */
export const enum SettingsMap {
    WINDOW_VISIBLE = 'windowVisible'
}

/**
 * Shape of the internal settings stored in the database.
 */
export interface StoredSettings {
    id: SettingsMap,
    value: any;
}
