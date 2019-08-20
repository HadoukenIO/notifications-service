describe('When clearing a notification with the center showing', () => {
    describe('When the center contains zero notifications', () => {
        test('When `clearAll` is called, it returns successfully', async () => {

        });

        describe('When `clear` is called', () => {
            test('When `clear` is called for a notifcation that doesn\'t exist, the promise rejects', async () => {

            });
        });
    });

    describe('When the center contains a single notifications without an `onClose` action result', () => {
        test('When `clearAll` is called, the notification is removed', async () => {

        });

        describe('When `clear` is called', () => {
            test('When `clear` is called for a notifcation that doesn\'t exist, no notifications are removed, and the promise rejects', async () => {

            });

            test('When `clear` is called for the notifcation, the notification is removed', async () => {

            });
        });
    });

    describe('When the center contains two notifications', () => {
        test('When `clearAll` is called, all notification are removed', async () => {

        });

        describe('When `clear` is called', () => {
            test('When `clear` is called for a notifcation that doesn\'t exist, no notifications are removed, and the promise rejects', async () => {

            });

            test('When `clear` is called for a notifcation, only that notification is removed', async () => {

            });
        });
    });
});
