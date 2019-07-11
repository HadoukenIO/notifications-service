import {NotificationOptions, Notification} from '../../../src/client';

export function assertHydratedCorrectly(options: NotificationOptions, fullNote: Notification): void {
    // Handle `id` and `date` seperately as these cannot be predicted if undefined
    if (options.id) {
        expect(fullNote.id).toEqual(options.id);
    }
    if (options.date) {
        expect(fullNote.date).toEqual(options.date);
    }

    // customData is never changed in any way by the provider
    expect(fullNote.customData).toEqual(options.customData);

    // Hydrate the buttons array if specified
    if (Array.isArray(options.buttons)) {
        options.buttons = options.buttons.map(btn => ({
            title: btn.title,
            iconUrl: btn.iconUrl || ''
        }));
    }

    const expectedValues = {
        body: options.body,
        title: options.title,
        subtitle: options.subtitle || '',
        icon: options.icon || '',
        buttons: options.buttons || []
    };
    expect(fullNote).toMatchObject(expectedValues);
}
