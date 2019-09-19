import 'reflect-metadata';

import {Signal, Aggregators} from 'openfin-service-signal';

import {Persistor} from '../../../src/provider/controller/Persistor';
import {createMockServiceStore, createMockDatabase, getterMock, createMockCollection} from '../../utils/unit/mocks';
import {Action} from '../../../src/provider/store/Store';
import {RootState} from '../../../src/provider/store/State';
import {CreateNotification, RemoveNotifications, RegisterApplication} from '../../../src/provider/store/Actions';
import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {CollectionMap} from '../../../src/provider/model/database/Database';
import {createFakeStoredNotification, createFakeStoredApplication} from '../../utils/unit/fakes';
import {DatabaseError} from '../../../src/provider/model/Errors';
import {StoredApplication} from '../../../src/provider/model/Environment';

const mockServiceStore = createMockServiceStore();
const mockDatabase = createMockDatabase();

const mockNotificationsCollection = createMockCollection<StoredNotification>();
const mockApplicationsCollection = createMockCollection<StoredApplication>();

let onAction: Signal<[Action<RootState>], Promise<void>, Promise<void>>;

beforeEach(() => {
    jest.resetAllMocks();

    onAction = new Signal<[Action<RootState>], Promise<void>, Promise<void>>(Aggregators.AWAIT_VOID);

    getterMock(mockServiceStore, 'onAction').mockReturnValue(onAction);
    mockDatabase.get.mockImplementation((collectionName: CollectionMap) => {
        if (collectionName === CollectionMap.NOTIFICATIONS) {
            return mockNotificationsCollection;
        } else if (collectionName === CollectionMap.APPLICATIONS) {
            return mockApplicationsCollection;
        } else {
            throw new Error('Attempting to get unknown collection');
        }
    });

    new Persistor(mockServiceStore, mockDatabase);
});

describe('When the database is working', () => {
    test('When a notification is created, it is upserted to the database', () => {
        const note = createFakeStoredNotification();

        onAction.emit(new CreateNotification(note));

        expect(mockNotificationsCollection.upsert).toBeCalledTimes(1);
        expect(mockNotificationsCollection.upsert).toBeCalledWith(note);

        expect(mockApplicationsCollection.upsert).toBeCalledTimes(0);
    });

    test('When a notification is removed, it is removed from the database', () => {
        const note = createFakeStoredNotification();

        onAction.emit(new RemoveNotifications([note]));

        expect(mockNotificationsCollection.delete).toBeCalledTimes(1);
        expect(mockNotificationsCollection.delete).toBeCalledWith([note.id]);

        expect(mockApplicationsCollection.upsert).toBeCalledTimes(0);
    });

    test('When multiple notifications are removed, they are removed from the database', () => {
        const note1 = createFakeStoredNotification();
        const note2 = createFakeStoredNotification();
        const note3 = createFakeStoredNotification();

        onAction.emit(new RemoveNotifications([note1, note2, note3]));

        expect(mockNotificationsCollection.delete).toBeCalledTimes(1);
        expect(mockNotificationsCollection.delete).toBeCalledWith([note1.id, note2.id, note3.id]);

        expect(mockApplicationsCollection.upsert).toBeCalledTimes(0);
    });

    test('When an application is registered, it is upserted to the database', () => {
        const app = createFakeStoredApplication();

        onAction.emit(new RegisterApplication(app));

        expect(mockApplicationsCollection.upsert).toBeCalledTimes(1);
        expect(mockApplicationsCollection.upsert).toBeCalledWith(app);

        expect(mockNotificationsCollection.upsert).toBeCalledTimes(0);
    });
});

describe('When the database is not working', () => {
    beforeEach(() => {
        mockNotificationsCollection.upsert.mockRejectedValue(new Error());
        mockNotificationsCollection.delete.mockRejectedValue(new Error());

        mockApplicationsCollection.upsert.mockRejectedValue(new Error());
    });

    test('When a notification is created, a DatabaseError is thrown', () => {
        const note = createFakeStoredNotification();

        expect(onAction.emit(new CreateNotification(note))).rejects.toEqual(new DatabaseError(`Unable to upsert notification ${note.id}`));
    });

    test('When a notification is removed, a DatabaseError is thrown', () => {
        const note = createFakeStoredNotification();

        expect(onAction.emit(new RemoveNotifications([note]))).rejects.toEqual(new DatabaseError(`Unable to delete notification ${[note.id]}`));
    });

    test('When an application is regsitered, a DatabaseError is thrown', () => {
        const app = createFakeStoredApplication();

        expect(onAction.emit(new RegisterApplication(app))).rejects.toEqual(new DatabaseError(`Unable to upsert Client info ${app.id}`));
    });
});
