import { ICreateChange, IDatabaseChange, IUpdateChange } from "dexie-observable/api";
import { getChangesStore } from "./ChangesStore";


class OrbitDexieSyncServerSide {




  async OrbitDixieServerSide(request:
    {
      // eslint-disable-next-line
      clientIdentity: any; baseRevision: unknown; partial: boolean;
      changes: IDatabaseChange[]; syncedRevision: unknown; url: string
    }) {

    const changesStore = await getChangesStore(request.url);

    const serverChangesFromOtherUsers = changesStore.getAllOtherUsersGt(request.clientIdentity)

    const CREATE = 1,
      UPDATE = 2,
      DELETE = 3;

    
    for (let i = 0; i < request.changes.length; i++) {
      const change = request.changes[i]

      switch (change.type) {
        case CREATE:
          await changesStore.doCreate(change.table, change.key, (change as ICreateChange).obj, request.clientIdentity);
          break;
        case UPDATE:
          await changesStore.doUpdate(change.table, change.key, (change as IUpdateChange).mods, request.clientIdentity);
          break;
        case DELETE:
          await changesStore.doDelete(change.table, change.key, request.clientIdentity);
          break;
      }
    }



    return {      
      type: "changes",
      changes: serverChangesFromOtherUsers.rowsToSyncLocally,
      currentRevision: changesStore.sharedCounter?.store.value,
      countersToSetAfterApply: serverChangesFromOtherUsers.countersToSetAfterApply,
      partial: false // Tell client that these are the only changes we are aware of. Since our mem DB is syncronous, we got all changes in one chunk.
    }


  }
}

export const orbitDexieSyncServerSide = new OrbitDexieSyncServerSide()

