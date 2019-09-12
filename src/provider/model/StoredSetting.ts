/**
 * List of available settings in the settings collection.
 */
export const enum SettingsMap {
}

/**
 * Shape of the internal settings stored in the database.
 */
export interface StoredSetting {
    id: SettingsMap,
    value: any;
}
