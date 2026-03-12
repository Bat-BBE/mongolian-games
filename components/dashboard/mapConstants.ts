export const STATION_CONFIGS: Record<string, {
  left: string;
  top: string;
  icon: string;
  wx: number;
  wz: number;
  region: string;
}> = {

  ulaanbaatar: {
    left: "50%", top: "44%", icon: "🏙️",
    wx:   0,  wz:   0,
    region: "Улаанбаатар",
  },

//   nalaikh: {
//     left: "55%", top: "47%", icon: "⚒️",
//     wx:  42,  wz:   35,
//     region: "Налайх",
//   },


//   terelj: {
//     left: "56%", top: "40%", icon: "🦅",
//     wx:  34,  wz: -40,
//     region: "Хэнтий",
//   },

  zuunmod: {
    left: "50%", top: "51%", icon: "🌲",
    wx:   0,  wz:  50,
    region: "Төв",
  },

  darkhan: {
    left: "46%", top: "30%", icon: "🏗️",
    wx: -10,  wz: -28,
    region: "Дархан-Уул",
  },

  erdenet: {
    left: "37%", top: "31%", icon: "⛏️",
    wx: -24,  wz: -26,
    region: "Орхон",
  },

//   sukhbaatar: {
//     left: "47%", top: "24%", icon: "🚉",
//     wx:  -106,  wz: -140,
//     region: "Сэлэнгэ",
//   },

  moron: {
    left: "22%", top: "27%", icon: "🏔️",
    wx: -50,  wz: -132,
    region: "Хөвсгөл",
  },

  khatgal: {
    left: "21%", top: "19%", icon: "🏞️",
    wx: -63,  wz: -44,
    region: "Хөвсгөл",
  },

  kharakhorum: {
    left: "32%", top: "47%", icon: "🏛️",
    wx: -66,  wz: 74,
    region: "Өвөрхангай",
  },

  orkhon_river: {
    left: "33%", top: "41%", icon: "🌊",
    wx: -133,  wz:  -118,
    region: "Орхон гол",
  },

  arvaikheer: {
    left: "31%", top: "55%", icon: "🏕️",
    wx: -37,  wz:  118,
    region: "Өвөрхангай",
  },

  bayankhongor: {
    left: "23%", top: "57%", icon: "🦌",
    wx: -155,  wz:  70,
    region: "Баянхонгор",
  },


  uliastai: {
    left: "12%", top: "43%", icon: "🏔️",
    wx: -178,  wz:   0,
    region: "Завхан",
  },

//   altai: {
//     left: "11%", top: "53%", icon: "⛰️",
//     wx: -180,  wz:  26,
//     region: "Говь-Алтай",
//   },

  khovd: {
    left: "3%",  top: "38%", icon: "🦅",
    wx: -160, wz:  -106,
    region: "Ховд",
  },

  ulaangom: {
    left: "5%",  top: "25%", icon: "🌊",
    wx: -198,  wz: -138,
    region: "Увс",
  },

//   ondorhaan: {
//     left: "65%", top: "45%", icon: "⛺",
//     wx:  134,  wz:   102,
//     region: "Хэнтий",
//   },

//   kherlenbayan: {
//     left: "74%", top: "37%", icon: "🌾",
//     wx:  150,  wz: -114,
//     region: "Хэнтий",
//   },

  choibalsan: {
    left: "84%", top: "32%", icon: "🐎",
    wx:  168,  wz: -126,
    region: "Дорнод",
  },

//   baruun_urt: {
//     left: "80%", top: "52%", icon: "🏜️",
//     wx:  160,  wz:  110,
//     region: "Сүхбаатар",
//   },


  mandalgovi: {
    left: "49%", top: "60%", icon: "🌅",
    wx:  -104,  wz:  126,
    region: "Дундговь",
  },

  dalanzadgad: {
    left: "38%", top: "73%", icon: "🏜️",
    wx: -162,  wz:  146,
    region: "Өмнөговь",
  },

//   sainshand: {
//     left: "63%", top: "65%", icon: "🚂",
//     wx:  230,  wz:  132,
//     region: "Дорноговь",
//   },

  zamiin_uud: {
    left: "69%", top: "76%", icon: "🚪",
    wx:  142,  wz:  148,
    region: "Дорноговь",
  },
};

export const HORSE_COLORS = [
  0x6b3a1f, 0x3a2010, 0xc8a060,
  0x8a6030, 0x1a1008, 0xd4b890, 0xa06040,
];

export const TERRAIN_W   = 900;
export const TERRAIN_D   = 520; 
export const TERRAIN_SEG = 280;