const STRATEGIES = {
    const: require('./const'),
    fibonacci: require('./fibonacci'),
    linear: require('./linear'),
    powerOf2: require('./powerOf2'),
    random: require('./random'),
};
const DEFAULT_STRATEGY = 'const';

module.exports = {
    createStrategy(name, base) {
        const make = STRATEGIES[name || DEFAULT_STRATEGY] || STRATEGIES[DEFAULT_STRATEGY];

        return make(base);
    },
    strategies: Object.keys(STRATEGIES).reduce((acc, name) => {
        acc[name] = name;
        return acc;
    }, {}),
};
