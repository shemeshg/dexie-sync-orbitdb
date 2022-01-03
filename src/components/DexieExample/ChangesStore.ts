import {EventStoreAbstruct} from "./EventStoreAbstruct"
import { ipfsRepo } from "../OrbitDbWebExample/IpfsOrbitRepo";
import { v4 as uuidv4 } from 'uuid';

enum ACTIONS {
  CREATE = 1,
  UPDATE = 2,
  DELETE = 3
}
interface ChangeItf {
  hash: string,
  rev: string,
  source: string,
  type: ACTIONS,
  table: string,
  key: string,
  obj?: unknown,
  mods?: unknown[]
}

class ChangesStore extends EventStoreAbstruct<ChangeItf>{
  async queryAndRender(): Promise<void>{return;}  

  changeStoreIsLoaded = false
  //Empty orbitdbUrlToOpen will create new store
  async loadStoreIfNotLoaded(orbitdbUrlToOpen: string): Promise<void>{    
    if (this.changeStoreIsLoaded){return;}
    await ipfsRepo.doConnect();

    if (orbitdbUrlToOpen) {
      await this.openStore(orbitdbUrlToOpen);
    } else {
      await this.createStore("changes", true);
    }
    await this.loadStore();
    this.changeStoreIsLoaded=true
  }

  async resetStore(): Promise<void> {
      await super.resetStore()
      this.changeStoreIsLoaded = false;
  }

  async doCreate(table: string, key: string, obj: unknown, clientIdentity: string) {
    const cid = await this.store?.add({
      hash: uuidv4(),
      rev: uuidv4(),
      source: clientIdentity,
      type: ACTIONS.CREATE,
      table: table,
      key: key,
      obj: obj
    })
    if (!cid) { throw new Error("Error in log") }
    return cid;
  }



  // eslint-disable-next-line
  async doUpdate(table: string, key: string, modifications: { [keyPath: string]: any; }, clientIdentity: string) {
    const cid = await this.store.add({
      hash: uuidv4(),
      rev: uuidv4(),
      source: clientIdentity,
      type: ACTIONS.UPDATE,
      table: table,
      key: key,
      mods: modifications
    })
    if (!cid) { throw new Error("Error in log") }
    return cid;
  }

  async doDelete(table: string, key: string, clientIdentity: string) {
    const cid = await this.store.add({
      hash: uuidv4(),
      rev: uuidv4(),
      source: clientIdentity,
      type: ACTIONS.DELETE,
      table: table,
      key: key,
    })
    if (!cid) { throw new Error("Error in log") }
    return cid;
  }

}

export const changesStore = new ChangesStore(ipfsRepo);