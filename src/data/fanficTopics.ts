import type { FanficTopic, FanficTopicSeed } from '@/types/domain';

export interface FanficGenreSection {
  id: string;
  label: string;
  description: string;
  topics: string[];
}

export interface FanficGenreGroup {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  sections: FanficGenreSection[];
}

const builtInCreatedAt = Date.UTC(2026, 6, 22);

export const fanficGenreGroups: FanficGenreGroup[] = [
  {
    id: 'ancient-romance',
    label: '古代言情',
    shortLabel: '古言',
    description: '从庙堂、江湖到田园市井，覆盖古风女频的完整主流与衍生赛道。',
    sections: [
      {
        id: 'era',
        label: '时代背景',
        description: '按朝代感、社会形态与历史距离选择故事底色。',
        topics: ['古早架空', '正史古风·清穿', '正史古风·宋代', '正史古风·唐代', '正史古风·汉代', '正史古风·魏晋', '正史古风·明初', '春秋战国 / 先秦古风', '民国言情', '末世古代 / 废土古风']
      },
      {
        id: 'transmigration',
        label: '穿越古言',
        description: '以穿越、重生或快穿改变既定人生。',
        topics: ['清穿·九子夺嫡', '清穿·宫斗王府流', '胎穿·从小布局', '魂穿·庶女', '魂穿·弃妃', '魂穿·炮灰', '魂穿·侯府小姐', '身穿·携带现代物品', '身穿·运用现代知识', '双重生', '女主重生', '快穿古代副本']
      },
      {
        id: 'household',
        label: '宅斗文',
        description: '以内宅秩序、家族资源和女性生存智慧为核心。',
        topics: ['庶女逆袭', '嫡女复仇', '后宅小妾争斗', '继母继女', '侯府世家宅斗', '种田宅斗']
      },
      {
        id: 'palace',
        label: '宫斗文',
        description: '在宫廷规则中完成生存、上位或复仇。',
        topics: ['帝王后宫', '妃嫔上位', '皇后权谋', '宫斗复仇', '冷宫逆袭']
      },
      {
        id: 'court',
        label: '朝堂权谋',
        description: '大女主事业线与家国抉择并重。',
        topics: ['女官', '摄政公主', '权臣夫人', '女扮男装为官', '谋夺江山', '家国天下线']
      },
      {
        id: 'farming',
        label: '种田古言',
        description: '从日常劳作、经营与邻里关系中慢慢建立生活。',
        topics: ['农家穿越', '开荒种地', '养娃经商', '乡土日常', '山野隐居', '药膳美食种田']
      },
      {
        id: 'martial-arts',
        label: '江湖武侠',
        description: '门派、侠义、恩怨与江湖秩序。',
        topics: ['侠女闯荡江湖', '门派恩怨', '魔教女主', '江湖权谋', '武侠甜宠']
      },
      {
        id: 'royal-sweet',
        label: '宫廷王府甜宠',
        description: '轻权谋、重陪伴，不以惨烈争斗为主要推动力。',
        topics: ['王爷王妃', '皇子贵女', '古言先婚后爱', '古言双向奔赴', '轻松古风甜文']
      },
      {
        id: 'angst',
        label: '虐古言',
        description: '强情绪、强抉择与遗憾美学。',
        topics: ['帝王虐妃', '古言替身文学', '古言相爱相杀', '家国误会', '阴阳相隔', '古言破镜重圆']
      },
      {
        id: 'infrastructure',
        label: '基建古言',
        description: '用经营和技术推动社会发展。',
        topics: ['古代开商铺', '古代造农具', '古代建城池', '发展民生', '发展手工业', '古代通商']
      },
      {
        id: 'commerce',
        label: '经商古言',
        description: '围绕商品、账目、商路与行业竞争展开事业线。',
        topics: ['古代女商人', '胭脂铺', '酒楼经营', '绸缎庄', '跨国商路', '钱庄票号']
      },
      {
        id: 'special',
        label: '特殊衍生',
        description: '古风与志怪、幻想或地域使命的融合题材。',
        topics: ['古言灵异 / 志怪', '宫廷妖怪', '修仙古风', '兽世古代', '和亲文', '和亲公主逆袭']
      }
    ]
  },
  {
    id: 'modern-romance',
    label: '现代言情',
    shortLabel: '现言',
    description: '都市、校园、行业与现实生活全覆盖，兼顾甜感、成长和事业线。',
    sections: [
      {
        id: 'wealthy',
        label: '总裁豪门',
        description: '资源、身份与亲密关系共同构成冲突。',
        topics: ['霸总甜宠', '现代先婚后爱', '契约婚姻', '豪门争斗', '千金逆袭', '真假千金', '财阀世家', '大佬隐婚']
      },
      {
        id: 'workplace',
        label: '职场现言',
        description: '专业成长与关系推进并行的行业故事。',
        topics: ['律师现言', '医生现言', '设计师现言', '媒体行业', '互联网职场', '公务员职场', '娱乐圈编剧', '职场逆袭', '行业文']
      },
      {
        id: 'campus',
        label: '校园言情',
        description: '青春成长、暗恋与人生选择。',
        topics: ['高中甜宠', '大学恋爱', '校园暗恋', '校园救赎', '学霸学渣', '破镜重圆校园', '校园重生']
      },
      {
        id: 'ordinary-life',
        label: '市井平民',
        description: '以普通人的工作、居住与家庭生活承载感情。',
        topics: ['普通人恋爱', '出租屋日常', '打工女孩', '烟火气婚后', '家长里短', '普通人基建创业']
      },
      {
        id: 'period',
        label: '年代文',
        description: '在七十至九十年代的社会变化中重建人生。',
        topics: ['70年代重生', '80年代重生', '90年代重生', '知青下乡', '随军年代文', '下岗创业', '养娃致富', '年代种田']
      },
      {
        id: 'relationship-trope',
        label: '特殊人设',
        description: '以关系模式和人物张力决定叙事核心。',
        topics: ['现代破镜重圆', '追妻火葬场', '现代替身文学', '相亲先婚后爱', '契约联姻日久生情', '姐弟恋·年下小狼狗', '姐弟恋·年下小奶狗', '大叔文·成熟年上', '双向救赎', '禁欲系医生', '禁欲系教授', '禁欲系军官', '禁欲系科研大佬']
      },
      {
        id: 'entertainment',
        label: '娱乐圈',
        description: '镜头、舆论、作品与真实自我之间的拉扯。',
        topics: ['顶流爱豆', '十八线逆袭', '影后影帝', '娱乐圈选秀', '娱乐圈综艺', '幕后编剧导演', '黑粉变真爱', '娱乐圈重生']
      },
      {
        id: 'military',
        label: '军旅现言',
        description: '职业使命、长期分离与稳定陪伴。',
        topics: ['军人现言', '特种兵', '随军家属', '军医', '消防员', '航空机组', '军旅甜宠']
      },
      {
        id: 'esports',
        label: '电竞现言',
        description: '竞技成长、团队协作与网络身份。',
        topics: ['电竞女选手', '游戏主播', '职业战队', '大神网恋', '吃鸡电竞', 'LOL电竞', '古风网游题材']
      },
      {
        id: 'food',
        label: '美食现言',
        description: '以味觉、手艺和经营创造治愈日常。',
        topics: ['现代开餐馆', '甜品师', '美食探店', '美食治愈系']
      },
      {
        id: 'modern-infrastructure',
        label: '现代基建',
        description: '以实业、空间和地方发展推动事业线。',
        topics: ['建筑师', '乡村振兴', '回乡创业', '实业建厂']
      },
      {
        id: 'urban-mystery',
        label: '灵异悬疑',
        description: '都市日常与异常案件交叠。',
        topics: ['女主阴阳眼', '捉鬼天师', '刑侦悬疑', '法医探案', '都市怪谈', '娱乐圈刑侦', '行业悬疑']
      },
      {
        id: 'modern-rebirth-system',
        label: '重生与系统',
        description: '以第二次机会或任务机制改变现实人生。',
        topics: ['校园重生·重回青年', '都市重生·改变人生', '穿搭系统', '美食系统', '赚钱系统', '好感系统']
      }
    ]
  },
  {
    id: 'fantasy-romance',
    label: '幻想言情',
    shortLabel: '幻想',
    description: '修仙、奇幻、星际、末世与无限世界，强调原创规则和宏大成长。',
    sections: [
      {
        id: 'xianxia',
        label: '修仙 / 仙侠',
        description: '仙门、飞升、仙魔秩序与修真事业。',
        topics: ['三界仙门', '渡劫飞升', '师徒恋', '仙魔大战', '灵根逆袭', '修真基建·开宗门', '修真基建·培育灵植', '修真基建·炼丹炼器', '发展修仙产业', '仙虐·仙魔对立', '仙虐·三生三世', '仙虐·历劫虐恋', '修仙甜宠·小师妹', '修仙甜宠·魔尊男主', '双向修仙', '穿书仙侠·修仙炮灰', '灵植单职业仙侠', '炼丹单职业仙侠', '御兽单职业仙侠']
      },
      {
        id: 'beast-world',
        label: '兽世文',
        description: '兽人文明、部落生存与蛮荒建设。',
        topics: ['远古兽人大陆', '兽人部落', '多兽夫', '兽世开荒种田', '兽世繁育向', '蛮荒基建']
      },
      {
        id: 'western-fantasy',
        label: '西幻言情',
        description: '西方魔法文明、种族与王权体系。',
        topics: ['魔法师', '骑士', '龙族', '吸血鬼', '精灵', '西幻宫廷王室', '魔法校园', '中世纪西方']
      },
      {
        id: 'supernatural',
        label: '灵异神怪',
        description: '神祇、妖灵与人间秩序相遇。',
        topics: ['地府判官', '九尾狐', '妖神', '山神', '幻想人鱼', '鬼怪甜宠', '聊斋风现代志怪']
      },
      {
        id: 'space',
        label: '星际科幻',
        description: '星际文明、科技制度和新世界经营。',
        topics: ['星际帝国', '机甲', '星际军校', '虫族', '星际人鱼', '星际基建', '外星领主', '穿越星际', '星际种田', '飞船经商']
      },
      {
        id: 'apocalypse',
        label: '末日丧尸',
        description: '灾后求生、秩序重建与高压关系。',
        topics: ['末世重生', '末世囤货基建', '丧尸异能', '末世基地建设', '生存恋爱', '高温天灾', '洪水天灾', '雪灾天灾', '地震天灾']
      },
      {
        id: 'infinite',
        label: '无限流 / 规则怪谈',
        description: '副本闯关、规则推理与循环生存。',
        topics: ['女主闯关副本', '惊悚密室', '规则怪谈', '灵异闯关', '副本恋爱', '无限流基建']
      },
      {
        id: 'system',
        label: '系统流全品类',
        description: '可叠加古代、现代与幻想世界的机制型题材。',
        topics: ['快穿', '穿书', '系统流重生', '任务系统', '锦鲤系统', '养老系统', '致富系统', '美貌系统', '功德系统', '虐渣快穿', '甜宠快穿', '事业快穿', '无 CP 快穿', '复仇快穿', '穿成恶毒女配', '穿成炮灰', '穿书自救', '原书男主爱上我']
      }
    ]
  },
  {
    id: 'no-romance',
    label: '无 CP 大女主',
    shortLabel: '无 CP',
    description: '保留用户与角色双主角，以共同事业和深厚羁绊为核心，不设置恋爱线。',
    sections: [
      {
        id: 'ancient-no-cp',
        label: '古言无 CP',
        description: '古代世界中的权力、技艺与个人道路。',
        topics: ['女帝', '女权臣', '无 CP 江湖侠女', '修仙独修', '无 CP 种田搞事业']
      },
      {
        id: 'modern-no-cp',
        label: '现言无 CP',
        description: '现代职业与社会议题中的独立成长。',
        topics: ['职场搞事业', '娱乐圈大女主', '科研大佬', '无 CP 刑侦法医']
      },
      {
        id: 'fantasy-no-cp',
        label: '幻想无 CP',
        description: '在宏大幻想世界中完成事业与使命。',
        topics: ['星际女王', '末世基地首领', '无限流单人闯关', '修仙独飞升']
      },
      {
        id: 'no-cp-principle',
        label: '无感情线方向',
        description: '不谈恋爱，把叙事重心完整交给事业与成长。',
        topics: ['纯事业线', '双主角战友情', '双主角知己线', '大女主复仇事业线']
      }
    ]
  },
  {
    id: 'niche',
    label: '小众特色',
    shortLabel: '小众',
    description: '跨世界观的稳定细分标签，可作为主赛道直接生成完整故事。',
    sections: [
      {
        id: 'food-cross',
        label: '美食文',
        description: '跨古代、现代与幻想世界的独立美食赛道。',
        topics: ['古代美食文', '现代美食文', '幻想美食文']
      },
      {
        id: 'pets',
        label: '养宠 / 御兽',
        description: '以照料、契约和共同成长连接人与非人伙伴。',
        topics: ['养猫狗', '养灵宠', '养神兽', '星际异兽']
      },
      {
        id: 'retirement',
        label: '养老治愈',
        description: '放慢节奏，在稳定生活中修复自我。',
        topics: ['佛系躺平', '种田养老', '修仙养老', '星际养老']
      },
      {
        id: 'infrastructure-cross',
        label: '全类型基建',
        description: '以资源规划、生产建设和群体生活改善推动剧情。',
        topics: ['古代基建流', '现代基建流', '星际基建流', '末世基建流']
      },
      {
        id: 'detective-romance',
        label: '悬疑探案言情',
        description: '案件调查与关系进展彼此推动。',
        topics: ['古代大理寺', '现代刑侦言情', '法医言情', '女捕快']
      },
      {
        id: 'full-dive-game',
        label: '游戏全息言情',
        description: '现实身份与虚拟世界关系交错。',
        topics: ['全息网游', '虚拟世界恋爱']
      },
      {
        id: 'fairy-tale',
        label: '童话改编言情',
        description: '借用公共领域母题重新设计世界规则与人物命运。',
        topics: ['白雪母题西幻改写', '灰姑娘母题西幻改写', '睡美人母题西幻改写', '小美人鱼母题西幻改写']
      },
      {
        id: 'game-character',
        label: '纸片人 / 穿游戏',
        description: '跨越媒介边界进入游戏世界。',
        topics: ['纸片人恋爱', '穿乙女游戏', '攻略 NPC']
      },
      {
        id: 'group-favorite',
        label: '团宠文',
        description: '稳定支持系统与群像关系带来安全感。',
        topics: ['全家宠爱女主', '世家团宠', '星际团宠', '修仙团宠']
      },
      {
        id: 'power-fantasy',
        label: '爽文标签',
        description: '强反馈、快成长与阶段性胜利。',
        topics: ['复仇虐渣', '打脸逆袭', '锦鲤好运', '金手指大女主']
      },
      {
        id: 'healing',
        label: '治愈系慢热',
        description: '无激烈冲突，以日常温情和缓慢信任推动故事。',
        topics: ['日常温情', '慢热陪伴', '低冲突治愈']
      },
      {
        id: 'be-aesthetic',
        label: 'BE 美学',
        description: '以遗憾、命运和余韵完成情绪表达。',
        topics: ['全员悲剧', '相爱不能相守', '开放式结局']
      }
    ]
  }
];

const groupStoryGuidance: Record<string, Pick<FanficTopic, 'setting' | 'conflict' | 'relationship'>> = {
  'ancient-romance': {
    setting: '使用完全原创的古风地域、制度、家族与生活细节，不照搬任何现成作品或人物原背景。',
    conflict: '两位主角必须在时代秩序、共同目标和个人选择之间找到全新的破局方式。',
    relationship: '双主角从利益或使命交点起步，在共同经历中建立平等、可信且循序渐进的关系。'
  },
  'modern-romance': {
    setting: '使用原创城市、机构、行业生态与生活空间，保持现实质感但不影射具体作品。',
    conflict: '职业目标、现实压力与双方不同的生活选择形成持续推进的核心矛盾。',
    relationship: '双主角以现实交集相识，在边界清晰的相处中逐步确认理解与爱意。'
  },
  'fantasy-romance': {
    setting: '从零建立世界规则、文明、地理、力量代价与社会制度，避免套用现成世界观。',
    conflict: '世界规则的代价、共同使命与双方成长方向彼此牵制，迫使两人不断作出选择。',
    relationship: '双主角在共同探索未知世界时形成互补关系，感情由行动、信任和牺牲自然推进。'
  },
  'no-romance': {
    setting: '使用完全原创的时代、组织、行业和规则，以事业成长与世界改变为主轴。',
    conflict: '两位主角面对同一事业目标和不同方法论，以合作、竞争与共同承担推动剧情。',
    relationship: '用户与角色仍是唯一双主角，保持知己、战友或事业伙伴羁绊，全程不设置恋爱线。'
  },
  niche: {
    setting: '围绕细分题材从零创造地点、行业、规则和社会关系，不复用人物原背景。',
    conflict: '细分题材的独特规则与两位主角的共同目标形成可持续升级的原创矛盾。',
    relationship: '双主角通过共同完成目标建立专属关系节奏，具体感情浓度服从所选题材。'
  }
};

interface CommercialSectionSeed extends FanficTopicSeed {
  setting: string;
  relationship: string;
}

const commercialSectionSeeds: Record<string, CommercialSectionSeed> = {
  era: {
    setting: '原创王朝的州府、边城与新旧制度交替的社会',
    openingProblem: '两人在一场公开审讯中同时被推成替罪羊',
    immediateGoal: '在当天找到能证明清白的账册、证人或实物',
    escalation: '家族、官府和真正的幕后得利者会一起封锁线索',
    readerPromise: '清晰的身份处境、查证反击和一步步站稳脚跟',
    relationship: '从被迫并肩查清一件事开始，在分工、争执和互相兜底中建立信任。'
  },
  transmigration: {
    setting: '原创古代社会与现代生活常识发生错位的全新身份起点',
    openingProblem: '其中一人醒来时只剩三天就会被推入一场注定失败的局',
    immediateGoal: '先弄清自己手里的资源，再和另一位主角改掉第一个坏结果',
    escalation: '原本以为能避开的命运会换一种方式找上门',
    readerPromise: '重来一次的选择、当场改变和连续兑现的小胜利',
    relationship: '从信息不对等和互相试探起步，用一次次实际行动把临时搭档变成最可靠的同盟。'
  },
  household: {
    setting: '原创世家、宅院和地方产业交织的古代生活秩序',
    openingProblem: '婚礼前夜，两人被迫接手一座即将查封、还背着巨额亏空的宅院',
    immediateGoal: '先保住账房、下人和一项能立刻变现的家业',
    escalation: '亲族会用礼法和旧账逼他们互相怀疑、交出实权',
    readerPromise: '宅院反击、资源争夺和看得见的经营成果',
    relationship: '从利益绑定的合作开始，在共同守住生活和底线的过程中形成平等的默契。'
  },
  palace: {
    setting: '原创宫廷机构、后宫秩序与地方势力共同运转的古代王朝',
    openingProblem: '入宫第一天，两人就被安排背同一口会掉脑袋的黑锅',
    immediateGoal: '在第一次问责前找出真正的受益者并抢回主动权',
    escalation: '每一次自保都会牵动更高层的利益，退一步就会失去生存资格',
    readerPromise: '明牌冲突、宫廷博弈和一次次漂亮的反击',
    relationship: '两人以不同方式观察局势，靠共享情报和互相掩护从陌生合作者走向真正同盟。'
  },
  court: {
    setting: '原创官署、边地和改革派系并存的古代政治舞台',
    openingProblem: '新政发布当日，两人被推成众矢之的，手里却握着唯一能落地的方案',
    immediateGoal: '先让方案在一个具体地方成功，再拿结果换取朝堂发言权',
    escalation: '旧派会制造民怨和假证，把事业危机变成个人生死局',
    readerPromise: '女主掌局、实事落地、对手被结果打脸',
    relationship: '一人擅长判断人心，一人擅长把计划落地，两人在分歧中保持同等的决策权。'
  },
  farming: {
    setting: '原创乡镇、田地和邻里网络组成的古代日常社会',
    openingProblem: '两人接手一间空屋和一片荒地，开局就要在秋收前还清债务',
    immediateGoal: '先找到能活下来的收入来源，再把家里和邻里的日子一起稳住',
    escalation: '旱涝、价格操控和亲族争产会轮番压缩他们的选择',
    readerPromise: '种田经营、烟火日常和一点点变富的即时反馈',
    relationship: '从共同过日子的分工开始，在琐碎争执和实际照顾里建立踏实的陪伴。'
  },
  'martial-arts': {
    setting: '原创门派、驿路和江湖盟约构成的武侠世界',
    openingProblem: '押送途中，两人同时发现自己被各方势力当成一桩旧案的关键证人',
    immediateGoal: '先活着抵达下一座城，并查清谁在借江湖规矩杀人',
    escalation: '每个看似可靠的门派都有不能公开的利益',
    readerPromise: '打斗、追逃、查案和双主角并肩闯关',
    relationship: '两人一个敢冒险一个善收尾，在互相救场和共同守诺中成为真正的江湖伙伴。'
  },
  'royal-sweet': {
    setting: '原创王府、宗室与民间产业交错的轻权谋古代社会',
    openingProblem: '一纸婚约把两人绑定到一桩即将失控的王府危机上',
    immediateGoal: '先把婚约变成可以共同使用的保护伞，再解决眼前的外部麻烦',
    escalation: '看似轻松的日常背后藏着身份和继承的真实较量',
    readerPromise: '高频互动、甜感兑现、轻权谋和双向护短',
    relationship: '从约定好的相处规则开始，在每次公开站队和私下照顾中自然升温。'
  },
  angst: {
    setting: '原创王朝、家国边境与个人选择互相牵制的古代世界',
    openingProblem: '两人站在同一场葬礼的两侧，却各自被迫接受了相反的命令',
    immediateGoal: '先弄清误会背后的利益链，再决定是否要为对方承担代价',
    escalation: '真相每推进一步，就会牺牲一段关系或一项重要选择',
    readerPromise: '强情绪、明确抉择、误会揭开后的高回报反转',
    relationship: '不靠空泛误会拖戏，关系变化必须由选择、伤害和补偿一步步推动。'
  },
  infrastructure: {
    setting: '原创灾后城镇、工坊和地方行政共同重建的古代社会',
    openingProblem: '一场灾害毁掉了两人负责的城镇，所有人都等着他们交出结果',
    immediateGoal: '先恢复饮水、粮食或交通中的一项，让第一批居民留下来',
    escalation: '资源短缺、地方豪强和错误政策会不断逼他们调整方案',
    readerPromise: '从一砖一瓦到城市变好的事业成就感',
    relationship: '两人一个统筹资源，一个处理现场，在共同扛责中形成可靠的事业搭档关系。'
  },
  commerce: {
    setting: '原创商路、行会和地方市场构成的古代商业世界',
    openingProblem: '货船沉没或铺子被查封后，两人只剩一笔小本钱和七天翻身',
    immediateGoal: '先找到一个能立刻成交的商品或渠道，拿回第一笔现金流',
    escalation: '同行压价、假货和旧东家的追债会同时出现',
    readerPromise: '开店、谈生意、赚到钱和当场反击',
    relationship: '一人看机会，一人守底线，利益分配和共同冒险让关系持续有火花。'
  },
  special: {
    setting: '原创古风地域、民间传说和一条可验证的奇异规则',
    openingProblem: '一件会在特定时辰开口的失物把两人卷进一桩无人敢认的案子',
    immediateGoal: '先在规则触发前找到失主，并确认这件事是否会伤及身边的人',
    escalation: '奇异现象背后牵出一条现实利益链，不能只靠玄学解决',
    readerPromise: '直观奇遇、现实查证、反转和双主角互相兜底',
    relationship: '一人相信证据，一人相信直觉，两种方法在共同破局中互相补足。'
  },
  wealthy: {
    setting: '原创城市、家族企业和资本规则构成的现代豪门环境',
    openingProblem: '订婚宴或董事会上，两人被当众推到一场即将爆雷的利益交换里',
    immediateGoal: '先保住属于自己的决定权，再拿到能反击的第一份证据',
    escalation: '家族会用舆论、合同和亲情逼他们互相让步',
    readerPromise: '身份反差、公开打脸、豪门博弈和高密度互动',
    relationship: '从互相利用的协议开始，在公开站队和私下坦白中逐步确认彼此。'
  },
  workplace: {
    setting: '原创城市、公司和行业生态组成的现实职场',
    openingProblem: '项目上线前一晚，两人发现最关键的数据被人动过手脚',
    immediateGoal: '先在截止时间前救回项目，再找出谁从失败中获利',
    escalation: '职位、绩效和舆论会把专业问题变成个人淘汰赛',
    readerPromise: '专业细节、升职成长、职场反击和稳定感情推进',
    relationship: '两人拥有不同专业和边界，靠事实说话，在并肩解决工作问题时建立信任。'
  },
  campus: {
    setting: '原创校园、社团和家庭选择交织的青春成长环境',
    openingProblem: '开学第一周，两人因为一场公开误会被迫共同完成一项重要任务',
    immediateGoal: '先把任务做成，证明自己没有被流言定义',
    escalation: '升学、家庭和同龄人的目光会让一次选择变成人生分岔',
    readerPromise: '清爽互动、青春成长、暗恋或误会的即时回收',
    relationship: '从不熟到默契，感情用具体相处和共同成果推进，不靠旁白硬说。'
  },
  'ordinary-life': {
    setting: '原创城市街区、出租屋和普通人的工作生活',
    openingProblem: '房东通知搬离、工作又临时出问题，两人必须在一周内重新安排生活',
    immediateGoal: '先找到稳定住处和收入，再决定要不要把这段搭伙继续下去',
    escalation: '家人、金钱和现实选择会不断考验他们的边界',
    readerPromise: '烟火气、真实小胜利、日常甜点和可共情的成长',
    relationship: '从互相帮一个小忙开始，在共同承担生活账单和情绪压力中慢慢靠近。'
  },
  period: {
    setting: '原创年代城市、乡镇和改革浪潮中的生活空间',
    openingProblem: '两人回到人生转折点，手里只有一间旧屋和一次重新选择的机会',
    immediateGoal: '先抓住一个能让家人吃饱、让自己站住的现实机会',
    escalation: '政策变化、资源差距和熟人关系会轮番制造障碍',
    readerPromise: '重建人生、经营致富、时代变化和阶段性收获',
    relationship: '两人有各自的过去和打算，在一起把日子过起来的过程中成为并肩伙伴。'
  },
  'relationship-trope': {
    setting: '原创现代城市、家庭关系与契约规则构成的现实情感环境',
    openingProblem: '一份期限明确的协议把两人放进同一个必须完成的生活场景',
    immediateGoal: '先按约定解决眼前危机，同时守住各自最后的底线',
    escalation: '协议外的真实需求和旧关系会逼他们重新定义规则',
    readerPromise: '高频对手戏、关系拉扯、误会快收和情感兑现',
    relationship: '用行动和边界变化写感情，避免只靠心声反复解释。'
  },
  entertainment: {
    setting: '原创娱乐行业、制作团队和公众舆论场',
    openingProblem: '一条热搜让两人同时失去原本的机会，却意外握住了一个翻盘项目',
    immediateGoal: '先把作品做出来，再用公开成果夺回发言权',
    escalation: '资本、竞争对手和舆论会让每次曝光都带来新风险',
    readerPromise: '镜头内外、事业逆袭、公开回击和高甜名场面',
    relationship: '一人站在台前，一人掌控幕后，彼此成就而不是谁依附谁。'
  },
  military: {
    setting: '原创军旅单位、救援体系和家属生活构成的现代职业世界',
    openingProblem: '一次紧急任务让两人的工作计划和私人承诺同时失效',
    immediateGoal: '先完成任务、保住队伍，再处理任务之外的真实选择',
    escalation: '时间、纪律和长期分离会不断考验他们的信任',
    readerPromise: '使命感、可靠行动、救援现场和克制但有回报的感情',
    relationship: '尊重职业边界，用守信、等待和实际陪伴推进关系。'
  },
  esports: {
    setting: '原创电竞俱乐部、赛事体系和直播平台生态',
    openingProblem: '比赛开打前，战队临时缺人，两人必须用陌生阵容打完关键局',
    immediateGoal: '先赢下眼前一场，再证明这支队伍值得继续留下',
    escalation: '排名、合同和网络舆论会让每次失误都被放大',
    readerPromise: '比赛高光、团队成长、身份掉马和赛场外互动',
    relationship: '在配合和竞争中建立默契，感情服务于共同成长而非替代竞技目标。'
  },
  food: {
    setting: '原创城市街区、餐饮行业和一间需要重新开张的小店',
    openingProblem: '小店被贴上封条或欠下租金，两人只剩一周证明这门手艺能养活自己',
    immediateGoal: '先做出一道能让第一批客人愿意回来的招牌菜',
    escalation: '同行抄袭、供应链和家庭压力会把小店经营变成生存战',
    readerPromise: '美食细节、开店升级、烟火日常和稳定甜感',
    relationship: '一个负责手艺，一个负责经营，在一餐一饭里累积可靠的信任。'
  },
  'modern-infrastructure': {
    setting: '原创旧城区、地方项目和实业团队共同发展的现代社会',
    openingProblem: '一块被所有人放弃的旧厂区交到两人手里，半年内必须拿出成果',
    immediateGoal: '先找到能落地的第一项产业，让居民看到留下来的理由',
    escalation: '资金、拆迁利益和短期政绩会持续拉扯长期方案',
    readerPromise: '创业建设、现实成果、团队成长和双主角并肩扛事',
    relationship: '在长期目标和具体分工中建立伙伴式亲密，冲突靠方案和结果解决。'
  },
  'urban-mystery': {
    setting: '原创都市、专业机构和一套可验证的案件规则',
    openingProblem: '一段看似普通的监控把两人同时指向同一桩不能公开的案件',
    immediateGoal: '先在证据消失前还原一个关键时间点',
    escalation: '每个新证据都会让他们更接近真正的受害者和幕后利益',
    readerPromise: '案件推进、专业查证、明确反转和关系同步升温',
    relationship: '一人负责现场判断，一人负责证据链，两人的不同方法共同推动真相。'
  },
  'modern-rebirth-system': {
    setting: '原创现代城市与一套边界清楚、代价明确的重来机制',
    openingProblem: '两人同时获得改写一个关键节点的机会，却发现时间只够完成一件事',
    immediateGoal: '先救回最重要的人或项目，再确认机制有没有隐藏条件',
    escalation: '每次改变都会产生现实代价，捷径越快，反噬越近',
    readerPromise: '即时任务、现实翻盘、能力兑现和连续追问',
    relationship: '一人想求稳，一人敢押注，机制逼他们把真实目标说清楚。'
  },
  xianxia: {
    setting: '原创仙门、灵脉和有明确代价的修行秩序',
    openingProblem: '入门测试当天，两人被判定为最不可能通过的人，却拿到同一枚异常令牌',
    immediateGoal: '先通过第一道试炼并查清令牌为何只对他们有反应',
    escalation: '宗门资源、师门立场和力量代价会让成长无法走捷径',
    readerPromise: '升级打怪、宗门任务、能力兑现和双强并肩',
    relationship: '两人修行路径不同，靠互补和共同承担代价建立信任。'
  },
  'beast-world': {
    setting: '原创兽人部落、迁徙路线和资源分配制度组成的蛮荒世界',
    openingProblem: '部落迁徙前夕，两人发现唯一的水源被人提前占用',
    immediateGoal: '先带着族群找到可活下来的新地点，再建立能长期运转的规则',
    escalation: '领地、食物和族群旧习会同时阻碍改变',
    readerPromise: '开荒、生存、部落升级和强烈的共同建设感',
    relationship: '一人善于观察环境，一人善于组织族群，在共同活下来后形成稳定羁绊。'
  },
  'western-fantasy': {
    setting: '原创魔法王国、学院与多种族城市组成的西幻世界',
    openingProblem: '王都继承或学院考核前，两人被发现共享一条不该存在的魔法契约',
    immediateGoal: '先完成眼前的公开考验，再查清契约真正的代价',
    escalation: '王权、种族和魔法资源会让私人选择变成公共危机',
    readerPromise: '魔法升级、身份反差、王都博弈和冒险搭档',
    relationship: '两人的力量和立场互补，关系在共同冒险和明确选择里升温。'
  },
  supernatural: {
    setting: '原创现代城市、人间机构与神怪规则交叠的幻想世界',
    openingProblem: '城市某处连续出现同一个不可能存在的人影，两人被同时卷入调查',
    immediateGoal: '先找出异常发生的现实地点，阻止下一次伤害',
    escalation: '神怪规则不能替代现实证据，幕后人会利用恐惧牟利',
    readerPromise: '奇异事件、现实查案、反转和双主角互相护航',
    relationship: '一人更信规则，一人更信人心，差异让他们的合作持续有张力。'
  },
  space: {
    setting: '原创星际航线、殖民站和多方势力共存的科幻社会',
    openingProblem: '航线或殖民站突然断联，两人手里却有唯一能恢复运行的权限',
    immediateGoal: '先让一处关键设施重新运转，再查明断联是否人为',
    escalation: '资源、阶层和星际政治会不断提高行动成本',
    readerPromise: '星际冒险、科技设定、事业升级和并肩破局',
    relationship: '两人分属不同专业和立场，靠任务分工与共同承担风险建立信任。'
  },
  apocalypse: {
    setting: '原创灾害类型、避难点和灾后资源规则组成的末世世界',
    openingProblem: '灾难倒计时只剩很短时间，两人必须在物资不足时决定先救谁、先去哪',
    immediateGoal: '先建立能撑过第一阶段的安全点，并带回一项关键资源',
    escalation: '天气、感染、资源争夺和人心会一起升级',
    readerPromise: '囤货求生、基地建设、阶段胜利和高强度选择',
    relationship: '一人负责判断风险，一人负责执行计划，在一次次互相托底中成为核心搭档。'
  },
  infinite: {
    setting: '原创副本空间、通关规则和可追溯的惩罚机制',
    openingProblem: '第一场副本的规则看似简单，却把两人的名字列在不同的死亡条件下',
    immediateGoal: '先活过第一关并找出规则里的一个漏洞',
    escalation: '副本奖励、队友利益和隐藏规则会不断逼他们取舍',
    readerPromise: '规则解谜、危机反转、通关奖励和紧凑追更点',
    relationship: '两人一个擅长推理，一个擅长执行，信任必须在每一关用结果换来。'
  },
  system: {
    setting: '原创任务机制、穿梭世界和明确积分代价构成的系统世界',
    openingProblem: '一条只有两人能看见的任务要求他们在期限内改写一个坏结局',
    immediateGoal: '先完成最低任务目标，摸清奖励与惩罚是否真实',
    escalation: '系统给出的捷径会牺牲别的东西，任务越快越容易触发隐藏条件',
    readerPromise: '任务兑现、世界切换、能力升级和连续爽点',
    relationship: '一人负责看长期代价，一人负责抓眼前机会，争论与合作共同推进任务。'
  },
  'ancient-no-cp': {
    setting: '原创古代官署、工坊或边地社会，把个人能力放进真实制度中',
    openingProblem: '两人被交付一项无人愿意接手的公共事务，失败就要由他们承担全部后果',
    immediateGoal: '先用一个可验证的成果让百姓或同僚愿意继续配合',
    escalation: '旧制度、利益集团和资源短缺会不断阻碍事业推进',
    readerPromise: '大女主掌局、能力兑现、公共成果和清晰升级线',
    relationship: '用户与角色是唯一双主角，保持知己或事业伙伴关系，不设置恋爱线。'
  },
  'modern-no-cp': {
    setting: '原创现代城市、专业行业和真实社会议题组成的事业舞台',
    openingProblem: '一个关键项目因人为失误即将失败，两人被迫接手并承担公开结果',
    immediateGoal: '先救回项目或证据，再用结果证明专业价值',
    escalation: '职位、资源和舆论会让事业选择越来越难',
    readerPromise: '专业成长、公开反击、阶段成果和大女主爽感',
    relationship: '用户与角色是平等的事业伙伴或知己，全程不安排恋爱线。'
  },
  'fantasy-no-cp': {
    setting: '原创星际、末世或修行文明，把力量和资源规则写清楚',
    openingProblem: '两人共同守护的基地、星球或宗门即将被更强势力接管',
    immediateGoal: '先保住核心人口或资源，再建立能长期自立的秩序',
    escalation: '能力代价、群体利益和外部战争会迫使他们持续升级',
    readerPromise: '宏大事业、能力成长、建设成果和双主角并肩',
    relationship: '用户与角色是战友、同僚或知己，不设置恋爱线，把情感回报放在共同目标上。'
  },
  'no-cp-principle': {
    setting: '原创时代、组织或行业，把所有戏剧冲突交给事业目标与价值选择',
    openingProblem: '两人共同接下一项会改变许多人命运的任务，却没有现成资源可用',
    immediateGoal: '先做出第一个公开成果，让更多人愿意加入或相信他们',
    escalation: '方法分歧、利益诱惑和失败代价会反复检验共同目标',
    readerPromise: '纯事业推进、双主角高密度对手戏和明确阶段胜利',
    relationship: '只写知己、战友或事业伙伴羁绊，明确不安排恋爱线。'
  },
  'food-cross': {
    setting: '原创古代、现代或幻想城市中的餐饮生态与生活空间',
    openingProblem: '两人接手一家无人看好的小店，开张前就面临租金、食材或口碑危机',
    immediateGoal: '先用一顿饭留住第一批客人，再找到能持续经营的招牌',
    escalation: '同行竞争、供应问题和各自的生活压力会不断找上门',
    readerPromise: '美食治愈、经营升级、烟火互动和稳定小爽点',
    relationship: '在共同做饭、分工经营和解决客人问题中形成自然默契。'
  },
  pets: {
    setting: '原创城市、灵宠生态或星际生物管理体系',
    openingProblem: '两人捡到或接手一只会引发争议的特殊伙伴，原主人和管理机构同时找来',
    immediateGoal: '先证明伙伴没有危险，再找到适合它长期生活的地方',
    escalation: '照料成本、身份秘密和不同群体的利益会逐步扩大',
    readerPromise: '可爱日常、养成成长、伙伴升级和轻松追更感',
    relationship: '一个负责照料，一个负责对外处理问题，在共同守护中建立稳定的家人式羁绊。'
  },
  retirement: {
    setting: '原创小镇、山居或星际社区，把生活资源和邻里关系写实',
    openingProblem: '两人想安静过日子，却在入住第一天被交付一桩必须解决的社区麻烦',
    immediateGoal: '先把生活安顿好，再用自己的方式解决一个小问题',
    escalation: '旧账、邻里误会和外部开发会慢慢打破平静',
    readerPromise: '低压日常、治愈陪伴、慢慢变好的生活和小回报',
    relationship: '不急着制造戏剧化误会，用共同生活中的照顾、边界和默契推进羁绊。'
  },
  'infrastructure-cross': {
    setting: '原创古代、现代、星际或末世的资源与生产体系',
    openingProblem: '两人接管一片缺水、缺粮或缺设备的区域，居民只给他们一个月试用期',
    immediateGoal: '先解决最急迫的一项民生需求，让第一批人看到具体变化',
    escalation: '资源分配、旧利益和突发灾害会不断迫使方案升级',
    readerPromise: '建设成果、群体成长、能力落地和持续爽点',
    relationship: '两人负责不同环节，靠共同扛结果和公开分工保持平等伙伴关系。'
  },
  'detective-romance': {
    setting: '原创时代、办案机构与一条可追踪的案件规则',
    openingProblem: '一桩看似普通的案子把两人同时列为关键证人或嫌疑对象',
    immediateGoal: '先还原第一处现场，再在舆论发酵前找到真正受害者',
    escalation: '案件背后的关系网会把职业风险和个人感情绑在一起',
    readerPromise: '查案反转、专业搭档、明确感情进度和章末问题',
    relationship: '让关系通过合作、信任和立场选择推进，案件与感情互相提供回报。'
  },
  'full-dive-game': {
    setting: '原创全息游戏公司、现实玩家社区和虚拟世界规则',
    openingProblem: '两人在游戏里发现同一处无法退出的异常区域，现实账号也开始受影响',
    immediateGoal: '先带出第一批被困玩家，再查清异常是否来自游戏外',
    escalation: '排名、商业利益和虚拟身份会让每次选择都被直播放大',
    readerPromise: '副本闯关、身份反差、赛场高光和关系互动',
    relationship: '现实与游戏两条线互相验证，两人靠配合和坦白建立真正的默契。'
  },
  'fairy-tale': {
    setting: '只借用公共母题的影子、完全重写制度与人物命运的原创幻想世界',
    openingProblem: '两人被迫参加一场决定身份的公开仪式，却发现规则对他们各自不公平',
    immediateGoal: '先利用规则漏洞完成第一步自救，再重新定义自己的结局',
    escalation: '王国、家族和旧传说都会试图把他们拉回既定位置',
    readerPromise: '熟悉母题的新解、身份逆袭、甜虐反转和清晰成长',
    relationship: '两人共同改写命运，感情靠行动和选择落地，不复述任何现成作品。'
  },
  'game-character': {
    setting: '原创游戏公司、任务世界和可被验证的角色规则',
    openingProblem: '两人进入游戏后发现自己不是被安排好的角色，第一关就会被系统清除',
    immediateGoal: '先拿到脱离初始剧情的权限，再找到真正控制世界的人',
    escalation: '任务奖励和现实代价会让每次攻略都产生新问题',
    readerPromise: '穿游戏、任务推进、身份掉马和连续关卡爽点',
    relationship: '两人一个熟悉规则一个擅长应变，在共同越界中形成专属默契。'
  },
  'group-favorite': {
    setting: '原创家族、宗门、团队或星际社区，支持系统必须有具体代价',
    openingProblem: '两人刚被接回一个看似热闹的群体，就发现所有人的好意都带着未解决的旧账',
    immediateGoal: '先查清自己为什么被需要，再决定如何接受或拒绝这份保护',
    escalation: '家族利益、外部对手和过度保护会一起制造新的冲突',
    readerPromise: '被偏爱、打脸护短、群像互动和双主角成长',
    relationship: '两人共同辨别真心与利用，在被支持和互相支持中建立安全感。'
  },
  'power-fantasy': {
    setting: '原创时代、组织和资源规则，让能力增长有清晰门槛和代价',
    openingProblem: '两人被当众判定为失败者，却在同一天拿到一个能翻盘的机会',
    immediateGoal: '先赢下眼前一场公开挑战，再拿到继续升级的资源',
    escalation: '对手会换规则、抢功劳并逼他们暴露真正底牌',
    readerPromise: '快节奏打脸、能力兑现、连续胜利和强互动',
    relationship: '一人冲锋一人补位，爽点来自两人共同赢下结果。'
  },
  healing: {
    setting: '原创社区、工作场所或小镇生活，让日常问题有真实解决路径',
    openingProblem: '两人因为一件不大的现实麻烦开始合作，却发现彼此都在逃避更大的问题',
    immediateGoal: '先解决眼前这件小事，让生活恢复一点秩序',
    escalation: '家庭、工作和旧伤会在平静日常里逐渐浮出水面',
    readerPromise: '好读的日常、温柔互动、问题回收和慢慢变好的生活',
    relationship: '用稳定陪伴、明确边界和一次次兑现承诺建立信任，不用抽象抒情替代剧情。'
  },
  'be-aesthetic': {
    setting: '原创时代、关系和现实选择，让遗憾来自具体决定而不是强行误会',
    openingProblem: '两人终于站到同一边，却发现必须在彼此和更重要的责任之间做选择',
    immediateGoal: '先完成眼前承诺，再决定要不要把真相说出口',
    escalation: '每一次靠近都会带来真实代价，结局由前面的选择累积而成',
    readerPromise: '强情绪、明确因果、克制拉扯和有回收的遗憾感',
    relationship: '关系变化必须由行动和代价推动，避免无意义虐待或悬空的诗性表达。'
  }
};

function topicVariant(title: string): Partial<FanficTopicSeed> {
  const variants: Array<{ test: RegExp; seed: Partial<FanficTopicSeed> }> = [
    { test: /重生/, seed: { openingProblem: '两人带着一次重来的机会回到最关键的节点，却只够先改一件事', immediateGoal: '先救回最重要的结果，再确认第二次机会的边界', readerPromise: '即时翻盘、旧账回收和一次次改变命运的爽点' } },
    { test: /穿书|穿越|魂穿|身穿|胎穿/, seed: { openingProblem: '其中一人醒来就发现自己站在一个即将失败的身份上，另一位主角是唯一变量', immediateGoal: '先避开眼前最危险的结局，再用现实行动改写身份处境', readerPromise: '身份错位、当场自救和原定结局被逐步改写' } },
    { test: /系统|任务|快穿/, seed: { openingProblem: '一条只有两人能看见的任务把他们推到一个必须立刻解决的坏结局前', immediateGoal: '先完成最低任务目标，摸清奖励和惩罚是否可信', readerPromise: '任务兑现、能力升级和一个世界接一个世界的追更点' } },
    { test: /末世|丧尸|天灾/, seed: { openingProblem: '灾难倒计时已经开始，两人手里的物资和时间只够做一次优先选择', immediateGoal: '先建立安全点并带回一项能让更多人活下来的资源', readerPromise: '求生、囤货、建设和阶段性胜利' } },
    { test: /先婚后爱|契约|联姻|婚姻|王爷王妃|相亲/, seed: { openingProblem: '一纸期限明确的关系安排把两人推到同一张桌前，桌外还有一场必须共同解决的危机', immediateGoal: '先按约定守住双方利益，再决定这段关系要不要继续', readerPromise: '高频对手戏、边界变化和感情兑现' } },
    { test: /复仇|虐渣|逆袭|打脸|火葬场/, seed: { openingProblem: '两人被当众夺走了一个本该属于自己的机会，却拿到了对手忽略的关键证据', immediateGoal: '先在公开场合赢回第一局，再让对手为自己的选择付出代价', readerPromise: '快节奏反击、证据落地和连续打脸' } },
    { test: /基建|种田|开荒|创业|经商|商铺|酒楼|建城|工坊|致富/, seed: { openingProblem: '两人只剩一块没人看好的资源和一笔必须自负盈亏的账', immediateGoal: '先做出第一个能产生现金流或改善生活的成果', readerPromise: '经营升级、实打实的成果和越做越大的事业线' } },
    { test: /娱乐圈|爱豆|影后|选秀|综艺|编剧|导演/, seed: { openingProblem: '一条热搜或一次临时换角让两人同时失去原有位置，却意外拿到翻盘机会', immediateGoal: '先把作品或舞台做出成绩，再用公开结果拿回话语权', readerPromise: '事业逆袭、镜头名场面和舆论反击' } },
    { test: /校园|高中|大学|学霸|青春/, seed: { openingProblem: '两人在开学或重要考试前因为一场误会被迫共同完成一件不能失败的事', immediateGoal: '先把事情做成，再决定是否把真正的心意说清楚', readerPromise: '清爽互动、成长选择和高频青春甜点' } },
    { test: /悬疑|刑侦|法医|探案|怪谈|副本|闯关|密室|规则/, seed: { openingProblem: '第一条线索同时把两人指向现场，证据却只会保留很短时间', immediateGoal: '先还原关键时间点或通关规则，再追到真正的受益者', readerPromise: '明确查证、反转、危机和章末问题' } },
    { test: /修仙|仙|灵根|炼丹|御兽|魔法|骑士|龙族|星际|机甲|虫族/, seed: { openingProblem: '两人在第一次公开考验中被判定为最不可能成功，却拿到同一条异常线索', immediateGoal: '先通过第一道考验并摸清力量或科技规则的代价', readerPromise: '升级、任务、能力兑现和双主角并肩破局' } },
    { test: /美食|餐馆|甜品|酒楼/, seed: { openingProblem: '两人接手一家即将关门的小店，开张前就要面对租金、食材或口碑危机', immediateGoal: '先做出一道让第一批客人愿意回来的招牌', readerPromise: '好吃的细节、经营升级和烟火互动' } },
    { test: /无 CP|事业|女帝|权臣|科研|基地首领|纯事业/, seed: { openingProblem: '两人共同接下一个会影响许多人命运的事业目标，失败就要承担公开后果', immediateGoal: '先做出第一个可验证成果，让更多人愿意加入', readerPromise: '能力兑现、事业升级、公开反击和双主角并肩', } }
  ];
  return variants.find((variant) => variant.test.test(title))?.seed ?? {};
}

function createCommercialSeed(title: string, sectionId: string): FanficTopicSeed {
  const profile = commercialSectionSeeds[sectionId] ?? commercialSectionSeeds.era;
  return {
    openingProblem: topicVariant(title).openingProblem ?? profile.openingProblem,
    immediateGoal: topicVariant(title).immediateGoal ?? profile.immediateGoal,
    escalation: topicVariant(title).escalation ?? profile.escalation,
    readerPromise: topicVariant(title).readerPromise ?? profile.readerPromise
  };
}

export const builtInFanficTopics: FanficTopic[] = fanficGenreGroups.flatMap((group, groupIndex) =>
  group.sections.flatMap((section, sectionIndex) =>
    section.topics.map((title, topicIndex) => {
      const guidance = groupStoryGuidance[group.id];
      const sectionSeed = commercialSectionSeeds[section.id] ?? commercialSectionSeeds.era;
      const commercialSeed = createCommercialSeed(title, section.id);
      return {
        id: `fanfic_topic_${groupIndex + 1}_${sectionIndex + 1}_${topicIndex + 1}`,
        source: 'built-in' as const,
        title,
        hook: `开局就有事：${commercialSeed.openingProblem}。两人必须${commercialSeed.immediateGoal}；否则${commercialSeed.escalation}。本书主打${commercialSeed.readerPromise}。`,
        setting: `${sectionSeed.setting}。题材标签“${title}”只决定商业赛道，具体地点、身份、制度与细节必须为本书重新原创。`,
        conflict: `第一章围绕“${commercialSeed.openingProblem}”展开，先完成“${commercialSeed.immediateGoal}”；中后段持续升级：${commercialSeed.escalation}。`,
        relationship: sectionSeed.relationship || guidance.relationship,
        tags: [group.shortLabel, section.label, title],
        trendKeywords: [],
        categoryId: group.id,
        categoryLabel: group.label,
        subcategory: section.label,
        builtIn: true,
        commercialSeed,
        createdAt: builtInCreatedAt
      };
    })
  )
);

export function createFallbackTrendTopic(keyword: string, index: number): FanficTopic {
  const trendBases = builtInFanficTopics.filter((topic) => topic.categoryId !== 'no-romance');
  const base = trendBases[index % trendBases.length];
  const now = Date.now();
  const commercialSeed = base.commercialSeed ?? {
    openingProblem: '两人同时遇到一个必须立刻解决的现实麻烦',
    immediateGoal: '先拿到第一份可以验证的成果',
    escalation: '新的对手和代价会继续出现',
    readerPromise: '清晰冲突、阶段回报和章末追更钩子'
  };
  return {
    ...base,
    id: `fanfic_trend_${now}_${index}`,
    source: 'trend',
    title: `${keyword} · 双主角开局`,
    hook: `开局就有事：${commercialSeed.openingProblem}。两人必须${commercialSeed.immediateGoal}，在原创世界里用结果赢回主动权。`,
    tags: [...new Set([keyword, ...base.tags])].slice(0, 6),
    trendKeywords: [keyword],
    commercialSeed,
    categoryId: undefined,
    categoryLabel: undefined,
    subcategory: undefined,
    builtIn: false,
    createdAt: now + index,
    expiresAt: now + 24 * 60 * 60 * 1000
  };
}