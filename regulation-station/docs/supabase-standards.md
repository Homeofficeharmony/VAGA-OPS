# Supabase Usage Standards

Standards for all Supabase queries and mutations in this project (`regulation-station`).

---

## 1. Always destructure `{ data, error }`

Every query must destructure both fields, even if `data` is not used.

```js
// WRONG
await supabase.from('sessions').insert({ ... })

// WRONG — error ignored
const { data } = await supabase.from('sessions').select('*')

// CORRECT
const { data, error } = await supabase.from('sessions').select('*')
if (error) { ... }
```

If `data` is genuinely not needed, use `_data` or discard explicitly:

```js
const { error } = await supabase.from('sessions').insert({ ... })
```

---

## 2. All async Supabase calls must use try/catch

Supabase SDK methods can throw (network failures, malformed responses, auth token expiry). A returned `error` object and a thrown exception are different things — both must be handled.

```js
// WRONG
const doSomething = async () => {
  const { data, error } = await supabase.from('teams').select('*')
  if (error) return
}

// CORRECT
const doSomething = async () => {
  try {
    const { data, error } = await supabase.from('teams').select('*')
    if (error) { ... }
  } catch (err) {
    console.error('[context] operation failed:', err)
  }
}
```

For functions that return results to callers (e.g. `createTeam`, `joinTeam`), surface thrown errors as a return value rather than letting them propagate:

```js
const createTeam = async (name) => {
  try {
    const { data, error } = await supabase.from('teams').insert({ ... }).select().single()
    if (error) return { error: error.message }
    return { data }
  } catch (err) {
    console.error('[useTeam] createTeam threw:', err)
    return { error: 'Unexpected error. Please try again.' }
  }
}
```

---

## 3. No fire-and-forget mutations

Every insert, update, upsert, and delete must be awaited. Unawaited mutations cannot be retried, logged, or acted on.

```js
// WRONG
supabase.from('sessions').insert({ ... })

// WRONG — .then() without .catch() is still fire-and-forget on throw
supabase.from('sessions').insert({ ... }).then(({ error }) => { ... })

// CORRECT
const { error } = await supabase.from('sessions').insert({ ... })
if (error) console.error('[useSessionLog] insert failed:', error.message)
```

Exception: background sync after local state is already updated (e.g. optimistic writes in `logSession`) may use `.then()` — but must always chain `.catch()` or check `error` in the callback. Never omit both.

---

## 4. All deletes must be awaited and checked

A failed delete that goes undetected leaves orphaned data and inconsistent local state.

```js
// WRONG
await supabase.from('team_members').delete().eq('user_id', user.id)
// (awaited but result not captured)

// CORRECT
const { error } = await supabase
  .from('team_members')
  .delete()
  .eq('team_id', team.id)
  .eq('user_id', user.id)

if (error) {
  setError(error.message)
  return // do not update local state if remote delete failed
}

setTeam(null)
setMembers([])
```

Local state must only be updated **after** a successful delete, not before.

---

## 5. No silent failures

Every error path must do at least one of:
- `console.error(...)` with a namespaced prefix (e.g. `[useTeam]`, `[AuthContext]`)
- `setError(error.message)` to surface it in UI
- `return { error: error.message }` to pass it to the caller

```js
// WRONG — silent
if (err || !rows) return

// CORRECT — logged
if (err) {
  console.error('[useTeam] fetchMembers failed:', err.message)
  return
}
if (!rows) return
```

Use namespaced prefixes in all console calls so failures are traceable by file/hook:

| File | Prefix |
|---|---|
| `hooks/useTeam.js` | `[useTeam]` |
| `hooks/useSessionLog.js` | `[useSessionLog]` |
| `contexts/AuthContext.jsx` | `[AuthContext]` |
| `components/AuthModal.jsx` | `[AuthModal]` |
| `components/TeamPanel.jsx` | `[TeamPanel]` |

---

## 6. RLS assumptions

All tables have Row Level Security enabled. The following assumptions are baked into query logic — any change to RLS policies requires a corresponding review of the affected hook.

### `sessions`
- **Policy:** `Users manage own sessions` — `auth.uid() = user_id` on all operations
- **Assumption:** A user can only read, insert, and delete their own rows. Cross-user session data is never available client-side. `useSessionLog` does not attempt to query other users' sessions.

### `teams`
- **Policy:** `Anyone can read teams` (SELECT) — no auth required to look up a team by invite code
- **Policy:** `Owner manages team` — only `owner_id` can UPDATE/DELETE a team row
- **Assumption:** `joinTeam` looks up teams by `invite_code` without auth. This is intentional and safe — invite codes are short-lived secrets, not sensitive data.

### `team_members`
- **Policy:** `Members can read team members` — SELECT is gated on the querying user already being a member of that team (self-referential EXISTS check)
- **Policy:** `Users can join teams` — INSERT only; `user_id` must equal `auth.uid()`
- **Policy:** `Users can leave teams` — DELETE only; `user_id` must equal `auth.uid()`
- **Assumption:** `fetchMembers` will return an empty result (not an error) if the user is not a member of the team. Callers must handle `rows.length === 0` gracefully.
- **Assumption:** A user cannot remove another user from a team via client-side code. Owner-based removal is a Wave 3 server-side feature.

### `team_checkins`
- **Policy:** `Members can read team checkins` — SELECT gated on team membership (same EXISTS pattern as `team_members`)
- **Policy:** `Users create own checkins` — INSERT, `user_id` must equal `auth.uid()`
- **Policy:** `Users delete own checkins` — DELETE, `user_id` must equal `auth.uid()`
- **Assumption:** Realtime is enabled on this table (`supabase_realtime` publication). Subscription handlers must be cleaned up on component unmount to prevent memory leaks.
- **Assumption:** This table is not yet consumed client-side (Wave 3). When implemented, realtime subscriptions must follow the try/catch and error-check rules above.

---

## Quick reference

```js
// Standard query pattern
try {
  const { data, error } = await supabase
    .from('table')
    .select('col1, col2')
    .eq('user_id', user.id)

  if (error) {
    console.error('[Hook] query failed:', error.message)
    return
  }

  // use data
} catch (err) {
  console.error('[Hook] query threw:', err)
}

// Standard mutation pattern (insert / update / upsert)
try {
  const { error } = await supabase
    .from('table')
    .insert({ user_id: user.id, ... })

  if (error) {
    console.error('[Hook] insert failed:', error.message)
    return { error: error.message }
  }

  return {}
} catch (err) {
  console.error('[Hook] insert threw:', err)
  return { error: 'Unexpected error.' }
}

// Standard delete pattern — update local state only on success
try {
  const { error } = await supabase
    .from('table')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    setError(error.message)
    return
  }

  setLocalState(null) // only reached if delete succeeded
} catch (err) {
  console.error('[Hook] delete threw:', err)
  setError('Unexpected error.')
}
```
