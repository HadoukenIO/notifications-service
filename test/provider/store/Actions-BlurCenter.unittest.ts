import 'reflect-metadata';

import {useMockTime, advanceTime} from '../../utils/unit/time';
import {ToggleCenterVisibilitySource, ToggleCenterVisibility, BlurCenter} from '../../../src/provider/store/Actions';
import {createMockServiceStore, getterMock} from '../../utils/unit/mocks';
import {createFakeEmptyRootState} from '../../utils/unit/fakes';
import {RootState} from '../../../src/provider/store/State';
import {Action} from '../../../src/provider/store/Store';

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

afterEach(async () => {
    jest.runAllTimers();
});

describe.each([
    ['open', true],
    ['closed', false]
] as VisibilityTestParam[])('When the Notification Center is %s', (titleParam: string, centerVisible: boolean) => {
    beforeEach(() => {
        state = {...createFakeEmptyRootState(), centerVisible};
    });

    test('When Notification Center is blurred, the Notification Center will close if not already closed', async () => {
        await new BlurCenter().dispatch(mockServiceStore);

        expect(state.centerVisible).toBe(false);
    });

    test('When the Notification Center is blurred shortly after being toggled, the blur will be ignored', async () => {
        new ToggleCenterVisibility(ToggleCenterVisibilitySource.API).dispatch(mockServiceStore);
        await advanceTime(10);
        await new BlurCenter().dispatch(mockServiceStore);

        expect(state.centerVisible).toBe(!centerVisible);
    });

    test('When the Notification Center is blurred shortly after a paired blur then toggle, the latter blur is not ignored', async () => {
        new BlurCenter().dispatch(mockServiceStore);
        await advanceTime(5);
        new ToggleCenterVisibility(ToggleCenterVisibilitySource.API).dispatch(mockServiceStore);

        await advanceTime(5);

        new BlurCenter().dispatch(mockServiceStore);

        expect(state.centerVisible).toBe(false);
    });
});
