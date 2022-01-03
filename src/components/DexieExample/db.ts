// db.ts
import Dexie from 'dexie';
import 'dexie-observable';
import 'dexie-syncable';
import {OrbitDexieSyncClient, SYNCABLE_PROTOCOL} from "./OrbitDexieSyncClient"

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
}



export const db=new MySubClassedDexie();
Dexie.Syncable.registerSyncProtocol(SYNCABLE_PROTOCOL, { sync: new OrbitDexieSyncClient().sync });
// This example uses the WebSocketSyncProtocol included in earlier steps.
db.syncable.connect (SYNCABLE_PROTOCOL, "https://syncserver.com/sync");
db.syncable.on('statusChanged', function (newStatus) {
    console.log ("Sync Status changed: " + Dexie.Syncable.StatusTexts[newStatus]);
});



