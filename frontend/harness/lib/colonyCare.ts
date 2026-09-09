import { type ColonyFrame } from "../../src/sim/colonySensors";
import { type Action } from "../../src/sim/controller/contract";

/** Opportunity diagnostics only. These counters never enter actor inputs or fitness. */
export class ColonyCare {
  readonly counts = {
    loadedCommands: 0,
    tinyCargoCommands: 0,
    cargoQuantitySum: 0,
    loadedRecipientContacts: 0,
    loadedQueenContacts: 0,
    feedCommands: 0,
    feedWithRecipient: 0,
    pickupCommands: 0,
    releaseCommands: 0,
    releaseNearQueen: 0,
  };

  observe(frame: ColonyFrame, action: Action): void {
    const loaded = frame.cargo > 1e-9;
    const recipient = frame.contacts.some((contact) => contact.hungry);
    const queen = frame.contacts.some((contact) => contact.queen);
    this.counts.loadedCommands += Number(loaded);
    this.counts.tinyCargoCommands += Number(loaded && frame.cargo < 1e-6);
    this.counts.cargoQuantitySum += frame.cargo;
    this.counts.loadedRecipientContacts += Number(loaded && recipient);
    this.counts.loadedQueenContacts += Number(loaded && queen);
    this.counts.feedCommands += Number(action.feed);
    this.counts.feedWithRecipient += Number(action.feed && loaded && recipient);
    this.counts.pickupCommands += Number(action.mandible);
    this.counts.releaseCommands += Number(action.release);
    this.counts.releaseNearQueen += Number(action.release && queen);
  }
}
