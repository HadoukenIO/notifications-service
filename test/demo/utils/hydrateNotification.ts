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

    // customData is never changed in any way by the provider
    expect(fullNote.customData).toEqual(options.customData);

    const expectedValues = {
        body: options.body,
        title: options.title,
        subtitle: options.subtitle || '',
        icon: options.icon || '',
        buttons: options.buttons ? options.buttons.map(btn => ({...btn, iconUrl: btn.iconUrl || ''})) : []
    };
    expect(fullNote).toMatchObject(expectedValues);
}
