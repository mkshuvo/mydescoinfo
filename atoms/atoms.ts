import { atom } from 'recoil';
import { BalanceInfo } from '../Interfaces/getBalance';
import { DailyConsumptionInfo } from '../Interfaces/getCustomerDailyConsumption';

export const meterNoState = atom<string | null>({
  key: 'meterNoState',
  default: null,
});

export const balanceState = atom<BalanceInfo | null>({
  key: 'balanceState',
  default: null,
});

export const dailyConsumptionState = atom<DailyConsumptionInfo[] | null>({
  key: 'dailyConsumptionState',
  default: null,
});
