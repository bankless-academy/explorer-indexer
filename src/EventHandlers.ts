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

const datadisksAddresses = [
  '0x5ce61b80931Ea67565f0532965DDe5be2d41331d',
  '0x92B55D5254bC93A4f282224A9C3bD2b7e0eF37fc'
];

const handbooksAddresses = [
  '0x235f3dfe5106f137d8b137c1b7fa115076e8b476',
  '0xdeDEBfC6893D5e7e87Db8A1a88667D2BB746C231',
  '0x58da595fec45ca61cc68883869885e378caf0231',
  '0x0ae1cfd5f84bde987b255e822463a17705ad9ba9',
  '0xa22ed08b4ed3a34ce5c1802748ed8b294f3ec926',
  '0xb9Eef5b84D862e45e6C425574BE23b11CA9211f3',
  '0xe2dd5eb9841920937833c094874ba33d26becb4f',
  '0x8C21eABd632B41f840690C56D9dda70C9FD6E55e',
  '0xd94ecc2f45d7346975f2437c789b3e2e32c397ca'
];

function getContractIndex(address: string, contractList: string[]): string {
  const index = contractList.findIndex(a => a.toLowerCase() === address.toLowerCase());
  if (index === -1) return '';
  const prefix = contractList === datadisksAddresses ? 'D' : 'H';
  return `${prefix}${(index + 1).toString().padStart(3, '0')}`;
}

async function updateOwnerAssets(context: any, address: string, assetType: 'badges' | 'datadisks' | 'handbooks', assetId: string | BigInt, isAdd: boolean) {
  let ownerAssets = await context.OwnerAssets.get(address);
  if (!ownerAssets) {
    ownerAssets = {
      id: address,
      address: address,
      badges: [],
      datadisks: [],
      handbooks: [],
    };
  }

  const assetArray = ownerAssets[assetType];
  const assetIdString = assetId.toString();

  if (isAdd) {
    assetArray.push(assetIdString);
  } else {
    const assetIndex = assetArray.indexOf(assetIdString);
    if (assetIndex !== -1) {
      assetArray.splice(assetIndex, 1);
    }
  }

  // Ensure badges are BigInt, while datadisks and handbooks remain as strings
  ownerAssets.badges = ownerAssets.badges.map((id: string | number) => BigInt(id));
  ownerAssets.datadisks = ownerAssets.datadisks.map((id: string) => id);
  ownerAssets.handbooks = ownerAssets.handbooks.map((id: string) => id);

  await context.OwnerAssets.set(ownerAssets);
}

PolBadges.TransferSingle.handler(async ({ event, context }) => {
  // console.log("PolBadges TransferSingle event received:", event);
  const entity: PolBadges_TransferSingle = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    operator: event.params.operator,
    from: event.params.from,
    to: event.params.to,
    event_id: event.params.id,
    value: event.params.value,
  };

  context.PolBadges_TransferSingle.set(entity);

  await updateOwnerAssets(context, event.params.from, 'badges', event.params.id, false);
  await updateOwnerAssets(context, event.params.to, 'badges', event.params.id, true);
});

Datadisks.Transfer.handler(async ({ event, context }) => {
  console.log("Datadisks Transfer event received:", event);
  const contractIndex = getContractIndex(event.srcAddress, datadisksAddresses);
  const entity: Datadisks_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    tokenId: event.params.tokenId,
    contractIndex: contractIndex,
  };

  await context.Datadisks_Transfer.set(entity);

  await updateOwnerAssets(context, event.params.from, 'datadisks', contractIndex, false);
  await updateOwnerAssets(context, event.params.to, 'datadisks', contractIndex, true);
});

Handbooks.Transfer.handler(async ({ event, context }) => {
  console.log("Handbooks Transfer event received:", event);
  const contractIndex = getContractIndex(event.srcAddress, handbooksAddresses);
  const entity: Handbooks_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    clone: event.params.clone,
    from: event.params.from,
    to: event.params.to,
    tokenId: event.params.tokenId,
    contractIndex: contractIndex,
  };

  await context.Handbooks_Transfer.set(entity);

  await updateOwnerAssets(context, event.params.from, 'handbooks', contractIndex, false);
  await updateOwnerAssets(context, event.params.to, 'handbooks', contractIndex, true);
});
