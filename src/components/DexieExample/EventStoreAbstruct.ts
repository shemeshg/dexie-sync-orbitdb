import EventStore from "orbit-db-eventstore";
import { DbStore } from "../OrbitDbWebExample/IpfsOrbitRepo"
export abstract class EventStoreAbstruct<T> extends DbStore {

  async createStore(name: string, publicAccess: boolean): Promise<void> {
    await this.createStoreProtected(name, "eventlog", publicAccess)
  }

  get store(): EventStore<T> {
    return this.storeProtected as EventStore<T>
  }
  set store(store: EventStore<T>) {
    this.storeProtected = store
  }

  getAll(baseRevision?: string): T[] | undefined {
    if (baseRevision) {
      return this.store.iterator({ gt: baseRevision })
        .collect()
        .map((e) => e.payload.value)
    } else {
      return this.store.iterator()
        .collect()
        .map((e) => e.payload.value)
    }


  }

  getByHash(hash: string): LogEntry<T> | undefined {
    return this.store.get(hash)
  }

  async add(row: T): Promise<string | undefined> {
    return this.store.add(row)
  }
}