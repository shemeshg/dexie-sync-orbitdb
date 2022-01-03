import { ApplyRemoteChangesFunction, IPersistedContext, ISyncProtocol, PollContinuation, ReactiveContinuation } from 'dexie-syncable/api';
import { IDatabaseChange } from 'dexie-observable/api';
import { v4 as uuidv4 } from 'uuid';

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
    if (!context.clientIdentity){
      context.clientIdentity = uuidv4()      
      context.save
    } 



    const i = 1

    if (2 > i) {
      onChangesAccepted();  
      onSuccess({ again: POLL_INTERVAL });
      
      const request = {
        clientIdentity: context.clientIdentity || null,
        baseRevision: baseRevision,
        partial: partial,
        changes: changes,
        syncedRevision: syncedRevision
      };
      console.log(request)
      /*
      conn.doCreate()
      .then(()=>{        
        if (conn.node)
          {
            return dbSyncApp.initOrbitDb(conn.node);
          } else{
            throw new Error("Error")
          }
        
      })
      .then(()=>{
        return orbitDexieSyncServerSide.OrbitDixieServerSide(request)
      })      
      .then((serverSideData)=>{
        onChangesAccepted();   
        const changes = serverSideData?.changes || []   
        applyRemoteChanges(changes as unknown as IDatabaseChange[], serverSideData?.currentRevision,partial)  
      
        onSuccess({ again: POLL_INTERVAL });
      })
      .catch((e)=>{
        onError(e, Infinity);
      })*/


      return

    }

    onError("FAILED IT IS DEBUGGED", POLL_INTERVAL);

    const isRemoteError = true
    if (isRemoteError) {
      onError("data.errorMessage bla bla", Infinity); // Infinity = Don't try again. We would continue getting this error.
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}

    if ('clientIdentity' in data) {
      context.clientIdentity = data.clientIdentity;
      // Make sure we save the clientIdentity sent by the server before we try to resync.
      // If saving fails we wouldn't be able to do a partial synchronization
      context.save()
        .then(() => {
          // Since we got success, we also know that server accepted our changes:
          onChangesAccepted();
          // Convert the response format to the Dexie.Syncable.Remote.SyncProtocolAPI specification:
          applyRemoteChanges(data.changes, data.currentRevision, data.partial, data.needsResync);
          onSuccess({ again: POLL_INTERVAL });
        })
        .catch((e) => {
          // We didn't manage to save the clientIdentity stop synchronization
          onError(e, Infinity);
        });
    } else {
      // Since we got success, we also know that server accepted our changes:
      onChangesAccepted();
      // Convert the response format to the Dexie.Syncable.Remote.SyncProtocolAPI specification:
      applyRemoteChanges(data.changes, data.currentRevision, data.partial, data.needsResync);
      onSuccess({ again: POLL_INTERVAL });
    }

  }

}
