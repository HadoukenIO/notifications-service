import 'jest';
import {IndexedDb} from '../../src/provider/persistence/dataLayer/IndexedDb';

/**
 * @describe After each test we reset the mock to restore its defaults
 * otherwise there will still be internal state that will invalidate
 * the tests
 */
afterEach(() => {
    jest.restoreAllMocks();
});

describe('Initialise the database', () => {
    it('should log an error if no database name has been passed', () => {
        // Arrange
        const indexedDb = new IndexedDb(window.indexedDB);
        const errorMessage = 'No database name has been passed in';
        jest.spyOn(global.console, 'error');

        // Act
        indexedDb.initialise(null!, null!);

        // Assert
        expect(console.error).toBeCalledWith(errorMessage);
    });
});

describe('Create table in the database', () => {
    it('should log an error if no table name has been passed', () => {
        // Arrange
        const indexedDb = new IndexedDb(window.indexedDB);
        const errorMessage = 'No table name has been passed';
        jest.spyOn(global.console, 'error');

        // Act
        indexedDb.create(null!, null!);

        // Assert
        expect(console.error).toBeCalledWith(errorMessage);
    });
});

describe('Create entry in the database', () => {
    it('should log an error if no table name has been passed', () => {
        // Arrange
        const indexedDb = new IndexedDb(window.indexedDB);
        const errorMessage = 'No table name has been passed';
        jest.spyOn(global.console, 'error');

        // Act
        indexedDb.create(null!, {id: 'asdf'});

        // Assert
        expect(console.error).toBeCalledWith(errorMessage);
    });

    it('should log an error if no entry has been passed', () => {
        // Arrange
        const indexedDb = new IndexedDb(window.indexedDB);
        const errorMessage = 'No entry has been passed';
        jest.spyOn(global.console, 'error');

        // Act
        indexedDb.create('sometable', null!);

        // Assert
        expect(console.error).toBeCalledWith(errorMessage);
    });
});

describe('Create table in the database', () => {
    it('should log an error if no table name has been passed', () => {
        // Arrange
        const indexedDb = new IndexedDb(window.indexedDB);
        const errorMessage = 'No table name has been passed';
        jest.spyOn(global.console, 'error');

        // Act
        indexedDb.create(null!, null!);

        // Assert
        expect(console.error).toBeCalledWith(errorMessage);
    });
});

describe('Remove entry from the database', () => {
    it('should log an error if no table name has been passed', () => {
        // Arrange
        const indexedDb = new IndexedDb(window.indexedDB);
        const errorMessage = 'No table name has been passed';
        jest.spyOn(global.console, 'error');

        // Act
        indexedDb.remove(null!, 2);

        // Assert
        expect(console.error).toBeCalledWith(errorMessage);
    });

    it('should log an error if no id has been passed', () => {
        // Arrange
        const indexedDb = new IndexedDb(window.indexedDB);
        const errorMessage = 'No id has been passed';
        jest.spyOn(global.console, 'error');

        // Act
        indexedDb.remove('sometable', null!);

        // Assert
        expect(console.error).toBeCalledWith(errorMessage);
    });
});

describe('update an entry in the database', () => {
    it('should log an error if no table name has been passed', () => {
        // Arrange
        const indexedDb = new IndexedDb(window.indexedDB);
        const errorMessage = 'No table name has been passed';
        jest.spyOn(global.console, 'error');

        // Act
        indexedDb.update(null!, {id: 'asdf'});

        // Assert
        expect(console.error).toBeCalledWith(errorMessage);
    });

    it('should log an error if no entry has been passed', () => {
        // Arrange
        const indexedDb = new IndexedDb(window.indexedDB);
        const errorMessage = 'No entry has been passed';
        jest.spyOn(global.console, 'error');

        // Act
        indexedDb.update('sometable', null!);

        // Assert
        expect(console.error).toBeCalledWith(errorMessage);
    });
});
