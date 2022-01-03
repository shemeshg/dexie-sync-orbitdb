import {EventStoreAbstruct} from "./EventStoreAbstruct"
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

export class ChangesStore extends EventStoreAbstruct<ChangeItf>{
  async queryAndRender(): Promise<void>{return;}  
}