import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deleteAccountHandler } from './deleteAccountHandler';

test('la suppression serveur exige un jeton et n’efface que cet utilisateur', async () => {
  assert.equal((await deleteAccountHandler(null, { getUserId: async () => 'u1', deleteUser: async () => ({}) })).status, 401);
  const deleted: string[] = [];
  const ok = await deleteAccountHandler('jwt', {
    getUserId: async (token) => (token === 'jwt' ? 'user_1' : null),
    deleteUser: async (id) => { deleted.push(id); return {}; },
  });
  assert.equal(ok.status, 200);
  assert.deepEqual(deleted, ['user_1']);
  const failed = await deleteAccountHandler('jwt', {
    getUserId: async () => 'user_1',
    deleteUser: async () => ({ error: 'no' }),
  });
  assert.equal(failed.status, 500);
});
