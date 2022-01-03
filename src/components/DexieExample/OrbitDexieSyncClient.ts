import { ApplyRemoteChangesFunction, IPersistedContext, ISyncProtocol, PollContinuation, ReactiveContinuation } from 'dexie-syncable/api';
import { IDatabaseChange } from 'dexie-observable/api';
import { v4 as uuidv4 } from 'uuid';

import { orbitDexieSyncServerSide } from './OrbitDexieSyncServerSide';

export const SYNCABLE_PROTOCOL = 'orbitdb';

export class OrbitDexieSyncClient implements ISyncProtocol {
  sync(
    context: IPersistedContext,
    url: string,
    options: unknown,
    baseRevision: unknown,
    syncedRevision: unknown,
    changes: IDatabaseChange[],
    partial: boolean,
    applyRemoteChanges: ApplyRemoteChangesFunction,
    onChangesAccepted: () => void,
    onSuccess: (continuation: PollContinuation | ReactiveContinuation) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any, again?: number) => void): void {
    const POLL_INTERVAL = 10000//10000; // Poll every 10th second
    if (!context.clientIdentity) {
      context.clientIdentity = uuidv4()
      context.save
    }






    const request = {
      clientIdentity: context.clientIdentity || null,
      baseRevision: baseRevision,
      partial: partial,
      changes: changes,
      syncedRevision: syncedRevision,
      url: url
    };

    orbitDexieSyncServerSide.OrbitDixieServerSide(request)
      .then((serverSideData) => {
        onChangesAccepted();
        const changes = serverSideData?.changes || []
        applyRemoteChanges(changes as unknown as IDatabaseChange[], serverSideData?.currentRevision, partial)

        onSuccess({ again: POLL_INTERVAL });
      }).catch((e) => {
        onError(e, Infinity);
      })

    return;
  }

}
