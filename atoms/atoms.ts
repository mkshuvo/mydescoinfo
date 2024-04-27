import { atom } from 'recoil';

export const meterNoState = atom<string | null>({
  key: 'meterNoState',
  default: null,
});

export const balanceState = atom({
  key: 'balanceState',
  default: {
    accountNo: '',
    meterNo: '',
    balance: 0,
    currentMonthConsumption: 0,
    readingTime: '',
  },
});

export const dailyConsumptionState = atom({
  key: 'dailyConsumptionState',
  default: [],
});
