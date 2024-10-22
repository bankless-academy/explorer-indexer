/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  PolBadges,
  PolBadges_TransferSingle,
  Datadisks,
  Datadisks_Transfer,
  Handbooks,
  Handbooks_Transfer,
} from "generated";

PolBadges.TransferSingle.handler(async ({ event, context }) => {
  const entity: PolBadges_TransferSingle = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    operator: event.params.operator,
    from: event.params.from,
    to: event.params.to,
    event_id: event.params.id,
    value: event.params.value,
  };

  context.PolBadges_TransferSingle.set(entity);
});

Datadisks.Transfer.handler(async ({ event, context }) => {
  const entity: Datadisks_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    tokenId: event.params.tokenId,
  };

  context.Datadisks_Transfer.set(entity);
});

Handbooks.Transfer.handler(async ({ event, context }) => {
  const entity: Handbooks_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    clone: event.params.clone,
    from: event.params.from,
    to: event.params.to,
    tokenId: event.params.tokenId,
  };

  context.Handbooks_Transfer.set(entity);
});
