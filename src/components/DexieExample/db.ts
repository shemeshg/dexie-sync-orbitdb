// db.ts
import Dexie from 'dexie';
import 'dexie-observable';
import 'dexie-syncable';
import { OrbitDexieSyncClient, SYNCABLE_PROTOCOL, setOnClientAppliedUpdates } from "./OrbitDexieSyncClient"
import store from "../../store/index"
import { ChangeItf } from './ChangesStore';
import {importInto, exportDB} from "dexie-export-import";

export interface Friend {
  oid?: string;
  name: string;
  age: number;
}

export class MySubClassedDexie extends Dexie {
  // 'friends' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  friends!: Dexie.Table<Friend, number>; // number = type of the primkey 

  constructor() {
    super('myDatabase');
    this.version(1).stores({
      friends: '$$oid, name, age' // Primary key and indexed props
    });
  }

  async doExport():Promise<Blob>{
    return await exportDB(this)
  }

  async doImport(file: Blob): Promise<void>{
    return await importInto(db,file,{clearTablesBeforeImport: true})
  }  
}


setOnClientAppliedUpdates((changes: ChangeItf[]) => {
  if (changes.length) {
    //To Make vue refresh
    store.dispatch('refreshList')
    return;
  }
})

export const db = new MySubClassedDexie();


Dexie.Syncable.registerSyncProtocol(SYNCABLE_PROTOCOL, { sync: new OrbitDexieSyncClient().sync });


db.syncable.on('statusChanged', function (newStatus) {
  console.log("Sync Status changed: " + Dexie.Syncable.StatusTexts[newStatus]);
});



