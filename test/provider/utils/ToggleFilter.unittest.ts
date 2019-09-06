import {useFakeTime, advanceTime} from '../../utils/unit/time';
import {ToggleFilter} from '../../../src/provider/utils/ToggleFilter';
import {ToggleCenterVisibilitySource} from '../../../src/provider/store/Actions';

let toggleFilter: ToggleFilter;

type TestParam = [string, ToggleCenterVisibilitySource];

beforeEach(() => {
    jest.resetAllMocks();
    useFakeTime();

    toggleFilter = new ToggleFilter();
});

describe.each([
    ['an API call', ToggleCenterVisibilitySource.API],
    ['the tray icon', ToggleCenterVisibilitySource.TRAY]
] as TestParam[])('When the Notification Center is toggled by %s', (titleParam: string, source: ToggleCenterVisibilitySource) => {
    test('A toggle following shortly after a blur is ignored', async () => {
        toggleFilter.recordBlur();

        await advanceTime(10);

        expect(toggleFilter.recordToggle(source)).toBe(false);
    });

    test('A toggle following long after a blur is not ignored', async () => {
        toggleFilter.recordBlur();

        await advanceTime(1000);

        expect(toggleFilter.recordToggle(source)).toBe(true);
    });

    test('A toggle following shortly after a paired toggle then blur is not ignored', async () => {
        toggleFilter.recordToggle(source);
        await advanceTime(5);
        toggleFilter.recordBlur();

        await advanceTime(5);

        expect(toggleFilter.recordToggle(source)).toBe(true);
    });

    test('A toggle following shortly after a paired toggle of a different source then blur is not ignored', async () => {
        toggleFilter.recordToggle(source === ToggleCenterVisibilitySource.API ? ToggleCenterVisibilitySource.TRAY : ToggleCenterVisibilitySource.API);
        await advanceTime(5);
        toggleFilter.recordBlur();

        await advanceTime(5);

        expect(toggleFilter.recordToggle(source)).toBe(true);
    });
});

test('When the Notification Center is toggled by an internal button shortly after a blur, it is not ignored', async () => {
    toggleFilter.recordBlur();

    await advanceTime(10);

    expect(toggleFilter.recordToggle(ToggleCenterVisibilitySource.BUTTON)).toBe(true);
});
