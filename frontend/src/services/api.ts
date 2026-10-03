import {
  Advisor,
  Army,
  BattleResultResponse,
  ChainType,
  DailyQuestSummary,
  Faction,
  FactionRegisterRequest,
  LeaderboardEntry,
  MarketplaceListing,
  NonceResponse,
  Player,
  Quest,
  RewardClaim,
  TradeProposal,
  WalletVerifyRequest,
} from '../types';
import type { DexConfig, DexExecution, DexMarketPrice, DexOrder, DexOrderRequest, DexSwapHistory } from '../types/dex';

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? `${window.location.origin}/api`
    : 'http://127.0.0.1:8000'
);

/** Chuẩn hoá BẤT KỲ giá trị bị reject thành một `Error` cụ thể.
 *
 * Đây là điểm tương đương với "response interceptor" của Axios: mọi promise
 * reject trong tầng HTTP đều phải mang theo một `Error`. Nếu ví/backend reject
 * bằng `undefined` (ví dụ người dùng bấm huỷ trên Phantom/Solflare) thì promise
 * đó sẽ nổi lên console dưới dạng `Uncaught (in promise) undefined`, nên ta luôn
 * bọc lại thành `Error` trước khi `throw`/`Promise.reject`.
 */
export function normalizeError(reason: unknown, fallback = 'Unknown error'): Error {
  if (reason instanceof Error) return reason;
  if (typeof reason === 'string' && reason.trim()) return new Error(reason);
  if (reason && typeof reason === 'object') {
    const message = (reason as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return new Error(message);
    try {
      const serialized = JSON.stringify(reason);
      if (serialized && serialized !== '{}' && serialized !== 'null') return new Error(serialized);
    } catch {
      // Giá trị không serialize được (vòng lặp, BigInt, ...) — dùng fallback.
    }
  }
  return new Error(fallback);
}

async function apiError(response: Response): Promise<Error> {
  if (response.status === 401) {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('gamefi:session-expired'));
    return new SessionExpiredError('Phiên đăng nhập đã hết hạn. Hãy kết nối ví lại.');
  }
  try {
    const payload = await response.json();
    const detail = (payload as { detail?: unknown } | null)?.detail;
    if (detail !== undefined && detail !== null) {
      return normalizeError(detail, `HTTP error ${response.status}`);
    }
    return new Error(`HTTP error ${response.status}`);
  } catch {
    return new Error(`HTTP error ${response.status}`);
  }
}

export class SessionExpiredError extends Error {}
export const DEFAULT_FACTION_IMAGE = '/dai-viet-worlds.webp';

const FACTION_IMAGE_FALLBACKS: Record<number, string> = {
  1: '/dai-viet-worlds.webp',
  2: '/dai-viet-legends.webp',
  3: '/dai-viet-hero.webp',
  4: '/dai-viet-worlds.webp',
  5: '/dai-viet-legends.webp',
  6: '/dai-viet-legends.webp',
  7: '/dai-viet-legends.webp',
  8: '/dai-viet-worlds.webp',
};

export const fallbackFactionImage = (factionId: number): string =>
  FACTION_IMAGE_FALLBACKS[factionId] || DEFAULT_FACTION_IMAGE;

/** Backend still serves legacy external image URLs (assets.vnhistory.gamefi / unsplash);
 *  always prefer a bundled local asset so a missing domain never breaks the UI. */
export const sanitizeFactionImage = (image: string | undefined, factionId: number): string => {
  if (!image || image.includes('assets.vnhistory.gamefi') || image.includes('unsplash.com')) {
    return fallbackFactionImage(factionId);
  }
  return image;
};

export const handleFactionImageError = (event: React.SyntheticEvent<HTMLImageElement>, factionId: number): void => {
  const target = event.currentTarget;
  const fallback = fallbackFactionImage(factionId);
  if (target.src !== fallback && !target.dataset.factionFallbackApplied) {
    target.dataset.factionFallbackApplied = 'true';
    target.src = fallback;
  }
};

export const DEFAULT_FACTIONS: Faction[] = [
  {
    faction_id: 1,
    name: "Văn Lang – Âu Lạc",
    rarity: "Lịch sử",
    image: "/dai-viet-worlds.webp",
    historical_era: "TK VII TCN – 179 TCN",
    history_origin: "Thời đại Hùng Vương khai sơn phá thạch định đô Phong Châu dựng nước Văn Lang, kết hợp cùng Thục Phán An Dương Vương sáp nhập Lạc Việt - Âu Việt, định đô Cổ Loa, đắp thành ốc 9 vòng kiên cố.",
    description: "Thời kỳ khởi nguyên của nền văn minh sông Hồng, sáng tạo nỏ thần liên cơ và thành lũy Cổ Loa bảo vệ vẹn toàn bờ cõi Lạc Việt.",
    motto: "Hùng Đồ Lạc Việt • Uy Trấn Cổ Loa",
    attack_bonus: 15,
    defense_bonus: 20,
    movement_bonus: 10,
    special_unit: "Xạ Thủ Nỏ Thần Cổ Loa",
    banner_color: "from-amber-700 via-yellow-600 to-amber-900",
    coat_of_arms: "Trống Đồng Đông Sơn & Chim Lạc",
    starting_advisor_id: "cao_lo",
    strengths: "Công sự thành lũy Cổ Loa xoáy trôn ốc hiểm trở; nỏ thần liên cơ của danh tướng Cao Lỗ tạo hỏa lực tầm xa áp đảo.",
    weaknesses: "Vũ khí và giáp trụ bằng đồng sơ khai; cấu trúc triều đình sơ kỳ dễ bị phân hóa bởi kế sách gián điệp và chia rẽ nội bộ."
  },
  {
    faction_id: 2,
    name: "Hai Bà Trưng – Bà Triệu",
    rarity: "Lịch sử",
    image: "/dai-viet-legends.webp",
    historical_era: "Năm 40 – 248",
    history_origin: "Mùa xuân năm 40, Trưng Trắc - Trưng Nhị phất cờ tại Hát Môn rửa sạch nợ nước, thu phục 65 thành trì Lĩnh Nam. Đến năm 248, Triệu Thị Trinh tiếp bước cưỡi voi đánh đuổi quân Ngô tại Cửu Chân.",
    description: "Biểu tượng bất khuất của phụ nữ và tinh thần quật cường chống ách đô hộ phương Bắc, khẳng định quyền tự chủ dân tộc từ buổi đầu lịch sử.",
    motto: "Rửa Sạch Nợ Nước • Khôi Phục Cơ Nghiệp",
    attack_bonus: 20,
    defense_bonus: 10,
    movement_bonus: 15,
    special_unit: "Chiến Tượng Nữ Binh Mê Linh",
    banner_color: "from-pink-800 via-rose-700 to-red-900",
    coat_of_arms: "Chiến Tượng Hai Đầu & Hoa Sen",
    starting_advisor_id: "hai_ba_trung",
    strengths: "Đội hình Voi chiến dũng mãnh càn quét thiết giáp bộ binh; sĩ khí quật khởi của toàn thể nhân dân đồng lòng hưởng ứng.",
    weaknesses: "Lực lượng nghĩa quân nông dân chưa qua huấn luyện trận địa chính quy lâu dài; thiếu thốn trang bị giáp nặng và hậu cần công thành cơ giới."
  },
  {
    faction_id: 3,
    name: "Nhà Ngô – Nhà Đinh",
    rarity: "Lịch sử",
    image: "/dai-viet-hero.webp",
    historical_era: "Năm 938 – 980",
    history_origin: "Năm 938, Ngô Quyền đại phá quân Nam Hán trên sông Bạch Đằng, chấm dứt hơn 1.000 năm Bắc thuộc. Tiếp đó, Đinh Tiên Hoàng dẹp loạn 12 sứ quân, thống nhất non sông, định đô tại Hoa Lư xưng Đế.",
    description: "Bản lề mở ra kỷ nguyên độc lập tự chủ lâu dài cho dân tộc, đặt nền móng quốc hiệu Đại Cồ Việt và tổ chức quân sự tập quyền vững mạnh.",
    motto: "Bạch Đằng Phá Địch • Vạn Thắng Thống Nhất",
    attack_bonus: 15,
    defense_bonus: 15,
    movement_bonus: 15,
    special_unit: "Thủy Binh Cọc Ngầm & Kỵ Binh Hoa Lư",
    banner_color: "from-blue-900 via-cyan-800 to-slate-900",
    coat_of_arms: "Cọc Nhọn Sông Nước & Cờ Lau Hoa Lư",
    starting_advisor_id: "ngo_quyen",
    strengths: "Nghệ thuật thủy chiến cọc ngầm lợi dụng thủy triều điêu luyện; phối hợp kỵ bộ cơ động tinh thông địa hình sông suối và thung lũng đá vôi.",
    weaknesses: "Nền tảng kinh tế quốc gia mới giành độc lập còn nhiều thiếu thốn; mầm mống tranh chấp quyền lực giữa các hào tộc địa phương vẫn tiềm ẩn."
  },
  {
    faction_id: 4,
    name: "Nhà Lý",
    rarity: "Lịch sử",
    image: "/dai-viet-worlds.webp",
    historical_era: "Năm 1009 – 1225",
    history_origin: "Lý Thái Tổ ban Chiếu Dời Đô về Thăng Long năm 1010, mở ra thời kỳ văn hiến rực rỡ. Thái úy Lý Thường Kiệt lãnh đạo quân dân phá Tống bình Chiêm với bản tuyên ngôn độc lập Nam Quốc Sơn Hà.",
    description: "Thời kỳ đỉnh cao của nền văn hóa Thăng Long, chính sách 'Ngụ binh ư nông' kết hợp Phật giáo - Nho giáo tạo nên quốc gia Đại Việt hùng cường.",
    motto: "Nam Quốc Sơn Hà Nam Đế Cư",
    attack_bonus: 15,
    defense_bonus: 20,
    movement_bonus: 10,
    special_unit: "Cấm Quân Hoàng Thành Thăng Long",
    banner_color: "from-amber-700 via-amber-600 to-yellow-500",
    coat_of_arms: "Thần Long Thời Lý & Bia Văn Miếu",
    starting_advisor_id: "ly_thuong_kiet",
    strengths: "Chính quy hóa quân đội, cấm quân tinh nhuệ kỷ luật cao; chiến lược chủ động tiến công tự vệ 'tiên phát chế nhân' và phòng tuyến Như Nguyệt kiên cố.",
    weaknesses: "Về giai đoạn cuối triều đại, việc xây dựng chùa tháp tốn kém cùng sự suy đồi của quan lại khiến tiềm lực kinh tế và quốc phòng suy giảm."
  },
  {
    faction_id: 5,
    name: "Nhà Trần",
    rarity: "Lịch sử",
    image: "/dai-viet-legends.webp",
    historical_era: "Năm 1225 – 1400",
    history_origin: "Nhà Trần với chế độ Thái Thượng Hoàng và tinh thần Diên Hồng - Bình Than đã đoàn kết toàn dân, ba lần (1258, 1285, 1288) đè bẹp vó ngựa đế chế Nguyên Mông dưới tài thao lược của Quốc công Tiết chế Trần Hưng Đạo.",
    description: "Kỷ nguyên Hào khí Đông A bất tử, đỉnh cao của nghệ thuật chiến tranh toàn dân, lấy thế nhỏ thắng lớn, lấy yếu chống mạnh trên chiến trường Đại Việt.",
    motto: "Sát Thát Quyết Chiến • Xã Tắc Lưỡng Hồi",
    attack_bonus: 15,
    defense_bonus: 15,
    movement_bonus: 15,
    special_unit: "Thiết Đột Thủy Binh Đại Việt",
    banner_color: "from-red-800 via-crimson to-red-600",
    coat_of_arms: "Hào Khí Sát Thát & Thần Kiếm Trần Triều",
    starting_advisor_id: "tran_hung_dao",
    strengths: "Khối đại đoàn kết toàn dân 'vua tôi đồng lòng, anh em hòa mục'; chiến lược vườn không nhà trống kết hợp đại phản công thủy bộ vô song.",
    weaknesses: "Chiến lược vườn không nhà trống đòi hỏi chấp nhận tàn phá kinh tế tạm thời; cuối triều đại mâu thuẫn quý tộc dẫn đến khủng hoảng xã hội sâu sắc."
  },
  {
    faction_id: 6,
    name: "Hậu Lê – Lam Sơn",
    rarity: "Lịch sử",
    image: "/dai-viet-legends.webp",
    historical_era: "Năm 1418 – 1527",
    history_origin: "Khởi xướng từ Hội thề Lũng Nhai 1418, Lê Lợi và Nguyễn Trãi lãnh đạo nghĩa quân Lam Sơn kiên trì mười năm nếm mật nằm gai, đại phá giặc Minh xâm lược, lập nên nhà Lê Sơ thịnh trị bậc nhất lịch sử phong kiến.",
    description: "Đỉnh cao tư tưởng nhân nghĩa 'Lấy đại nghĩa thắng hung tàn', ban bố luật Hồng Đức tiến bộ và phát triển hỏa lực vũ khí pháo thần cơ uy chấn.",
    motto: "Đem Đại Nghĩa Thắng Hung Tàn • Lấy Chí Nhân Thay Cường Bạo",
    attack_bonus: 20,
    defense_bonus: 15,
    movement_bonus: 10,
    special_unit: "Nghĩa Quân Lam Sơn Thiết Binh",
    banner_color: "from-orange-800 via-red-700 to-amber-700",
    coat_of_arms: "Thuận Thiên Kiếm & Thần Quy Kim Quy",
    starting_advisor_id: "le_loi",
    strengths: "Chiến tranh du kích chuyển hóa thành vận động chiến quy mô lớn; nghệ thuật công tâm vi thượng kết hợp hỏa tiễn, súng trường và pháo súng thần cơ.",
    weaknesses: "Những năm đầu kháng chiến chịu gian khổ tột cùng về tiếp vận và quân số; sau giai đoạn thịnh trị Lê Sơ, mâu thuẫn phong kiến phe phái nảy sinh phân tranh."
  },
  {
    faction_id: 7,
    name: "Tây Sơn",
    rarity: "Lịch sử",
    image: "/dai-viet-legends.webp",
    historical_era: "Năm 1771 – 1802",
    history_origin: "Ba anh em Tây Sơn dựng cờ khởi nghĩa lật đổ chế độ chúa Nguyễn và chúa Trịnh chia cắt hai miền suốt 200 năm. Quang Trung Nguyễn Huệ đánh tan 5 vạn quân Xiêm và lập kỳ tích hành quân thần tốc đại phá 29 vạn quân Thanh mùa xuân Kỷ Dậu 1789.",
    description: "Phong trào nông dân quật khởi vĩ đại nhất lịch sử, kết tinh ý chí giải phóng dân tộc bằng tốc độ hành quân thần tốc và chiến thuật hỏa công mãnh liệt.",
    motto: "Đánh Cho Để Dài Tóc • Đánh Cho Sử Tri Nam Quốc Anh Hùng",
    attack_bonus: 25,
    defense_bonus: 10,
    movement_bonus: 10,
    special_unit: "Hỏa Hổ Trận & Voi Chiến Đại Bác",
    banner_color: "from-red-600 via-amber-600 to-orange-700",
    coat_of_arms: "Hỏa Hổ Tây Sơn & Cờ Đỏ Quang Trung",
    starting_advisor_id: "quang_trung",
    strengths: "Tốc độ hành quân và công kích thần tốc vô song; đòn tập kích hỏa lực bằng hỏa hổ và voi chiến gắn đại bác gây hoảng loạn tan vỡ hàng ngũ địch.",
    weaknesses: "Lãnh thổ thống nhất quá nhanh trong điều kiện hậu cần nội chiến liên miên; Hoàng đế Quang Trung qua đời sớm khiến triều đình thiếu người kế tục ngang tầm."
  },
  {
    faction_id: 8,
    name: "Nhà Nguyễn",
    rarity: "Lịch sử",
    image: "/dai-viet-worlds.webp",
    historical_era: "Năm 1802 – 1945",
    history_origin: "Năm 1802, Hoàng đế Gia Long lập ra triều Nguyễn, hoàn thành sứ mệnh nhất thống non sông trọn vẹn từ Ải Nam Quan đến Mũi Cà Mau. Triều đình định đô tại Huế, đặt quốc hiệu Việt Nam năm 1804 và củng cố chủ quyền biển đảo Hoàng Sa - Trường Sa.",
    description: "Thời kỳ định hình cương vực lãnh thổ hiện đại của đất nước, để lại kho tàng di sản đồ sộ với Quần thể di tích Cố đô Huế và hệ thống địa bạ, hành chính quy mô.",
    motto: "Nhất Thống Giang Sơn • Uy Danh Cửu Đỉnh",
    attack_bonus: 15,
    defense_bonus: 20,
    movement_bonus: 10,
    special_unit: "Cửu Vị Thần Công Vệ Binh",
    banner_color: "from-amber-600 via-yellow-600 to-amber-800",
    coat_of_arms: "Kinh Thành Huế & Cửu Đỉnh Hoàng Gia",
    starting_advisor_id: "nguyen_tri_phuong",
    strengths: "Hệ thống thành lũy kiên cố kiểu Vauban trải dài ba miền; trang bị đại bác thần công, súng hỏa mai và tổ chức quân đội tập trung quy mô lớn.",
    weaknesses: "Chính sách đối ngoại bảo thủ khép kín và chậm canh tân khoa học kỹ thuật, khiến quân đội lúng túng khi đối mặt với hạm đội hiện đại của thực dân phương Tây."
  }
];

class GameApiService {
  private isServerHealthy: boolean | null = null;
  private accessToken: string | null = null;

  setAccessToken(token?: string | null): void {
    this.accessToken = token || null;
  }

  clearAccessToken(): void {
    this.accessToken = null;
  }

  private authHeaders(): Record<string, string> {
    return this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {};
  }

  async getCurrentSession(): Promise<Player> {
    const res = await fetch(`${API_BASE_URL}/auth/session`, {
      headers: this.authHeaders(),
      cache: 'no-store',
    });
    if (res.status === 401) throw new SessionExpiredError('Phiên đăng nhập đã hết hạn. Hãy kết nối ví lại.');
    if (!res.ok) throw await apiError(res);
    return { ...(await res.json()), access_token: this.accessToken || undefined, base_power: 1200 };
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(1500),
      });
      const data = await res.json();
      this.isServerHealthy = data?.status === 'ok';
      return this.isServerHealthy;
    } catch {
      this.isServerHealthy = false;
      return false;
    }
  }

  startRenderKeepAlive(intervalMs: number = 5 * 60 * 1000): () => void {
    if (typeof window === 'undefined') return () => undefined;

    const run = () => {
      void this.checkHealth();
    };

    run();
    const timer = window.setInterval(run, intervalMs);
    return () => window.clearInterval(timer);
  }

  // -------------------------------------------------------------------------
  // Auth & Players
  // -------------------------------------------------------------------------

  async guestLogin(username?: string): Promise<Player> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      this.setAccessToken(data.access_token);
      return {
        ...data,
        base_power: 1200,
      };
    } catch (e) {
      this.clearAccessToken();
      console.warn('Backend unavailable, using local guest player fallback:', e);
      const guestId = Math.random().toString(36).substring(2, 8);
      return {
        wallet: `guest_${guestId}`,
        chain: 'solana',
        username: username || `TuongQuan_${guestId}`,
        faction_id: null,
        nft_object_id: null,
        level: 1,
        base_power: 1200,
        rice: 5000,
        gold: 10000,
        morale: 85,
        is_guest: true,
      };
    }
  }

  async getNonce(chain: ChainType, wallet: string): Promise<NonceResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/nonce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chain, wallet }),
    });
    if (!res.ok) throw new Error(`Không thể tạo wallet challenge (${res.status})`);
    return await res.json();
  }

  async verifyWallet(payload: WalletVerifyRequest): Promise<Player> {
    const res = await fetch(`${API_BASE_URL}/auth/wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      this.clearAccessToken();
      throw new Error(`Xác thực chữ ký ví thất bại (${res.status})`);
    }
    const data = await res.json();
    this.setAccessToken(data.access_token);
    return { ...data, base_power: 1200 };
  }

  // -------------------------------------------------------------------------
  // Factions
  // -------------------------------------------------------------------------

  async getFactions(): Promise<Faction[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/factions`, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: Faction[] = await res.json();
      return data.map((item) => {
        const fallback = DEFAULT_FACTIONS.find(f => f.faction_id === item.faction_id) || DEFAULT_FACTIONS[0];
        return {
          ...fallback,
          ...item,
          image: sanitizeFactionImage(item.image, item.faction_id),
        };
      });
    } catch (e) {
      console.warn('Backend unavailable, using default rich faction metadata:', e);
      return DEFAULT_FACTIONS;
    }
  }

  async selectFactionF2P(wallet: string, factionId: number): Promise<Player> {
    const res = await fetch(`${API_BASE_URL}/players/${wallet}/faction/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify({ faction_id: factionId }),
    });
    if (!res.ok) throw await apiError(res);
    return {
      ...(await res.json()),
      access_token: this.accessToken || undefined,
      base_power: 1500,
    };
  }

  async registerPlayerFaction(wallet: string, payload: FactionRegisterRequest): Promise<Player> {
    const res = await fetch(`${API_BASE_URL}/players/${wallet}/faction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await apiError(res);
    return { ...(await res.json()), base_power: 1500 };
  }

  // -------------------------------------------------------------------------
  // Advisors & Army
  // -------------------------------------------------------------------------

  async getAdvisors(factionId?: number): Promise<Advisor[]> {
    try {
      const url = factionId ? `${API_BASE_URL}/advisors?faction_id=${factionId}` : `${API_BASE_URL}/advisors`;
      const res = await fetch(url);
      if (!res.ok) throw await apiError(res);
      return await res.json();
    } catch (e) {
      console.warn('Error fetching advisors:', e);
      return [];
    }
  }

  async getAdvisor(id: string): Promise<Advisor | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/advisors/${id}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('Error fetching advisor detail:', e);
      return null;
    }
  }

  async getPlayerArmy(wallet: string): Promise<Army> {
    try {
      const res = await fetch(`${API_BASE_URL}/players/${wallet}/army`, { headers: this.authHeaders() });
      if (!res.ok) throw await apiError(res);
      return await res.json();
    } catch (e) {
      console.warn('Error fetching army:', e);
      return {
        player_wallet: wallet,
        faction_id: null,
        equipped_advisor_id: null,
        equipped_advisor_name: null,
        spearmen_count: 100,
        archers_count: 60,
        cavalry_count: 30,
        elephants_count: 5,
        total_power: 500,
        morale: 85,
        formation: 'standard',
      };
    }
  }

  async equipAdvisor(wallet: string, advisorId: string): Promise<Army> {
    const res = await fetch(`${API_BASE_URL}/players/${wallet}/army/equip-advisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify({ advisor_id: advisorId }),
    });
    if (!res.ok) throw await apiError(res);
    return await res.json();
  }

  // -------------------------------------------------------------------------
  // Battles (100% Off-Chain)
  // -------------------------------------------------------------------------

  async executeBattle(
    playerWallet: string,
    scenarioId: string = 'bach_dang_1288',
    tacticalFormation: string = 'standard',
    advisorId?: string,
  ): Promise<BattleResultResponse> {
    const res = await fetch(`${API_BASE_URL}/battles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify({
        player_wallet: playerWallet,
        scenario_id: scenarioId,
        tactical_formation: tacticalFormation,
        advisor_id: advisorId,
      }),
    });
    if (!res.ok) throw await apiError(res);
    return await res.json();
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/leaderboard`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('Error fetching leaderboard:', e);
      return [];
    }
  }

  async getQuests(factionId?: number): Promise<Quest[]> {
    try {
      const url = factionId ? `${API_BASE_URL}/quests?faction_id=${factionId}` : `${API_BASE_URL}/quests`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('Error fetching quests:', e);
      return [];
    }
  }


  async getPlayerQuests(wallet: string): Promise<Quest[]> {
    const res = await fetch(`${API_BASE_URL}/quests/players/${wallet}`, {
      headers: this.authHeaders(),
    });
    if (!res.ok) throw await apiError(res);
    return await res.json();
  }

  // -------------------------------------------------------------------------
  // Daily Quests (Nhiệm Vụ Hàng Ngày)
  // -------------------------------------------------------------------------

  async getDailyQuests(wallet: string): Promise<DailyQuestSummary> {
    const res = await fetch(`${API_BASE_URL}/daily-quests/players/${wallet}`, {
      headers: this.authHeaders(),
    });
    if (!res.ok) throw await apiError(res);
    return await res.json();
  }

  async claimDailyQuest(wallet: string, questId: string): Promise<DailyQuestSummary> {
    const res = await fetch(`${API_BASE_URL}/daily-quests/players/${wallet}/claim/${questId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
    });
    if (!res.ok) throw await apiError(res);
    return await res.json();
  }

  async claimAllDailyQuests(wallet: string): Promise<DailyQuestSummary> {
    const res = await fetch(`${API_BASE_URL}/daily-quests/players/${wallet}/claim-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
    });
    if (!res.ok) throw await apiError(res);
    return await res.json();
  }

  async claimBattleReward(wallet: string, battleId: string): Promise<RewardClaim> {
    const res = await fetch(`${API_BASE_URL}/rewards/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify({ wallet, battle_id: battleId }),
    });
    if (!res.ok) throw await apiError(res);
    return await res.json();
  }

  async claimQuestReward(wallet: string, questId: string): Promise<RewardClaim> {
    const res = await fetch(`${API_BASE_URL}/rewards/quests/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify({ wallet, quest_id: questId }),
    });
    if (!res.ok) throw await apiError(res);
    return await res.json();
  }

  async getRewards(wallet: string, limit = 20): Promise<RewardClaim[]> {
    const res = await fetch(`${API_BASE_URL}/players/${wallet}/rewards?limit=${limit}`, {
      headers: this.authHeaders(),
    });
    if (!res.ok) throw await apiError(res);
    return await res.json();
  }


  async getSolRewardWallet(): Promise<{ address: string; balance_lamports: number | null; configured: boolean; active: boolean }> {
    const res = await fetch(`${API_BASE_URL}/blockchain/solana/reward-wallet`);
    if (!res.ok) throw await apiError(res);
    return await res.json();
  }

  // -------------------------------------------------------------------------
  // DEX provider gateway
  // -------------------------------------------------------------------------

  async getDexConfig(): Promise<DexConfig> {
    const res = await fetch(`${API_BASE_URL}/dex/config`);
    if (!res.ok) throw await apiError(res);
    return await res.json();
  }

  async getDexMarketPrice(): Promise<DexMarketPrice> {
    const res = await fetch(`${API_BASE_URL}/dex/market-price`);
    if (!res.ok) throw await apiError(res);
    return await res.json();
  }

  async createDexOrder(payload: DexOrderRequest, signal?: AbortSignal): Promise<DexOrder> {
    const res = await fetch(`${API_BASE_URL}/dex/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok) throw await apiError(res);
    return await res.json();
  }

  async executeDexOrder(payload: {
    wallet: string;
    request_id: string;
    signed_transaction: string;
  }): Promise<DexExecution> {
    const res = await fetch(`${API_BASE_URL}/dex/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await apiError(res);
    return await res.json();
  }

  async getDexHistory(limit = 5): Promise<DexSwapHistory[]> {
    const res = await fetch(`${API_BASE_URL}/dex/history?limit=${limit}`, {
      headers: this.authHeaders(),
    });
    if (!res.ok) throw await apiError(res);
    return await res.json();
  }

  // -------------------------------------------------------------------------
  // Marketplace & P2P Trades (Optional Blockchain Layer)
  // -------------------------------------------------------------------------

  async getMarketplace(chain?: ChainType, factionId?: number): Promise<MarketplaceListing[]> {
    try {
      const params = new URLSearchParams();
      if (chain) params.append('chain', chain);
      if (factionId) params.append('faction_id', factionId.toString());
      const res = await fetch(`${API_BASE_URL}/marketplace?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('Error fetching marketplace:', e);
      return [];
    }
  }

  async createListing(payload: {
    advisor_id: string;
    seller_wallet: string;
    chain: ChainType;
    price: number;
    currency?: string;
    token_id: string;
  }): Promise<MarketplaceListing> {
    const res = await fetch(`${API_BASE_URL}/marketplace/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  }

  async buyListing(payload: {
    listing_id: string;
    buyer_wallet: string;
    tx_digest: string;
  }): Promise<MarketplaceListing> {
    const res = await fetch(`${API_BASE_URL}/marketplace/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  }

  async cancelListing(payload: {
    listing_id: string;
    seller_wallet: string;
  }): Promise<MarketplaceListing> {
    const res = await fetch(`${API_BASE_URL}/marketplace/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  }

  async createTrade(payload: {
    initiator_wallet: string;
    target_wallet: string;
    offered_advisor_id: string;
    requested_advisor_id: string;
    chain: ChainType;
  }): Promise<TradeProposal> {
    const res = await fetch(`${API_BASE_URL}/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  }

  async acceptTrade(tradeId: string, wallet: string, txDigest?: string): Promise<TradeProposal> {
    const res = await fetch(`${API_BASE_URL}/trades/${tradeId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trade_id: tradeId, wallet, tx_digest: txDigest }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  }

  async rejectTrade(tradeId: string, wallet: string): Promise<TradeProposal> {
    const res = await fetch(`${API_BASE_URL}/trades/${tradeId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trade_id: tradeId, wallet }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  }
}

export const apiService = new GameApiService();
