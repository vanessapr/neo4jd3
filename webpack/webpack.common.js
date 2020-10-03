const path = require('path');

const paths = {
    root: path.resolve(__dirname, '..'),
    docs: path.resolve(__dirname, '../src/demos'),
    srcIndex: path.resolve(__dirname, '../src/index.js')
};

const common = () => ({
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
        ],
    },
});

module.exports = { paths, common };