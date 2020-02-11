export default new Proxy({}, {
    get(target: any, key: string | number | symbol, receiver: any): any {
        if (key === '__esModule') {
            return false;
        }
        return key;
    }
});
