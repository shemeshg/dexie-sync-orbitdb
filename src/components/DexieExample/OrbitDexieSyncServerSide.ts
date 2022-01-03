import { ICreateChange, IDatabaseChange, IUpdateChange } from "dexie-observable/api";
import {changesStore} from "./ChangesStore"

class OrbitDexieSyncServerSide {


  toCreateObj(c: IDatabaseChange): ICreateChange {
    return c as ICreateChange
  }

  toUpdateObj(c: IDatabaseChange): IUpdateChange {
    return c as IUpdateChange
  }

  async OrbitDixieServerSide(request:
    {
      // eslint-disable-next-line
      clientIdentity: any; baseRevision: unknown; partial: boolean;
      changes: IDatabaseChange[]; syncedRevision: unknown;url: string
    }) {
    await changesStore.loadStoreIfNotLoaded(request.url)
    const baseRevision = request.baseRevision as string | undefined
    const serverChangesFromOtherUsers = changesStore.getAll(baseRevision)?.filter((row) => { return row.source !== request.clientIdentity })
    console.log(changesStore.getAll());
    let currentRevision = changesStore.getLastRecords(1)[0].key
    
    const CREATE = 1,
      UPDATE = 2,
      DELETE = 3;
    for (let i = 0; i < request.changes.length; i++) {
      const change = request.changes[i]

      switch (change.type) {
        case CREATE:
          currentRevision = await changesStore.doCreate(change.table, change.key, this.toCreateObj(change).obj, request.clientIdentity);
          break;
        case UPDATE:
          currentRevision = await changesStore.doUpdate(change.table, change.key, this.toUpdateObj(change).mods, request.clientIdentity);

          break;
        case DELETE:
          currentRevision = await changesStore.doDelete(change.table, change.key, request.clientIdentity);
          break;
      }
    }

    return {
      type: "changes",
      changes: serverChangesFromOtherUsers,
      currentRevision: currentRevision,
      partial: false // Tell client that these are the only changes we are aware of. Since our mem DB is syncronous, we got all changes in one chunk.
    }


  }
}

export const orbitDexieSyncServerSide = new OrbitDexieSyncServerSide()

