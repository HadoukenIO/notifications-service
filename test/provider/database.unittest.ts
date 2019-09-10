import 'jest';
import 'fake-indexeddb/auto';

import {Database, CollectionMap} from '../../src/provider/model/database/Database';
import {StoredNotification} from '../../src/provider/model/StoredNotification';
import {NotificationInternal} from '../../src/client/internal';
import {Collection} from '../../src/provider/model/database/Collection';
import {assertNotificationStored} from '../utils/int/storageRemote';

let database: Database;
let collection: Collection<StoredNotification>;
let generatedNotificationCount: number = 0;

beforeAll(async () => {
    database = await new Database().delayedInit();
    collection = database.get(CollectionMap.NOTIFICATIONS);
});

test.only('fooo', async () => {
    const fun2 = async () => {
        console.log('baz');
    };

    const fun1 = async () => {
        await fun2();
        console.log('bar');
    };

    const prom = fun1();
    console.log('foo');
    await prom;
});

describe('Database Methods', () => {
    describe('Get', () => {
        it('Returns a collection when given a valid name', async () => {
            const localCollection: Collection<StoredNotification> = database.get(CollectionMap.NOTIFICATIONS);
            expect(localCollection).toBeDefined();
        });

        it('Throws an error when given an invalid name', async () => {
            expect(() => {
                database.get('INVALID COLLECTION' as any);
            }).toThrowError();
        });
    });
});

describe('Collection Methods', () => {
    afterEach(async () => {
        const records = await collection.getAll();
        await Promise.all(records.map(record => collection.delete(record.id)));

        if ((await collection.getAll()).length !== 0) {
            throw new Error('Collection cleanup failed: Collection not cleared!');
        }
    });

    describe('Get', () => {
        let note: StoredNotification;

        beforeEach(async () =>{
            note = generateNotification();
            await collection.upsert(note);
        });

        it('Returns a single record when passed a valid ID', async () => {
            const record = await collection.get(note.id);
            expect(record).toEqual(note);
        });

        it('Returns undefined when passed an invalid ID', async () => {
            const record = await collection.get('INVALID ID');
            expect(record).toBeUndefined();
        });
    });

    describe('GetAll', () => {
        it('Returns all records from collection', async () => {
            const notes = [generateNotification(), generateNotification(), generateNotification()];
            await collection.upsert(notes);

            const results = await collection.getAll();
            expect(results).toEqual(notes);
        });

        it('Returns an empty array when no records are in the collection', async () => {
            const results = await collection.getAll();
            expect(results).toEqual([]);
        });
    });

    describe('GetMany', () => {
        let notes: StoredNotification[];

        beforeEach(async () => {
            notes = [generateNotification(), generateNotification(), generateNotification()];
            await collection.upsert(notes);
        });

        it('Returns an array of all records for valid IDs passed in', async () => {
            const notesToGet = [notes[0], notes[1]];
            const results = await collection.getMany(notesToGet.map(note => note.id));

            expect(results).toEqual(notesToGet);
        });

        it('Returns an empty array for array of invalid IDs passed in', async () => {
            const notesToGet = ['INVALID', 'INVALID2'];

            const results = await collection.getMany(notesToGet);
            expect(results).toEqual([]);
        });

        it('Returns an array of only valid notifications when valid and invalid IDs passed in', async () => {
            const notesToGet = [notes[0], notes[1]];
            const results = await collection.getMany([...notesToGet.map(note => note.id), 'INVALID ID']);

            expect(results).toEqual(notesToGet);
        });
    });

    describe('Upsert', () => {
        it('Adds a new record', async () => {
            const note = generateNotification();

            await collection.upsert(note);
            expect(await collection.getAll()).toEqual([note]);
        });

        it('Adds many records from array', async () => {
            const notes = [generateNotification(), generateNotification(), generateNotification()];
            await collection.upsert(notes);

            const results = await collection.getAll();
            expect(results).toEqual(notes);
        });

        it('Updates an existing record', async () => {
            const [note1, note2] = [generateNotification({id: 'updateable'}), generateNotification({id: 'updateable', title: 'title'})];

            await collection.upsert(note1);
            await collection.upsert(note2);

            const results = await collection.getAll();
            expect(results).toEqual([note2]);
        });

        it('Updates many existing records from array', async () => {
            const expectedTitle = 'updated title';
            const notes = [generateNotification({id: 'updateable'}), generateNotification({id: 'updateable2'}), generateNotification()];
            await collection.upsert(notes);

            const updatedNotes = [generateNotification({id: 'updateable', title: expectedTitle}),
                generateNotification({id: 'updateable2', title: expectedTitle})];
            await collection.upsert(updatedNotes);

            const filteredNotes = (await collection.getAll()).filter(note => note.notification.title === expectedTitle);
            expect(filteredNotes.length).toEqual(updatedNotes.length);
        });

        it('Updates existing records and adds new records from array', async () => {
            const expectedTitle = 'updated title';
            await collection.upsert(generateNotification({id: 'updateable'}));

            const newAndUpdatedNotes = [generateNotification(), generateNotification({id: 'updateable', title: expectedTitle})];
            await collection.upsert(newAndUpdatedNotes);

            const results = await collection.getAll();

            expect(results).toEqual(newAndUpdatedNotes);
        });
    });

    describe('Delete', () => {
        let notes: StoredNotification[];

        beforeEach(()=> {
            notes = [generateNotification(), generateNotification(), generateNotification()];
        });

        it('Deletes a single record', async () => {
            const noteToDelete = generateNotification();
            await collection.upsert([...notes, noteToDelete]);
            await collection.delete(noteToDelete.id);

            expect(await collection.getAll()).toEqual(notes);
        });

        it('Deletes many records from array', async () => {
            await collection.upsert(notes);
            await collection.delete(notes.map(note => note.id));

            expect(await collection.getAll()).toEqual([]);
        });

        it('Passing in an invalid ID does nothing', async () => {
            await collection.upsert(notes);
            const preDeleteCollection = await collection.getAll();
            await collection.delete(['INVALID']);

            const results = await collection.getAll();
            expect(results).toEqual(preDeleteCollection);
        });

        it('Deletes valid IDs from an array of valid and invalid IDs', async () => {
            const notesToDelete = [generateNotification(), generateNotification()];
            await collection.upsert([...notes, ...notesToDelete]);
            await collection.delete(['INVALID', ...notesToDelete.map(note => note.id), 'INVALID']);

            const results = await collection.getAll();
            expect(results).toEqual(notes);
        });
    });
});

function generateNotification(notificationOptions?: Partial<NotificationInternal>): StoredNotification {
    const id = notificationOptions && notificationOptions.id || `generatedNotification-${++generatedNotificationCount}`;

    const storedNotification: StoredNotification = {
        id,
        notification: {
            id,
            body: '',
            buttons: [],
            category: '',
            customData: {},
            date: 1,
            expires: null,
            icon: '',
            onSelect: null,
            onExpire: null,
            onClose: null,
            title: '',
            ...notificationOptions
        },
        source: {uuid: '', name: ''}
    };

    return storedNotification;
}
