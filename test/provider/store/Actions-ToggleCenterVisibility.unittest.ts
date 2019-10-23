import 'reflect-metadata';

import {useMockTime, advanceTime} from '../../utils/unit/time';
import {ToggleCenterVisibilitySource, ToggleCenterVisibility, BlurCenter} from '../../../src/provider/store/Actions';
import {createMockServiceStore, getterMock} from '../../utils/unit/mocks';
import {createFakeEmptyRootState} from '../../utils/unit/fakes';
import {RootState} from '../../../src/provider/store/State';
import {Action} from '../../../src/provider/store/Store';

type SourceTestParam = [string, ToggleCenterVisibilitySource];
type VisibilityTestParam = [string, boolean];

const mockServiceStore = createMockServiceStore();
let state: RootState;

beforeEach(() => {
    jest.resetAllMocks();
    useMockTime();

    mockServiceStore.dispatch.mockImplementation(async (action: Action<RootState>) => {
        state = action.reduce(state);
    });

    getterMock(mockServiceStore, 'state').mockImplementation(() => state);
});

afterEach(() => {
    jest.runAllTimers();
});

describe.each([
    ['an API call', ToggleCenterVisibilitySource.API],
    ['the tray icon', ToggleCenterVisibilitySource.TRAY],
    ['an internal button press', ToggleCenterVisibilitySource.BUTTON]
] as SourceTestParam[])('When the Notification Center is toggled by %s', (titleParam: string, source: ToggleCenterVisibilitySource) => {
    describe.each([
        ['open', true],
        ['closed', false]
    ] as VisibilityTestParam[])('When the Notification Center is %s', (title: string, centerVisible: boolean) => {
        beforeEach(() => {
            state = {...createFakeEmptyRootState(), centerVisible};
        });

        test(`A toggle will ${centerVisible ? 'close' : 'open'} the Notification Center`, async () => {
            await new ToggleCenterVisibility(source).dispatch(mockServiceStore);

            expect(state.centerVisible).toBe(!centerVisible);
        });

        test(`Two toggles will leave the Notification Center ${centerVisible ? 'open' : 'close'}`, async () => {
            await new ToggleCenterVisibility(source).dispatch(mockServiceStore);
            await advanceTime(5);
            await new ToggleCenterVisibility(source).dispatch(mockServiceStore);

            expect(state.centerVisible).toBe(centerVisible);
        });

        test('A toggle with visibility set to false will close the Notification Center if not already closed', async () => {
            await new ToggleCenterVisibility(source, false).dispatch(mockServiceStore);

            expect(state.centerVisible).toBe(false);
        });

        test('A toggle with visibility set to true will open the Notification Center if not already opened', async () => {
            await new ToggleCenterVisibility(source, true).dispatch(mockServiceStore);

            expect(state.centerVisible).toBe(true);
        });

        if (source === ToggleCenterVisibilitySource.BUTTON) {
            testUnfilteredToggle(source, centerVisible);
        } else {
            testFilteredToggle(source, centerVisible);
        }
    });
});

function testUnfilteredToggle(source: ToggleCenterVisibilitySource, centerVisible: boolean): void {
    test('A toggle following shortly after a blur is not ignored', async () => {
        new BlurCenter().dispatch(mockServiceStore);

        await advanceTime(10);

        new ToggleCenterVisibility(source).dispatch(mockServiceStore);

        expect(state.centerVisible).toBe(true);
    });
}

function testFilteredToggle(source: ToggleCenterVisibilitySource, centerVisible: boolean): void {
    test('A toggle following shortly after a blur is ignored', async () => {
        new BlurCenter().dispatch(mockServiceStore);

        await advanceTime(10);

        new ToggleCenterVisibility(source).dispatch(mockServiceStore);

        expect(state.centerVisible).toBe(false);
    });

    test('A toggle following long after a blur is not ignored', async () => {
        new BlurCenter().dispatch(mockServiceStore);

        await advanceTime(1000);

        new ToggleCenterVisibility(source).dispatch(mockServiceStore);

        expect(state.centerVisible).toBe(true);
    });

    test('A toggle following shortly after a paired toggle then blur is not ignored', async () => {
        new ToggleCenterVisibility(source).dispatch(mockServiceStore);
        await advanceTime(5);
        new BlurCenter().dispatch(mockServiceStore);

        await advanceTime(5);

        new ToggleCenterVisibility(source).dispatch(mockServiceStore);

        expect(state.centerVisible).toBe(centerVisible);
    });

    test('A toggle following shortly after a paired toggle of a different source then blur is not ignored', async () => {
        const otherSource = source === ToggleCenterVisibilitySource.API ? ToggleCenterVisibilitySource.TRAY : ToggleCenterVisibilitySource.API;

        new ToggleCenterVisibility(otherSource).dispatch(mockServiceStore);
        await advanceTime(5);
        new BlurCenter().dispatch(mockServiceStore);

        await advanceTime(5);

        new ToggleCenterVisibility(source).dispatch(mockServiceStore);

        expect(state.centerVisible).toBe(centerVisible);
    });
}
