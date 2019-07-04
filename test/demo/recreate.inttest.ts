import 'jest';

describe('When creating a notification with an ID that already exists and different options', () => {
    test.todo('The promise resolves to the new notification object');
    test.todo('No "cleared" event is emitted');
    test.todo('The card in the center is updated to show the new notification details');

    describe('When the existing notification has an active toast', () =>{
        test.todo('The existing toast window is closed');
        test.todo('A new toast window is created');
        test.todo('The new toast matches the options of the new notification');
    });
});
