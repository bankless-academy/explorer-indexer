import {
  PolBadges,
  PolBadges_TransferSingle,
  Datadisks,
  Datadisks_Transfer,
  Handbooks,
  Handbooks_Transfer,
  BaseBadges,
  BaseBadges_TransferSingle,
} from "generated";
import kudosBadges from './badges.json';

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

const scorePerType = {
  polBadges: 1,
  baseBadges: 1,
  kudosBadges: 1,
  datadisks: 1,
  handbooks: 3,
};

function getContractIndex(address: string, contractList: string[]): string {
  const index = contractList.findIndex(a => a.toLowerCase() === address.toLowerCase());
  if (index === -1) return '';
  const prefix = contractList === datadisksAddresses ? 'D' : 'H';
  return `${prefix}${(index + 1).toString().padStart(3, '0')}`;
}

async function updateOwnerAssets(
  context: any,
  address: string,
  assetType: 'polBadges' | 'baseBadges' | 'kudosBadges' | 'datadisks' | 'handbooks',
  assetId: string | BigInt,
  isAdd: boolean
) {
  if (!address) return;
  const addressLower = address.toLowerCase();

  let ownerAssets = await context.OwnerAssets.get(addressLower);
  if (!ownerAssets) {
    ownerAssets = {
      id: addressLower,
      address: addressLower,
      badges: [],
      polBadges: [],
      baseBadges: [],
      kudosBadges: [],
      datadisks: [],
      handbooks: [],
      score: 0,
      lessonsCompleted: 0,
    };
  }

  const assetArray = ownerAssets[assetType];
  const assetIdString = assetId.toString();

  const isBadge = ['polBadges', 'baseBadges', 'kudosBadges'].includes(assetType);

  if (isAdd) {
    if (isBadge && ownerAssets.badges.includes(BigInt(assetIdString))) {
      // don't update score or lessonsCompleted if the badge is already in the array
      assetArray.push(assetIdString);
    } else {
      assetArray.push(assetIdString);
      ownerAssets.score += scorePerType[assetType];
      if (isBadge) {
        ownerAssets.lessonsCompleted += 1;
        ownerAssets.badges.push(assetIdString);
      }
    }
  } else {
    const assetIndex = assetArray.indexOf(assetIdString);
    if (assetIndex !== -1) {
      assetArray.splice(assetIndex, 1);
      ownerAssets.score -= scorePerType[assetType];
    }
  }

  ownerAssets.badges = ownerAssets.badges.map((id: string | number) => BigInt(id));
  ownerAssets.polBadges = ownerAssets.polBadges.map((id: string | number) => BigInt(id));
  ownerAssets.baseBadges = ownerAssets.baseBadges.map((id: string | number) => BigInt(id));
  ownerAssets.kudosBadges = ownerAssets.kudosBadges.map((id: string | number) => BigInt(id));
  ownerAssets.datadisks = ownerAssets.datadisks.map((id: string) => id);
  ownerAssets.handbooks = ownerAssets.handbooks.map((id: string) => id);

  await context.OwnerAssets.set(ownerAssets);
}

// Import kudos badges on startup
async function importKudosBadges(context: any) {
  console.log('Importing kudos badges...');
  for (const [address, badges] of Object.entries(kudosBadges)) {
    for (const badgeId of badges as number[]) {
      await updateOwnerAssets(context, address, 'kudosBadges', BigInt(badgeId), true);
    }
  }
  console.log('Kudos badges import completed');
}

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

  // await updateOwnerAssets(context, event.params.from, 'polBadges', event.params.id, false);
  await updateOwnerAssets(context, event.params.to, 'polBadges', event.params.id, true);
});

BaseBadges.TransferSingle.handler(async ({ event, context }) => {
  const entity: BaseBadges_TransferSingle = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    operator: event.params.operator,
    from: event.params.from,
    to: event.params.to,
    event_id: event.params.id,
    value: event.params.value,
  };

  context.BaseBadges_TransferSingle.set(entity);

  // only handle the transfer done by the bankless academy minter account
  if (event.params.from === '0x0000000000000000000000000000000000000000' && event.params.operator?.toLowerCase() === '0x472A74C4F7e281e590Bed861daa66721A6ACADBC'.toLowerCase()) {
    // await updateOwnerAssets(context, event.params.from, 'baseBadges', event.params.id, false);
    await updateOwnerAssets(context, event.params.to, 'baseBadges', event.params.id, true);
  }
});

const handleTransfer = async ({ event, context }: { event: any; context: any }) => {
  // HACK: simulate init event
  if (event.block.number === 56350237) {
    console.log('first datadisk transfer -> import kudos badges');
    await importKudosBadges(context);
  }

  const isDatadisk = datadisksAddresses.includes(event.srcAddress);
  const contractList = isDatadisk ? datadisksAddresses : handbooksAddresses;
  const contractIndex = getContractIndex(event.srcAddress, contractList);
  const assetType = isDatadisk ? 'datadisks' : 'handbooks';

  const entity = isDatadisk
    ? {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      from: event.params.from,
      to: event.params.to,
      tokenId: event.params.tokenId.toString(),
      contractIndex: contractIndex,
    } as Datadisks_Transfer
    : {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      from: event.params.from,
      to: event.params.to,
      value: event.params.tokenId.toString(),
      contractIndex: contractIndex,
    } as Handbooks_Transfer;

  await (isDatadisk ? context.Datadisks_Transfer.set(entity) : context.Handbooks_Transfer.set(entity));

  if (event.params.from !== '0x0000000000000000000000000000000000000000') {
    await updateOwnerAssets(context, event.params.from, assetType, contractIndex, false);
  }
  await updateOwnerAssets(context, event.params.to, assetType, contractIndex, true);
};

Datadisks.Transfer.handler(handleTransfer);
Handbooks.Transfer.handler(handleTransfer);
