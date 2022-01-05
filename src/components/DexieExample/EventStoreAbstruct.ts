import KeyValueStore from "orbit-db-kvstore";
import { DbStore } from "../OrbitDbWebExample/IpfsOrbitRepo"



export abstract class EventStoreAbstruct<T> extends DbStore {


  get store(): KeyValueStore<T> {
    return this.storeProtected as KeyValueStore<T>
  }
  set store(store: KeyValueStore<T>) {
    this.storeProtected = store
  }

}