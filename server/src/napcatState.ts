export interface NapCatRuntimeStatus {
  connected: boolean;
  online: boolean;
  checkedAt: number;
}

let runtimeStatus: NapCatRuntimeStatus = {
  connected: false,
  online: false,
  checkedAt: 0
};

export function getNapCatRuntimeStatus() {
  return { ...runtimeStatus };
}

export function setNapCatRuntimeStatus(patch: Partial<NapCatRuntimeStatus>) {
  runtimeStatus = { ...runtimeStatus, ...patch };
  return getNapCatRuntimeStatus();
}