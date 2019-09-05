import {NotificationOptions, Notification} from '../../../src/client';

export function assertHydratedCorrectly(options: NotificationOptions, fullNote: Notification): void {
    // Handle `id` and `date` seperately as these cannot be predicted if undefined
    if (options.id) {
        expect(fullNote.id).toEqual(options.id);
    } else {
        expect(fullNote.id).toMatch(/[0-9]{9}/);
    }
    if (options.date) {
        expect(fullNote.date).toEqual(options.date);
    } else {
        expect(fullNote.date).toBeInstanceOf(Date);
    }

    const expectedValues = {
        body: options.body,
        title: options.title,
        icon: options.icon || '',
        customData: options.customData !== undefined ? options.customData : {},
        expiration: options.expiration !== undefined && options.expiration !== null ? new Date(options.expiration) : null,
        buttons: options.buttons ? options.buttons.map(btn => ({...btn, iconUrl: btn.iconUrl || ''})) : []
    };
    expect(fullNote).toMatchObject(expectedValues);
}
