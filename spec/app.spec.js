const path = require('path');
const ChatDB = require(path.join(process.cwd(), 'Models', 'ChatDB.js'));

describe('app.js', () => {
    it('サーバ起動テスト', () => {
        const chatdb = new ChatDB({
            user: 'node',
            password: 'node'
        });
        expect(chatdb.user).toBe('node');
    })
})