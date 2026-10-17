# 🤖 Memrise AI Helper - Tampermonkey Script

![Version](https://img.shields.io/badge/version-2.0-blue)
![Tampermonkey](https://img.shields.io/badge/Tampermonkey-%E2%9C%93-00485B)
![AI](https://img.shields.io/badge/AI-Translation-4285F4)
![Platform](https://img.shields.io/badge/supports-Memrise%20%2B%20Duolingo-green)
![Backend](https://img.shields.io/badge/backend-Cloudflare%20Workers-orange)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

> 🧠 Tiện ích dịch tự động thông minh bằng AI cho **Memrise** và **Duolingo**, tích hợp cơ chế chống rào cản CSP/CORS, bộ nhớ đệm chống giật lag, loại bỏ race-condition và hỗ trợ chuyển trang Single Page App (SPA) hoàn hảo!

---

## 📖 Giới thiệu

**Memrise AI Helper** là một UserScript Tampermonkey cao cấp được thiết kế để nâng tầm trải nghiệm học ngoại ngữ trên cả **Memrise** (bao gồm cả Memrise Modern mới và Memrise Community Courses cổ điển) và **Duolingo**.

Khác với các tiện ích mở rộng thông thường hay gặp lỗi khi trang web thay đổi giao diện hoặc bị chính sách bảo mật trình duyệt chặn, phiên bản **2.0** giải quyết triệt để:
1. **Rào cản Content Security Policy (CSP) & CORS:** Tận dụng đặc quyền `GM_xmlhttpRequest` của Tampermonkey để gửi yêu cầu đến Cloudflare Worker mà không bao giờ bị trang web chặn.
2. **Hiện tượng Race Condition:** Khi bạn làm bài nhanh, câu hỏi trước chưa kịp trả về kết quả có thể đè lên câu hỏi sau. Script sử dụng mã số chuỗi (`requestSeq token`) để luôn đảm bảo chỉ hiển thị kết quả của từ vựng hiện tại.
3. **Chuyển bài không tải lại trang (SPA Navigation):** Theo dõi trực tiếp `history.pushState` / `popstate` và DOM Mutation để phát hiện từ vựng tức thì.

---

## 🎯 Tính năng nổi bật

| Tính năng | Chi tiết |
|-----------|---------|
| 🤖 **Dịch tự động bằng AI** | Kết nối với Cloudflare Worker AI Backend để phân tích từ vựng, ngữ cảnh và cung cấp bản dịch chính xác, tự nhiên. |
| 🛡️ **Vượt CSP & CORS** | Dùng `GM_xmlhttpRequest` truyền tải dữ liệu trực tiếp, hoàn toàn miễn nhiễm với các quy định bảo mật khắt khe của Memrise và Duolingo. |
| ⚡ **Chống Race Condition** | Sử dụng Request Sequence Token (`requestSeq`) đảm bảo câu hỏi cũ không bao giờ ghi đè câu hỏi mới khi bấm nhanh. |
| 💾 **Bộ nhớ đệm thông minh** | Lưu tạm kết quả dịch của các từ đã học trong phiên (`translateCache`), giảm thiểu tối đa request và hiển thị kết quả ngay tức thì. |
| 🪟 **Cửa sổ Overlay linh hoạt** | Có thể kéo thả di chuyển (`Draggable`), thay đổi kích thước (`Resizable`), tự động ghi nhớ vị trí và kích thước trên màn hình qua `GM_setValue`. |
| 🎯 **Bộ chỉ điểm thông minh (Picker)** | Cho phép click trực tiếp vào giao diện web để nhận diện câu hỏi mới, hỗ trợ chọn đơn lẻ (Single) hoặc theo cặp câu (Pair). |
| 🧭 **Hỗ trợ SPA Navigation** | Tự động cập nhật nội dung dịch khi chuyển đổi bài học, sessions mà không cần tải lại trang. |
| 🧠 **Nút nổi FAB & Menu lệnh** | Nút bấm nổi tiện lợi khi ẩn bảng dịch và tích hợp sẵn vào menu lệnh của Tampermonkey (`GM_registerMenuCommand`). |

---

## 🚀 Cài đặt

### Cách 1: Cài đặt trực tiếp (Khuyến nghị)

1. Cài đặt tiện ích **Tampermonkey** trên trình duyệt:
   - [Tampermonkey cho Google Chrome / Edge](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Tampermonkey cho Mozilla Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
2. Nhấp vào đường link cài đặt chính thức:  
   👉 **[Cài đặt Memrise AI Helper (Memrise AI Helper.js)](https://raw.githubusercontent.com/ngxuanhai123/MemAIHelper/main/Memrise%20AI%20Helper.js)**
3. Tampermonkey sẽ hiển thị giao diện cài đặt, nhấp vào **Install** (hoặc **Cập nhật**).

### Cách 2: Cài đặt thủ công

1. Mở trang quản trị của Tampermonkey -> Nhấp chọn biểu tượng **Create a new script** (+).
2. Xóa toàn bộ nội dung mẫu.
3. Sao chép và dán toàn bộ mã nguồn từ file [`Memrise AI Helper.js`](Memrise%20AI%20Helper.js).
4. Nhấn **Ctrl + S** để lưu.

---

## 💡 Hướng dẫn sử dụng

### 1. Học bài tự động
- Truy cập vào **[Memrise](https://www.memrise.com/)** hoặc **[Duolingo](https://www.duolingo.com/)**.
- Bắt đầu bất kỳ bài học từ vựng nào.
- Một bảng thông tin trợ giúp (Overlay) màu trắng thanh lịch sẽ xuất hiện ở góc màn hình, tự động hiển thị nghĩa chính và ngữ cảnh/ví dụ chi tiết bằng tiếng Việt.

### 2. Các nút thao tác trên thanh tiêu đề Overlay
- **⚙️ Cài đặt:** Mở hộp thoại cấu hình hệ thống (bật/tắt, đổi URL Worker, mở picker).
- **🎯 Chỉ điểm (Picker):** Bật chế độ chọn phần tử thủ công nếu bạn học khóa học có cấu trúc giao diện đặc thù.
- **↻ Làm mới:** Xóa bộ nhớ đệm từ hiện tại và ép script gửi yêu cầu dịch lại ngay lập tức.

### 3. Di chuyển & Thu phóng bảng dịch
- **Di chuyển:** Nhấp giữ chuột vào thanh tiêu đề màu xám nhạt và kéo đi bất kỳ đâu.
- **Thu phóng:** Kéo góc dưới phải của bảng để điều chỉnh độ rộng/độ cao tùy ý. Tọa độ và kích thước sẽ được ghi nhớ vĩnh viễn.

---

## ⚙️ Cấu hình hệ thống

Bạn có thể chỉnh sửa các thiết lập ngay trong giao diện web (bấm icon ⚙️) hoặc thay đổi các hằng số mặc định ở đầu mã nguồn:

```javascript
// URL Backend Cloudflare Worker xử lý dịch thuật
const DEFAULT_WORKER_URL = "https://add-tuvung.ngxuanhai123.workers.dev/";

// Từ khóa lưu cấu hình toàn cục áp dụng cho toàn bộ domain
const GLOBAL_KEY = "global_domain";
```

### Danh sách Preset Selector có sẵn

Script đã tích hợp sẵn hệ thống nhận diện tự động cho:
- **Modern Memrise:** `[data-testid="prompt-sentence"]`, `[data-testid="presentation-element"]`, `[data-testid="typing-prompt"]`, `[data-testid="multiple-choice-prompt"]`, `[data-testid="word-title"]`, v.v.
- **Classic Memrise (Community Courses):** `.qquestion`, `.qtitle`, `.thing .col_a`, `.highlighted-word`.
- **Duolingo:** `[data-test="challenge-translate-prompt"]`, `[data-test="challenge-header"]`, `[data-test="hint-sentence"]`, v.v.

---

## 🏗️ Kiến trúc mã nguồn chi tiết

Toàn bộ script được xây dựng theo mô-đun hóa chặt chẽ trong file [`Memrise AI Helper.js`](Memrise%20AI%20Helper.js):

### 1. Lớp lưu trữ & Đồng bộ (`Storage Layer`)
- Sử dụng `GM_getValue` và `GM_setValue` để lưu trữ dữ liệu cấu hình người dùng:
  - `workerUrl`: Địa chỉ API Backend.
  - `savedConfigs`: Danh sách bộ chọn selector tùy biến theo từng đường dẫn URL hoặc toàn domain.
  - `winPos`: Tọa độ `left`, `top`, `width`, `height` của bảng dịch.
  - `isActive`: Trạng thái bật/tắt toàn cục.

### 2. Lớp giao tiếp mạng (`Network & Security Layer`)
```javascript
function apiFetch(payload) {
    return new Promise((resolve, reject) => {
        if (typeof GM_xmlhttpRequest !== 'undefined') {
            GM_xmlhttpRequest({
                method: 'POST',
                url: workerUrl,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(payload),
                timeout: 20000,
                ...
            });
        }
    });
}
```
*Cơ chế:* Sử dụng `GM_xmlhttpRequest` chạy ở cấp độ script engine của trình duyệt để không bị ràng buộc bởi `connect-src` trong Content Security Policy của trang chủ.

### 3. Cơ chế khử Race Condition (`Concurrency Control`)
```javascript
const currentSeq = ++requestSeq;
// ... gửi request apiFetch ...
if (currentSeq === requestSeq) {
    translateCache[currentKey] = finalHtml;
    lastTranslatedKey = currentKey;
    updateOverlayContent(finalHtml);
}
```
*Cơ chế:* Mỗi lần tìm thấy từ mới cần dịch, biến đếm `requestSeq` sẽ tăng lên 1 đơn vị. Khi phản hồi trả về từ server, script chỉ cập nhật DOM nếu sequence của request đó trùng khớp với sequence mới nhất. Các phản hồi cũ đến muộn sẽ tự động bị bỏ qua.

### 4. Lọc nội dung sạch (`DOM Sanitizer`)
Hàm `getElementText(el)` tự động nhân bản node DOM, loại bỏ toàn bộ các thẻ rác như `button`, `svg`, `audio`, `script`, thẻ ẩn `[aria-hidden="true"]` trước khi trích xuất chuỗi văn bản nguyên bản để gửi lên server dịch.

### 5. Bộ chỉ điểm phần tử thông minh (`Smart Selector Generator`)
Khi bật chế độ 🎯 Picker:
- Tự động dò ngược cây DOM để tìm thuộc tính định danh duy nhất như `data-testid` hoặc `data-test`.
- Nhận diện thẻ `<input>` / `<textarea>` qua thuộc tính `placeholder`.
- Tự động lọc các class ngẫu nhiên của styled-components (dạng `sc-xxxx` hoặc chứa chữ số) để giữ lại class CSS ngữ nghĩa bền vững.

---

## 🛠️ Công nghệ sử dụng

| Công nghệ | Ứng dụng |
|-----------|----------|
| **JavaScript (ES6+)** | Lõi xử lý logic toàn bộ script |
| **Tampermonkey API** | `GM_getValue`, `GM_setValue`, `GM_addStyle`, `GM_xmlhttpRequest`, `GM_registerMenuCommand` |
| **Cloudflare Workers** | Máy chủ AI dịch thuật không máy chủ (Serverless) phản hồi tức thì |
| **MutationObserver API** | Quan sát biến động DOM để nhận diện từ vựng mới |
| **History API Hooks** | Giám sát `pushState` / `replaceState` để bắt sự kiện đổi màn hình trong SPA |

---

## 🔗 Liên kết liên quan

- 📦 **Cài đặt script:** https://raw.githubusercontent.com/ngxuanhai123/MemAIHelper/main/Memrise%20AI%20Helper.js
- 📂 **Kho lưu trữ GitHub:** https://github.com/ngxuanhai123/MemAIHelper

---

## ✍️ Tác giả

[**Ng Xuan Hai**](https://github.com/ngxuanhai123) & **Claude**
