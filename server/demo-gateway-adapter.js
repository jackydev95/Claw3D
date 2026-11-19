"use strict";

const http = require("http");
const { randomUUID } = require("crypto");
const { WebSocketServer } = require("ws");

const ADAPTER_PORT = parseInt(process.env.DEMO_ADAPTER_PORT || "18789", 10);
const MAIN_KEY = "main";
const DEFAULT_AGENT_ID = "ceo-minh-quan";
const MODELS = [
  { id: "demo/viet-tech-hq-45", name: "Tech Company HQ (45 Nhân Sự)", provider: "demo" },
];

const TECH_COMPANY_45_ROSTER = [
  // Row 1 (desk_0..desk_5): Ban Giám Đốc & Engineering Leadership (6)
  {
    id: "ceo-minh-quan",
    name: "Nguyễn Minh Quân",
    role: "CEO / Tổng Giám Đốc",
    department: "Ban Giám Đốc",
    emoji: "👔",
    currentTask: "Đang rà soát OKR Quý 4 cùng các khối Sản phẩm, Kỹ thuật và Kinh doanh B2B.",
  },
  {
    id: "cto-hoang-nam",
    name: "Trần Hoàng Nam",
    role: "CTO / Giám Đốc Công Nghệ",
    department: "Ban Giám Đốc",
    emoji: "🧠",
    currentTask: "Đang duyệt kiến trúc multi-region microservices và ngân sách hạ tầng Cloud + AI.",
  },
  {
    id: "cpo-thu-ha",
    name: "Lê Thu Hà",
    role: "CPO / Giám Đốc Sản Phẩm",
    department: "Ban Giám Đốc",
    emoji: "🎯",
    currentTask: "Đang chốt Product Roadmap 2027 và ưu tiên tính năng AI Copilot cho khách hàng doanh nghiệp.",
  },
  {
    id: "vp-eng-duc-anh",
    name: "Phạm Đức Anh",
    role: "VP of Engineering",
    department: "Quản Lý Kỹ Thuật",
    emoji: "⚙️",
    currentTask: "Đang cân đối nguồn lực giữa 5 squad Backend, Frontend, Mobile, AI và Platform.",
  },
  {
    id: "head-ai-quang-huy",
    name: "Vũ Quang Huy",
    role: "Head of AI & Data",
    department: "Khối AI & Dữ Liệu",
    emoji: "🤖",
    currentTask: "Đang đánh giá benchmark mô hình LLM tiếng Việt và độ trễ suy luận trên môi trường production.",
  },
  {
    id: "em-thanh-tung",
    name: "Đặng Thanh Tùng",
    role: "Engineering Manager",
    department: "Quản Lý Kỹ Thuật",
    emoji: "📋",
    currentTask: "Đang điều phối tiến độ Sprint 24, gỡ điểm nghẽn tích hợp API giữa Backend và Mobile.",
  },

  // Row 2 (desk_6..desk_11): Backend & Core Platform (6)
  {
    id: "be-lead-quoc-bao",
    name: "Bùi Quốc Bảo",
    role: "Tech Lead Backend",
    department: "Khối Backend",
    emoji: "🛠️",
    currentTask: "Đang review PR tối ưu connection pool PostgreSQL và cơ chế distributed lock trên Redis.",
  },
  {
    id: "be-sr-tuan-kiet",
    name: "Hoàng Tuấn Kiệt",
    role: "Senior Backend Engineer",
    department: "Khối Backend",
    emoji: "💻",
    currentTask: "Đang xây dựng event-driven pipeline xử lý 20.000 giao dịch/giây qua Kafka.",
  },
  {
    id: "be-sr-van-hung",
    name: "Ngô Văn Hùng",
    role: "Senior Backend Engineer",
    department: "Khối Backend",
    emoji: "🔧",
    currentTask: "Đang tách module xác thực OAuth2/SSO multi-tenant sang dịch vụ độc lập.",
  },
  {
    id: "be-hai-dang",
    name: "Đỗ Hải Đăng",
    role: "Backend Engineer",
    department: "Khối Backend",
    emoji: "⚡",
    currentTask: "Đang viết API tổng hợp báo cáo thời gian thực và bổ sung unit test đạt 92% coverage.",
  },
  {
    id: "be-minh-triet",
    name: "Lý Minh Triết",
    role: "Backend Engineer",
    department: "Khối Backend",
    emoji: "🧩",
    currentTask: "Đang tối ưu truy vấn tìm kiếm full-text và đồng bộ chỉ mục sang Elasticsearch.",
  },
  {
    id: "be-gia-huy",
    name: "Trương Gia Huy",
    role: "Payment & Core API Engineer",
    department: "Khối Backend",
    emoji: "💳",
    currentTask: "Đang tích hợp đối soát thanh toán VietQR, webhook idempotency và xử lý hoàn tiền tự động.",
  },

  // Row 3 (desk_12..desk_15): Architecture, DevOps/SRE & Security (4)
  {
    id: "arch-viet-anh",
    name: "Phan Việt Anh",
    role: "Principal System Architect",
    department: "Hạ Tầng & Kiến Trúc",
    emoji: "🏛️",
    currentTask: "Đang thiết kế chuẩn Domain-Driven Design và hợp đồng OpenAPI/gRPC liên dịch vụ.",
  },
  {
    id: "devops-manh-cuong",
    name: "Võ Mạnh Cường",
    role: "Lead DevOps / SRE",
    department: "Hạ Tầng & DevOps",
    emoji: "☁️",
    currentTask: "Đang cấu hình canary deployment trên Kubernetes và cảnh báo SLO qua Prometheus/Grafana.",
  },
  {
    id: "cloud-dang-khoa",
    name: "Đinh Đăng Khoa",
    role: "Cloud Infrastructure Engineer",
    department: "Hạ Tầng & DevOps",
    emoji: "🚀",
    currentTask: "Đang tự động hóa hạ tầng bằng Terraform và tối ưu 22% chi phí cụm worker tự co giãn.",
  },
  {
    id: "secops-hoai-nam",
    name: "Mai Hoài Nam",
    role: "Security / DevSecOps Engineer",
    department: "An Toàn Thông Tin",
    emoji: "🛡️",
    currentTask: "Đang quét lỗ hổng phụ thuộc trên CI/CD, kiểm tra phân quyền RBAC và chính sách WAF.",
  },

  // East QA Wing (desk_16..desk_18): QA Lead & Automation (3)
  {
    id: "qa-lead-ngoc-anh",
    name: "Nguyễn Ngọc Ánh",
    role: "QA Manager / Test Lead",
    department: "Đảm Bảo Chất Lượng (QA)",
    emoji: "🔬",
    currentTask: "Đang nghiệm thu tiêu chí xuất bản bản phát hành v2.8 và ký duyệt biên bản UAT.",
  },
  {
    id: "qa-auto-thao-vy",
    name: "Trần Thảo Vy",
    role: "Senior QA Automation Engineer",
    department: "Đảm Bảo Chất Lượng (QA)",
    emoji: "🧪",
    currentTask: "Đang chạy bộ 340 kịch bản kiểm thử tự động Playwright E2E trên môi trường staging.",
  },
  {
    id: "qa-sdet-khanh-linh",
    name: "Lê Khánh Linh",
    role: "SDET / API Test Engineer",
    department: "Đảm Bảo Chất Lượng (QA)",
    emoji: "✅",
    currentTask: "Đang viết contract test tự động cho cổng thanh toán và luồng phân quyền doanh nghiệp.",
  },

  // Row 4 Left (desk_19..desk_23): Frontend & Web Platform (5)
  {
    id: "fe-lead-minh-khoi",
    name: "Phạm Minh Khôi",
    role: "Tech Lead Frontend",
    department: "Khối Frontend",
    emoji: "🎨",
    currentTask: "Đang tối ưu Core Web Vitals (LCP < 1.5s) và kiến trúc App Router trên Next.js.",
  },
  {
    id: "fe-sr-hoang-long",
    name: "Vũ Hoàng Long",
    role: "Senior Frontend Engineer",
    department: "Khối Frontend",
    emoji: "⚛️",
    currentTask: "Đang xây dựng bảng điều khiển phân tích thời gian thực qua kết nối WebSocket.",
  },
  {
    id: "fe-anh-tuan",
    name: "Đặng Anh Tuấn",
    role: "Frontend Engineer (Next.js)",
    department: "Khối Frontend",
    emoji: "🌐",
    currentTask: "Đang hoàn thiện màn hình quản trị phân quyền nhóm và bộ lọc dữ liệu đa chiều.",
  },
  {
    id: "fe-phuong-thao",
    name: "Bùi Phương Thảo",
    role: "Frontend Engineer (3D/WebGL)",
    department: "Khối Frontend",
    emoji: "✨",
    currentTask: "Đang tinh chỉnh hiệu ứng ánh sáng Three.js, instanced mesh và chuyển động mượt 60fps.",
  },
  {
    id: "fe-quoc-thinh",
    name: "Hoàng Quốc Thịnh",
    role: "Frontend Engineer (Design System)",
    department: "Khối Frontend",
    emoji: "📐",
    currentTask: "Đang chuẩn hóa thư viện UI components, dark mode tokens và khả năng truy cập bàn phím.",
  },

  // Row 4 Right (desk_24..desk_27): Mobile App Engineering (4)
  {
    id: "mob-lead-thanh-dat",
    name: "Ngô Thành Đạt",
    role: "Mobile Team Lead",
    department: "Khối Mobile",
    emoji: "📱",
    currentTask: "Đang chuẩn bị bản build TestFlight & Google Play Internal cho phiên bản Mobile 3.4.",
  },
  {
    id: "ios-duc-thang",
    name: "Đỗ Đức Thắng",
    role: "Senior iOS Engineer",
    department: "Khối Mobile",
    emoji: "🍎",
    currentTask: "Đang tối ưu đồng bộ ngoại tuyến SwiftUI, push notification và xác thực FaceID.",
  },
  {
    id: "android-trung-kien",
    name: "Hồ Trung Kiên",
    role: "Senior Android Engineer",
    department: "Khối Mobile",
    emoji: "🤖",
    currentTask: "Đang giảm thời gian khởi động lạnh Jetpack Compose và xử lý bộ nhớ đệm ảnh.",
  },
  {
    id: "flutter-bao-ngoc",
    name: "Dương Bảo Ngọc",
    role: "Cross-Platform / Flutter Engineer",
    department: "Khối Mobile",
    emoji: "🦋",
    currentTask: "Đang đồng bộ module chat trực tuyến và gửi tệp đính kèm trên cả iOS lẫn Android.",
  },

  // Row 5 Left (desk_28..desk_32): AI, Machine Learning & Data (5)
  {
    id: "ai-sr-minh-duc",
    name: "Lương Minh Đức",
    role: "Senior AI / LLM Engineer",
    department: "Khối AI & Dữ Liệu",
    emoji: "🧬",
    currentTask: "Đang tinh chỉnh luồng gọi công cụ (tool-calling) và giảm hiện tượng ảo giác của AI Agent.",
  },
  {
    id: "ai-agent-tu-anh",
    name: "Trịnh Tú Anh",
    role: "AI Agent & RAG Engineer",
    department: "Khối AI & Dữ Liệu",
    emoji: "🔮",
    currentTask: "Đang nâng cấp hybrid vector search kết hợp reranker cho kho tri thức nội bộ doanh nghiệp.",
  },
  {
    id: "ml-quang-minh",
    name: "Cao Quang Minh",
    role: "Machine Learning Engineer",
    department: "Khối AI & Dữ Liệu",
    emoji: "📊",
    currentTask: "Đang huấn luyện mô hình dự báo rời bỏ khách hàng (churn prediction) và gợi ý thông minh.",
  },
  {
    id: "de-xuan-bach",
    name: "Tạ Xuân Bách",
    role: "Senior Data Engineer",
    department: "Khối AI & Dữ Liệu",
    emoji: "🗄️",
    currentTask: "Đang vận hành luồng ETL dbt + ClickHouse phục vụ báo cáo phân tích dưới 1 giây.",
  },
  {
    id: "da-my-linh",
    name: "Chu Mỹ Linh",
    role: "BI & Product Data Analyst",
    department: "Khối AI & Dữ Liệu",
    emoji: "📈",
    currentTask: "Đang phân tích phễu chuyển đổi người dùng mới và tỷ lệ giữ chân tuần thứ 4 (W4 Retention).",
  },

  // Row 5 Right (desk_33..desk_36): Product, BA & Lead UX (4)
  {
    id: "pm-sr-lan-anh",
    name: "Nguyễn Lan Anh",
    role: "Senior Product Manager",
    department: "Sản Phẩm & Thiết Kế",
    emoji: "🗺️",
    currentTask: "Đang viết PRD cho phân hệ Tự động hóa quy trình duyệt việc đa cấp (Approval Workflow).",
  },
  {
    id: "po-minh-chau",
    name: "Trần Minh Châu",
    role: "Product Owner",
    department: "Sản Phẩm & Thiết Kế",
    emoji: "📌",
    currentTask: "Đang làm mịn backlog Sprint 25 và nghiệm thu user stories cùng đội Frontend & Backend.",
  },
  {
    id: "ba-thuy-duong",
    name: "Lê Thùy Dương",
    role: "Lead Business Analyst",
    department: "Sản Phẩm & Thiết Kế",
    emoji: "📝",
    currentTask: "Đang đặc tả luồng nghiệp vụ kế toán đối soát và sơ đồ trạng thái đơn hàng B2B.",
  },
  {
    id: "ux-lead-khanh-huyen",
    name: "Phạm Khánh Huyền",
    role: "Lead UI/UX Product Designer",
    department: "Sản Phẩm & Thiết Kế",
    emoji: "🖌️",
    currentTask: "Đang kiểm thử khả năng sử dụng (usability test) prototype Figma cho trải nghiệm onboarding mới.",
  },

  // Row 6 Left (desk_37..desk_40): UI Design, QA Manual/Perf & Customer Success (4)
  {
    id: "ui-gia-han",
    name: "Vũ Gia Hân",
    role: "UI & Motion Designer",
    department: "Sản Phẩm & Thiết Kế",
    emoji: "🎭",
    currentTask: "Đang thiết kế bộ micro-interactions, biểu tượng 3D và minh họa trạng thái trống trên ứng dụng.",
  },
  {
    id: "qa-manual-yen-nhi",
    name: "Đặng Yến Nhi",
    role: "QA Engineer (Mobile & Web)",
    department: "Đảm Bảo Chất Lượng (QA)",
    emoji: "🔍",
    currentTask: "Đang kiểm thử tương thích giao diện trên 12 thiết bị iOS/Android và xác minh các bản vá lỗi.",
  },
  {
    id: "qa-perf-cong-minh",
    name: "Bùi Công Minh",
    role: "Performance Test Engineer",
    department: "Đảm Bảo Chất Lượng (QA)",
    emoji: "⏱️",
    currentTask: "Đang chạy kịch bản chịu tải k6 với 15.000 người dùng đồng thời để đo ngưỡng p99 latency.",
  },
  {
    id: "cs-lead-thanh-truc",
    name: "Hoàng Thanh Trúc",
    role: "Customer Success Lead",
    department: "Chăm Sóc Khách Hàng",
    emoji: "🤝",
    currentTask: "Đang hướng dẫn triển khai cho 3 khách hàng doanh nghiệp mới và tổng hợp phản hồi tính năng.",
  },

  // Row 6 Right (desk_41..desk_44): Growth, B2B Sales & HR/Operations (4)
  {
    id: "growth-lead-ha-my",
    name: "Ngô Hà My",
    role: "Head of Growth & Marketing",
    department: "Tăng Trưởng & Kinh Doanh",
    emoji: "📣",
    currentTask: "Đang triển khai chiến dịch ra mắt sản phẩm AI Workspace và tối ưu chi phí thu hút khách hàng (CAC).",
  },
  {
    id: "bd-tuan-anh",
    name: "Đỗ Tuấn Anh",
    role: "B2B Enterprise Sales Manager",
    department: "Tăng Trưởng & Kinh Doanh",
    emoji: "💼",
    currentTask: "Đang đàm phán hợp đồng gói Enterprise thường niên với 2 tập đoàn tài chính - bán lẻ.",
  },
  {
    id: "hr-cam-tu",
    name: "Lê Cẩm Tú",
    role: "HRBP & Tech Talent Acquisition",
    department: "Nhân Sự & Vận Hành",
    emoji: "🌱",
    currentTask: "Đang phỏng vấn ứng viên Senior AI/Backend và tổ chức chương trình gắn kết đội ngũ 45 thành viên.",
  },
  {
    id: "ops-minh-tam",
    name: "Nguyễn Minh Tâm",
    role: "Finance & Office Operations",
    department: "Nhân Sự & Vận Hành",
    emoji: "🏢",
    currentTask: "Đang quyết toán ngân sách vận hành văn phòng, bản quyền phần mềm và hậu cần sự kiện công ty.",
  },
];

const agents = new Map(
  TECH_COMPANY_45_ROSTER.map((member) => [
    member.id,
    {
      id: member.id,
      name: member.name,
      role: member.role,
      department: member.department,
      emoji: member.emoji,
      currentTask: member.currentTask,
      workspace: `/company/${member.id}`,
    },
  ])
);

const files = new Map();
const sessionSettings = new Map();
const conversationHistory = new Map();
const activeRuns = new Map();
const activeSendEventFns = new Set();

function randomId() {
  return randomUUID().replace(/-/g, "");
}

function sessionKeyFor(agentId) {
  return `agent:${agentId}:${MAIN_KEY}`;
}

// Seed initial sprint history so every employee has meaningful context when clicked.
for (const member of TECH_COMPANY_45_ROSTER) {
  conversationHistory.set(sessionKeyFor(member.id), [
    {
      role: "user",
      content: `Cập nhật nhanh tiến độ công việc hiện tại của bạn tại ${member.department}?`,
    },
    {
      role: "assistant",
      content: `Chào bạn! Mình là ${member.name} (${member.role} — ${member.department}). ${member.currentTask}`,
    },
  ]);
}

function getHistory(sessionKey) {
  if (!conversationHistory.has(sessionKey)) {
    conversationHistory.set(sessionKey, []);
  }
  return conversationHistory.get(sessionKey);
}

function clearHistory(sessionKey) {
  conversationHistory.delete(sessionKey);
}

function resOk(id, payload) {
  return { type: "res", id, ok: true, payload: payload ?? {} };
}

function resErr(id, code, message) {
  return { type: "res", id, ok: false, error: { code, message } };
}

function broadcastEvent(frame) {
  for (const send of activeSendEventFns) {
    try {
      send(frame);
    } catch {}
  }
}

function agentListPayload() {
  return [...agents.values()].map((agent) => ({
    id: agent.id,
    name: agent.name,
    workspace: agent.workspace,
    identity: { name: agent.name, emoji: agent.emoji || "🧑‍💻" },
    role: agent.role,
  }));
}

function buildDemoReply(agent, message) {
  const compactMessage = message.replace(/\s+/g, " ").trim();
  const greetingOnly =
    /^(hi|hello|hey|chào|xin chào|alo|ơi|bạn ơi|anh ơi|chị ơi|em ơi)[!.? ]*$/i.test(
      compactMessage
    );
  const deptLabel = agent.department ? ` (${agent.department})` : "";
  const intro = `${agent.name} — ${agent.role}${deptLabel} xin nghe!`;

  if (greetingOnly) {
    return `${intro} Hiện tại mình đang phụ trách: ${agent.currentTask || "triển khai mục tiêu Sprint của nhóm."} Bạn cần phối hợp hạng mục nào cứ nhắn trực tiếp cho mình nhé!`;
  }

  const focusLine =
    compactMessage.length > 160
      ? `${compactMessage.slice(0, 160).trimEnd()}...`
      : compactMessage;

  const roleLower = (agent.role || "").toLowerCase();
  let nextStep =
    "Mình sẽ tổng hợp phương án, đồng bộ với các bộ phận liên quan trong công ty 45 nhân sự và phản hồi kết quả cụ thể ngay trong Sprint này.";

  if (roleLower.includes("ceo")) {
    nextStep =
      "Mình sẽ căn chỉnh ưu tiên chiến lược cùng CTO Hoàng Nam và CPO Thu Hà để phân bổ nguồn lực phù hợp nhất cho mục tiêu tăng trưởng của công ty.";
  } else if (roleLower.includes("cto") || roleLower.includes("architect")) {
    nextStep =
      "Mình sẽ đánh giá kiến trúc hệ thống, độ mở rộng, bảo mật và thống nhất thiết kế kỹ thuật với các Tech Lead Backend, Frontend, Mobile và AI.";
  } else if (roleLower.includes("backend") || roleLower.includes("payment")) {
    nextStep =
      "Mình sẽ thiết kế schema dữ liệu, viết API/service đảm bảo hiệu năng cao, xử lý giao dịch an toàn và gửi PR kèm bộ unit/integration test đầy đủ.";
  } else if (roleLower.includes("frontend") || roleLower.includes("3d")) {
    nextStep =
      "Mình sẽ triển khai giao diện chuẩn Design System, tối ưu tốc độ tải trang, trạng thái tương tác mượt mà và phối hợp khớp API cùng đội Backend.";
  } else if (roleLower.includes("mobile") || roleLower.includes("ios") || roleLower.includes("android") || roleLower.includes("flutter")) {
    nextStep =
      "Mình sẽ đóng gói tính năng trên ứng dụng di động, kiểm tra hiệu năng thiết bị thực tế và đẩy bản build lên TestFlight / Google Play Internal để QA nghiệm thu.";
  } else if (roleLower.includes("ai") || roleLower.includes("machine learning") || roleLower.includes("data")) {
    nextStep =
      "Mình sẽ chuẩn hóa pipeline dữ liệu, đo lường độ chính xác mô hình/RAG, tối ưu độ trễ suy luận và cung cấp dashboard chỉ số rõ ràng.";
  } else if (roleLower.includes("devops") || roleLower.includes("cloud") || roleLower.includes("security")) {
    nextStep =
      "Mình sẽ tự động hóa trên pipeline CI/CD, thiết lập giám sát cảnh báo SLO, kiểm tra an toàn bảo mật và đảm bảo uptime 99.95%.";
  } else if (roleLower.includes("qa") || roleLower.includes("sdet") || roleLower.includes("test")) {
    nextStep =
      "Mình sẽ lập ma trận kịch bản kiểm thử biên, chạy bộ test tự động E2E/API/tải cao và xác nhận chất lượng trước khi phát hành lên production.";
  } else if (roleLower.includes("product") || roleLower.includes("cpo") || roleLower.includes("analyst")) {
    nextStep =
      "Mình sẽ làm rõ yêu cầu nghiệp vụ, viết tiêu chí nghiệm thu (Acceptance Criteria) chi tiết và sắp xếp độ ưu tiên vào backlog cho đội phát triển.";
  } else if (roleLower.includes("designer") || roleLower.includes("ux") || roleLower.includes("ui")) {
    nextStep =
      "Mình sẽ phác thảo user flow, hoàn thiện prototype trên Figma và bàn giao đầy đủ thông số thiết kế cho đội Frontend & Mobile.";
  } else if (roleLower.includes("growth") || roleLower.includes("sales") || roleLower.includes("customer")) {
    nextStep =
      "Mình sẽ làm việc sát với khách hàng, theo dõi phễu chuyển đổi doanh thu B2B và phản hồi nhu cầu thực tế về cho khối Sản phẩm.";
  } else if (roleLower.includes("hr") || roleLower.includes("finance") || roleLower.includes("operations")) {
    nextStep =
      "Mình sẽ hỗ trợ quy trình nhân sự, ngân sách vận hành và đảm bảo toàn bộ 45 thành viên trong công ty có điều kiện làm việc tốt nhất.";
  }

  return `${intro} Về nội dung "${focusLine}": ${nextStep}`;
}

async function handleMethod(method, params, id, sendEvent) {
  const p = params || {};

  switch (method) {
    case "agents.list":
      return resOk(id, {
        defaultId: DEFAULT_AGENT_ID,
        mainKey: MAIN_KEY,
        agents: agentListPayload(),
      });

    case "agents.create": {
      const name = typeof p.name === "string" && p.name.trim() ? p.name.trim() : "Thành Viên Mới";
      const role = typeof p.role === "string" ? p.role.trim() : "Software Engineer";
      const slug =
        name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "thanh-vien";
      const agentId = `${slug}-${randomId().slice(0, 6)}`;
      agents.set(agentId, {
        id: agentId,
        name,
        role,
        department: "Khối Kỹ Thuật",
        emoji: "🧑‍💻",
        currentTask: "Đang hội nhập quy trình phát triển sản phẩm cùng đội ngũ.",
        workspace: `/company/${slug}`,
      });
      broadcastEvent({
        type: "event",
        event: "presence",
        payload: { sessions: { recent: [], byAgent: [] } },
      });
      return resOk(id, { agentId, name, workspace: `/company/${slug}` });
    }

    case "agents.update": {
      const agentId = typeof p.agentId === "string" ? p.agentId.trim() : "";
      const agent = agents.get(agentId);
      if (!agent) return resErr(id, "not_found", `Agent ${agentId} not found`);
      if (typeof p.name === "string" && p.name.trim()) agent.name = p.name.trim();
      if (typeof p.role === "string") agent.role = p.role.trim();
      return resOk(id, { ok: true, removedBindings: 0 });
    }

    case "agents.delete": {
      const agentId = typeof p.agentId === "string" ? p.agentId.trim() : "";
      if (agentId && agents.has(agentId) && agentId !== DEFAULT_AGENT_ID) {
        agents.delete(agentId);
        clearHistory(sessionKeyFor(agentId));
      }
      return resOk(id, { ok: true, removedBindings: 0 });
    }

    case "agents.files.get": {
      const key = `${p.agentId || DEFAULT_AGENT_ID}/${p.name || ""}`;
      const content = files.get(key);
      return resOk(id, { file: content !== undefined ? { content } : { missing: true } });
    }

    case "agents.files.set": {
      const key = `${p.agentId || DEFAULT_AGENT_ID}/${p.name || ""}`;
      files.set(key, typeof p.content === "string" ? p.content : "");
      return resOk(id, {});
    }

    case "config.get":
      return resOk(id, {
        config: { gateway: { reload: { mode: "hot" } } },
        hash: "demo-gateway",
        exists: true,
        path: "/demo/config.json",
      });

    case "config.patch":
    case "config.set":
      return resOk(id, { hash: "demo-gateway" });

    case "exec.approvals.get":
      return resOk(id, {
        path: "",
        exists: true,
        hash: "demo-approvals",
        file: {
          version: 1,
          defaults: { security: "full", ask: "off", autoAllowSkills: true },
          agents: {},
        },
      });

    case "exec.approvals.set":
      return resOk(id, { hash: "demo-approvals" });

    case "exec.approval.resolve":
      return resOk(id, { ok: true });

    case "models.list":
      return resOk(id, { models: MODELS });

    case "skills.status":
      return resOk(id, { skills: [] });

    case "cron.list":
      return resOk(id, { jobs: [] });

    case "cron.add":
    case "cron.run":
    case "cron.remove":
      return resErr(id, "unsupported_method", `Demo runtime does not support ${method}.`);

    case "sessions.list": {
      const sessions = [...agents.values()].map((agent) => {
        const sessionKey = sessionKeyFor(agent.id);
        const history = getHistory(sessionKey);
        const settings = sessionSettings.get(sessionKey) || {};
        return {
          key: sessionKey,
          agentId: agent.id,
          updatedAt: history.length > 0 ? Date.now() : null,
          displayName: "Main",
          origin: { label: agent.name, provider: "demo" },
          model: settings.model || MODELS[0].id,
          modelProvider: "demo",
        };
      });
      return resOk(id, { sessions });
    }

    case "sessions.preview": {
      const keys = Array.isArray(p.keys) ? p.keys : [];
      const limit = typeof p.limit === "number" ? p.limit : 8;
      const maxChars = typeof p.maxChars === "number" ? p.maxChars : 240;
      const previews = keys.map((key) => {
        const history = getHistory(key);
        if (history.length === 0) return { key, status: "empty", items: [] };
        const items = history.slice(-limit).map((msg) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          text: String(msg.content || "").slice(0, maxChars),
          timestamp: Date.now(),
        }));
        return { key, status: "ok", items };
      });
      return resOk(id, { ts: Date.now(), previews });
    }

    case "sessions.patch": {
      const key = typeof p.key === "string" ? p.key : sessionKeyFor(DEFAULT_AGENT_ID);
      const current = sessionSettings.get(key) || {};
      const next = { ...current };
      if (p.model !== undefined) next.model = p.model;
      if (p.thinkingLevel !== undefined) next.thinkingLevel = p.thinkingLevel;
      sessionSettings.set(key, next);
      return resOk(id, {
        ok: true,
        key,
        entry: { thinkingLevel: next.thinkingLevel },
        resolved: { model: next.model || MODELS[0].id, modelProvider: "demo" },
      });
    }

    case "sessions.reset": {
      const key = typeof p.key === "string" ? p.key : sessionKeyFor(DEFAULT_AGENT_ID);
      clearHistory(key);
      return resOk(id, { ok: true });
    }

    case "chat.send": {
      const sessionKey =
        typeof p.sessionKey === "string" ? p.sessionKey : sessionKeyFor(DEFAULT_AGENT_ID);
      const agentId = sessionKey.startsWith("agent:")
        ? sessionKey.split(":")[1]
        : DEFAULT_AGENT_ID;
      const agent = agents.get(agentId) || agents.get(DEFAULT_AGENT_ID);
      const message =
        typeof p.message === "string" ? p.message.trim() : String(p.message || "").trim();
      const runId =
        typeof p.idempotencyKey === "string" && p.idempotencyKey
          ? p.idempotencyKey
          : randomId();
      if (!message) return resOk(id, { status: "no-op", runId });

      const reply = buildDemoReply(agent, message);
      let aborted = false;
      activeRuns.set(runId, {
        runId,
        sessionKey,
        agentId,
        abort() {
          aborted = true;
        },
      });

      setImmediate(async () => {
        let seq = 0;
        const emitChat = (state, extra) => {
          sendEvent({
            type: "event",
            event: "chat",
            seq: seq++,
            payload: { runId, sessionKey, state, ...extra },
          });
        };

        try {
          const words = reply.split(" ");
          let partial = "";
          for (const word of words) {
            if (aborted) break;
            partial = partial ? `${partial} ${word}` : word;
            emitChat("delta", { message: { role: "assistant", content: partial } });
            await new Promise((resolve) => setTimeout(resolve, 40));
          }

          if (aborted) {
            emitChat("aborted", {});
            return;
          }

          const history = getHistory(sessionKey);
          history.push({ role: "user", content: message });
          history.push({ role: "assistant", content: reply });
          emitChat("final", {
            stopReason: "end_turn",
            message: { role: "assistant", content: reply },
          });
          sendEvent({
            type: "event",
            event: "presence",
            seq: seq++,
            payload: {
              sessions: {
                recent: [{ key: sessionKey, updatedAt: Date.now() }],
                byAgent: [{ agentId, recent: [{ key: sessionKey, updatedAt: Date.now() }] }],
              },
            },
          });
        } finally {
          activeRuns.delete(runId);
        }
      });

      return resOk(id, { status: "started", runId });
    }

    case "chat.abort": {
      const runId = typeof p.runId === "string" ? p.runId.trim() : "";
      const sessionKey = typeof p.sessionKey === "string" ? p.sessionKey.trim() : "";
      let aborted = 0;
      if (runId) {
        const handle = activeRuns.get(runId);
        if (handle) {
          handle.abort();
          activeRuns.delete(runId);
          aborted += 1;
        }
      } else if (sessionKey) {
        for (const [activeRunId, handle] of activeRuns.entries()) {
          if (handle.sessionKey !== sessionKey) continue;
          handle.abort();
          activeRuns.delete(activeRunId);
          aborted += 1;
        }
      }
      return resOk(id, { ok: true, aborted });
    }

    case "chat.history": {
      const sessionKey =
        typeof p.sessionKey === "string" ? p.sessionKey : sessionKeyFor(DEFAULT_AGENT_ID);
      return resOk(id, { sessionKey, messages: getHistory(sessionKey) });
    }

    case "agent.wait": {
      const runId = typeof p.runId === "string" ? p.runId : "";
      const timeoutMs = typeof p.timeoutMs === "number" ? p.timeoutMs : 30000;
      const start = Date.now();
      while (activeRuns.has(runId) && Date.now() - start < timeoutMs) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return resOk(id, { status: activeRuns.has(runId) ? "running" : "done" });
    }

    case "status": {
      const recent = [...agents.keys()].flatMap((agentId) => {
        const key = sessionKeyFor(agentId);
        const history = getHistory(key);
        return history.length > 0 ? [{ key, updatedAt: Date.now() }] : [];
      });
      return resOk(id, {
        sessions: {
          recent,
          byAgent: [...agents.keys()].map((agentId) => ({
            agentId,
            recent: recent.filter((entry) => entry.key.includes(`:${agentId}:`)),
          })),
        },
      });
    }

    case "wake":
      return resOk(id, { ok: true });

    default:
      return resOk(id, {});
  }
}

function startLiveCompanySimulation(ws, sendEventFn) {
  const timers = new Set();
  let stopped = false;
  let cursor = 0;

  const schedule = (fn, delayMs) => {
    if (stopped) return;
    const handle = setTimeout(() => {
      timers.delete(handle);
      if (!stopped && ws.readyState === ws.OPEN) {
        fn();
      }
    }, delayMs);
    if (typeof handle.unref === "function") handle.unref();
    timers.add(handle);
  };

  const triggerAgentWorkBurst = (agent, durationMs) => {
    const sessionKey = sessionKeyFor(agent.id);
    // Skip if user is actively chatting with this agent.
    for (const run of activeRuns.values()) {
      if (run.sessionKey === sessionKey) return;
    }
    const runId = `sim_${randomId().slice(0, 10)}`;
    const statusNote = agent.currentTask || `${agent.name} đang xử lý công việc Sprint.`;

    sendEventFn({
      type: "event",
      event: "agent",
      payload: {
        runId,
        sessionKey,
        stream: "lifecycle",
        data: { phase: "start" },
      },
    });
    sendEventFn({
      type: "event",
      event: "chat",
      payload: {
        runId,
        sessionKey,
        state: "delta",
        message: { role: "assistant", content: statusNote },
      },
    });

    schedule(() => {
      sendEventFn({
        type: "event",
        event: "chat",
        payload: {
          runId,
          sessionKey,
          state: "final",
          stopReason: "end_turn",
          message: { role: "assistant", content: statusNote },
        },
      });
      sendEventFn({
        type: "event",
        event: "agent",
        payload: {
          runId,
          sessionKey,
          stream: "lifecycle",
          data: { phase: "end" },
        },
      });
    }, durationMs);
  };

  const runWave = (batchSize, baseDurationMs) => {
    const roster = [...agents.values()];
    if (roster.length === 0) return;
    for (let i = 0; i < batchSize; i += 1) {
      const member = roster[(cursor + i * 2) % roster.length];
      if (member) {
        triggerAgentWorkBurst(member, baseDurationMs + (i % 5) * 3500);
      }
    }
    cursor = (cursor + batchSize) % Math.max(roster.length, 1);
  };

  // Initial wave after client finishes bootstrap (~1.6s): 24 of 45 staff head to their desks to work!
  schedule(() => {
    runWave(24, 18000);
  }, 1600);

  // Continuous rotation every 7s so ~22-28 staff are working at desks while ~17-23 collaborate/walk around.
  const interval = setInterval(() => {
    if (stopped || ws.readyState !== ws.OPEN) return;
    runWave(8, 16000);
  }, 7000);
  if (typeof interval.unref === "function") interval.unref();

  return () => {
    stopped = true;
    clearInterval(interval);
    for (const handle of timers) {
      clearTimeout(handle);
    }
    timers.clear();
  };
}

function attachDemoClient(ws) {
  let connected = false;
  let globalSeq = 0;
  let stopSimulation = null;

  const send = (frame) => {
    if (ws.readyState !== ws.OPEN) return;
    ws.send(JSON.stringify(frame));
  };

  const sendEventFn = (frame) => {
    if (frame.type === "event" && typeof frame.seq !== "number") {
      frame.seq = globalSeq++;
    }
    send(frame);
  };

  const cleanup = () => {
    activeSendEventFns.delete(sendEventFn);
    if (stopSimulation) {
      stopSimulation();
      stopSimulation = null;
    }
  };

  activeSendEventFns.add(sendEventFn);
  send({ type: "event", event: "connect.challenge", payload: { nonce: randomId() } });

  ws.on("message", async (raw) => {
    let frame;
    try {
      frame = JSON.parse(raw.toString("utf8"));
    } catch {
      return;
    }
    if (!frame || typeof frame !== "object" || frame.type !== "req") return;
    const { id, method, params } = frame;
    if (typeof id !== "string" || typeof method !== "string") return;

    if (method === "connect") {
      connected = true;
      send({
        type: "res",
        id,
        ok: true,
        payload: {
          type: "hello-ok",
          protocol: 3,
          adapterType: "demo",
          features: {
            methods: [
              "agents.list",
              "agents.create",
              "agents.delete",
              "agents.update",
              "sessions.list",
              "sessions.preview",
              "sessions.patch",
              "sessions.reset",
              "chat.send",
              "chat.abort",
              "chat.history",
              "agent.wait",
              "status",
              "config.get",
              "config.set",
              "config.patch",
              "agents.files.get",
              "agents.files.set",
              "exec.approvals.get",
              "exec.approvals.set",
              "exec.approval.resolve",
              "wake",
              "skills.status",
              "models.list",
              "cron.list",
            ],
            events: ["chat", "agent", "presence", "heartbeat"],
          },
          snapshot: {
            health: {
              agents: [...agents.values()].map((agent) => ({
                agentId: agent.id,
                name: agent.name,
                isDefault: agent.id === DEFAULT_AGENT_ID,
              })),
              defaultAgentId: DEFAULT_AGENT_ID,
            },
            sessionDefaults: { mainKey: MAIN_KEY },
          },
          auth: { role: "operator", scopes: ["operator.admin"] },
          policy: { tickIntervalMs: 30000 },
        },
      });
      if (!stopSimulation) {
        stopSimulation = startLiveCompanySimulation(ws, sendEventFn);
      }
      return;
    }

    if (!connected) {
      send(resErr(id, "not_connected", "Send connect first."));
      return;
    }

    try {
      send(await handleMethod(method, params, id, sendEventFn));
    } catch (error) {
      send(resErr(id, "internal_error", error instanceof Error ? error.message : "Internal error"));
    }
  });

  ws.on("close", cleanup);
  ws.on("error", cleanup);
}

function startAdapter() {
  const httpServer = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Claw3D Demo Gateway Adapter — Tech Company HQ (45 Nhân Sự)\n");
  });

  const wss = new WebSocketServer({ server: httpServer });
  wss.on("connection", attachDemoClient);

  httpServer.listen(ADAPTER_PORT, "127.0.0.1", () => {
    console.log(`[demo-gateway] Listening on ws://localhost:${ADAPTER_PORT} (45 agents)`);
    console.log("[demo-gateway] No OpenClaw or Hermes required.");
  });
}

if (require.main === module) {
  startAdapter();
}

module.exports = {
  TECH_COMPANY_45_ROSTER,
  attachDemoClient,
  handleMethod,
  startAdapter,
};
