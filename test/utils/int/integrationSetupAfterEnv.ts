// Apps are taking a very long time to spawn on CI causing timeouts
// This should be removed once the underlying issue is resolved (SERVICE-532)
jest.setTimeout(60 * 1000);
