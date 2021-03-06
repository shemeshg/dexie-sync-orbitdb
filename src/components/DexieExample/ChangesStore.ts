import { EventStoreAbstruct } from "./EventStoreAbstruct"
import { v4 as uuidv4 } from 'uuid';
import CounterStore from "orbit-db-counterstore";
import { ipfsRepo } from "../OrbitDbWebExample/IpfsOrbitRepo";
import { DbStore } from "../OrbitDbWebExample/IpfsOrbitRepo"
import { MySubClassedDexie } from "./db";
import { SYNCABLE_PROTOCOL } from "./OrbitDexieSyncClient";

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

export type OtherUsersLastRevisionKnown = { counter: number; clientIdentity: string }[]

interface DocumentItf {
  userData: ChangeItf[]
  otherUsersLastRevisionKnown: OtherUsersLastRevisionKnown
  counter: number,
  lastBackup?: LastBackupItf
}

interface LastBackupItf {
  allUsersCounterHighWattermark: {clientIdentity:string; counter: number}[]
  ipfsCid: string
  rev: number,
}

class SharedCounter extends DbStore {

  async queryAndRender(): Promise<void> { return; }

  async createStore(name: string, publicAccess: boolean): Promise<void> {
    await this.createStoreProtected(name, "counter", publicAccess)
  }

  async openStore(address: string): Promise<void> {
    await this.openStoreProtected(address)
  }

  get store(): CounterStore {
    return this.storeProtected as CounterStore
  }
  set store(store: CounterStore) {
    this.storeProtected = store
  }

  async incAndGetNewVal(): Promise<number> {
    const sharedCounter = await this.store.inc()
    if (!sharedCounter || !this.store.value) { throw new Error("Could not inc counter") }
    return this.store.value - 1
  }

}


class ChangesStore extends EventStoreAbstruct<DocumentItf | string | LastBackupItf>{
  requestSendReplicaToAll = false
  sharedCounter?: SharedCounter
  async createStore(name: string, publicAccess: boolean): Promise<void> {
    await this.createStoreProtected(name, "keyvalue", publicAccess)
  }

  async openStore(address: string): Promise<void> {
    await this.openStoreProtected(address)    
  }

  
  async add(row: ChangeItf, clientIdentity: string): Promise<string | undefined> {
    let doc = this.store.get(clientIdentity) as DocumentItf | undefined
    if (!doc) {
      doc = {
        otherUsersLastRevisionKnown: [],
        userData: [],
        counter: this.sharedCounter?.store.value as number
      }
    }
    doc.counter = this.sharedCounter?.store.value as number
    doc.userData.push(row)
    return this.store.put(clientIdentity, doc)
  }

  async queryAndRender(): Promise<void> {
    this.statusFnc({ queryData: [], status: "", newData: true });
  }

  changeStoreIsLoaded = false
  //Empty orbitdbUrlToOpen will create new store
  async loadStoreIfNotLoaded(orbitdbUrlToOpen: string): Promise<void> {
    if (this.changeStoreIsLoaded) { return; }

    if (orbitdbUrlToOpen) {
      await this.openStore(orbitdbUrlToOpen);
      await this.loadStore();

      const counterDbAddress = this.store.get("counter") as string
      this.sharedCounter = new SharedCounter(ipfsRepo)
      await this.sharedCounter.openStore(counterDbAddress)
      await this.sharedCounter.loadStore()      
    } else {
      // Probably you want this to be 
      // await this.createStore("changes" + UniqueString, true);
      await this.createStore("changes", true);
      await this.loadStore();

      this.sharedCounter = new SharedCounter(ipfsRepo)
      // Probably you want this to be 
      // await this.sharedCounter.createStore("counter" + UniqueString, true)
      await this.sharedCounter.createStore("counter", true)
      this.sharedCounter.loadStore()
      if (this.sharedCounter.storeAddress) {
        await this.store.put("counter", this.sharedCounter.storeAddress)
      }
    }
    
    this.changeStoreIsLoaded = true
  }

  async resetStore(): Promise<void> {
    if (this.store) {
      await this.store.close()
    }

    this.changeStoreIsLoaded = false;
  }

  async  restoreReplicaAndRollupChangesIfRequired(db: MySubClassedDexie, clientIdentity: string): Promise<{ refresh: boolean; appayData?: ChangeItf[]; }>{
    const currentUserDoc = this.store.get(clientIdentity) as DocumentItf        
    if(!currentUserDoc){return {refresh:false}}
    
    const lastbackup = this.store.get("lastbackup") as LastBackupItf
    if (!currentUserDoc.lastBackup){return {refresh:false};}
    const doRestore = (lastbackup.rev && currentUserDoc.lastBackup.rev < lastbackup.rev)

    if (!doRestore) {return {refresh:false};}

    const fileIpfs = await   this.getBlobByCid(lastbackup.ipfsCid,"text")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileText = await   fileIpfs.text() as any
    const j=JSON.parse(fileText)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tables=j.data.data.filter( (row: any)=>{return row.tableName[0]!=="_"})
    
    const list = await db.syncable.list();
    await db.syncable.disconnect(list[0]);

    
    for (let i=0;i<tables.length;i++){
      await db.table(tables[i].tableName).clear()
      await db.table(tables[i].tableName).bulkAdd(tables[i].rows)
    }
    db.table("_changes").clear()

    currentUserDoc.lastBackup = lastbackup;
    const truncateAllItemsBelow= lastbackup.allUsersCounterHighWattermark.filter((row)=>{return row.clientIdentity === clientIdentity})[0].counter
    currentUserDoc.userData = currentUserDoc.userData.filter((row)=>{return row.rev>truncateAllItemsBelow})
    await this.store.set(clientIdentity, currentUserDoc)
    await db.syncable.connect(SYNCABLE_PROTOCOL, list[0]);
    return {refresh: true, appayData: currentUserDoc.userData}
  }

  async sendReplicaToAll(db: MySubClassedDexie, clientIdentity: string): Promise<void>{
    const currentUserDoc = this.store.get(clientIdentity) as DocumentItf
        
    if(!currentUserDoc){return;}
    const fileObj = await db.doExport()
    const fileText = await fileObj.text();
    const fileIpfs = await this.ipfs.add(fileText)
    const sharedCounter = await this.sharedCounter?.incAndGetNewVal() as number
    let allUsersCounterHighWattermark: { counter: number; clientIdentity:string;}[] = []
    // get max current user, get max all others
    allUsersCounterHighWattermark.push({clientIdentity:clientIdentity,counter: Math.max( ...currentUserDoc.userData.map( (row)=>{return row.rev}) )})
    allUsersCounterHighWattermark = allUsersCounterHighWattermark.concat( currentUserDoc.otherUsersLastRevisionKnown)

    const lastBackup: LastBackupItf = {
      allUsersCounterHighWattermark: allUsersCounterHighWattermark,
      ipfsCid: fileIpfs.cid.toString(),
      rev: sharedCounter,
    }
    
    await this.store.put("lastbackup", lastBackup)
    currentUserDoc.lastBackup = lastBackup
    currentUserDoc.userData = []
    await this.store.put(clientIdentity, currentUserDoc)    
    
    return;
  }

  getAllOtherUsersGt(clientIdentity: string): {
    rowsToSyncLocally: ChangeItf[];
    countersToSetAfterApply: {
      counter: number;
      clientIdentity: string;
    }[];
  } {    
    
    const otherUsersKeys = Object.keys(this.store.all)
        .filter((key) => { return key !== clientIdentity && key !=="counter" && key !== "lastbackup" })
    const currentUserDoc = this.store.get(clientIdentity) as DocumentItf
    
    let rowsToSyncLocally: ChangeItf[] = []
    const countersToSetAfterApply: { counter: number, clientIdentity: string }[] = []
    if (!currentUserDoc){return { rowsToSyncLocally, countersToSetAfterApply } }
    
    for (let i = 0; i < otherUsersKeys.length; i++) {
      const otherUserKey = otherUsersKeys[i]
      const otherUserDoc = this.store.get(otherUserKey) as DocumentItf
      const otherUserCounterRows = currentUserDoc.otherUsersLastRevisionKnown.filter((row) => {
        return row.clientIdentity === otherUserKey
      })
      if (otherUserCounterRows.length === 0) {
        rowsToSyncLocally = rowsToSyncLocally.concat(otherUserDoc.userData)
        countersToSetAfterApply.push({ counter: otherUserDoc.counter, clientIdentity: otherUserKey })

      } else if (otherUserCounterRows[0].counter < otherUserDoc.counter) {
        const newRows = otherUserDoc.userData.filter((row) => {
          return row.rev > otherUserCounterRows[0].counter -1  && row.rev  < otherUserDoc.counter          
        })
        rowsToSyncLocally = rowsToSyncLocally.concat(newRows)
        countersToSetAfterApply.push({ counter: otherUserDoc.counter, clientIdentity: otherUserKey })
      } 

    }
    return { rowsToSyncLocally, countersToSetAfterApply }
  }

  async setCountersAfterApply(clientIdentity: string, countersToSetAfterApply: {
    counter: number;
    clientIdentity: string;
  }[]): Promise<void> {
    let currentUserDoc = this.store.get(clientIdentity) as DocumentItf
    if (!currentUserDoc) {
      currentUserDoc = {
        otherUsersLastRevisionKnown: [],
        userData: [],
        counter: this.sharedCounter?.store.value as number
      }
    }    
    for (let i=0;i<countersToSetAfterApply.length;i++){
      const remoteClientIdentity = countersToSetAfterApply[i].clientIdentity
      const rowToUpdate = currentUserDoc.otherUsersLastRevisionKnown.filter((row)=>{
        return row.clientIdentity===remoteClientIdentity
      })
      if (rowToUpdate.length===0){
        currentUserDoc.otherUsersLastRevisionKnown.push(countersToSetAfterApply[i])
      } else {
        rowToUpdate[0].counter = countersToSetAfterApply[i].counter
      }      
    }
    await this.store.put(clientIdentity, currentUserDoc)
  }

  async doCreate(table: string, key: string, obj: unknown, clientIdentity: string): Promise<string> {
    const sharedCounter = await this.sharedCounter?.incAndGetNewVal()

    const cid = await this.add({
      hash: uuidv4(),
      rev: sharedCounter as number,
      source: clientIdentity,
      type: ACTIONS.CREATE,
      table: table,
      key: key,
      obj: obj
    }, clientIdentity)
    if (!cid) { throw new Error("Error in log") }
    return cid;
  }



  // eslint-disable-next-line
  async doUpdate(table: string, key: string, modifications: any, clientIdentity: string) {
    const sharedCounter = await this.sharedCounter?.incAndGetNewVal()
    const cid = await this.add({
      hash: uuidv4(),
      rev: sharedCounter as number,
      source: clientIdentity,
      type: ACTIONS.UPDATE,
      table: table,
      key: key,

      mods: modifications,
    }, clientIdentity)
    if (!cid) { throw new Error("Error in log") }
    return cid;
  }

  async doDelete(table: string, key: string, clientIdentity: string): Promise<string> {
    const sharedCounter = await this.sharedCounter?.incAndGetNewVal()
    const cid = await this.add({
      hash: uuidv4(),
      rev: sharedCounter as number,
      source: clientIdentity,
      type: ACTIONS.DELETE,
      table: table,
      key: key,
    }, clientIdentity)
    if (!cid) { throw new Error("Error in log") }
    return cid;
  }

}

let _changesStore: ChangesStore
export async function getChangesStore(orbitdbUrlToOpen: string): Promise<ChangesStore>{
  if (!_changesStore) {
    _changesStore = new ChangesStore(ipfsRepo)
    await _changesStore.loadStoreIfNotLoaded(orbitdbUrlToOpen)
  } 
  return _changesStore
}