import {EventStoreAbstruct} from "./EventStoreAbstruct"
import { v4 as uuidv4 } from 'uuid';


enum ACTIONS {
  CREATE = 1,
  UPDATE = 2,
  DELETE = 3
}
export interface ChangeItf {
  hash: string,
  rev: number,
  source: string,
  type: ACTIONS,
  table: string,
  key: string,
  obj?: unknown,
  mods?: unknown[]
}

export class ChangesStore extends EventStoreAbstruct<ChangeItf>{
  async queryAndRender(): Promise<void>{
    this.statusFnc({ queryData: [], status: "", newData: true  });
  }  

  changeStoreIsLoaded = false
  //Empty orbitdbUrlToOpen will create new store
  async loadStoreIfNotLoaded(orbitdbUrlToOpen: string): Promise<void>{    
    if (this.changeStoreIsLoaded){return;}
   

    if (orbitdbUrlToOpen) {
      await this.openStore(orbitdbUrlToOpen);
    } else {
      await this.createStore("changes", true);
    }
    await this.loadStore();
    this.changeStoreIsLoaded=true
  }

  async resetStore(): Promise<void> {
    if(this.store){
      await this.store.close()
    }
      
      this.changeStoreIsLoaded = false;
  }

  async doCreate(table: string, key: string, obj: unknown, clientIdentity: string): Promise<string> {
    const cid = await this.store?.add({
      hash: uuidv4(),
      rev: (new Date()).getTime(),
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

  async doDelete(table: string, key: string, clientIdentity: string): Promise<string> {
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
