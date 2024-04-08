interface MachineStatus {
  time: number;
  hostname?: string;
  ambient?: number;
  exhaust?: number;
  DC?: number;
}

export default MachineStatus;