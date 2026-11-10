import { WordStageConfig } from '../types';

export const WORD_STAGES: WordStageConfig[] = [
  {
    word: 'door',
    cameraPos: [0.2, 2.5, 6.8],
    sceneRotationY: -0.28,
    visibleHouses: 1,
    doorOpen: true,
  },
  {
    word: 'home',
    cameraPos: [0.5, 2.8, 7.2],
    sceneRotationY: -0.16,
    visibleHouses: 1,
    doorOpen: true,
  },
  {
    word: 'street',
    cameraPos: [0.8, 3.1, 7.7],
    sceneRotationY: 0.06,
    visibleHouses: 3,
    doorOpen: false,
  },
  {
    word: 'barangay',
    cameraPos: [1.0, 3.4, 8.1],
    sceneRotationY: -0.2,
    visibleHouses: 5,
    doorOpen: false,
  },
  {
    word: 'neighborhood',
    cameraPos: [0.6, 3.6, 8.4],
    sceneRotationY: 0.14,
    visibleHouses: 7,
    doorOpen: true,
  },
];
