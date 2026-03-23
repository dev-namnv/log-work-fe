# Log Work — Copilot Instructions

## Tổng quan dự án

**Log Work** là ứng dụng quản lý chấm công cho phép nhân viên ghi nhận thời gian làm việc (check-in / check-out) và tính toán ngày công, phục vụ tính lương.

### Tech stack

- **Framework**: React Router v7 (SSR enabled) + React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Build**: Vite
- **Containerization**: Docker

---

## Cấu trúc thư mục chuẩn

```
app/
  routes/           # File-based routing (React Router v7)
  components/       # Shared UI components
    ui/             # Primitive components (Button, Input, Badge, Table…)
    layout/         # Shell, Sidebar, Header, etc.
    forms/          # Form-specific components
  lib/
    calculations.ts # Business logic: tính giờ công, ngày công, lương
    utils.ts        # General utilities (date format, number format)
    validators.ts   # Zod schemas / validation helpers
    constants.ts    # App-wide constants
  types/
    index.ts        # Re-exports all domain types
    organization.ts
    employee.ts
    work-log.ts
    reports.ts
  hooks/            # Custom React hooks
  services/         # API call abstractions (fetch wrappers)
```

---

## Domain Model

### Organization (Cơ quan / Đơn vị)

```ts
interface Organization {
	id: string;
	name: string;
	code: string;
	settings: OrganizationSettings;
	createdAt: string; // ISO
	updatedAt: string;
}

interface OrganizationSettings {
	workStartTime: string; // "HH:mm", ví dụ: "08:00"
	workEndTime: string; // "HH:mm", ví dụ: "17:30"
	lunchBreakStart: string; // "HH:mm", ví dụ: "12:00"
	lunchBreakEnd: string; // "HH:mm", ví dụ: "13:00"
	standardWorkHoursPerDay: number; // Số giờ chuẩn/ngày, ví dụ: 8.0
	workDays: number[]; // [1,2,3,4,5] = Thứ 2 – Thứ 6 (ISO weekday)
	timezone: string; // "Asia/Ho_Chi_Minh"
	allowLateMinutes: number; // Số phút được phép trễ không trừ công
	allowEarlyLeaveMinutes: number;
}
```

### Employee (Nhân viên)

```ts
interface Employee {
	id: string;
	organizationId: string;
	employeeCode: string; // Mã nhân viên
	fullName: string;
	email: string;
	department: string; // Phòng / Ban
	position: string; // Chức vụ
	status: 'active' | 'inactive';
	hireDate: string; // YYYY-MM-DD
}
```

### WorkLog (Bản ghi chấm công)

```ts
interface WorkLog {
	id: string;
	employeeId: string;
	organizationId: string;
	date: string; // YYYY-MM-DD
	checkInTime: string | null; // "HH:mm"
	checkOutTime: string | null; // "HH:mm"
	notes: string;
	source: 'manual' | 'device' | 'import';
	createdAt: string;
	updatedAt: string;
}
```

### WorkDaySummary (Kết quả tính công mỗi ngày — computed)

```ts
interface WorkDaySummary {
	date: string;
	employeeId: string;
	scheduledMinutes: number; // Số phút làm chuẩn theo cơ quan
	actualMinutes: number; // Số phút làm thực tế (có khấu trừ)
	workCoefficient: number; // actualMinutes / scheduledMinutes  (0.0 → 1.5+)
	overtimeMinutes: number; // Số phút làm thêm (nếu có)
	status: WorkDayStatus;
	checkInTime: string | null;
	checkOutTime: string | null;
}

type WorkDayStatus =
	| 'present' // Đi làm đủ
	| 'absent' // Vắng mặt
	| 'late' // Đi trễ
	| 'early-leave' // Về sớm
	| 'overtime' // Làm thêm giờ
	| 'half-day' // Nửa ngày
	| 'holiday' // Ngày nghỉ lễ
	| 'weekend'; // Cuối tuần
```

### PayrollPeriod (Kỳ lương)

```ts
interface PayrollPeriod {
	organizationId: string;
	year: number;
	month: number; // 1-12
	standardWorkDays: number; // Số ngày công chuẩn trong tháng
	employees: EmployeePayroll[];
}

interface EmployeePayroll {
	employeeId: string;
	employee: Employee;
	totalWorkDays: number; // Tổng ngày công (sum of workCoefficient)
	totalActualHours: number; // Tổng giờ làm thực tế
	totalOvertimeHours: number; // Tổng giờ làm thêm
	workDayDetails: WorkDaySummary[];
}
```

---

## Logic tính công (Business Rules)

> Tất cả logic tính toán phải được đặt trong `app/lib/calculations.ts`.

### Quy tắc tính giờ làm trong ngày

```
effectiveCheckIn  = max(actualCheckIn, orgWorkStartTime)
effectiveCheckOut = min(actualCheckOut, orgWorkEndTime)
rawWorkMinutes    = effectiveCheckOut - effectiveCheckIn

lunchDeduction    = nếu (effectiveCheckIn < lunchBreakEnd && effectiveCheckOut > lunchBreakStart)
                    thì min(effectiveCheckOut, lunchBreakEnd) - max(effectiveCheckIn, lunchBreakStart)
                    else 0

actualWorkMinutes = rawWorkMinutes - lunchDeduction
workCoefficient   = actualWorkMinutes / scheduledMinutes
```

### Quy tắc phân loại trạng thái ngày

- **absent**: không có check-in hoặc check-out, ngày là ngày làm việc
- **weekend**: ngày không thuộc `workDays`
- **holiday**: ngày nằm trong danh sách ngày nghỉ lễ
- **late**: `checkInTime > workStartTime + allowLateMinutes`
- **early-leave**: `checkOutTime < workEndTime - allowEarlyLeaveMinutes`
- **overtime**: `checkOutTime > workEndTime` và `actualWorkMinutes > scheduledMinutes`
- **half-day**: `workCoefficient < 0.75`
- **present**: mặc định còn lại

### Tính ngày công tháng

```
totalWorkDays = SUM(workCoefficient) với mỗi ngày trong tháng
standardWorkDays = số ngày làm việc (workDays) trong tháng, trừ ngày lễ
```

---

## Routes (trang)

| Route                           | Mô tả                                                  |
| ------------------------------- | ------------------------------------------------------ |
| `/`                             | Dashboard: tổng quan hôm nay, thống kê nhanh           |
| `/check-in`                     | Form check-in / check-out nhanh                        |
| `/work-logs`                    | Danh sách bản ghi chấm công (lọc theo ngày, nhân viên) |
| `/work-logs/:date`              | Chi tiết chấm công theo ngày                           |
| `/employees`                    | Danh sách nhân viên                                    |
| `/employees/:id`                | Hồ sơ nhân viên + lịch sử chấm công                    |
| `/organizations`                | Danh sách cơ quan                                      |
| `/organizations/:id`            | Chi tiết cơ quan                                       |
| `/organizations/:id/settings`   | Cấu hình giờ làm, giờ nghỉ trưa                        |
| `/reports/attendance`           | Báo cáo chuyên cần                                     |
| `/reports/payroll`              | Báo cáo ngày công / tính lương                         |
| `/reports/payroll/:year/:month` | Chi tiết kỳ lương tháng                                |

---

## Quy ước code

### TypeScript

- Luôn dùng `interface` cho domain types, `type` cho union/utility types.
- Không dùng `any`; dùng `unknown` khi cần.
- Dùng Zod để validate dữ liệu tại system boundaries (form input, API response).

### React / React Router v7

- Dùng `loader` để fetch data server-side; không fetch trong component.
- Dùng `action` cho form mutations (POST/PUT/DELETE).
- Dùng `useFetcher` cho partial updates (ví dụ: nút check-in inline).
- Đặt tên route file theo slug trang: `work-logs.$date.tsx`, `organizations.$id.settings.tsx`.
- `meta` phải được khai báo trên mọi route.

### Components

- Mỗi component có file riêng, export default.
- Props interface đặt trong cùng file, đặt tên `<ComponentName>Props`.
- Không dùng inline styles; chỉ dùng Tailwind utility classes.
- Dùng `cn()` helper (clsx + tailwind-merge) để gộp className có điều kiện.

### Naming

| Loại       | Convention      | Ví dụ                             |
| ---------- | --------------- | --------------------------------- |
| File route | kebab-case      | `work-logs.$date.tsx`             |
| Component  | PascalCase      | `WorkLogTable.tsx`                |
| Hook       | camelCase       | `useWorkLog.ts`                   |
| Utility    | camelCase       | `calculations.ts`                 |
| Type       | PascalCase      | `WorkLog`, `OrganizationSettings` |
| Constant   | SCREAMING_SNAKE | `DEFAULT_LUNCH_BREAK_DURATION`    |

### Date/Time

- Dùng `date` dạng `YYYY-MM-DD` string, `time` dạng `HH:mm` string.
- Không dùng `Date` object trực tiếp ở domain layer; chỉ dùng để format/parse trên UI.
- Timezone mặc định là `Asia/Ho_Chi_Minh`.

---

## Tiếng Việt / Ngôn ngữ

- UI labels, error messages, placeholder: **tiếng Việt**.
- Code (biến, hàm, type, comment kỹ thuật): **tiếng Anh**.
- Docstring/comment giải thích business rule phức tạp: **tiếng Việt**.

---

## Anti-patterns (tránh)

- Không tính ngày công trực tiếp trong component — luôn gọi từ `app/lib/calculations.ts`.
- Không expose `OrganizationSettings` raw cho UI — dùng helper để lấy giá trị display.
- Không lưu `workCoefficient` tạm thời ở localStorage — đây là dữ liệu tính toán từ server.
- Không mix logic tính lương vào route loader — tách thành service function riêng.
