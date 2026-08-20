var METHODS = [
  {
    id: 3,
    code: "MWL",
    name: ["Muslim World League", "رابطة العالم الإسلامي"],
    short: ["MWL", "الرابطة"],
    fajr: 18,
    isha: 17,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 1, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: []
  },
  {
    id: 2,
    code: "ISNA",
    name: ["Islamic Society of North America", "الجمعية الإسلامية لأمريكا الشمالية"],
    short: ["ISNA", "أمريكا الشمالية"],
    fajr: 15,
    isha: 15,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 1, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["US", "CA"]
  },
  {
    id: 5,
    code: "EGAS",
    name: ["Egyptian General Authority of Survey", "الهيئة المصرية العامة للمساحة"],
    short: ["Egypt", "مصر"],
    fajr: 19.5,
    isha: 17.5,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 1, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["EG"]
  },
  {
    id: 4,
    code: "UAQ",
    name: ["Umm al-Qura University, Makkah", "جامعة أم القرى"],
    short: ["Umm al-Qura", "أم القرى"],
    fajr: 18.5,
    isha: 0,
    ishaMinutes: 90,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["SA"]
  },
  {
    id: 1,
    code: "UISK",
    name: ["University of Islamic Sciences, Karachi", "جامعة العلوم الإسلامية بكراتشي"],
    short: ["Karachi", "كراتشي"],
    fajr: 18,
    isha: 18,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 1, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["PK", "IN", "BD", "AF"]
  },
  {
    id: 7,
    code: "TEHRAN",
    name: ["Institute of Geophysics, University of Tehran", "معهد الجيوفيزياء بجامعة طهران"],
    short: ["Tehran", "طهران"],
    fajr: 17.7,
    isha: 14,
    ishaMinutes: 0,
    maghrib: 4.5,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Jafari",
    regions: ["IR"]
  },
  {
    id: 0,
    code: "JAFARI",
    name: ["Shia Ithna-Ashari, Leva Institute, Qum", "الشيعة الإمامية - معهد ليفا بقم"],
    short: ["Jafari", "جعفري"],
    fajr: 16,
    isha: 14,
    ishaMinutes: 0,
    maghrib: 4,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Jafari",
    regions: []
  },
  {
    id: 8,
    code: "GULF",
    name: ["Gulf Region", "منطقة الخليج"],
    short: ["Gulf", "الخليج"],
    fajr: 19.5,
    isha: 0,
    ishaMinutes: 90,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["BH", "OM"]
  },
  {
    id: 9,
    code: "KUWAIT",
    name: ["Kuwait", "الكويت"],
    short: ["Kuwait", "الكويت"],
    fajr: 18,
    isha: 17.5,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["KW"]
  },
  {
    id: 10,
    code: "QATAR",
    name: ["Qatar", "قطر"],
    short: ["Qatar", "قطر"],
    fajr: 18,
    isha: 0,
    ishaMinutes: 90,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["QA"]
  },
  {
    id: 11,
    code: "MUIS",
    name: ["Majlis Ugama Islam Singapura", "المجلس الإسلامي في سنغافورة"],
    short: ["Singapore", "سنغافورة"],
    fajr: 20,
    isha: 18,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 1, asr: 0, maghrib: 0, isha: 0 },
    rounding: "up",
    midnight: "Standard",
    regions: ["SG"]
  },
  {
    id: 12,
    code: "UOIF",
    name: ["Union des Organisations Islamiques de France", "اتحاد المنظمات الإسلامية في فرنسا"],
    short: ["UOIF", "فرنسا"],
    fajr: 12,
    isha: 12,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["FR"]
  },
  {
    id: 13,
    code: "DIYANET",
    name: ["Diyanet İşleri Başkanlığı, Turkey", "رئاسة الشؤون الدينية التركية"],
    short: ["Diyanet", "تركيا"],
    fajr: 18,
    isha: 17,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: -7, dhuhr: 5, asr: 4, maghrib: 7, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["TR"]
  },
  {
    id: 14,
    code: "SAMR",
    name: ["Spiritual Administration of Muslims of Russia", "الإدارة الدينية لمسلمي روسيا"],
    short: ["Russia", "روسيا"],
    fajr: 16,
    isha: 15,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["RU"]
  },
  {
    id: 15,
    code: "MOONSIGHT",
    name: ["Moonsighting Committee Worldwide", "لجنة رؤية الهلال العالمية"],
    short: ["Moonsighting", "رؤية الهلال"],
    fajr: 18,
    isha: 18,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 5, asr: 0, maghrib: 3, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: []
  },
  {
    id: 16,
    code: "DUBAI",
    name: ["Dubai", "دبي"],
    short: ["Dubai", "دبي"],
    fajr: 18.2,
    isha: 18.2,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: -3, dhuhr: 3, asr: 3, maghrib: 3, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["AE"]
  },
  {
    id: 17,
    code: "JAKIM",
    name: ["Jabatan Kemajuan Islam Malaysia", "دائرة التقدم الإسلامي الماليزية"],
    short: ["JAKIM", "ماليزيا"],
    fajr: 20,
    isha: 18,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 1, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["MY", "BN"]
  },
  {
    id: 18,
    code: "TUNISIA",
    name: ["Tunisia", "تونس"],
    short: ["Tunisia", "تونس"],
    fajr: 18,
    isha: 18,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["TN"]
  },
  {
    id: 19,
    code: "ALGERIA",
    name: ["Algeria", "الجزائر"],
    short: ["Algeria", "الجزائر"],
    fajr: 18,
    isha: 17,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["DZ"]
  },
  {
    id: 20,
    code: "KEMENAG",
    name: ["Kementerian Agama, Indonesia", "وزارة الشؤون الدينية الإندونيسية"],
    short: ["Kemenag", "إندونيسيا"],
    fajr: 20,
    isha: 18,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 1, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["ID"]
  },
  {
    id: 21,
    code: "MOROCCO",
    name: ["Morocco", "المغرب"],
    short: ["Morocco", "المغرب"],
    fajr: 19,
    isha: 17,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 5, asr: 0, maghrib: 5, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["MA"]
  },
  {
    id: 22,
    code: "LISBOA",
    name: ["Comunidade Islâmica de Lisboa", "الجالية الإسلامية في لشبونة"],
    short: ["Lisbon", "لشبونة"],
    fajr: 18,
    isha: 0,
    ishaMinutes: 77,
    maghrib: 0,
    maghribMinutes: 3,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 5, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["PT"]
  },
  {
    id: 23,
    code: "JORDAN",
    name: ["Ministry of Awqaf, Jordan", "وزارة الأوقاف الأردنية"],
    short: ["Jordan", "الأردن"],
    fajr: 18,
    isha: 18,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 5,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: ["JO"]
  },
  {
    id: 99,
    code: "CUSTOM",
    name: ["Custom", "مخصص"],
    short: ["Custom", "مخصص"],
    fajr: 15,
    isha: 15,
    ishaMinutes: 0,
    maghrib: 0,
    maghribMinutes: 0,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    midnight: "Standard",
    regions: []
  }
]

var MONTH_STARTS = [
  23999, 24029, 24058, 24088, 24118, 24147, 24177, 24207, 24237, 24265, 24295, 24325,
  24355, 24384, 24413, 24443, 24472, 24502, 24531, 24561, 24590, 24620, 24649, 24679,
  24708, 24738, 24767, 24797, 24826, 24857, 24886, 24916, 24944, 24974, 25004, 25033,
  25063, 25092, 25121, 25151, 25181, 25210, 25240, 25270, 25299, 25328, 25358, 25388,
  25417, 25446, 25475, 25505, 25535, 25564, 25594, 25624, 25653, 25683, 25713, 25742,
  25771, 25801, 25830, 25860, 25889, 25919, 25948, 25979, 26008, 26037, 26066, 26097,
  26125, 26155, 26184, 26214, 26243, 26273, 26302, 26332, 26362, 26392, 26420, 26451,
  26481, 26510, 26540, 26569, 26599, 26628, 26657, 26687, 26716, 26746, 26776, 26805,
  26835, 26865, 26894, 26924, 26953, 26983, 27012, 27041, 27070, 27100, 27130, 27159,
  27189, 27219, 27248, 27278, 27307, 27337, 27366, 27396, 27425, 27455, 27484, 27514,
  27543, 27573, 27602, 27632, 27662, 27691, 27721, 27750, 27780, 27810, 27839, 27868,
  27898, 27927, 27957, 27986, 28016, 28045, 28075, 28105, 28134, 28164, 28193, 28223,
  28252, 28282, 28311, 28341, 28370, 28400, 28429, 28459, 28488, 28518, 28548, 28577,
  28607, 28636, 28665, 28695, 28724, 28754, 28783, 28813, 28843, 28872, 28901, 28931,
  28960, 28990, 29019, 29049, 29078, 29108, 29137, 29167, 29196, 29226, 29255, 29285,
  29315, 29345, 29375, 29404, 29434, 29463, 29492, 29522, 29551, 29580, 29610, 29640,
  29669, 29699, 29729, 29759, 29788, 29818, 29847, 29876, 29906, 29935, 29964, 29994,
  30023, 30053, 30082, 30112, 30141, 30171, 30200, 30230, 30259, 30289, 30318, 30348,
  30378, 30408, 30437, 30467, 30496, 30526, 30555, 30585, 30614, 30644, 30673, 30703,
  30732, 30762, 30791, 30821, 30850, 30880, 30909, 30939, 30968, 30998, 31027, 31057,
  31086, 31116, 31145, 31175, 31204, 31234, 31263, 31293, 31322, 31352, 31381, 31411,
  31441, 31471, 31500, 31530, 31559, 31589, 31618, 31648, 31676, 31706, 31736, 31766,
  31795, 31825, 31854, 31884, 31913, 31943, 31972, 32002, 32031, 32061, 32090, 32120,
  32150, 32180, 32209, 32239, 32268, 32298, 32327, 32357, 32386, 32416, 32445, 32475,
  32504, 32534, 32563, 32593, 32622, 32652, 32681, 32711, 32740, 32770, 32799, 32829,
  32858, 32888, 32917, 32947, 32976, 33006, 33035, 33065, 33094, 33124, 33153, 33183,
  33213, 33243, 33272, 33302, 33331, 33361, 33390, 33420, 33450, 33479, 33509, 33539,
  33568, 33598, 33627, 33657, 33686, 33716, 33745, 33775, 33804, 33834, 33863, 33893,
  33922, 33952, 33981, 34011, 34040, 34069, 34099, 34128, 34158, 34187, 34217, 34247,
  34277, 34306, 34336, 34365, 34395, 34424, 34454, 34483, 34512, 34542, 34571, 34601,
  34631, 34660, 34690, 34719, 34749, 34778, 34808, 34837, 34867, 34896, 34926, 34955,
  34985, 35015, 35044, 35074, 35103, 35133, 35162, 35192, 35222, 35251, 35280, 35310,
  35340, 35370, 35399, 35429, 35458, 35488, 35517, 35547, 35576, 35605, 35635, 35665,
  35694, 35723, 35753, 35782, 35811, 35841, 35871, 35901, 35930, 35960, 35989, 36019,
  36048, 36078, 36107, 36136, 36166, 36195, 36225, 36254, 36284, 36314, 36343, 36373,
  36403, 36433, 36462, 36492, 36521, 36551, 36580, 36610, 36639, 36669, 36698, 36728,
  36757, 36786, 36816, 36845, 36875, 36904, 36934, 36963, 36993, 37022, 37052, 37081,
  37111, 37141, 37170, 37200, 37229, 37259, 37288, 37318, 37347, 37377, 37406, 37436,
  37465, 37495, 37524, 37554, 37584, 37613, 37643, 37672, 37701, 37731, 37760, 37790,
  37819, 37849, 37878, 37908, 37938, 37967, 37997, 38027, 38056, 38085, 38115, 38144,
  38174, 38203, 38233, 38262, 38292, 38322, 38351, 38381, 38410, 38440, 38469, 38499,
  38528, 38558, 38587, 38617, 38646, 38676, 38705, 38735, 38764, 38794, 38823, 38853,
  38882, 38912, 38941, 38971, 39001, 39030, 39059, 39089, 39118, 39148, 39178, 39208,
  39237, 39267, 39297, 39326, 39355, 39385, 39414, 39444, 39473, 39503, 39532, 39562,
  39592, 39621, 39650, 39680, 39709, 39739, 39768, 39798, 39827, 39857, 39886, 39916,
  39946, 39975, 40005, 40035, 40064, 40094, 40123, 40153, 40182, 40212, 40241, 40271,
  40300, 40330, 40359, 40389, 40418, 40448, 40477, 40507, 40536, 40566, 40595, 40625,
  40655, 40685, 40714, 40744, 40773, 40803, 40832, 40862, 40892, 40921, 40951, 40980,
  41009, 41039, 41068, 41098, 41127, 41157, 41186, 41216, 41245, 41275, 41304, 41334,
  41364, 41393, 41422, 41452, 41481, 41511, 41540, 41570, 41599, 41629, 41658, 41688,
  41718, 41748, 41777, 41807, 41836, 41865, 41894, 41924, 41953, 41983, 42012, 42042,
  42072, 42102, 42131, 42161, 42190, 42220, 42249, 42279, 42308, 42337, 42367, 42397,
  42426, 42456, 42485, 42515, 42545, 42574, 42604, 42633, 42662, 42692, 42721, 42751,
  42780, 42810, 42839, 42869, 42899, 42929, 42958, 42988, 43017, 43046, 43076, 43105,
  43135, 43164, 43194, 43223, 43253, 43283, 43312, 43342, 43371, 43401, 43430, 43460,
  43489, 43519, 43548, 43578, 43607, 43637, 43666, 43696, 43726, 43755, 43785, 43814,
  43844, 43873, 43903, 43932, 43962, 43991, 44021, 44050, 44080, 44109, 44139, 44169,
  44198, 44228, 44258, 44287, 44317, 44346, 44375, 44405, 44434, 44464, 44493, 44523,
  44553, 44582, 44612, 44641, 44671, 44700, 44730, 44759, 44788, 44818, 44847, 44877,
  44906, 44936, 44966, 44996, 45025, 45055, 45084, 45114, 45143, 45172, 45202, 45231,
  45261, 45290, 45320, 45350, 45380, 45409, 45439, 45468, 45498, 45527, 45556, 45586,
  45615, 45644, 45674, 45704, 45733, 45763, 45793, 45823, 45852, 45882, 45911, 45940,
  45970, 45999, 46028, 46058, 46088, 46117, 46147, 46177, 46206, 46236, 46265, 46295,
  46324, 46354, 46383, 46413, 46442, 46472, 46501, 46531, 46560, 46590, 46620, 46649,
  46679, 46708, 46738, 46767, 46797, 46826, 46856, 46885, 46915, 46944, 46974, 47003,
  47033, 47063, 47092, 47122, 47151, 47181, 47210, 47240, 47269, 47298, 47328, 47357,
  47387, 47417, 47446, 47476, 47506, 47535, 47565, 47594, 47624, 47653, 47682, 47712,
  47741, 47771, 47800, 47830, 47860, 47890, 47919, 47949, 47978, 48008, 48037, 48066,
  48096, 48125, 48155, 48184, 48214, 48244, 48273, 48303, 48333, 48362, 48392, 48421,
  48450, 48480, 48509, 48538, 48568, 48598, 48627, 48657, 48687, 48717, 48746, 48776,
  48805, 48834, 48864, 48893, 48922, 48952, 48982, 49011, 49041, 49071, 49100, 49130,
  49160, 49189, 49218, 49248, 49277, 49306, 49336, 49365, 49395, 49425, 49455, 49484,
  49514, 49543, 49573, 49602, 49632, 49661, 49690, 49720, 49749, 49779, 49809, 49838,
  49868, 49898, 49927, 49957, 49986, 50016, 50045, 50075, 50104, 50133, 50163, 50192,
  50222, 50252, 50281, 50311, 50340, 50370, 50400, 50429, 50459, 50488, 50518, 50547,
  50576, 50606, 50635, 50665, 50694, 50724, 50754, 50784, 50813, 50843, 50872, 50902,
  50931, 50960, 50990, 51019, 51049, 51078, 51108, 51138, 51167, 51197, 51227, 51256,
  51286, 51315, 51345, 51374, 51403, 51433, 51462, 51492, 51522, 51552, 51582, 51611,
  51641, 51670, 51699, 51729, 51758, 51787, 51816, 51846, 51876, 51906, 51936, 51965,
  51995, 52025, 52054, 52083, 52113, 52142, 52171, 52200, 52230, 52260, 52290, 52319,
  52349, 52379, 52408, 52438, 52467, 52497, 52526, 52555, 52585, 52614, 52644, 52673,
  52703, 52733, 52762, 52792, 52822, 52851, 52881, 52910, 52939, 52969, 52998, 53028,
  53057, 53087, 53116, 53146, 53176, 53205, 53235, 53264, 53294, 53324, 53353, 53383,
  53412, 53441, 53471, 53500, 53530, 53559, 53589, 53619, 53648, 53678, 53708, 53737,
  53767, 53796, 53825, 53855, 53884, 53914, 53943, 53973, 54003, 54032, 54062, 54092,
  54121, 54151, 54180, 54209, 54239, 54268, 54297, 54327, 54357, 54387, 54416, 54446,
  54476, 54505, 54535, 54564, 54593, 54623, 54652, 54681, 54711, 54741, 54770, 54800,
  54830, 54859, 54889, 54919, 54948, 54977, 55007, 55036, 55066, 55095, 55125, 55154,
  55184, 55213, 55243, 55273, 55302, 55332, 55361, 55391, 55420, 55450, 55479, 55508,
  55538, 55567, 55597, 55627, 55657, 55686, 55716, 55745, 55775, 55804, 55834, 55863,
  55892, 55922, 55951, 55981, 56011, 56040, 56070, 56100, 56129, 56159, 56188, 56218,
  56247, 56276, 56306, 56335, 56365, 56394, 56424, 56454, 56483, 56513, 56543, 56572,
  56601, 56631, 56660, 56690, 56719, 56749, 56778, 56808, 56837, 56867, 56897, 56926,
  56956, 56985, 57015, 57044, 57074, 57103, 57133, 57162, 57192, 57221, 57251, 57280,
  57310, 57340, 57369, 57399, 57429, 57458, 57487, 57517, 57546, 57576, 57605, 57634,
  57664, 57694, 57723, 57753, 57783, 57813, 57842, 57871, 57901, 57930, 57959, 57989,
  58018, 58048, 58077, 58107, 58137, 58167, 58196, 58226, 58255, 58285, 58314, 58343,
  58373, 58402, 58432, 58461, 58491, 58521, 58551, 58580, 58610, 58639, 58669, 58698,
  58727, 58757, 58786, 58816, 58845, 58875, 58905, 58934, 58964, 58994, 59023, 59053,
  59082, 59111, 59141, 59170, 59200, 59229, 59259, 59288, 59318, 59348, 59377, 59407,
  59436, 59466, 59495, 59525, 59554, 59584, 59613, 59643, 59672, 59702, 59731, 59761,
  59791, 59820, 59850, 59879, 59909, 59939, 59968, 59997, 60027, 60056, 60086, 60115,
  60145, 60174, 60204, 60234, 60264, 60293, 60323, 60352, 60381, 60411, 60440, 60469,
  60499, 60528, 60558, 60588, 60618, 60647, 60677, 60707, 60736, 60765, 60795, 60824,
  60853, 60883, 60912, 60942, 60972, 61002, 61031, 61061, 61090, 61120, 61149, 61179,
  61208, 61237, 61267, 61296, 61326, 61356, 61385, 61415, 61445, 61474, 61504, 61533,
  61563, 61592, 61621, 61651, 61680, 61710, 61739, 61769, 61799, 61828, 61858, 61888,
  61917, 61947, 61976, 62006, 62035, 62064, 62094, 62123, 62153, 62182, 62212, 62242,
  62271, 62301, 62331, 62360, 62390, 62419, 62448, 62478, 62507, 62537, 62566, 62596,
  62625, 62655, 62685, 62715, 62744, 62774, 62803, 62832, 62862, 62891, 62921, 62950,
  62980, 63009, 63039, 63069, 63099, 63128, 63157, 63187, 63216, 63246, 63275, 63305,
  63334, 63363, 63393, 63423, 63453, 63482, 63512, 63541, 63571, 63600, 63630, 63659,
  63689, 63718, 63747, 63777, 63807, 63836, 63866, 63895, 63925, 63955, 63984, 64014,
  64043, 64073, 64102, 64131, 64161, 64190, 64220, 64249, 64279, 64309, 64339, 64368,
  64398, 64427, 64457, 64486, 64515, 64545, 64574, 64603, 64633, 64663, 64692, 64722,
  64752, 64782, 64811, 64841, 64870, 64899, 64929, 64958, 64987, 65017, 65047, 65076,
  65106, 65136, 65166, 65195, 65225, 65254, 65283, 65313, 65342, 65371, 65401, 65431,
  65460, 65490, 65520, 65549, 65579, 65608, 65638, 65667, 65697, 65726, 65755, 65785,
  65815, 65844, 65874, 65903, 65933, 65963, 65992, 66022, 66051, 66081, 66110, 66140,
  66169, 66199, 66228, 66258, 66287, 66317, 66346, 66376, 66405, 66435, 66465, 66494,
  66524, 66553, 66583, 66612, 66641, 66671, 66700, 66730, 66760, 66789, 66819, 66849,
  66878, 66908, 66937, 66967, 66996, 67025, 67055, 67084, 67114, 67143, 67173, 67203,
  67233, 67262, 67292, 67321, 67351, 67380, 67409, 67439, 67468, 67497, 67527, 67557,
  67587, 67617, 67646, 67676, 67705, 67735, 67764, 67793, 67823, 67852, 67882, 67911,
  67941, 67971, 68000, 68030, 68060, 68089, 68119, 68148, 68177, 68207, 68236, 68266,
  68295, 68325, 68354, 68384, 68414, 68443, 68473, 68502, 68532, 68561, 68591, 68620,
  68650, 68679, 68708, 68738, 68768, 68797, 68827, 68857, 68886, 68916, 68946, 68975,
  69004, 69034, 69063, 69092, 69122, 69152, 69181, 69211, 69240, 69270, 69300, 69330,
  69359, 69388, 69418, 69447, 69476, 69506, 69535, 69565, 69595, 69624, 69654, 69684,
  69713, 69743, 69772, 69802, 69831, 69861, 69890, 69919, 69949, 69978, 70008, 70038,
  70067, 70097, 70126, 70156, 70186, 70215, 70245, 70274, 70303, 70333, 70362, 70392,
  70421, 70451, 70481, 70510, 70540, 70570, 70599, 70629, 70658, 70687, 70717, 70746,
  70776, 70805, 70835, 70864, 70894, 70924, 70954, 70983, 71013, 71042, 71071, 71101,
  71130, 71159, 71189, 71218, 71248, 71278, 71308, 71337, 71367, 71397, 71426, 71455,
  71485, 71514, 71543, 71573, 71602, 71632, 71662, 71691, 71721, 71751, 71781, 71810,
  71839, 71869, 71898, 71927, 71957, 71986, 72016, 72046, 72075, 72105, 72135, 72164,
  72194, 72223, 72253, 72282, 72311, 72341, 72370, 72400, 72429, 72459, 72489, 72518,
  72548, 72577, 72607, 72637, 72666, 72695, 72725, 72754, 72784, 72813, 72843, 72872,
  72902, 72931, 72961, 72991, 73020, 73050, 73080, 73109, 73139, 73168, 73197, 73227,
  73256, 73286, 73315, 73345, 73375, 73404, 73434, 73464, 73493, 73523, 73552, 73581,
  73611, 73640, 73669, 73699, 73729, 73758, 73788, 73818, 73848, 73877, 73907, 73936,
  73965, 73995, 74024, 74053, 74083, 74113, 74142, 74172, 74202, 74231, 74261, 74291,
  74320, 74349, 74379, 74408, 74437, 74467, 74497, 74526, 74556, 74585, 74615, 74645,
  74675, 74704, 74733, 74763, 74792, 74822, 74851, 74881, 74910, 74940, 74969, 74999,
  75029, 75058, 75088, 75117, 75147, 75176, 75206, 75235, 75264, 75294, 75323, 75353,
  75383, 75412, 75442, 75472, 75501, 75531, 75560, 75590, 75619, 75648, 75678, 75707,
  75737, 75766, 75796, 75826, 75856, 75885, 75915, 75944, 75974, 76003, 76032, 76062,
  76091, 76121, 76150, 76180, 76210, 76239, 76269, 76299, 76328, 76358, 76387, 76416,
  76446, 76475, 76505, 76534, 76564, 76593, 76623, 76653, 76682, 76712, 76741, 76771,
  76801, 76830, 76859, 76889, 76918, 76948, 76977, 77007, 77036, 77066, 77096, 77125,
  77155, 77185, 77214, 77243, 77273, 77302, 77332, 77361, 77390, 77420, 77450, 77479,
  77509, 77539, 77569, 77598, 77627, 77657, 77686, 77715, 77745, 77774, 77804, 77833,
  77863, 77893, 77923, 77952, 77982, 78011, 78041, 78070, 78099, 78129, 78158, 78188,
  78217, 78247, 78277, 78307, 78336, 78366, 78395, 78425, 78454, 78483, 78513, 78542,
  78572, 78601, 78631, 78661, 78690, 78720, 78750, 78779, 78808, 78838, 78867, 78897,
  78926, 78956, 78985, 79015, 79044, 79074, 79104, 79133, 79163, 79192, 79222, 79251,
  79281, 79310, 79340, 79369, 79399, 79428, 79458, 79487, 79517, 79546, 79576, 79606,
  79635, 79665, 79695, 79724, 79753, 79783, 79812, 79841, 79871, 79900, 79930, 79960,
  79990
]

var HIJRI_MONTH_NAMES = [
  ["Muharram", "محرم"], ["Safar", "صفر"], ["Rabi' al-Awwal", "ربيع الأول"],
  ["Rabi' al-Thani", "ربيع الآخر"], ["Jumada al-Ula", "جمادى الأولى"],
  ["Jumada al-Akhirah", "جمادى الآخرة"], ["Rajab", "رجب"], ["Sha'ban", "شعبان"],
  ["Ramadan", "رمضان"], ["Shawwal", "شوال"], ["Dhu al-Qi'dah", "ذو القعدة"],
  ["Dhu al-Hijjah", "ذو الحجة"]
]
var WEEKDAY_NAMES = [
  ["Sunday", "الأحد"], ["Monday", "الاثنين"], ["Tuesday", "الثلاثاء"],
  ["Wednesday", "الأربعاء"], ["Thursday", "الخميس"], ["Friday", "الجمعة"],
  ["Saturday", "السبت"]
]
var GREGORIAN_MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

function methodById(id) {
  var wanted = Number(id)
  for (var i = 0; i < METHODS.length; i++) {
    if (METHODS[i].id === wanted) return METHODS[i]
  }
  return null
}

function copyAdjustments(source) {
  return {
    fajr: Number(source.fajr) || 0,
    sunrise: Number(source.sunrise) || 0,
    dhuhr: Number(source.dhuhr) || 0,
    asr: Number(source.asr) || 0,
    maghrib: Number(source.maghrib) || 0,
    isha: Number(source.isha) || 0
  }
}

function customComponent(value, fallback) {
  if (value === undefined || value === null) return fallback
  if (String(value).replace(/^\s+|\s+$/g, "").toLowerCase() === "null") return fallback
  if (String(value).replace(/^\s+|\s+$/g, "") === "") return fallback
  var parsed = Number(value)
  return isFinite(parsed) ? parsed : fallback
}

function methodParameters(config) {
  var source = config && typeof config === "object" ? config : { method: config }
  var id = source.method
  if (id === undefined || id === null || id === "") id = source.calculationMethod
  if (id === undefined || id === null || id === "") id = 5
  var method = methodById(id)
  if (!method) return null

  var fajr = method.fajr
  var maghrib = method.maghrib
  var isha = method.isha
  if (method.id === 99) {
    var values = source.methodSettings instanceof Array
      ? source.methodSettings
      : String(source.methodSettings || "").split(",")
    fajr = customComponent(values[0], 15)
    maghrib = customComponent(values[1], 0)
    isha = customComponent(values[2], 15)
  }

  return {
    id: method.id,
    code: method.code,
    method: method.code,
    fajr: fajr,
    fajrAngle: fajr,
    isha: isha,
    ishaAngle: isha,
    ishaMinutes: method.id === 99 ? 0 : method.ishaMinutes,
    ishaInterval: method.id === 99 ? 0 : method.ishaMinutes,
    maghrib: maghrib,
    maghribAngle: maghrib,
    maghribMinutes: method.id === 99 ? 0 : method.maghribMinutes,
    maghribInterval: method.id === 99 ? 0 : method.maghribMinutes,
    adjustments: copyAdjustments(method.adjustments),
    rounding: method.rounding,
    midnight: method.midnight
  }
}

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180
}

function radiansToDegrees(radians) {
  return radians * 180 / Math.PI
}

function normalizeToScale(value, maximum) {
  return value - maximum * Math.floor(value / maximum)
}

function unwindAngle(angle) {
  return normalizeToScale(angle, 360)
}

function quadrantShiftAngle(angle) {
  if (angle >= -180 && angle <= 180) return angle
  return angle - 360 * Math.round(angle / 360)
}

function isLeapYear(year) {
  if (year % 4 !== 0) return false
  if (year % 100 === 0 && year % 400 !== 0) return false
  return true
}

function dayOfYear(year, month, day) {
  if (year && typeof year === "object" && typeof year.getTime === "function") {
    day = year.getUTCDate()
    month = year.getUTCMonth() + 1
    year = year.getUTCFullYear()
  }
  var months = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  var total = Number(day)
  for (var i = 1; i < Number(month); i++) total += months[i - 1]
  return total
}

function julianDay(year, month, day, hours) {
  var hourValue = hours === undefined ? 0 : Number(hours)
  var adjustedYear = month > 2 ? year : year - 1
  var adjustedMonth = month > 2 ? month : month + 12
  var dateValue = day + hourValue / 24
  var century = Math.floor(adjustedYear / 100)
  var correction = 2 - century + Math.floor(century / 4)
  var yearDays = Math.floor(365.25 * (adjustedYear + 4716))
  var monthDays = Math.floor(30.6001 * (adjustedMonth + 1))
  return yearDays + monthDays + dateValue + correction - 1524.5
}

function julianCentury(day) {
  return (day - 2451545) / 36525
}

function meanSolarLongitude(century) {
  return unwindAngle(280.4664567 + 36000.76983 * century + 0.0003032 * Math.pow(century, 2))
}

function meanLunarLongitude(century) {
  return unwindAngle(218.3165 + 481267.8813 * century)
}

function ascendingLunarNodeLongitude(century) {
  return unwindAngle(125.04452 - 1934.136261 * century
    + 0.0020708 * Math.pow(century, 2) + Math.pow(century, 3) / 450000)
}

function meanSolarAnomaly(century) {
  return unwindAngle(357.52911 + 35999.05029 * century - 0.0001537 * Math.pow(century, 2))
}

function solarEquationOfTheCenter(century, anomaly) {
  var radians = degreesToRadians(anomaly)
  var first = (1.914602 - 0.004817 * century - 0.000014 * Math.pow(century, 2)) * Math.sin(radians)
  var second = (0.019993 - 0.000101 * century) * Math.sin(2 * radians)
  var third = 0.000289 * Math.sin(3 * radians)
  return first + second + third
}

function apparentSolarLongitude(century, longitude) {
  var corrected = longitude + solarEquationOfTheCenter(century, meanSolarAnomaly(century))
  var omega = 125.04 - 1934.136 * century
  return unwindAngle(corrected - 0.00569 - 0.00478 * Math.sin(degreesToRadians(omega)))
}

function meanObliquityOfTheEcliptic(century) {
  return 23.439291 - 0.013004167 * century
    - 0.0000001639 * Math.pow(century, 2) + 0.0000005036 * Math.pow(century, 3)
}

function apparentObliquityOfTheEcliptic(century, obliquity) {
  var omega = 125.04 - 1934.136 * century
  return obliquity + 0.00256 * Math.cos(degreesToRadians(omega))
}

function meanSiderealTime(century) {
  var day = century * 36525 + 2451545
  return unwindAngle(280.46061837 + 360.98564736629 * (day - 2451545)
    + 0.000387933 * Math.pow(century, 2) - Math.pow(century, 3) / 38710000)
}

function nutationInLongitude(century, solarLongitude, lunarLongitude, ascendingNode) {
  var first = -17.2 / 3600 * Math.sin(degreesToRadians(ascendingNode))
  var second = 1.32 / 3600 * Math.sin(2 * degreesToRadians(solarLongitude))
  var third = 0.23 / 3600 * Math.sin(2 * degreesToRadians(lunarLongitude))
  var fourth = 0.21 / 3600 * Math.sin(2 * degreesToRadians(ascendingNode))
  return first - second - third + fourth
}

function nutationInObliquity(century, solarLongitude, lunarLongitude, ascendingNode) {
  var first = 9.2 / 3600 * Math.cos(degreesToRadians(ascendingNode))
  var second = 0.57 / 3600 * Math.cos(2 * degreesToRadians(solarLongitude))
  var third = 0.1 / 3600 * Math.cos(2 * degreesToRadians(lunarLongitude))
  var fourth = 0.09 / 3600 * Math.cos(2 * degreesToRadians(ascendingNode))
  return first + second + third - fourth
}

function solarCoordinates(day) {
  var century = julianCentury(day)
  var solarLongitude = meanSolarLongitude(century)
  var lunarLongitude = meanLunarLongitude(century)
  var ascendingNode = ascendingLunarNodeLongitude(century)
  var longitude = degreesToRadians(apparentSolarLongitude(century, solarLongitude))
  var siderealTime = meanSiderealTime(century)
  var longitudeNutation = nutationInLongitude(century, solarLongitude, lunarLongitude, ascendingNode)
  var obliquityNutation = nutationInObliquity(century, solarLongitude, lunarLongitude, ascendingNode)
  var meanObliquity = meanObliquityOfTheEcliptic(century)
  var apparentObliquity = degreesToRadians(apparentObliquityOfTheEcliptic(century, meanObliquity))
  return {
    declination: radiansToDegrees(Math.asin(Math.sin(apparentObliquity) * Math.sin(longitude))),
    rightAscension: unwindAngle(radiansToDegrees(Math.atan2(
      Math.cos(apparentObliquity) * Math.sin(longitude), Math.cos(longitude)
    ))),
    apparentSiderealTime: siderealTime
      + longitudeNutation * Math.cos(degreesToRadians(meanObliquity + obliquityNutation))
  }
}

function approximateTransit(longitude, siderealTime, rightAscension) {
  var westLongitude = longitude * -1
  var transit = normalizeToScale((rightAscension + westLongitude - siderealTime) / 360, 1)
  // The generalized noon keeps date-line longitudes on the requested civil day.
  var expected = normalizeToScale((12 - longitude / 15) / 24, 1)
  if (transit - expected > 0.5) return transit - 1
  if (expected - transit > 0.5) return transit + 1
  return transit
}

function interpolate(value, previous, next, factor) {
  var first = value - previous
  var second = next - value
  return value + factor / 2 * (first + second + factor * (second - first))
}

function interpolateAngles(value, previous, next, factor) {
  var first = unwindAngle(value - previous)
  var second = unwindAngle(next - value)
  return value + factor / 2 * (first + second + factor * (second - first))
}

function correctedTransit(transit, longitude, solar, previous, next) {
  var westLongitude = longitude * -1
  var sidereal = unwindAngle(solar.apparentSiderealTime + 360.985647 * transit)
  var rightAscension = unwindAngle(interpolateAngles(
    solar.rightAscension, previous.rightAscension, next.rightAscension, transit
  ))
  var hourAngle = quadrantShiftAngle(sidereal - westLongitude - rightAscension)
  return (transit + hourAngle / -360) * 24
}

function altitudeOfCelestialBody(latitude, declination, hourAngle) {
  var first = Math.sin(degreesToRadians(latitude)) * Math.sin(degreesToRadians(declination))
  var second = Math.cos(degreesToRadians(latitude)) * Math.cos(degreesToRadians(declination))
    * Math.cos(degreesToRadians(hourAngle))
  return radiansToDegrees(Math.asin(first + second))
}

function correctedHourAngle(transit, angle, latitude, longitude, afterTransit, solar, previous, next) {
  var westLongitude = longitude * -1
  var numerator = Math.sin(degreesToRadians(angle))
    - Math.sin(degreesToRadians(latitude)) * Math.sin(degreesToRadians(solar.declination))
  var denominator = Math.cos(degreesToRadians(latitude)) * Math.cos(degreesToRadians(solar.declination))
  var approximateHourAngle = radiansToDegrees(Math.acos(numerator / denominator))
  var time = afterTransit ? transit + approximateHourAngle / 360 : transit - approximateHourAngle / 360
  var sidereal = unwindAngle(solar.apparentSiderealTime + 360.985647 * time)
  var rightAscension = unwindAngle(interpolateAngles(
    solar.rightAscension, previous.rightAscension, next.rightAscension, time
  ))
  var declination = interpolate(solar.declination, previous.declination, next.declination, time)
  var hourAngle = sidereal - westLongitude - rightAscension
  var altitude = altitudeOfCelestialBody(latitude, declination, hourAngle)
  var correction = (altitude - angle) / (360 * Math.cos(degreesToRadians(declination))
    * Math.cos(degreesToRadians(latitude)) * Math.sin(degreesToRadians(hourAngle)))
  return (time + correction) * 24
}

function solarTimeForDay(year, month, day, latitude, longitude) {
  var julian = julianDay(year, month, day, 0)
  var solar = solarCoordinates(julian)
  var previous = solarCoordinates(julian - 1)
  var next = solarCoordinates(julian + 1)
  var transit = approximateTransit(longitude, solar.apparentSiderealTime, solar.rightAscension)
  var result = {
    latitude: latitude,
    longitude: longitude,
    approximateTransit: transit,
    solar: solar,
    previous: previous,
    next: next
  }
  result.transit = correctedTransit(transit, longitude, solar, previous, next)
  result.sunrise = correctedHourAngle(transit, -50 / 60, latitude, longitude, false, solar, previous, next)
  result.sunset = correctedHourAngle(transit, -50 / 60, latitude, longitude, true, solar, previous, next)
  return result
}

function solarHourAngle(solarTime, angle, afterTransit) {
  return correctedHourAngle(
    solarTime.approximateTransit,
    angle,
    solarTime.latitude,
    solarTime.longitude,
    afterTransit,
    solarTime.solar,
    solarTime.previous,
    solarTime.next
  )
}

function afternoon(solarTime, shadowLength) {
  var tangent = Math.abs(solarTime.latitude - solarTime.solar.declination)
  var inverse = shadowLength + Math.tan(degreesToRadians(tangent))
  var angle = radiansToDegrees(Math.atan(1 / inverse))
  return solarHourAngle(solarTime, angle, true)
}

function epochFromHours(year, month, day, hours) {
  if (!isFinite(hours)) return NaN
  var wholeHours = Math.floor(hours)
  var minutes = Math.floor((hours - wholeHours) * 60)
  var seconds = Math.floor((hours - (wholeHours + minutes / 60)) * 3600)
  return Date.UTC(year, month - 1, day) + wholeHours * 3600000 + minutes * 60000 + seconds * 1000
}

function validCivilDate(year, month, day) {
  if (!isFinite(year) || !isFinite(month) || !isFinite(day)) return false
  if (Math.floor(year) !== year || Math.floor(month) !== month || Math.floor(day) !== day) return false
  var value = new Date(Date.UTC(year, month - 1, day))
  return value.getUTCFullYear() === year && value.getUTCMonth() + 1 === month && value.getUTCDate() === day
}

function datePartsFromEpoch(epoch) {
  var value = new Date(epoch)
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() }
}

function addCivilDays(year, month, day, amount) {
  return datePartsFromEpoch(Date.UTC(year, month - 1, day + amount))
}

function validSolarTime(value) {
  return value && isFinite(value.sunrise) && isFinite(value.sunset)
}

function nearestLatitudeSolar(year, month, day, latitude, longitude) {
  var direction = latitude < 0 ? -1 : 1
  var candidate = latitude - direction * 0.5
  var tomorrow = addCivilDays(year, month, day, 1)
  while (true) {
    var currentSolar = solarTimeForDay(year, month, day, candidate, longitude)
    var tomorrowSolar = solarTimeForDay(tomorrow.year, tomorrow.month, tomorrow.day, candidate, longitude)
    if (validSolarTime(currentSolar) && validSolarTime(tomorrowSolar)) {
      return { solar: currentSolar, tomorrowSolar: tomorrowSolar }
    }
    if (Math.abs(candidate) < 65) return null
    candidate -= direction * 0.5
  }
}

function nearestDaySolar(year, month, day, latitude, longitude) {
  var distance = 1
  var direction = 1
  while (distance <= Math.ceil(365 / 2)) {
    var candidate = addCivilDays(year, month, day, direction * distance)
    var candidateTomorrow = addCivilDays(candidate.year, candidate.month, candidate.day, 1)
    var currentSolar = solarTimeForDay(candidate.year, candidate.month, candidate.day, latitude, longitude)
    var tomorrowSolar = solarTimeForDay(
      candidateTomorrow.year, candidateTomorrow.month, candidateTomorrow.day, latitude, longitude
    )
    if (validSolarTime(currentSolar) && validSolarTime(tomorrowSolar)) {
      return { solar: currentSolar, tomorrowSolar: tomorrowSolar }
    }
    if (direction < 0) distance++
    direction *= -1
  }
  return null
}

function resolvedSolarTimes(year, month, day, latitude, longitude) {
  var tomorrow = addCivilDays(year, month, day, 1)
  var solar = solarTimeForDay(year, month, day, latitude, longitude)
  var tomorrowSolar = solarTimeForDay(tomorrow.year, tomorrow.month, tomorrow.day, latitude, longitude)
  if (validSolarTime(solar) && isFinite(tomorrowSolar.sunrise)) {
    return { solar: solar, tomorrowSolar: tomorrowSolar, resolution: "none" }
  }
  var latitudeResult = nearestLatitudeSolar(year, month, day, latitude, longitude)
  if (latitudeResult) {
    latitudeResult.resolution = "nearest-latitude"
    return latitudeResult
  }
  var dayResult = nearestDaySolar(year, month, day, latitude, longitude)
  if (dayResult) {
    dayResult.resolution = "nearest-day"
    return dayResult
  }
  return null
}

function daysSinceSolstice(dayNumber, year, latitude) {
  var northernOffset = 10
  var southernOffset = isLeapYear(year) ? 173 : 172
  var daysInYear = isLeapYear(year) ? 366 : 365
  var result
  if (latitude >= 0) {
    result = dayNumber + northernOffset
    if (result >= daysInYear) result -= daysInYear
  } else {
    result = dayNumber - southernOffset
    if (result < 0) result += daysInYear
  }
  return result
}

function seasonalAdjustment(a, b, c, d, dayNumber, year, latitude) {
  var sinceSolstice = daysSinceSolstice(dayNumber, year, latitude)
  if (sinceSolstice < 91) return a + (b - a) / 91 * sinceSolstice
  if (sinceSolstice < 137) return b + (c - b) / 46 * (sinceSolstice - 91)
  if (sinceSolstice < 183) return c + (d - c) / 46 * (sinceSolstice - 137)
  if (sinceSolstice < 229) return d + (c - d) / 46 * (sinceSolstice - 183)
  if (sinceSolstice < 275) return c + (b - c) / 46 * (sinceSolstice - 229)
  return b + (a - b) / 91 * (sinceSolstice - 275)
}

function seasonAdjustedMorningTwilight(latitude, dayNumber, year, sunriseTime) {
  var absoluteLatitude = Math.abs(latitude)
  var a = 75 + 28.65 / 55 * absoluteLatitude
  var b = 75 + 19.44 / 55 * absoluteLatitude
  var c = 75 + 32.74 / 55 * absoluteLatitude
  var d = 75 + 48.1 / 55 * absoluteLatitude
  var minutes = seasonalAdjustment(a, b, c, d, dayNumber, year, latitude)
  return sunriseTime + Math.round(minutes * -60) * 1000
}

function seasonAdjustedEveningTwilight(latitude, dayNumber, year, sunsetTime, shafaq) {
  var absoluteLatitude = Math.abs(latitude)
  var a
  var b
  var c
  var d
  if (shafaq === "ahmer") {
    a = 62 + 17.4 / 55 * absoluteLatitude
    b = 62 - 7.16 / 55 * absoluteLatitude
    c = 62 + 5.12 / 55 * absoluteLatitude
    d = 62 + 19.44 / 55 * absoluteLatitude
  } else if (shafaq === "abyad") {
    a = 75 + 25.6 / 55 * absoluteLatitude
    b = 75 + 7.16 / 55 * absoluteLatitude
    c = 75 + 36.84 / 55 * absoluteLatitude
    d = 75 + 81.84 / 55 * absoluteLatitude
  } else {
    a = 75 + 25.6 / 55 * absoluteLatitude
    b = 75 + 2.05 / 55 * absoluteLatitude
    c = 75 - 9.21 / 55 * absoluteLatitude
    d = 75 + 6.14 / 55 * absoluteLatitude
  }
  var minutes = seasonalAdjustment(a, b, c, d, dayNumber, year, latitude)
  return sunsetTime + Math.round(minutes * 60) * 1000
}

function highLatitudePortions(params, rule) {
  if (Number(rule) === 2) return { fajr: 1 / 7, isha: 1 / 7 }
  if (Number(rule) === 3) return { fajr: params.fajrAngle / 60, isha: params.ishaAngle / 60 }
  return { fajr: 1 / 2, isha: 1 / 2 }
}

function adjustment(params, name) {
  if (!params.adjustments) return 0
  var value = Number(params.adjustments[name])
  return isFinite(value) ? value : 0
}

function normalizedShafaq(value) {
  var shafaq = String(value || "general").toLowerCase()
  if (shafaq === "red") return "ahmer"
  if (shafaq === "white") return "abyad"
  if (shafaq !== "ahmer" && shafaq !== "abyad") return "general"
  return shafaq
}

function prayerTimes(year, month, day, latitude, longitude, params, options) {
  year = Number(year)
  month = Number(month)
  day = Number(day)
  latitude = Number(latitude)
  longitude = Number(longitude)
  if (!validCivilDate(year, month, day) || !isFinite(latitude) || !isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || !params) return null

  var resolved = resolvedSolarTimes(year, month, day, latitude, longitude)
  if (!resolved) return null
  var tomorrow = addCivilDays(year, month, day, 1)
  var solar = resolved.solar
  var tomorrowSolar = resolved.tomorrowSolar
  var sunriseTime = epochFromHours(year, month, day, solar.sunrise)
  var sunsetTime = epochFromHours(year, month, day, solar.sunset)
  var tomorrowSunrise = epochFromHours(tomorrow.year, tomorrow.month, tomorrow.day, tomorrowSolar.sunrise)
  var dhuhrTime = epochFromHours(year, month, day, solar.transit)
  var school = options && Number(options.school) === 1 ? 2 : 1
  var asrTime = epochFromHours(year, month, day, afternoon(solar, school))
  var night = tomorrowSunrise - sunsetTime
  if (!isFinite(night) || night <= 0) return null

  var fajrTime = epochFromHours(year, month, day, solarHourAngle(solar, -params.fajrAngle, false))
  var rule = options && options.latitudeAdjustmentMethod !== undefined
    ? options.latitudeAdjustmentMethod : 1
  var portions = highLatitudePortions(params, rule)
  if (params.id === 15 && latitude >= 55) fajrTime = sunriseTime - night / 7
  var safeFajr = params.id === 15
    ? seasonAdjustedMorningTwilight(latitude, dayOfYear(year, month, day), year, sunriseTime)
    : sunriseTime - portions.fajr * night
  if (!isFinite(fajrTime) || safeFajr > fajrTime) fajrTime = safeFajr

  var maghribTime = sunsetTime + Number(params.maghribMinutes || 0) * 60000
  var ishaTime
  if (Number(params.ishaMinutes) > 0) {
    ishaTime = maghribTime + Number(params.ishaMinutes) * 60000
  } else {
    ishaTime = epochFromHours(year, month, day, solarHourAngle(solar, -params.ishaAngle, true))
    if (params.id === 15 && latitude >= 55) ishaTime = sunsetTime + night / 7
    var safeIsha = params.id === 15
      ? seasonAdjustedEveningTwilight(
        latitude, dayOfYear(year, month, day), year, sunsetTime,
        normalizedShafaq(options && options.shafaq)
      )
      : sunsetTime + portions.isha * night
    if (!isFinite(ishaTime) || safeIsha < ishaTime) ishaTime = safeIsha
  }

  if (Number(params.maghribAngle) > 0) {
    var angleMaghrib = epochFromHours(
      year, month, day, solarHourAngle(solar, -Number(params.maghribAngle), true)
    )
    if (sunsetTime < angleMaghrib && angleMaghrib < ishaTime) maghribTime = angleMaghrib
  }

  var result = {
    fajr: fajrTime + adjustment(params, "fajr") * 60000,
    sunrise: sunriseTime + adjustment(params, "sunrise") * 60000,
    dhuhr: dhuhrTime + adjustment(params, "dhuhr") * 60000,
    asr: asrTime + adjustment(params, "asr") * 60000,
    sunset: sunsetTime,
    maghrib: maghribTime + adjustment(params, "maghrib") * 60000,
    isha: ishaTime + adjustment(params, "isha") * 60000,
    resolution: resolved.resolution
  }
  if (!isFinite(result.fajr) || !isFinite(result.sunrise) || !isFinite(result.dhuhr)
      || !isFinite(result.asr) || !isFinite(result.sunset) || !isFinite(result.maghrib)
      || !isFinite(result.isha)) return null
  return result
}

function tuneValues(value) {
  var source = value instanceof Array ? value : String(value || "").split(",")
  var result = []
  for (var i = 0; i < 9; i++) {
    var parsed = Number(source[i])
    result.push(isFinite(parsed) ? Math.round(parsed) : 0)
  }
  return result
}

function roundedTime(value, rounding) {
  if (!isFinite(value)) return NaN
  if (rounding === "up") return Math.ceil(value / 60000) * 60000
  return Math.floor((value + 30000) / 60000) * 60000
}

function dayTimes(config, year, month, day, hijri) {
  config = config || {}
  var params = methodParameters(config)
  if (!params) return null
  var options = {
    school: config.school === undefined ? (config.hanafi ? 1 : 0) : Number(config.school),
    latitudeAdjustmentMethod: config.latitudeAdjustmentMethod === undefined
      ? 3 : Number(config.latitudeAdjustmentMethod),
    shafaq: normalizedShafaq(config.shafaq)
  }
  var current = prayerTimes(
    year, month, day, Number(config.latitude), Number(config.longitude), params, options
  )
  var tomorrow = addCivilDays(Number(year), Number(month), Number(day), 1)
  var next = prayerTimes(
    tomorrow.year, tomorrow.month, tomorrow.day,
    Number(config.latitude), Number(config.longitude), params, options
  )
  if (!current || !next) return null

  var tune = tuneValues(config.tune)
  var ishaTime = current.isha
  if (params.id === 4 && hijri && Number(hijri.month) === 9) ishaTime += 30 * 60000
  var nightEnd = Number(config.midnightMode) === 1 ? next.fajr : next.sunrise
  var night = nightEnd - current.sunset
  if (!isFinite(night) || night <= 0) return null
  var firstThird = current.sunset + night / 3
  var midnight = current.sunset + night / 2
  var lastThird = current.sunset + night * 2 / 3
  var rounding = params.rounding

  return {
    Imsak: roundedTime(current.fajr - 10 * 60000 + tune[0] * 60000, rounding),
    Fajr: roundedTime(current.fajr + tune[1] * 60000, rounding),
    Sunrise: roundedTime(current.sunrise + tune[2] * 60000, rounding),
    Dhuhr: roundedTime(current.dhuhr + tune[3] * 60000, rounding),
    Asr: roundedTime(current.asr + tune[4] * 60000, rounding),
    Sunset: roundedTime(current.sunset + tune[6] * 60000, rounding),
    Maghrib: roundedTime(current.maghrib + tune[5] * 60000, rounding),
    Isha: roundedTime(ishaTime + tune[7] * 60000, rounding),
    Midnight: roundedTime(midnight + tune[8] * 60000, rounding),
    Firstthird: roundedTime(firstThird, rounding),
    Lastthird: roundedTime(lastThird, rounding),
    resolution: current.resolution,
    approximate: current.resolution !== "none"
  }
}

function islamicJulianDay(year, month, day) {
  return day + Math.ceil(29.5 * (month - 1)) + (year - 1) * 354
    + Math.floor((3 + 11 * year) / 30) + 1948439.5 - 1
}

function arithmeticHijri(julian) {
  var year = Math.floor((30 * (julian - 1948439.5) + 10646) / 10631)
  var month = Math.min(12, Math.ceil(
    (julian - 29 - islamicJulianDay(year, 1, 1)) / 29.5
  ) + 1)
  var day = Math.floor(julian - islamicJulianDay(year, month, 1) + 1)
  return { year: year, month: month, day: day }
}

function hijri(year, month, day, adjustmentDays) {
  year = Number(year)
  month = Number(month)
  day = Number(day)
  if (!validCivilDate(year, month, day)) return null
  var adjustment = Number(adjustmentDays)
  if (!isFinite(adjustment)) adjustment = 0
  adjustment = Math.round(adjustment)
  var shifted = new Date(Date.UTC(year, month - 1, day + adjustment))
  var shiftedYear = shifted.getUTCFullYear()
  var shiftedMonth = shifted.getUTCMonth() + 1
  var shiftedDay = shifted.getUTCDate()
  var julian = julianDay(shiftedYear, shiftedMonth, shiftedDay, 0)
  var reduced = Math.floor(julian + 0.5) - 2400000
  var converted
  var approximate = true

  if (reduced >= MONTH_STARTS[0] && reduced < MONTH_STARTS[MONTH_STARTS.length - 1]) {
    var low = 0
    var high = MONTH_STARTS.length
    while (low < high) {
      var middle = Math.floor((low + high) / 2)
      if (MONTH_STARTS[middle] <= reduced) low = middle + 1
      else high = middle
    }
    var index = low - 1
    converted = {
      year: 1343 + Math.floor(index / 12),
      month: index % 12 + 1,
      day: reduced - MONTH_STARTS[index] + 1
    }
    approximate = false
  } else {
    converted = arithmeticHijri(julian)
  }

  var weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return {
    year: converted.year,
    month: converted.month,
    day: converted.day,
    monthName: HIJRI_MONTH_NAMES[converted.month - 1],
    weekday: WEEKDAY_NAMES[weekday],
    approximate: approximate
  }
}

function twoDigits(value) {
  return value < 10 ? "0" + value : String(value)
}

function clock(epochMs, offsetSeconds) {
  var value = new Date(Number(epochMs) + Number(offsetSeconds) * 1000)
  if (isNaN(value.getTime())) return ""
  return twoDigits(value.getUTCHours()) + ":" + twoDigits(value.getUTCMinutes())
}

function isoWithOffset(epochMs, offsetSeconds) {
  var offset = Number(offsetSeconds)
  var value = new Date(Number(epochMs) + offset * 1000)
  if (!isFinite(offset) || isNaN(value.getTime())) return ""
  var sign = offset < 0 ? "-" : "+"
  var absolute = Math.abs(offset)
  var offsetHours = Math.floor(absolute / 3600)
  var offsetMinutes = Math.floor((absolute % 3600) / 60)
  return value.getUTCFullYear() + "-" + twoDigits(value.getUTCMonth() + 1) + "-"
    + twoDigits(value.getUTCDate()) + "T" + twoDigits(value.getUTCHours()) + ":"
    + twoDigits(value.getUTCMinutes()) + ":" + twoDigits(value.getUTCSeconds())
    + sign + twoDigits(offsetHours) + ":" + twoDigits(offsetMinutes)
}

function offsetAt(zone, epochSeconds) {
  var offsets = zone && zone.offsets instanceof Array ? zone.offsets : []
  var epoch = Number(epochSeconds)
  var selected = null
  var selectedAt = -Infinity
  for (var i = 0; i < offsets.length; i++) {
    var at = Number(offsets[i].at)
    var offset = Number(offsets[i].offset)
    if (isFinite(at) && isFinite(offset) && at <= epoch && at >= selectedAt) {
      selected = offset
      selectedAt = at
    }
  }
  if (selected !== null) return selected
  if (offsets.length && isFinite(Number(offsets[0].offset))) return Number(offsets[0].offset)
  return 0
}

function localDate(zone, epochMs) {
  var epoch = Number(epochMs)
  var offset = offsetAt(zone, epoch / 1000)
  var value = new Date(epoch + offset * 1000)
  if (isNaN(value.getTime())) return ""
  return value.getUTCFullYear() + "-" + twoDigits(value.getUTCMonth() + 1)
    + "-" + twoDigits(value.getUTCDate())
}

function civilDateParts(text) {
  var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text || ""))
  if (!match) return null
  var result = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  return validCivilDate(result.year, result.month, result.day) ? result : null
}

function civilDateText(parts) {
  return parts.year + "-" + twoDigits(parts.month) + "-" + twoDigits(parts.day)
}

function nextCivilDateText(text) {
  var parts = civilDateParts(text)
  if (!parts) return ""
  return civilDateText(addCivilDays(parts.year, parts.month, parts.day, 1))
}

function normalizedConfig(config, zone) {
  config = config || {}
  var method = Number(config.method)
  if (!isFinite(method)) method = Number(config.calculationMethod)
  if (!isFinite(method)) method = 5
  method = Math.round(method)
  var school = Number(config.school)
  if (!isFinite(school)) school = config.hanafi ? 1 : 0
  school = school === 1 ? 1 : 0
  var latitudeRule = Number(config.latitudeAdjustmentMethod)
  if (latitudeRule !== 1 && latitudeRule !== 2 && latitudeRule !== 3) latitudeRule = 3
  var midnightMode = Number(config.midnightMode) === 1 ? 1 : 0
  var hijriAdjustment = Number(config.hijriAdjustment)
  if (!isFinite(hijriAdjustment)) hijriAdjustment = 0
  hijriAdjustment = Math.round(hijriAdjustment)
  var tune = config.tune instanceof Array
    ? tuneValues(config.tune).join(",")
    : String(config.tune || "0,0,0,0,0,0,0,0,0")
  return {
    locationLabel: String(config.locationLabel || "Prayer location"),
    latitude: Number(config.latitude),
    longitude: Number(config.longitude),
    timezone: String(config.timezone || (zone && zone.timezone) || ""),
    method: method,
    school: school,
    latitudeAdjustmentMethod: latitudeRule,
    midnightMode: midnightMode,
    hijriAdjustment: hijriAdjustment,
    tune: tune,
    shafaq: normalizedShafaq(config.shafaq),
    methodSettings: String(config.methodSettings || "")
  }
}

function scheduleError(message) {
  return { schemaVersion: 2, ok: false, status: "error", error: String(message || "Schedule calculation failed") }
}

function scheduleTiming(epochMs, zone) {
  var offset = offsetAt(zone, epochMs / 1000)
  return { at: isoWithOffset(epochMs, offset), time: clock(epochMs, offset) }
}

function buildSchedule(config, zone, nowMs) {
  var normalized = normalizedConfig(config, zone)
  var method = methodById(normalized.method)
  if (!method) return scheduleError("unknown calculation method")
  if (!isFinite(normalized.latitude) || normalized.latitude < -90 || normalized.latitude > 90)
    return scheduleError("latitude must be between -90 and 90")
  if (!isFinite(normalized.longitude) || normalized.longitude < -180 || normalized.longitude > 180)
    return scheduleError("longitude must be between -180 and 180")
  if (!zone || zone.ok !== true || !(zone.days instanceof Array) || zone.days.length < 3)
    return scheduleError("timezone window is invalid")
  if (!(zone.offsets instanceof Array) || !zone.offsets.length)
    return scheduleError("timezone offsets are invalid")

  var computedAt = Number(nowMs)
  if (!isFinite(computedAt)) computedAt = Date.now()
  var today = localDate(zone, computedAt)
  var tomorrow = nextCivilDateText(today)
  if (!today || !tomorrow) return scheduleError("could not resolve local date")
  var timingNames = [
    "Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Sunset", "Maghrib", "Isha",
    "Midnight", "Firstthird", "Lastthird"
  ]
  var days = []

  for (var i = 0; i < zone.days.length - 1; i++) {
    var dateText = String(zone.days[i].date || "")
    var date = civilDateParts(dateText)
    var start = Number(zone.days[i].start) * 1000
    var end = Number(zone.days[i + 1].start) * 1000
    if (!date || !isFinite(start) || !isFinite(end) || end <= start)
      return scheduleError("timezone day window is invalid")
    var hijriDate = hijri(date.year, date.month, date.day, normalized.hijriAdjustment)
    if (!hijriDate) return scheduleError("could not calculate Hijri date")
    var chosen = null
    for (var difference = -1; difference <= 1; difference++) {
      var civil = addCivilDays(date.year, date.month, date.day, difference)
      var candidate = dayTimes(normalized, civil.year, civil.month, civil.day, hijriDate)
      if (candidate && candidate.Dhuhr >= start && candidate.Dhuhr < end) {
        chosen = candidate
        break
      }
    }
    if (!chosen) return scheduleError("could not assign prayer times to " + dateText)

    var timings = {}
    for (var timingIndex = 0; timingIndex < timingNames.length; timingIndex++) {
      var timingName = timingNames[timingIndex]
      timings[timingName] = scheduleTiming(chosen[timingName], zone)
    }
    days.push({
      date: dateText,
      readableDate: date.day + " " + GREGORIAN_MONTH_NAMES[date.month - 1] + " " + date.year,
      weekday: hijriDate.weekday[0],
      timezone: normalized.timezone,
      methodName: method.name[0],
      methodShort: method.short[0],
      approximate: chosen.approximate || hijriDate.approximate,
      resolution: chosen.resolution,
      hijri: {
        day: String(hijriDate.day),
        month: hijriDate.monthName[0],
        monthAr: hijriDate.monthName[1],
        year: String(hijriDate.year),
        weekday: hijriDate.weekday[0],
        weekdayAr: hijriDate.weekday[1],
        display: hijriDate.day + " " + hijriDate.monthName[0] + " " + hijriDate.year + " AH",
        displayAr: hijriDate.day + " " + hijriDate.monthName[1] + " " + hijriDate.year + " هـ"
      },
      timings: timings
    })
  }

  var todayDay = null
  var tomorrowDay = null
  for (var dayIndex = 0; dayIndex < days.length; dayIndex++) {
    if (days[dayIndex].date === today) todayDay = days[dayIndex]
    if (days[dayIndex].date === tomorrow) tomorrowDay = days[dayIndex]
  }
  if (!todayDay || !tomorrowDay) return scheduleError("timezone window does not cover today and tomorrow")
  var mandatory = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]
  for (var requiredDay = 0; requiredDay < 2; requiredDay++) {
    var checkDay = requiredDay === 0 ? todayDay : tomorrowDay
    for (var required = 0; required < mandatory.length; required++) {
      if (!checkDay.timings[mandatory[required]].at)
        return scheduleError("mandatory prayer time is unavailable")
    }
  }

  var tomorrowStart = null
  for (var zoneIndex = 0; zoneIndex < zone.days.length; zoneIndex++) {
    if (String(zone.days[zoneIndex].date) === tomorrow) {
      tomorrowStart = Number(zone.days[zoneIndex].start)
      break
    }
  }
  if (!isFinite(tomorrowStart)) return scheduleError("could not resolve next local midnight")
  var configKey = [
    normalized.locationLabel, normalized.latitude, normalized.longitude, normalized.timezone,
    normalized.method, normalized.school, normalized.latitudeAdjustmentMethod, normalized.midnightMode,
    normalized.hijriAdjustment, normalized.tune, normalized.shafaq, normalized.methodSettings
  ].join("|")
  var lastZoneDay = zone.days[zone.days.length - 1]
  return {
    schemaVersion: 2,
    ok: true,
    status: "local",
    error: "",
    provider: "OmaPrayers engine",
    engine: "adhan-js port",
    config: normalized,
    configKey: configKey,
    today: today,
    tomorrow: tomorrow,
    nextRefreshAt: isoWithOffset(tomorrowStart * 1000, offsetAt(zone, tomorrowStart)),
    computedAtEpoch: Math.floor(computedAt / 1000),
    zoneWindowEnd: String(lastZoneDay.date || ""),
    days: days
  }
}

function solarNoon(year, month, day, latitude, longitude) {
  var solar = solarTimeForDay(Number(year), Number(month), Number(day), Number(latitude), Number(longitude))
  return epochFromHours(Number(year), Number(month), Number(day), solar.transit)
}

function sunrise(year, month, day, latitude, longitude) {
  var solar = solarTimeForDay(Number(year), Number(month), Number(day), Number(latitude), Number(longitude))
  return epochFromHours(Number(year), Number(month), Number(day), solar.sunrise)
}

function sunset(year, month, day, latitude, longitude) {
  var solar = solarTimeForDay(Number(year), Number(month), Number(day), Number(latitude), Number(longitude))
  return epochFromHours(Number(year), Number(month), Number(day), solar.sunset)
}

if (typeof module !== "undefined") {
  module.exports = {
    METHODS: METHODS,
    methodById: methodById,
    methodParameters: methodParameters,
    prayerTimes: prayerTimes,
    dayTimes: dayTimes,
    hijri: hijri,
    buildSchedule: buildSchedule,
    offsetAt: offsetAt,
    localDate: localDate,
    isoWithOffset: isoWithOffset,
    clock: clock,
    dayOfYear: dayOfYear,
    julianDay: julianDay,
    solarNoon: solarNoon,
    sunrise: sunrise,
    sunset: sunset
  }
}
