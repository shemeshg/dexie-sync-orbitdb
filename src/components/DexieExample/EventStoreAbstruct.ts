import FeedStore from "orbit-db-feedstore";
import { DbStore } from "../OrbitDbWebExample/IpfsOrbitRepo"
export abstract class EventStoreAbstruct<T> extends DbStore {

  async createStore(name: string, publicAccess: boolean): Promise<void> {
    await this.createStoreProtected(name, "feed", publicAccess)
  }

  get store(): FeedStore<T> {
    return this.storeProtected as FeedStore<T>
  }
  set store(store: FeedStore<T>) {
    this.storeProtected = store
  }

  
  getAllGt(baseRevision?: string):LogEntry<T>[]{
    if (baseRevision) {
      return this.store.iterator({ gt: baseRevision, limit: -1 })
        .collect()
        
    } else {
      return this.store.iterator({limit: -1})
        .collect()
  
    }
  }

  getAllLt(baseRevision?: string): LogEntry<T>[]{
    if (baseRevision) {
      return this.store.iterator({ lte: baseRevision, limit: -1 })
        .collect()
    } else {
      return this.store.iterator({limit: -1})
        .collect()
    }
  }

  getLastRecords(numberOfRecord: number): LogEntry<T>[]{
    return this.store.iterator({ limit: numberOfRecord }).collect()
  }

  getByHash(hash: string): LogEntry<T> | undefined {
    return this.store.get(hash)
  }

  async add(row: T): Promise<string | undefined> {
    return await this.store.add(row)
  }

  async remove(hash: string): Promise<string | undefined> {
    return await this.store.remove(hash)
  }

}