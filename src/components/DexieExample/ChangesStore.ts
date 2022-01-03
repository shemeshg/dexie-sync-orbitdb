import {EventStoreAbstruct} from "./EventStoreAbstruct"
import { ipfsRepo } from "../OrbitDbWebExample/IpfsOrbitRepo";

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
}

export const changesStore = new ChangesStore(ipfsRepo);