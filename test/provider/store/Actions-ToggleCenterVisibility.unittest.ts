import 'reflect-metadata';

import {useFakeTime, advanceTime} from '../../utils/unit/time';
import {ToggleCenterVisibilitySource, ToggleCenterVisibility, BlurCenter, RootAction} from '../../../src/provider/store/Actions';
import {createMockServiceStore} from '../../utils/unit/mocks';
import {createFakeRootState} from '../../utils/common/fakes';
import {RootState} from '../../../src/provider/store/State';

type TestParam = [string, ToggleCenterVisibilitySource];

describe('When toggling the notification center', () => {
    let state: RootState;

    const mockServiceStore = createMockServiceStore();

    beforeEach(async () => {
        jest.resetAllMocks();
        useFakeTime();

        mockServiceStore.dispatch.mockImplementation(async (action: RootAction) => {
            state = action.reduce(state);
        });

        (Object.getOwnPropertyDescriptor(mockServiceStore, 'state')!.get as jest.Mock<RootState, []>).mockImplementation(() => state);
    });

    afterEach(async () => {
        jest.runAllTimers();
    });

    describe.each([
        ['an API call', ToggleCenterVisibilitySource.API],
        ['the tray icon', ToggleCenterVisibilitySource.TRAY]
    ] as TestParam[])('When the Notification Center is toggled by %s', (titleParam: string, source: ToggleCenterVisibilitySource) => {
        describe('When the Notification Center is open', () => {
            beforeEach(() => {
                state = {...createFakeRootState(), centerVisible: true};
            });

            test('A toggle will close the notification center', async () => {
                await new ToggleCenterVisibility(source).dispatch(mockServiceStore);

                expect(state.centerVisible).toBe(false);
            });

            test('A toggle following shortly after a blur is ignored', async () => {
                new BlurCenter().dispatch(mockServiceStore);

                await advanceTime(10);

                mockServiceStore.dispatch.mockReset();
                new ToggleCenterVisibility(source).dispatch(mockServiceStore);

                expect(mockServiceStore.dispatch).toBeCalledTimes(0);
            });

            test('A toggle following long after a blur is not ignored', async () => {
                new BlurCenter().dispatch(mockServiceStore);

                await advanceTime(1000);

                mockServiceStore.dispatch.mockReset();
                new ToggleCenterVisibility(source).dispatch(mockServiceStore);

                expect(mockServiceStore.dispatch).toBeCalledTimes(1);
            });

            test('A toggle following shortly after a paired toggle then blur is not ignored', async () => {
                new ToggleCenterVisibility(source).dispatch(mockServiceStore);
                await advanceTime(5);
                new BlurCenter().dispatch(mockServiceStore);

                await advanceTime(5);

                mockServiceStore.dispatch.mockReset();
                new ToggleCenterVisibility(source).dispatch(mockServiceStore);

                expect(mockServiceStore.dispatch).toBeCalledTimes(1);
            });

            test('A toggle following shortly after a paired toggle of a different source then blur is not ignored', async () => {
                const otherSource = ToggleCenterVisibilitySource.API ? ToggleCenterVisibilitySource.TRAY : ToggleCenterVisibilitySource.API;

                new ToggleCenterVisibility(otherSource).dispatch(mockServiceStore);
                await advanceTime(5);
                new BlurCenter().dispatch(mockServiceStore);

                await advanceTime(5);

                mockServiceStore.dispatch.mockReset();
                new ToggleCenterVisibility(source).dispatch(mockServiceStore);

                expect(mockServiceStore.dispatch).toBeCalledTimes(1);
            });
        });

        describe('When the Notification Center is closed', () => {
            beforeEach(() => {
                state = {...createFakeRootState(), centerVisible: false};
            });

            test('A toggle will show the notification center', () => {
                new ToggleCenterVisibility(source).dispatch(mockServiceStore);

                expect(state.centerVisible).toBe(true);
            });
        });
    });

    describe('When the Notification Center is toggled by an internal button', () => {
        beforeEach(() => {
            state = createFakeRootState();
        });

        test('A toggle following shortly after a blur is not ignored', async () => {
            new BlurCenter().dispatch(mockServiceStore);

            await advanceTime(10);

            mockServiceStore.dispatch.mockReset();
            new ToggleCenterVisibility(ToggleCenterVisibilitySource.BUTTON).dispatch(mockServiceStore);

            expect(mockServiceStore.dispatch).toBeCalledTimes(1);
        });
    });
});
