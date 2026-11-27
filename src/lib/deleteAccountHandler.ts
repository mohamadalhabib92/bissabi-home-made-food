/** Suppression réelle du compte Auth. Le service role n’est jamais dans l’app. */
export async function deleteAccountHandler(
  jwt: string | null,
  deps: {
    getUserId: (token: string) => Promise<string | null>;
    deleteUser: (userId: string) => Promise<{ error?: string }>;
  },
): Promise<{ status: number }> {
  if (!jwt?.trim()) return { status: 401 };
  const userId = await deps.getUserId(jwt.trim());
  if (!userId) return { status: 401 };
  const result = await deps.deleteUser(userId);
  if (result.error) return { status: 500 };
  return { status: 200 };
}
