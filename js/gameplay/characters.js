/**
 * 사방신 무림전(四方神 武林傳) - 4인의 무림 고수 스펙 및 무공 정의
 */
window.SF = window.SF || {};

SF.CHARACTERS = {
  BLUE_DRAGON: {
    id: 'BLUE_DRAGON',
    nameKr: '청룡',
    nameEn: 'Blue Dragon',
    title: '신속의 청도검객 (靑道劍客)',
    tagline: '청록색 도포와 날렵한 검기, 질풍의 쾌속 연격',
    color: '#00f3ff',
    glowColor: 'rgba(0, 243, 255, 0.65)',
    robeColor: '#0a424a',     // Deep cyan martial robe
    sashColor: '#00f3ff',     // Bright cyan sash belt
    weaponType: 'SWORD',
    
    // Stats
    speed: 7.2,
    jumpForce: -17.5,
    maxHp: 950,
    defense: 0.95,
    canDoubleJump: false,

    stats: {
      speed: 10,
      power: 6,
      range: 8,
      defense: 5
    },

    skills: {
      light: {
        name: '청풍 3연격',
        damage: 38,
        hitstun: 14,
        knockback: { x: 3.5, y: -2 },
        duration: 16,
        hitbox: { x: 25, y: -48, w: 70, h: 55 },
        sound: 'slash'
      },
      heavy: {
        name: '발도 질풍참',
        damage: 85,
        hitstun: 24,
        knockback: { x: 9.5, y: -5 },
        duration: 26,
        hitbox: { x: 22, y: -52, w: 95, h: 65 },
        dashSpeed: 9.5,
        sound: 'slash'
      },
      special: {
        name: '청룡파 (풍압검기)',
        spCost: 25,
        cooldown: 140,
        desc: '청룡검에서 뿜어져 나오는 날카로운 수묵 풍압 검기를 날립니다.'
      },
      ultimate: {
        name: '청룡참 (풍신난무)',
        spCost: 100,
        damage: 260,
        desc: '화면 전체를 가르는 초고속 사방신 수묵 십자 참격을 퍼붓습니다.'
      }
    }
  },

  WHITE_TIGER: {
    id: 'WHITE_TIGER',
    nameKr: '백호',
    nameEn: 'White Tiger',
    title: '파천의 패도전사 (覇刀戰士)',
    tagline: '묵직한 갑주와 백호대도로 대지를 분쇄하는 괴력의 투신',
    color: '#ffd700',
    glowColor: 'rgba(255, 215, 0, 0.65)',
    robeColor: '#362c16',     // Armored dark bronze robe
    sashColor: '#ffd700',     // Golden tiger belt
    weaponType: 'BROADSWORD', // 백호 대도

    speed: 4.8,
    jumpForce: -16.0,
    maxHp: 1150,
    defense: 0.85,
    canDoubleJump: false,

    stats: {
      speed: 4,
      power: 10,
      range: 6,
      defense: 9
    },

    skills: {
      light: {
        name: '패도 횡타',
        damage: 55,
        hitstun: 18,
        knockback: { x: 4.5, y: -3 },
        duration: 22,
        hitbox: { x: 22, y: -52, w: 75, h: 60 },
        sound: 'hitHeavy'
      },
      heavy: {
        name: '대도 분쇄벽 (가드 파괴)',
        damage: 130,
        hitstun: 32,
        knockback: { x: 7.5, y: -8 },
        duration: 36,
        guardBreak: true,
        hitbox: { x: 28, y: -68, w: 90, h: 85 },
        sound: 'hitHeavy'
      },
      special: {
        name: '백호 맹돌 (지진파)',
        spCost: 25,
        cooldown: 180,
        desc: '패기를 두르고 돌진하며 지면을 뒤흔드는 뇌전 충격파를 방출합니다.'
      },
      ultimate: {
        name: '백호포효쇄 (대지분쇄)',
        spCost: 100,
        damage: 320,
        desc: '백호의 포효로 적을 제압한 뒤 대지를 분쇄하는 일격을 가합니다.'
      }
    }
  },

  VERMILION_BIRD: {
    id: 'VERMILION_BIRD',
    nameKr: '주작',
    nameEn: 'Vermilion Bird',
    title: '불멸의 선무가 (扇舞家)',
    tagline: '진홍빛 날개 도포와 주작철선, 화려한 공중 화염 연계',
    color: '#ff3344',
    glowColor: 'rgba(255, 51, 68, 0.65)',
    robeColor: '#4a1218',     // Crimson silk robe
    sashColor: '#ff3344',     // Fiery silk ribbons
    weaponType: 'IRON_FAN',   // 주작 철선 (부채)

    speed: 6.4,
    jumpForce: -16.8,
    maxHp: 900,
    defense: 1.0,
    canDoubleJump: true,

    stats: {
      speed: 8,
      power: 7,
      range: 9,
      defense: 4
    },

    skills: {
      light: {
        name: '선무 연타',
        damage: 42,
        hitstun: 15,
        knockback: { x: 4, y: -2.5 },
        duration: 18,
        hitbox: { x: 22, y: -48, w: 65, h: 55 },
        sound: 'slash'
      },
      heavy: {
        name: '성화 강하선',
        damage: 95,
        hitstun: 26,
        knockback: { x: 6.5, y: -6 },
        duration: 28,
        hitbox: { x: 18, y: -42, w: 80, h: 70 },
        sound: 'fire'
      },
      special: {
        name: '업화탄 (철선화염)',
        spCost: 25,
        cooldown: 150,
        desc: '철선을 펼쳐 화염 깃털을 사출하고 지면에 지속 불길을 일으킵니다.'
      },
      ultimate: {
        name: '주작천상진 (성화폭격)',
        spCost: 100,
        damage: 280,
        desc: '불타는 날개로 비상하여 허공에서 거대한 화염 폭격을 쏟아붓습니다.'
      }
    }
  },

  BLACK_TORTOISE: {
    id: 'BLACK_TORTOISE',
    nameKr: '현무',
    nameEn: 'Black Tortoise',
    title: '심연의 흑도사 (黑道士)',
    tagline: '짙은 먹빛 도포와 현무사슬낫, 결계 제어와 수경 반격',
    color: '#3a7afe',
    glowColor: 'rgba(58, 122, 254, 0.65)',
    robeColor: '#121828',     // Dark ink taoist robe
    sashColor: '#3a7afe',     // Indigo talismans belt
    weaponType: 'CHAIN_SICKLE',

    speed: 4.5,
    jumpForce: -15.8,
    maxHp: 1200,
    defense: 0.80,
    canDoubleJump: false,

    stats: {
      speed: 4,
      power: 7,
      range: 10,
      defense: 10
    },

    skills: {
      light: {
        name: '흑사슬 횡소',
        damage: 45,
        hitstun: 16,
        knockback: { x: 5.5, y: -2 },
        duration: 24,
        hitbox: { x: 30, y: -52, w: 110, h: 48 },
        sound: 'slash'
      },
      heavy: {
        name: '사슬 포박 (견인)',
        damage: 75,
        hitstun: 30,
        knockback: { x: -6.5, y: -1 },
        duration: 32,
        hitbox: { x: 35, y: -52, w: 135, h: 48 },
        sound: 'hitHeavy'
      },
      special: {
        name: '수경 반격 (카운터)',
        spCost: 25,
        cooldown: 160,
        desc: '수호 수경 진을 전개하여 적의 공격을 무효화하고 튕겨냅니다.'
      },
      ultimate: {
        name: '현무수진각 (소용돌이)',
        spCost: 100,
        damage: 270,
        desc: '거대한 수묵 소용돌이 결계를 펼쳐 적을 가두고 폭발시킵니다.'
      }
    }
  }
};
