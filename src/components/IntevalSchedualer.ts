import {DbStore} from "./IpfsOrbitRepo"
export class IntevalSchedualer {
  updateInterval?: NodeJS.Timeout
  interval?: number
  count = 0
  dbstore: DbStore
  constructor(dbstore: DbStore) {
    this.dbstore=dbstore
    this.resetIntervalTime();
  }
  private resetIntervalTime() {
    this.interval = Math.floor((Math.random() * 300) + (Math.random() * 2000))
  }

  start(): void{
    // Start update/insert loop
    this.updateInterval = setInterval(async () => {
      try {
        await this.dummyInsert()
      } catch (e) {
        console.error(e)        
        if (this.updateInterval) {
          clearInterval(this.updateInterval)
        }
      }
    }, this.interval)
  }

  private async dummyInsert(): Promise<void>{
    const creatures = [
      '🐙', '🐷', '🐬', '🐞', 
      '🐈', '🙉', '🐸', '🐓',
      '🐊', '🕷', '🐠', '🐘',
      '🐼', '🐰', '🐶', '🐥'
    ]
    const time = new Date().toISOString()
    const idx = Math.floor(Math.random() * creatures.length)
    const creature = creatures[idx]
    this.count++

    if (this.dbstore.store?.type === 'eventlog') {
      const value = "GrEEtinGs from " + this.dbstore.orbitdb.id + " " + creature + ": Hello #" + this.count + " (" + time + ")"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.dbstore.store as any).add(value)
    } else if (this.dbstore.store?.type  === 'feed') {
      const value = "GrEEtinGs from " + this.dbstore.orbitdb.id + " " + creature + ": Hello #" + this.count + " (" + time + ")"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.dbstore.store as any).add(value)
    } else if (this.dbstore.store?.type  === 'docstore') {
      const value = { _id: 'peer1', avatar: creature, updated: time }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.dbstore.store as any).put(value)
    } else if (this.dbstore.store?.type  === 'keyvalue') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.dbstore.store as any).set('mykey', creature)
    } else if (this.dbstore.store?.type  === 'counter') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.dbstore.store as any).inc(1)
    } else {
      throw new Error(`Unknown datatbase type:  ${this.dbstore.store?.type}`)
    }
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
    this.dbstore.resetStore();
    this.interval = Math.floor((Math.random() * 300) + (Math.random() * 2000))
  }
}
