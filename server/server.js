import configureStore from '../src/store/configureStore';
import serverRenderer from './middleware/renderer';
import { setAsyncMessage } from '../src/store/appReducer';

export default (req, res, next) => {
    const store = configureStore();
    store.dispatch(setAsyncMessage("Hi, I'm from server!"))
        .then(() => {
            serverRenderer(store)(req, res, next);
        });
};
