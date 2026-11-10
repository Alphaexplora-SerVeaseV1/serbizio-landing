export type StageWord = 'door' | 'home' | 'street' | 'barangay' | 'neighborhood';

export interface WordStageConfig {
  word: StageWord;
  cameraPos: [number, number, number];
  sceneRotationY: number;
  visibleHouses: number;
  doorOpen: boolean;
}
