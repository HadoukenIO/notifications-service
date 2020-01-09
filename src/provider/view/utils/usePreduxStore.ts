import {useStore} from 'react-redux';

import {RootState} from '../../store/State';
import {Store} from '../../store/Store';

export const usePreduxStore: () => Store<RootState> = () => useStore() as unknown as Store<RootState>;
