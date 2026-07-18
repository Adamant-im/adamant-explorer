/**
 * Canonical ADAMANT transaction type registry shared by the backend and
 * frontend. Semantic flags define which protocol types appear in each
 * explorer operation group.
 */
module.exports = Object.freeze([
  {
    type: 0,
    id: 'transfer',
    label: 'Transfer',
    publicOperation: true,
    transfer: true,
    service: false,
  },
  {
    type: 1,
    id: 'second-signature',
    label: 'Second signature',
    publicOperation: true,
    transfer: false,
    service: true,
  },
  {
    type: 2,
    id: 'create-delegate',
    label: 'Create delegate',
    publicOperation: true,
    transfer: false,
    service: true,
  },
  {
    type: 3,
    id: 'vote',
    label: 'Vote / Unvote',
    publicOperation: true,
    transfer: false,
    service: true,
  },
  {
    type: 4,
    id: 'multisignature',
    label: 'Multisignature',
    publicOperation: true,
    transfer: false,
    service: true,
  },
  {
    type: 5,
    id: 'dapp-registration',
    label: 'DApp registration',
    publicOperation: true,
    transfer: false,
    service: true,
  },
  {
    type: 6,
    id: 'dapp-deposit',
    label: 'DApp deposit',
    publicOperation: true,
    transfer: false,
    service: true,
  },
  {
    type: 7,
    id: 'dapp-withdrawal',
    label: 'DApp withdrawal',
    publicOperation: true,
    transfer: false,
    service: true,
  },
  {
    type: 8,
    id: 'message',
    label: 'Message',
    publicOperation: false,
    transfer: true,
    service: false,
  },
  {
    type: 9,
    id: 'state',
    label: 'State',
    publicOperation: false,
    transfer: false,
    service: true,
  },
]);
