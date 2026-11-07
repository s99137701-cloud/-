/**
 * 사방신 무림전 - Constants & Configuration (룸 코드 멀티플레이 & 사계절 투기장)
 */
window.SF = window.SF || {};

SF.CONSTANTS = {
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,
  
  // Game States
  STATE: {
    LOBBY: 'LOBBY',
    WAITING_GUEST: 'WAITING_GUEST',
    BATTLE: 'BATTLE',
    ROUND_END: 'ROUND_END',
    VICTORY: 'VICTORY'
  },

  // Match Type
  MATCH_TYPE: {
    P2P_HOST: 'P2P_HOST',
    P2P_GUEST: 'P2P_GUEST',
    PRACTICE: 'PRACTICE'
  },

  // 4 Seasonal Stages (사계절 무림 투기장)
  SEASONS: {
    SPRING: {
      id: 'SPRING',
      nameKr: '낙화유수 (落花流水) - 봄',
      desc: '달빛 아래 흩날리는 분홍 벚꽃과 고요한 도관',
      skyColor: '#120b18',
      moonColor: '#ffeef5',
      petalColor: '#ffb7c5',
      accentColor: '#ff80ab'
    },
    SUMMER: {
      id: 'SUMMER',
      nameKr: '청죽녹음 (靑竹綠陰) - 여름',
      desc: '햇살이 비치는 청량한 대나무 숲과 반딧불이',
      skyColor: '#071815',
      moonColor: '#e0f7fa',
      petalColor: '#80cbc4',
      accentColor: '#00e676'
    },
    AUTUMN: {
      id: 'AUTUMN',
      nameKr: '만산홍엽 (滿山紅葉) - 가을',
      desc: '붉게 물든 단풍잎과 거대한 보름달',
      skyColor: '#180a08',
      moonColor: '#fff3e0',
      petalColor: '#ff7043',
      accentColor: '#ff9800'
    },
    WINTER: {
      id: 'WINTER',
      nameKr: '설산빙벽 (雪山氷壁) - 겨울',
      desc: '휘몰아치는 함박눈과 얼어붙은 설산 투기장',
      skyColor: '#09101d',
      moonColor: '#e3f2fd',
      petalColor: '#ffffff',
      accentColor: '#90caf9'
    }
  },

  // Physics
  PHYSICS: {
    GRAVITY: 0.85,
    FLOOR_Y: 570,
    ARENA_LEFT: 60,
    ARENA_RIGHT: 1220,
    MAX_FALL_SPEED: 20,
    GROUND_FRICTION: 0.82,
    AIR_FRICTION: 0.95
  },

  // Combat Specs
  COMBAT: {
    MAX_HP: 1000,
    MAX_SP: 100,
    SP_GAIN_HIT: 7,
    SP_GAIN_DAMAGE: 11,
    GUARD_DAMAGE_RATIO: 0.2,
    HITSTOP_LIGHT: 4,
    HITSTOP_HEAVY: 8,
    HITSTOP_SPECIAL: 10,
    HITSTOP_ULT: 30,
    ROUND_TIME: 99
  },

  // Unified 1P Controls for each player
  KEYS: {
    UP: ['KeyW'],
    LEFT: ['KeyA'],
    DOWN: ['KeyS'],
    RIGHT: ['KeyD'],
    LIGHT: ['KeyJ'],       // 기본 공격 연타
    SPECIAL: ['KeyK'],     // 무기 특수 스킬
    ULTIMATE: ['KeyL']     // 궁극기 (SP 100%)
  }
};
